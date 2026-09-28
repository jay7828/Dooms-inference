ROBOT SPEC (physical facts about this arm and gripper; respect them when planning and choosing numbers).
THIS ROBOT IS A SMALL DESKTOP ARM (SO-ARM101). Where these facts differ from any generic number in the instructions above
(hover heights, retract heights, gripper opening, force thresholds, reach), THESE FACTS WIN.
- 5-joint arm (shoulder pan, shoulder lift, elbow, wrist flex, wrist roll) with a single-jaw gripper that points DOWN;
  base at the world origin; x forward, y left, z up; table top at z = 0.
- Reach is SHORT: reachable workspace roughly x 0.10-0.30 m, |y| < 0.16 m. Everything on the table is small: objects are
  1.4-3 cm wide and 3-6 cm tall, the box is about 11 cm wide with walls under 2.5 cm tall.
- With the gripper pointing straight down the fingertip centre can only be held up to a limited height that DEPENDS ON
  THE DISTANCE r = sqrt(x^2 + y^2) FROM THE BASE (a target higher than this is unreachable: the arm stalls):
  r 0.12 m: 0.07 m | r 0.16: 0.09 | r 0.20-0.24: 0.10 | r 0.26: 0.09 | r 0.28: 0.08 | r 0.30: 0.07 | r 0.32: 0.04.
  The fingertip centre height you ask for = the keypoint's height + your hover offset, so at the far edge (r >= 0.27) a
  cap 0.046 m high leaves only about 0.02-0.03 m of hover. Therefore ALL heights are small: hover 0.02-0.03 m above a
  grasp point (0.04 only when the target is within r 0.24 m), lifts of 0.02-0.03 m, and retract 0.02-0.03 m at the far
  edge (up to 0.04 m within r 0.24 m). Use the LOWEST heights that still clear obstacles, and check the height limit for the
  target's distance before choosing a number.
- CARRYING AN OBJECT OVER THE BOX: `box_inside` is the centre of the box FLOOR and the box walls stand 0.018 m above it.
  A held object hangs BELOW the keypoint you hold it by (a bottle held by `bottle_cap` extends 0.046 m below it; a cube held
  by its top face extends 0.025 m below it). So the offset of the held keypoint above `box_inside` must be at least
  (object height below the keypoint) + 0.018 + 0.005: about 0.07 m for the bottle and 0.05 m for a cube. A smaller offset
  drives the object into the box wall and it is dropped or knocked out. To stack on a cube, hold the carried cube's top
  keypoint about 0.03 m above the target cube's top keypoint.
- SETTING IT DOWN: the offset of the held keypoint above the surface it should rest on = (object height below the keypoint)
  + 0.004 m: about 0.05 m for the bottle in the box, 0.029 m for a cube (in the box, on the table, or on another cube's top
  keypoint). Then open the gripper.
- `eef_tcp` is between the jaws, about 1 cm above the fingertips. One jaw is fixed and one moves: the gripper opens to
  at most 0.055 m (along the gripper's y axis); when it closes, the moving jaw pushes the object slightly toward the
  fixed jaw. Objects here are narrower than the opening. Gripper widths: at most 0.055 m.
- The gripper body above the jaws is about 0.03 m wide, so grasp small objects within about 0.01 m of their TOP
  (a bottle by its cap, a cube a few millimetres below its top face). Each open jaw needs about 0.03 m of free table beside it.
- NO force / torque sensor: NEVER use the Force controller. To set something down, hold the object's keypoint at a small
  z offset above the surface it should rest on (offset = the object's own height + about 0.003 m for a keypoint on its top),
  then open the gripper.
- Positioning accuracy is about 3-5 mm and the gripper is light: light objects (< 0.05 kg) only; the box can be pushed but not lifted.
- The gripper cannot re-orient an object in its fingers or stand a lying object back up. Never plan 'place upright'.
- The controllers work in world axes; positions are metres, angles degrees. Keep the gripper pointing straight down with
  AxisAlign(eef_z, world_z, 180); YawAlign (fingers across a cube's faces) works as usual.
