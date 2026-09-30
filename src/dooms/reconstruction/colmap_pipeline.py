"""COLMAP wrapper: frames -> camera poses (sparse SfM) -> dense point cloud, via the colmap CLI binary.

Requires the `colmap` binary on PATH (e.g. `brew install colmap`). Dense stereo is far faster with a
CUDA build; on CPU-only COLMAP it still works but is slow for more than a few dozen frames.
"""
from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path


class ColmapNotFound(RuntimeError):
    pass


@dataclass
class ColmapResult:
    workspace: Path
    sparse_dir: Path
    fused_ply: Path | None  # None if dense stereo was skipped or produced nothing


def _run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True)


def reconstruct(frames_dir: Path, workspace: Path, dense: bool = True) -> ColmapResult:
    if shutil.which("colmap") is None:
        raise ColmapNotFound("colmap binary not found on PATH — install COLMAP or pass --skip-colmap")

    workspace.mkdir(parents=True, exist_ok=True)
    db = workspace / "database.db"
    sparse_dir = workspace / "sparse"
    sparse_dir.mkdir(exist_ok=True)

    _run(["colmap", "feature_extractor", "--database_path", str(db), "--image_path", str(frames_dir)])
    # sequential (not exhaustive) matching: frames come from one continuous walk-around, not unordered photos
    _run(["colmap", "sequential_matcher", "--database_path", str(db)])
    _run(["colmap", "mapper", "--database_path", str(db), "--image_path", str(frames_dir),
          "--output_path", str(sparse_dir)])

    fused_ply = None
    if dense:
        dense_dir = workspace / "dense"
        _run(["colmap", "image_undistorter", "--image_path", str(frames_dir),
              "--input_path", str(sparse_dir / "0"), "--output_path", str(dense_dir), "--output_type", "COLMAP"])
        _run(["colmap", "patch_match_stereo", "--workspace_path", str(dense_dir)])
        fused_ply = dense_dir / "fused.ply"
        _run(["colmap", "stereo_fusion", "--workspace_path", str(dense_dir), "--output_path", str(fused_ply)])

    return ColmapResult(workspace, sparse_dir / "0", fused_ply)
