"""Prioritised task stacking with null-space projection."""
from __future__ import annotations

import numpy as np

from .base import TaskTerm


def _svd_level(JN: np.ndarray, lam: float, tol: float = 1e-3):
    """Damped pseudo-inverse of JN plus an exact projector onto its row space (for the next null space)."""
    U, S, Vt = np.linalg.svd(JN, full_matrices=False)
    P = Vt.T @ ((S / (S ** 2 + lam ** 2))[:, None] * U.T)
    Vr = Vt[S > tol]
    return P, Vr.T @ Vr


def _clip_norm(v: np.ndarray, vmax: float) -> np.ndarray:
    n = np.linalg.norm(v)
    return v if n <= vmax or n == 0 else v * (vmax / n)


def solve_stack(levels: list[list[TaskTerm]], n: int, damping: float,
                q_post_err: np.ndarray | None = None, post_gain: float = 0.5,
                dq_max: float = 1.5) -> np.ndarray:
    """levels[0] has the highest priority. Returns joint velocity (rad/s)."""
    N = np.eye(n)
    dq = np.zeros(n)
    for terms in levels:
        if not terms:
            continue
        J = np.vstack([t.J for t in terms])
        v = np.concatenate([_clip_norm(t.gain * t.e, t.v_max) for t in terms])
        JN = J @ N
        P, row_space = _svd_level(JN, damping)
        dq = dq + P @ (v - J @ dq)
        N = N - row_space
    if q_post_err is not None:  # lowest priority: keep the arm near its home posture
        dq = dq + N @ (post_gain * q_post_err)
    peak = np.max(np.abs(dq))
    return dq if peak <= dq_max else dq * (dq_max / peak)
