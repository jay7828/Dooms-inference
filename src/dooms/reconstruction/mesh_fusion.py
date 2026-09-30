"""Dense point cloud -> clean, decimated mesh (Poisson), or RGB-D frames -> mesh (TSDF fusion). Needs open3d."""
from __future__ import annotations

from pathlib import Path

import numpy as np


def poisson_mesh(ply_path: Path, out_obj: Path, target_triangles: int = 20000, depth: int = 9) -> Path:
    import open3d as o3d

    pcd = o3d.io.read_point_cloud(str(ply_path))
    pcd.estimate_normals(search_param=o3d.geometry.KDTreeSearchParamHybrid(radius=0.02, max_nn=30))
    pcd.orient_normals_consistent_tangent_plane(30)

    mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(pcd, depth=depth)
    densities = np.asarray(densities)
    mesh.remove_vertices_by_mask(densities < np.quantile(densities, 0.02))  # drop low-confidence fringe geometry

    if len(mesh.triangles) > target_triangles:
        mesh = mesh.simplify_quadric_decimation(target_triangles)
    mesh.compute_vertex_normals()

    out_obj.parent.mkdir(parents=True, exist_ok=True)
    o3d.io.write_triangle_mesh(str(out_obj), mesh)
    return out_obj


def tsdf_fuse(frames: list[tuple[np.ndarray, np.ndarray, np.ndarray]], intrinsics, out_obj: Path,
              voxel_length: float = 0.004, sdf_trunc: float = 0.02, target_triangles: int = 20000) -> Path:
    """frames: list of (rgb uint8 HxWx3, depth float32 HxW metres, T_world_cam 4x4). intrinsics: o3d PinholeCameraIntrinsic.

    Use this instead of poisson_mesh when you have real per-frame depth (a depth camera, or a model like
    LingBot-Depth/-Map) rather than only an unordered dense point cloud from COLMAP.
    """
    import open3d as o3d

    volume = o3d.pipelines.integration.ScalableTSDFVolume(
        voxel_length=voxel_length, sdf_trunc=sdf_trunc,
        color_type=o3d.pipelines.integration.TSDFVolumeColorType.RGB8)
    for rgb, depth, pose in frames:
        color = o3d.geometry.Image(np.ascontiguousarray(rgb))
        d = o3d.geometry.Image(np.ascontiguousarray(depth))
        rgbd = o3d.geometry.RGBDImage.create_from_color_and_depth(
            color, d, depth_scale=1.0, convert_rgb_to_intensity=False)
        volume.integrate(rgbd, intrinsics, np.linalg.inv(pose))

    mesh = volume.extract_triangle_mesh()
    if len(mesh.triangles) > target_triangles:
        mesh = mesh.simplify_quadric_decimation(target_triangles)
    mesh.compute_vertex_normals()

    out_obj.parent.mkdir(parents=True, exist_ok=True)
    o3d.io.write_triangle_mesh(str(out_obj), mesh)
    return out_obj
