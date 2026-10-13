# Third-party robot assets used by the in-browser Dooms engine

The simulator that runs in the browser loads these robot descriptions (MJCF + meshes) from `/dooms/`.
They are derived from the files the Dooms server uses; each folder carries its own `LICENSE`, `README.md` and the
original attribution.

| Folder | Robot | Origin | Licence |
| --- | --- | --- | --- |
| `franka_emika_panda/` | Franka Emika Panda | [MuJoCo Menagerie](https://github.com/google-deepmind/mujoco_menagerie) `franka_emika_panda` (Franka Robotics' `franka_description`) | Apache-2.0, see `franka_emika_panda/LICENSE` |
| `robotstudio_so101/` | SO-ARM101 | [The Robot Studio SO-ARM100/101](https://github.com/TheRobotStudio/SO-ARM100) MJCF, via MuJoCo Menagerie `robotstudio_so101` | Apache-2.0, see `robotstudio_so101/LICENSE` |

## Changes made for the web

The model XML is unchanged except that, for the Panda, the visual OBJ meshes are referenced as `<name>_v.stl`.
Collision meshes and every mesh that contributes mass or inertia are byte-for-byte copies; the purely visual
meshes were quadric-decimated to at most 6000 triangles and re-encoded as binary STL to cut the download from
about 50 MB to about 10 MB (`scripts/dooms/build_browser_assets.py` regenerates them). Physics is unaffected: the compiled
body masses, inertias and collision geometry are identical to the originals.
