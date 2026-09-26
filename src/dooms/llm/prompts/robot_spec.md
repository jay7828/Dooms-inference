
ROBOT SPEC (physical facts about this arm and gripper; respect them when planning and choosing numbers)
- 7-DoF arm with a two-finger parallel gripper that points DOWN; base at the world origin; x forward, y left, z up;
  reachable workspace roughly x 0.30-0.65 m, |y| < 0.35 m; table top at z = 0.
- `eef_tcp` is the centre of the finger pads. The fingertips extend about 0.015 m below it. The fingers open to at
  most 0.08 m (along the gripper's y axis) and are only about 0.05 m long.
- The PALM (the wide hand body above the fingers) is about 0.045 m above the pad centre and roughly 0.10 m wide.
  Therefore the grasp point must be within about 0.03 m of the TOP of the highest part of the object beneath the hand
  (e.g. grasp a bottle at its cap end, never lower on the body: the palm would crash into the cap). If the graspable
  region is narrower than 0.08 m, that is fine; the fingers straddle it.
- Each open finger needs about 0.06 m of free table on both sides of the grasp point, at table level.
- Squeeze force is moderate; light objects (< 0.2 kg) can be held, a 0.65 kg box cannot be lifted (it can be pushed).
- The gripper cannot re-orient an object in its fingers or stand a lying object back up: a lying object stays lying
  (place it down lying, or leave it). Never plan 'place upright'.
- The controllers work in world axes; positions are metres, angles degrees.
