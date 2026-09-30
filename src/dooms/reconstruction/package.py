"""Write a manifest describing everything produced so far — frames, poses, point cloud, mesh — the exact
set of files you'd hand to an external reconstruction model (COLMAP already ran here, but the same
frames_dir + intrinsics is what LingBot-Map/-Depth, TripoSR, or any other model would need as input)."""
from __future__ import annotations

import json
from pathlib import Path

from .capture import FrameSet
from .colmap_pipeline import ColmapResult


def build_manifest(out_dir: Path, frame_set: FrameSet, colmap_result: ColmapResult | None = None,
                    mesh_path: Path | None = None, collision: dict | None = None) -> Path:
    manifest = {
        "source_video": str(frame_set.src_video),
        "frames_dir": str(frame_set.frames_dir),
        "num_frames": len(frame_set.frame_paths),
        "sampled_fps": frame_set.fps_sampled,
        "image_size": [frame_set.width, frame_set.height],
        "camera_poses_dir": str(colmap_result.sparse_dir) if colmap_result else None,
        "dense_point_cloud": str(colmap_result.fused_ply) if colmap_result and colmap_result.fused_ply else None,
        "mesh": str(mesh_path) if mesh_path else None,
        "collision_proxy": collision,
    }
    path = out_dir / "manifest.json"
    path.write_text(json.dumps(manifest, indent=2))
    return path
