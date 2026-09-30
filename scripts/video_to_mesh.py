#!/usr/bin/env python
"""Video -> sampled frames -> (COLMAP) camera poses + dense point cloud -> mesh + MuJoCo collision proxy.

    python scripts/video_to_mesh.py --video table.mp4 --out runs/recon/table1
    python scripts/video_to_mesh.py --video table.mp4 --out runs/recon/table1 --skip-colmap  # frames + manifest only

Frame extraction always runs (needs only opencv, already a dependency). The COLMAP/mesh/collision
stages need `pip install -e ".[recon]"` plus the `colmap` binary on PATH; without them this still
produces frames_dir + manifest.json, which is the exact input package an external model like
LingBot-Map/-Depth or TripoSR would need.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from dooms.reconstruction.capture import extract_frames
from dooms.reconstruction.colmap_pipeline import ColmapNotFound, reconstruct
from dooms.reconstruction.package import build_manifest


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--fps", type=float, default=3.0, help="frames per second to sample from the video")
    ap.add_argument("--max-frames", type=int, default=200)
    ap.add_argument("--skip-colmap", action="store_true", help="only extract frames + manifest")
    ap.add_argument("--target-triangles", type=int, default=20000)
    args = ap.parse_args()

    out_dir = Path(args.out)
    frame_set = extract_frames(args.video, out_dir, target_fps=args.fps, max_frames=args.max_frames)
    print(f"1. extracted {len(frame_set.frame_paths)} frames -> {frame_set.frames_dir}")

    colmap_result = mesh_path = collision = None
    if not args.skip_colmap:
        try:
            colmap_result = reconstruct(frame_set.frames_dir, out_dir / "colmap")
            print(f"2. colmap sparse model -> {colmap_result.sparse_dir}")
            if colmap_result.fused_ply and colmap_result.fused_ply.exists():
                print(f"   dense point cloud -> {colmap_result.fused_ply}")
                from dooms.reconstruction.mesh_fusion import poisson_mesh
                mesh_path = poisson_mesh(colmap_result.fused_ply, out_dir / "mesh" / "reconstructed.obj",
                                          target_triangles=args.target_triangles)
                print(f"3. mesh -> {mesh_path}")
                from dooms.reconstruction.collision import bounding_box_geom
                collision = bounding_box_geom(mesh_path)
                print(f"4. collision proxy (bounding box; refine by hand, e.g. split into legs+top): {collision}")
        except ColmapNotFound as e:
            print(f"[skip 2-4] {e}")
        except ImportError as e:
            print(f"[skip mesh/collision] missing dependency ({e}) — run: pip install -e '.[recon]'")

    manifest_path = build_manifest(out_dir, frame_set, colmap_result, mesh_path, collision)
    print(f"5. manifest (send frames_dir + this to any external reconstruction model) -> {manifest_path}")


if __name__ == "__main__":
    main()
