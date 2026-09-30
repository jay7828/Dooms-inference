"""Sample frames out of a video at a target rate, ready for SfM or an external reconstruction model."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2


@dataclass
class FrameSet:
    frames_dir: Path
    frame_paths: list[Path]
    fps_sampled: float
    width: int
    height: int
    src_video: Path


def extract_frames(video_path: str | Path, out_dir: str | Path, target_fps: float = 3.0,
                    max_frames: int = 200) -> FrameSet:
    video_path, out_dir = Path(video_path), Path(out_dir)
    frames_dir = out_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError(f"cannot open video: {video_path}")
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    stride = max(1, round(src_fps / target_fps))

    frame_paths, i, saved = [], 0, 0
    while saved < max_frames:
        ok, frame = cap.read()
        if not ok:
            break
        if i % stride == 0:
            p = frames_dir / f"frame_{saved:05d}.jpg"
            cv2.imwrite(str(p), frame)
            frame_paths.append(p)
            saved += 1
        i += 1
    cap.release()
    if not frame_paths:
        raise ValueError(f"no frames extracted from {video_path} (bad path or empty/corrupt video)")

    h, w = cv2.imread(str(frame_paths[0])).shape[:2]
    return FrameSet(frames_dir, frame_paths, src_fps / stride, w, h, video_path)
