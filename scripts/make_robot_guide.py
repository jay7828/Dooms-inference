#!/usr/bin/env python
"""Render the reference images for the SO-101 real-robot guide from the actual model (so they match the software).

    python scripts/make_robot_guide.py            -> docs/real-robot/*.png and src/dooms/server/static/guide/*.png
"""
from __future__ import annotations

import copy
import shutil
from pathlib import Path

import mujoco
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from dooms import ROOT
from dooms.config import load_config
from dooms.hardware.real_env import REST_Q, TIP_LOCAL, twin_task
from dooms.hardware.so101 import DIRECTION_STEPS, JOINTS, REF_Q
from dooms.hardware.virtual import TAPE_MARKS, TRIPOD
from dooms.perception.camera import CameraParams
from dooms.sim.camera_rig import lookat_quat
from dooms.sim.mujoco_env import MuJoCoEnv
from dooms.task import load_task

OUT = ROOT / "docs" / "real-robot"
STATIC = ROOT / "src" / "dooms" / "server" / "static" / "guide"
W, H = 900, 600
INK, ACCENT, MUTED, BG = (38, 37, 30), (207, 45, 86), (111, 108, 98), (247, 247, 244)


def font(size: int, bold: bool = False):
    for p in (("/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf"),
              "/System/Library/Fonts/Helvetica.ttc", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


CAMS = {
    "side": ([0.18, 0.62, 0.22], [0.18, 0.0, 0.16], 45),
    "three_q": ([0.55, 0.42, 0.42], [0.14, 0.0, 0.14], 45),
    "top": ([0.19, -0.05, 1.05], [0.23, -0.05, 0.0], 52),
    "touch": ([0.33, 0.05, 0.12], [0.21, 0.17, 0.0], 40),
    "above": ([0.16, 0.0, 0.95], [0.19, 0.0, 0.0], 42),
    "front": ([0.80, -0.26, 0.42], [0.34, 0.0, 0.22], 24),
    "grip": ([0.36, 0.42, 0.33], [0.36, 0.0, 0.22], 28),
    "layout": ([0.17, -0.08, 0.80], [0.20, -0.08, 0.0], 50),
}
DIR_CAM = {"shoulder_pan": "above", "shoulder_lift": "side", "elbow_flex": "side", "wrist_flex": "side",
           "wrist_roll": "front", "gripper": "grip"}


def extras(spec):
    spec.visual.global_.offwidth, spec.visual.global_.offheight = W, H
    wb = spec.worldbody
    for i, (x, y) in enumerate(TAPE_MARKS):
        wb.add_geom(name=f"tape{i}", type=mujoco.mjtGeom.mjGEOM_BOX, size=[0.006, 0.006, 0.0004], pos=[x, y, 0.0004],
                    rgba=[0.75, 0.12, 0.12, 1], contype=0, conaffinity=0)
    for name, (pos, look, fovy) in CAMS.items():
        wb.add_camera(name=f"{name}_cam", pos=pos, quat=lookat_quat(pos, look), fovy=fovy)
    wb.add_camera(name="tripod_cam", pos=TRIPOD["pos"], quat=lookat_quat(TRIPOD["pos"], TRIPOD["lookat"]), fovy=TRIPOD["fovy"])


class Studio:
    def __init__(self, scene: str | None = None):
        cfg = copy.deepcopy(load_config())
        task = load_task(scene) if scene else twin_task()
        self.env = MuJoCoEnv(task, cfg, "so101", extras=extras)
        if scene:
            self.env.reset(1)
        self.m, self.d = self.env.model, self.env.data
        self.r = mujoco.Renderer(self.m, height=H, width=W)
        self.robot_bodies = {self.m.body(n).id for n in ("base", "shoulder", "upper_arm", "lower_arm", "wrist", "gripper",
                                                          "moving_jaw_so101_v1", "camera_mount")
                             if mujoco.mj_name2id(self.m, mujoco.mjtObj.mjOBJ_BODY, n) >= 0}

    def pose(self, q6):
        self.d.qpos[self.env._qadr] = q6[:5]
        self.d.qpos[self.env._jaw_adr] = q6[5]
        mujoco.mj_forward(self.m, self.d)

    def render(self, cam: str) -> np.ndarray:
        self.r.update_scene(self.d, camera=f"{cam}_cam")
        return self.r.render().copy()

    def robot_mask(self, cam: str) -> np.ndarray:
        self.r.enable_segmentation_rendering()
        self.r.update_scene(self.d, camera=f"{cam}_cam")
        seg = self.r.render()[:, :, 0]
        self.r.disable_segmentation_rendering()
        body = np.full(seg.shape, -1)
        ok = seg >= 0
        body[ok] = self.m.geom_bodyid[seg[ok]]
        return np.isin(body, list(self.robot_bodies))

    def params(self, cam: str) -> CameraParams:
        cid = self.m.camera(f"{cam}_cam").id
        T = np.eye(4)
        T[:3, :3] = self.d.cam_xmat[cid].reshape(3, 3)
        T[:3, 3] = self.d.cam_xpos[cid]
        return CameraParams.from_fovy(cam, W, H, self.m.cam_fovy[cid], T)

    def project(self, cam: str, p) -> tuple[float, float]:
        c = self.params(cam)
        q = np.linalg.inv(c.T_world_cam) @ np.append(np.asarray(p, float), 1)
        return q[0] / -q[2] * c.fx + c.cx, -q[1] / -q[2] * c.fy + c.cy

    def tip(self) -> np.ndarray:
        gb = self.m.body("gripper").id
        return self.d.xpos[gb] + self.d.xmat[gb].reshape(3, 3) @ TIP_LOCAL

    def point(self, local, body="gripper") -> np.ndarray:
        b = self.m.body(body).id
        return self.d.xpos[b] + self.d.xmat[b].reshape(3, 3) @ np.asarray(local, float)


def arrow(dr: ImageDraw.ImageDraw, a, b, color=ACCENT, width=6):
    a, b = np.asarray(a, float), np.asarray(b, float)
    v = b - a
    n = np.linalg.norm(v)
    if n < 1:
        return
    u = v / n
    tip = b
    base = b - u * 22
    perp = np.array([-u[1], u[0]])
    dr.line([tuple(a), tuple(base)], fill=color, width=width)
    dr.polygon([tuple(tip), tuple(base + perp * 12), tuple(base - perp * 12)], fill=color)


def caption(img: Image.Image, title: str, lines: list[str]) -> Image.Image:
    pad = 26
    out = Image.new("RGB", (img.width, img.height + 60 + 30 * len(lines)), BG)
    out.paste(img, (0, 0))
    dr = ImageDraw.Draw(out)
    y = img.height + 16
    dr.text((pad, y), title, font=font(26, True), fill=INK)
    y += 38
    for ln in lines:
        dr.text((pad, y), ln, font=font(20), fill=MUTED)
        y += 30
    return out


def label(dr, xy, text, color=INK, size=20, bold=True, anchor="la"):
    f = font(size, bold)
    x, y = xy
    box = dr.textbbox((x, y), text, font=f, anchor=anchor)
    dr.rounded_rectangle([box[0] - 7, box[1] - 5, box[2] + 7, box[3] + 5], radius=6, fill=(255, 255, 255))
    dr.text((x, y), text, font=f, fill=color, anchor=anchor)


def ghost(st: Studio, cam: str, q_from, q_to) -> Image.Image:
    st.pose(q_from)
    a_img, a_mask = st.render(cam), st.robot_mask(cam)
    st.pose(q_to)
    b_img, b_mask = st.render(cam), st.robot_mask(cam)
    out = b_img.astype(float)
    only_a = a_mask & ~b_mask
    out[only_a] = 0.55 * out[only_a] + 0.45 * (a_img[only_a] * 0.6 + np.array([255, 255, 255]) * 0.4)
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))


def make_all() -> list[Path]:
    OUT.mkdir(parents=True, exist_ok=True)
    made = []
    st = Studio()

    # 1. reference pose
    st.pose(REF_Q)
    img = Image.fromarray(st.render("side"))
    dr = ImageDraw.Draw(img)
    ua = st.point([0, 0, 0], "upper_arm"), st.point([0, 0, 0], "lower_arm")
    fa = st.point([0, 0, 0], "wrist")
    label(dr, st.project("side", (ua[0] + ua[1]) / 2 + [-0.03, 0, 0]), "upper arm: straight UP", anchor="rm")
    label(dr, st.project("side", (ua[1] + fa) / 2 + [0, 0, 0.035]), "forearm: level, pointing forward", anchor="mb")
    label(dr, st.project("side", st.tip() + [0.0, 0, -0.03]), "gripper: straight ahead, CLOSED", anchor="mt")
    label(dr, st.project("side", [0.0, 0, 0.0]) + np.array([0, 10]), "base", anchor="mt", bold=False)
    p = caption(img, "Reference pose (\"L pose\")",
                ["Torque off, move the arm by hand into this shape: upper arm vertical, forearm level,",
                 "wrist and gripper in line with the forearm, pointing away from the base, jaws closed."])
    made.append(OUT / "ref_pose.png")
    p.save(made[-1])

    # 2. direction steps
    for joint, text, expected in DIRECTION_STEPS:
        i = JOINTS.index(joint)
        q2 = REF_Q.copy()
        q2[i] += expected * {"gripper": 1.2, "wrist_roll": 1.1}.get(joint, 0.7)
        cam = DIR_CAM[joint]
        img = ghost(st, cam, REF_Q, q2)
        dr = ImageDraw.Draw(img)
        if joint in ("wrist_roll", "gripper"):             # rotations: trace the moving jaw's path
            path = []
            for t in np.linspace(0, 1, 16):
                st.pose(REF_Q + (q2 - REF_Q) * t)
                p3 = (st.point([-0.012, -0.078, 0.019], "moving_jaw_so101_v1") if joint == "gripper"
                      else st.point([0.0, 0.0, -0.065], "moving_jaw_so101_v1"))
                path.append(np.array(st.project(cam, p3)))
            dr.line([tuple(p) for p in path[:-2]], fill=ACCENT, width=6)
            a, b = path[-3], path[-1]
        else:
            st.pose(REF_Q)
            a = st.project(cam, st.tip())
            st.pose(q2)
            b = st.project(cam, st.tip())
        arrow(dr, a, b)
        label(dr, (24, 24), joint.replace("_", " "), size=22)
        label(dr, (24, 62), "faded = start (reference pose)   solid = move it this way", size=16, bold=False, color=MUTED)
        p = caption(img, text, ["Start from the reference pose. The app detects the motion and moves on by itself."])
        made.append(OUT / f"dir_{joint}.png")
        p.save(made[-1])

    # 3. rest pose
    st.pose(REST_Q)
    p = caption(Image.fromarray(st.render("side")), "Rest pose",
                ["Where 'Rest' folds the arm before switching the torque off. Keep this area clear."])
    made.append(OUT / "rest_pose.png")
    p.save(made[-1])

    # 4. table layout (top view) with tape marks, reach and camera
    rig = Studio()
    rig.pose(REST_Q)
    img = Image.fromarray(rig.render("layout"))
    dr = ImageDraw.Draw(img)
    L = "layout"
    c0 = np.array(rig.project(L, [0, 0, 0]))
    pts = [np.array(rig.project(L, [0.3 * np.cos(a), 0.3 * np.sin(a), 0])) for a in np.linspace(-1.1, 1.1, 40)]
    dr.line([tuple(p) for p in pts], fill=(90, 90, 200), width=3)
    label(dr, tuple(pts[20] + [0, -14]), "reach limit ~30 cm", color=(60, 60, 170), size=15, bold=False, anchor="mb")
    for i, (x, y) in enumerate(TAPE_MARKS):
        u, v = rig.project(L, [x, y, 0])
        dr.ellipse([u - 14, v - 14, u + 14, v + 14], outline=ACCENT, width=3)
        txt = f"{i + 1}: x {x * 100:.0f} cm, y {y * 100:+.0f} cm"
        if y > 0:
            label(dr, (u - 22, v), txt, size=15, color=ACCENT, anchor="rm")
        else:
            label(dr, (u + 22, v), txt, size=15, color=ACCENT, anchor="lm")
    cam_px = np.array(rig.project(L, [0.46, -0.30, 0]))
    look_px = np.array(rig.project(L, TRIPOD["lookat"]))
    arrow(dr, cam_px, cam_px + (look_px - cam_px) * 0.45, color=(40, 120, 80))
    label(dr, tuple(cam_px + [12, 10]), "camera / phone (tripod)", color=(40, 120, 80), size=16, anchor="la")
    ax = np.array(rig.project(L, [0.08, 0, 0])) - c0
    ay = np.array(rig.project(L, [0, 0.08, 0])) - c0
    arrow(dr, c0 + [70, 0], c0 + [70, 0] + ax, color=INK, width=4)
    label(dr, tuple(c0 + [70, 0] + ax + [8, 0]), "+x forward", size=14, bold=False, anchor="lm")
    arrow(dr, c0 + [0, 60], c0 + [0, 60] + ay, color=INK, width=4)
    label(dr, tuple(c0 + [0, 60] + ay + [-8, 0]), "+y (robot's left)", size=14, bold=False, anchor="rm")
    p = caption(img, "Table layout (seen from above)",
                ["Tape marks: 1-2 cm pieces of tape, measured from the centre of the robot's base.",
                 "Place the camera 40-55 cm from the base, 35-45 cm high, looking down at the work area."])
    made.append(OUT / "table_layout.png")
    p.save(made[-1])

    # 5. good camera view
    rig.pose(REST_Q)
    img = Image.fromarray(rig.render("tripod").copy() if False else rig.env._render_rgb("tripod_cam", W, H))
    dr = ImageDraw.Draw(img)
    label(dr, (24, H - 150), "Good camera view", size=22)
    for ln, y in (("whole work area and all tape marks visible", H - 110), ("the arm does not hide the objects when resting", H - 78),
                  ("camera fixed: do not move it after calibrating", H - 46)):
        label(dr, (24, y), "OK  " + ln, size=16, bold=False, color=(40, 120, 80))
    p = caption(img, "What the overview camera should see",
                ["Any webcam, or a phone used as a webcam. Light the table evenly, without glare."])
    made.append(OUT / "camera_view.png")
    p.save(made[-1])

    # 6. touching a tape mark
    from scipy.optimize import least_squares
    target = np.array([*TAPE_MARKS[3], 0.003])

    def res(q5):
        rig.pose(np.append(q5, -0.1745))
        R = rig.d.xmat[rig.m.body("gripper").id].reshape(3, 3)
        return np.concatenate([(rig.tip() - target) * 50, (R @ [0, 0, -1] - [0, 0, -1]) * 0.3])
    x = least_squares(res, np.array([0.6, 0.5, 0.3, 1.0, 0.0]), bounds=(rig.env._lo, rig.env._hi)).x
    rig.pose(np.append(x, -0.1745))
    img = Image.fromarray(rig.render("touch"))
    dr = ImageDraw.Draw(img)
    u, v = rig.project("touch", target)
    dr.ellipse([u - 26, v - 26, u + 26, v + 26], outline=ACCENT, width=4)
    label(dr, (u + 34, v - 10), "closed jaw tips resting on the tape", color=ACCENT, size=18)
    p = caption(img, "Camera calibration: touch each mark",
                ["Close the gripper, rest the jaw tips on the centre of a tape mark,",
                 "then click the same mark in the camera image. Repeat for all 6 marks."])
    made.append(OUT / "touch_mark.png")
    p.save(made[-1])

    # 7. wiring diagram
    img = Image.new("RGB", (W, 460), BG)
    dr = ImageDraw.Draw(img)

    def box(xy, title, sub):
        dr.rounded_rectangle(xy, radius=14, fill=(255, 255, 255), outline=(207, 205, 196), width=2)
        dr.text((xy[0] + 18, xy[1] + 16), title, font=font(20, True), fill=INK)
        dr.text((xy[0] + 18, xy[1] + 48), sub, font=font(15), fill=MUTED)
    box((40, 30, 300, 120), "Power supply", "12 V for the follower arm")
    box((40, 180, 300, 270), "Servo driver board", "on the arm's base")
    box((40, 330, 300, 420), "SO-101 follower arm", "6 x STS3215 servos, IDs 1-6")
    box((600, 180, 860, 270), "This computer", "runs the app")
    box((600, 30, 860, 120), "Overview camera", "USB webcam or phone")
    arrow(dr, (170, 120), (170, 180), color=(176, 125, 26))
    dr.text((182, 136), "DC jack (power)", font=font(15), fill=MUTED)
    dr.line([(170, 270), (170, 330)], fill=INK, width=5)
    dr.text((182, 290), "servo cable (daisy chain)", font=font(15), fill=MUTED)
    arrow(dr, (300, 225), (600, 225))
    dr.text((380, 196), "USB data cable", font=font(16, True), fill=ACCENT)
    arrow(dr, (730, 120), (730, 180), color=(40, 120, 80))
    dr.text((742, 136), "USB / Continuity / Wi-Fi", font=font(15), fill=MUTED)
    dr.text((40, 434), "Power switch within reach at all times: it is the real emergency stop.", font=font(16, True), fill=ACCENT)
    made.append(OUT / "wiring.png")
    img.save(made[-1])
    return made


if __name__ == "__main__":
    files = make_all()
    STATIC.mkdir(parents=True, exist_ok=True)
    for f in files:
        shutil.copy(f, STATIC / f.name)
    print("\n".join(str(f) for f in files))
