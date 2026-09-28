"""Overview camera sources: a USB webcam, a phone used as a webcam (iPhone Continuity Camera appears as an ordinary
camera on a Mac), a phone/IP camera stream URL (Android apps such as IP Webcam / DroidCam), or the virtual rig."""
from __future__ import annotations

import json
import platform
import subprocess
import threading
import time

import numpy as np


class CameraError(RuntimeError):
    pass


class OpenCVCamera:
    """Reads frames on a background thread so the control loop never waits for the camera."""

    def __init__(self, source: str, width: int = 1280, height: int = 720):
        import cv2
        self.source = source
        target = int(source) if source.isdigit() else source
        backend = cv2.CAP_AVFOUNDATION if (platform.system() == "Darwin" and isinstance(target, int)) else cv2.CAP_ANY
        self.cap = cv2.VideoCapture(target, backend)
        if not self.cap.isOpened():
            hint = (" On a Mac, allow camera access for this app in System Settings > Privacy & Security > Camera."
                    if isinstance(target, int) else " Check the address and that the phone app is streaming.")
            raise CameraError(f"could not open camera {source}.{hint}")
        if isinstance(target, int):
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        self._frame: np.ndarray | None = None
        self._t = 0.0
        self._lock = threading.Lock()
        self._stop = False
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        deadline = time.time() + 5
        while self._frame is None and time.time() < deadline:
            time.sleep(0.05)
        if self._frame is None:
            self.close()
            raise CameraError(f"camera {source} opened but sends no images")

    def _loop(self) -> None:
        import cv2
        while not self._stop:
            ok, bgr = self.cap.read()
            if ok:
                with self._lock:
                    self._frame = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                    self._t = time.time()
            else:
                time.sleep(0.02)

    def read(self) -> np.ndarray:
        with self._lock:
            if self._frame is None or time.time() - self._t > 3.0:
                raise CameraError("the camera stopped sending images (unplugged, or the phone locked?)")
            return self._frame.copy()

    @property
    def size(self) -> tuple[int, int]:
        f = self.read()
        return f.shape[1], f.shape[0]

    def close(self) -> None:
        self._stop = True
        try:
            self.cap.release()
        except Exception:  # noqa: BLE001
            pass


class VirtualCamera:
    source = "virtual"

    def __init__(self, rig):
        self.rig = rig

    def read(self) -> np.ndarray:
        return self.rig.render()

    @property
    def size(self) -> tuple[int, int]:
        return self.rig.cam_size

    def close(self) -> None:
        pass


def list_cameras() -> list[dict]:
    """Cameras the OS knows about. On macOS the names come from system_profiler (AVFoundation keeps the same order);
    elsewhere indices are probed. Phones used as webcams (Continuity Camera, DroidCam, Camo, ...) appear here too."""
    out: list[dict] = []
    if platform.system() == "Darwin":
        try:
            raw = subprocess.run(["system_profiler", "SPCameraDataType", "-json"], capture_output=True, text=True,
                                 timeout=8).stdout
            items = json.loads(raw or "{}").get("SPCameraDataType", [])
            for i, it in enumerate(items):
                name = it.get("_name", f"Camera {i}")
                out.append({"id": str(i), "name": name, "kind": "phone" if "iphone" in name.lower() else "camera"})
        except Exception:  # noqa: BLE001
            pass
    if not out:
        import cv2
        for i in range(4):
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                out.append({"id": str(i), "name": f"Camera {i}", "kind": "camera"})
            cap.release()
    return out


def open_camera(source: str, rig=None):
    if source == "virtual":
        if rig is None:
            raise CameraError("the virtual camera needs the virtual robot to be connected")
        return VirtualCamera(rig)
    return OpenCVCamera(source)
