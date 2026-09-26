"""Vision Grounder: VLM points at requested keypoints (coarse -> zoomed refinement), depth lifts them to 3D."""
from __future__ import annotations

import numpy as np

from ..controllers.base import Keypoint
from ..llm.base import Image
from ..llm.schemas import KeypointRequest, PixelPoints
from ..perception.camera import RGBDObservation
from ..perception.keypoints import lift_pixel
from ..perception.viz import draw_grid, encode_png
from .base import Agent, AgentError

CROP, ZOOM = 96, 5


class GroundingError(RuntimeError):
    pass


class VisionGrounder(Agent):
    name = "vision_grounder"
    schema = PixelPoints

    def __init__(self, llm, bedrock_cfg, refine_iters: int = 1):
        super().__init__(llm, bedrock_cfg)
        self.refine_iters = refine_iters
        self.last_pixels: dict[str, tuple[float, float]] = {}

    # -- pointing ---------------------------------------------------------------------------
    def _point(self, image: np.ndarray, reqs: list[KeypointRequest], grid: int, label: str,
               extra: str = "") -> dict[str, tuple[float, float, bool]]:
        h, w = image.shape[:2]
        want = "\n".join(f"- {r.name}: {r.description}" for r in reqs)
        text = (f"Image size: {w} x {h} pixels (u to the right, v downward).{extra}\n"
                f"Locate these keypoints:\n{want}")

        def check(p: PixelPoints):
            got = {q.name for q in p.points}
            missing = {r.name for r in reqs} - got
            if missing:
                raise ValueError(f"missing keypoints {sorted(missing)}")
            for q in p.points:
                if not (0 <= q.u <= w and 0 <= q.v <= h):
                    raise ValueError(f"{q.name}=({q.u},{q.v}) is outside the {w}x{h} image")

        out = self.call([text, Image(encode_png(draw_grid(image, grid)))], validate=check, label=label)
        return {q.name: (q.u, q.v, q.visible) for q in out.points}

    def _zoom_refine(self, obs: RGBDObservation, req: KeypointRequest, u: float, v: float):
        h, w = obs.rgb.shape[:2]
        x0 = int(np.clip(round(u) - CROP // 2, 0, w - CROP))
        y0 = int(np.clip(round(v) - CROP // 2, 0, h - CROP))
        crop = obs.rgb[y0:y0 + CROP, x0:x0 + CROP]
        import cv2
        big = cv2.resize(crop, (CROP * ZOOM, CROP * ZOOM), interpolation=cv2.INTER_CUBIC)
        pts = self._point(big, [req], grid=ZOOM * 12, label=f"refine:{req.name}",
                          extra=" This is a zoomed crop of the scene; the feature should be near the middle.")
        zu, zv, vis = pts[req.name]
        return x0 + zu / ZOOM, y0 + zv / ZOOM

    # -- public -----------------------------------------------------------------------------
    def ground(self, requests: list[KeypointRequest], obs: RGBDObservation) -> dict[str, Keypoint]:
        if not requests:
            return {}
        coarse = self._point(obs.rgb, requests, grid=80, label="coarse")
        out: dict[str, Keypoint] = {}
        self.last_pixels = {}
        for r in requests:
            u, v, visible = coarse[r.name]
            for _ in range(self.refine_iters):
                u, v = self._zoom_refine(obs, r, u, v)
            self.last_pixels[r.name] = (u, v)
            try:
                out[r.name] = lift_pixel(obs, r.name, u, v)
            except ValueError as e:
                raise GroundingError(f"{r.name}: {e}") from e
        return out


class OracleGrounder:
    """Ground truth keypoints straight from the simulator (ablation / upper bound)."""

    name = "oracle_grounder"

    def __init__(self, env):
        self.env = env
        self.trace: list[dict] = []
        self.last_pixels: dict[str, tuple[float, float]] = {}

    def ground(self, requests: list[KeypointRequest], obs: RGBDObservation) -> dict[str, Keypoint]:
        out = {}
        for r in requests:
            if not self.env.has_keypoint(r.name):
                raise GroundingError(f"oracle grounding only knows simulator keypoints, not '{r.name}' - use Vision grounding")
            pos, normal = self.env.visible_keypoint(r.name)
            axis, sym = self.env.gt_axis(r.name)
            out[r.name] = Keypoint(r.name, pos, normal, axis, sym)
        return out
