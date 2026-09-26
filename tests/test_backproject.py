import numpy as np

from dooms.perception.backproject import fit_surface, pixel_to_world
from dooms.perception.camera import CameraParams, RGBDObservation
from dooms.sim.camera_rig import lookat_rotation


def _synthetic_plane_obs():
    pos = np.array([1.0, 0.0, 0.8])
    R = lookat_rotation(pos, [0.4, 0.0, 0.0])
    T = np.eye(4)
    T[:3, :3], T[:3, 3] = R, pos
    cam = CameraParams.from_fovy("t", 200, 160, 55, T)
    # depth image of the horizontal plane z = 0
    us, vs = np.meshgrid(np.arange(200), np.arange(160))
    d_cam = np.stack([(us - cam.cx) / cam.fx, -(vs - cam.cy) / cam.fy, -np.ones_like(us, dtype=float)], axis=-1)
    dirs = d_cam @ R.T
    t = -pos[2] / dirs[..., 2]
    depth = (t * -d_cam[..., 2]).astype(np.float32)   # z-depth = t * |z component in camera frame|
    return RGBDObservation(np.zeros((160, 200, 3), np.uint8), depth, cam), pos


def test_backprojection_hits_the_plane():
    obs, _ = _synthetic_plane_obs()
    for u, v in [(100, 80), (30, 120), (170, 40)]:
        p = pixel_to_world(obs.camera, u, v, float(obs.depth[v, u]))
        assert abs(p[2]) < 1e-4


def test_plane_fit_returns_up_normal():
    obs, _ = _synthetic_plane_obs()
    n, c, rms = fit_surface(obs, 100, 80)
    assert n[2] > 0.999 and rms < 1e-4
