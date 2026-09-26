# Dooms-inference — architecture & file plan

Diagram: [architecture.jpg](architecture.jpg)

Task prompt + simulated RGB-D → 4 Bedrock agents (decompose → skill recipes → parameters → 3D grounding) → compile to controller script → execute in sim → benchmark.

## Defaults assumed (change in configs/)
- Simulator: MuJoCo (reliable contacts for grasping, native RGB-D + segmentation rendering, runs on macOS), behind a `SimEnv` interface so other backends can be swapped in.
- Robot: Franka Panda + parallel gripper, from MuJoCo Menagerie (MJCF).
- LLM: Claude on Amazon Bedrock via `bedrock-runtime` Converse API (text + image blocks). Model IDs live in `configs/bedrock.yaml`.
- Vision Grounder: VLM returns 2D points/masks → depth back-projection with camera K, T → 3D. An oracle mode reads sim ground truth (for ablations).

## File tree (as built)

```
Dooms-inference/
├── pyproject.toml  README.md  .env.example
├── docs/            architecture.jpg  ARCHITECTURE.md
├── configs/         default.yaml  bedrock.yaml  tasks/{put_bottle_in_box,put_cube_in_box,stack_cubes}.yaml
├── scripts/         run_task.py  run_benchmark.py
├── src/dooms/
│   ├── config.py  task.py  pipeline.py  monitor.py
│   ├── llm/         bedrock_client.py  base.py  schemas.py  scripted.py  factory.py  prompts/*.md
│   ├── agents/      base.py  task_decomposer.py  skill_generator.py  parameter_setter.py  vision_grounder.py
│   ├── controllers/ base.py  pos_align.py  axis_align.py  yaw_align.py  force.py  gripper.py  stack.py  library.py
│   ├── perception/  camera.py  backproject.py  keypoints.py  keypoint_store.py  viz.py
│   ├── sim/         base.py  mujoco_env.py  camera_rig.py  scenes/{builder.py, assets/franka_emika_panda/}
│   ├── execution/   compiler.py  runtime.py  robot_interface.py
│   └── bench/       success_checks.py  metrics.py  ablations.py  runner.py  report.py
└── tests/
```

## Build order
1. `sim/` + `perception/camera.py` — get an RGB-D frame of bottle + box out of the sim.
2. `llm/bedrock_client.py` + `schemas.py` — one working Converse call with an image.
3. `agents/` 01→02→03, prompts, JSON validation (test with a mocked LLM).
4. `perception/backproject.py` + `vision_grounder.py` (start with oracle mode, then VLM).
5. `controllers/` + `execution/` — hard-code the 6-subtask bottle→box skill and get it succeeding in sim without any LLM.
6. Wire the full pipeline, add `monitor.py` replanning.
7. `bench/` — task suite, metrics, ablations, report.

Step 5 before wiring the LLM matters: it separates "the controllers are wrong" from "the agents are wrong".

## Decisions taken
- Simulator MuJoCo + Franka Panda (Menagerie); Claude Sonnet 4.5 on Bedrock for all four agents (per-agent override in configs/bedrock.yaml).
- Vision Grounder: Claude points (coarse, then zoomed refinement); depth + plane fit lift to 3D. A detector/segmenter can replace it later behind the same `ground()` interface.
