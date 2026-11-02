# Video imitation: status and next steps

## What works (browser, `/static/imitate.html`)

1. MediaPipe hand landmarks every analysed frame; MediaPipe objects (EfficientDet-Lite2) for names.
2. Depth Anything V2 (small) on a clean plate of the scene and on ~10 frames with the hand; calibrated to metres by
   the hand's size (scale) and the table's flatness (offset). Depth video when given.
3. Table plane, objects standing on it, photo-textured surface, the video camera as a MuJoCo camera.
4. Robot base placed where the person was; TCP = thumb/index midpoint, gripper width = their gap; grasp assist.
5. Franka follows with prioritised differential IK, physics on; speed ¼× / ½× / 1×.

Tested: synthetic pick-and-place (Node, pass with and without depth), a still top-down camera (napkin folding,
Wikimedia Commons, CC BY-SA 4.0) and three head-mounted clips (cup, wipe, fold).

## Next: an arm with a hand like a human's

A parallel gripper uses 2 of the 21 hand points. A dexterous hand maps all fingers.

| Option | DoF | MuJoCo model | Fit |
| --- | --- | --- | --- |
| Franka + LEAP Hand | 7 + 16 | Menagerie `leap_hand` (mount on panda `link7`) | best: cheap real hardware, used by AnyTeleop / dex-retargeting |
| UR5e + Shadow Hand | 6 + 24 | Menagerie `shadow_hand`, `universal_robots_ur5e` | most human-like, hardest to control |
| Franka + Allegro | 7 + 16 | Menagerie `wonik_allegro` | like LEAP, older hardware |

Plan (LEAP on Franka):
1. Assets: copy Menagerie `leap_hand` (right) into `static/dooms/`, attach to the Panda flange in `buildModelXml`
   with an adapter offset; position actuators for the 16 finger joints. New robot profile `franka_leap`.
2. Wrist: the follower already tracks a 6-DoF pose; use the palm frame (wrist, index MCP, pinky MCP) instead of the
   pinch point, "Follow hand" orientation.
3. Fingers: per-frame optimisation like dex-retargeting's vector retargeting: minimise
   sum_i || (tip_i - palm)_robot(q) - s * (tip_i - palm)_human ||^2 + smoothness, over the 16 finger joints, with
   joint limits (a few Gauss-Newton steps on MuJoCo forward kinematics, warm-started from the previous frame).
   The fingertip vectors come straight from the MediaPipe world landmarks (metric, no depth needed).
4. Contacts: power grasps need friction and fingertip collision geoms (Menagerie has them); keep grasp assist for
   centring the palm on the object.
5. UI: a robot picker on the Video page (Franka gripper / Franka + LEAP).

References: AnyTeleop (Qin et al., RSS 2023) and its `dex-retargeting` library; DexMV (Qin et al., ECCV 2022);
MediaPipe Hands (Zhang et al., 2020); Depth Anything V2 (Yang et al., 2024).
