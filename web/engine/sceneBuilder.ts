/**
 * Build the MuJoCo model of a task for one arm. The Python server does this with MjSpec (sim/scenes/builder.py);
 * the browser build assembles the same model by injecting MJCF into the robot's base XML, which compiles to the
 * identical physics (same bodies, geoms, sites, sensors, cameras, in the same order).
 */
import { cross, mat2Quat, normalize, sub, type Vec3 } from './linalg'
import { capTopZ, type Config, type Dims, type ObjectSpec, type RobotProfile, type TaskSpec } from './data'

export const TCP_OFFSET = 0.1025 // Franka hand z -> pad centre
// SO-ARM101 TCP in the `gripper` body frame (see builder.py for the rationale)
export const SO101_TCP_POS: Vec3 = [0.011, 0.0, -0.088]
// columns: tcp x, y, z in the gripper frame (= transpose of [[0,1,0],[1,0,0],[0,0,-1]])
export const SO101_TCP_AXES_ROWMAJOR = [0, 1, 0, 1, 0, 0, 0, 0, -1]

const n = (v: number): string => String(v)
const arr = (v: ArrayLike<number>): string => Array.from(v, n).join(' ')
const rgba = (c: ArrayLike<number>, a = 1): string => `${n(c[0]!)} ${n(c[1]!)} ${n(c[2]!)} ${n(a)}`

/** Camera-to-world rotation for a MuJoCo camera (x right, y up, looks down -z), as a quaternion. */
export function lookatQuat(pos: ArrayLike<number>, target: ArrayLike<number>): number[] {
  const z = normalize(sub(pos, target))
  const x = normalize(cross([0, 0, 1], z))
  const y = cross(z, x)
  // columns x, y, z
  return mat2Quat([x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]])
}

function bottleXml(o: ObjectSpec, D: Dims): string {
  const fr = '1.5 0.01 0.001'
  return `<body name="${o.name}" pos="0.5 0.15 ${n(D.bottle_half_h + 0.002)}">
  <freejoint name="${o.name}_free"/>
  <geom name="${o.name}_body" type="cylinder" size="${n(D.bottle_r)} ${n(D.bottle_half_h)} 0" rgba="${rgba(o.color)}" mass="0.04" friction="0.4 0.01 0.001" condim="4"/>
  <geom name="${o.name}_cap_geom" type="cylinder" size="${n(D.cap_r)} ${n(D.cap_half_h)} 0" pos="0 0 ${n(D.bottle_half_h + D.cap_half_h)}" rgba="0.1 0.25 0.85 1" mass="0.005" friction="${fr}" condim="4"/>
  <site name="bottle_cap" pos="0 0 ${n(capTopZ(D))}" size="0.003 0 0" group="4"/>
</body>`
}

function trayXml(o: ObjectSpec, D: Dims): string {
  const h = D.tray_half
  const col = rgba(o.color)
  const wz = D.tray_floor + D.tray_wall_half_h
  const t = D.tray_wall_t
  const walls: [number, number, number, number][] = [
    [h, t, 0, h - t], [h, t, 0, -(h - t)], [t, h, h - t, 0], [t, h, -(h - t), 0],
  ]
  return `<body name="${o.name}" pos="0.5 -0.2 0.001">
  <freejoint name="${o.name}_free"/>
  <geom name="${o.name}_floor" type="box" size="${n(h)} ${n(h)} ${n(D.tray_floor / 2)}" mass="0.25" pos="0 0 ${n(D.tray_floor / 2)}" rgba="${col}" friction="0.5 0.005 0.0001"/>
${walls.map(([sx, sy, px, py], i) => `  <geom name="${o.name}_wall${i}" type="box" size="${n(sx)} ${n(sy)} ${n(D.tray_wall_half_h)}" mass="0.1" pos="${n(px)} ${n(py)} ${n(wz)}" rgba="${col}" friction="0.5 0.005 0.0001"/>`).join('\n')}
  <site name="box_inside" pos="0 0 ${n(D.tray_floor)}" size="0.003 0 0" group="4"/>
</body>`
}

function cubeXml(o: ObjectSpec): string {
  const hs = o.size / 2
  return `<body name="${o.name}" pos="0.5 0.15 ${n(hs + 0.002)}">
  <freejoint name="${o.name}_free"/>
  <geom name="${o.name}_geom" type="box" size="${n(hs)} ${n(hs)} ${n(hs)}" rgba="${rgba(o.color)}" mass="0.05" friction="1.5 0.01 0.001" condim="4"/>
  <site name="${o.name}_top" pos="0 0 ${n(hs)}" size="0.003 0 0" group="4"/>
</body>`
}

/** `baseXml` is the robot's MJCF; returns the full model for `task` (already adapted to the arm). */
export function buildModelXml(baseXml: string, task: TaskSpec, cfg: Config, profile: RobotProfile): string {
  const so = profile.id === 'so101'
  let xml = baseXml
  const dt = n(cfg.sim.timestep)
  if (so) xml = xml.replace(/timestep="[^"]*"/, `timestep="${dt}"`)
  else xml = xml.replace('<option integrator="implicitfast"/>', `<option integrator="implicitfast" timestep="${dt}"/>`)

  const [tcx, tcy] = profile.table_center
  const [thx, thy] = profile.table_half
  const world: string[] = [
    `<light pos="${n(tcx)} 0 2" dir="0 0 -1" diffuse="0.4 0.4 0.4" castshadow="false"/>`,
    '<geom name="floor" type="plane" size="3 3 0.05" pos="0 0 -0.04" rgba="0.12 0.13 0.15 1"/>',
    `<geom name="table" type="box" size="${n(thx)} ${n(thy)} 0.02" pos="${n(tcx)} ${n(tcy)} -0.02" rgba="0.62 0.62 0.6 1" friction="0.5 0.005 0.0001"/>`,
  ]
  for (const o of task.objects) world.push(o.type === 'bottle' ? bottleXml(o, profile.dims) : o.type === 'tray' ? trayXml(o, profile.dims) : cubeXml(o))
  const sc = { ...cfg.sim.cameras.scene, ...profile.scene_cam }
  world.push(`<camera name="scene_cam" pos="${arr(sc.pos)}" quat="${arr(lookatQuat(sc.pos, sc.lookat))}" fovy="${n(sc.fovy)}"/>`)

  let handTag: RegExp
  let handInner: string
  if (so) {
    handTag = /<body name="gripper"[^>]*>/
    handInner = `<site name="tcp" pos="${arr(SO101_TCP_POS)}" quat="${arr(mat2Quat(SO101_TCP_AXES_ROWMAJOR))}" size="0.004 0 0" group="4"/>`
  } else {
    // stiffer gripper: ~5x the Menagerie default squeeze (still opens to the same 0.08 m)
    xml = xml.replace(/(<general class="panda" name="actuator8"[^>]*?)gainprm="[^"]*" biasprm="[^"]*"/,
      `$1gainprm="${n(0.01568627451 * 5)} 0 0" biasprm="0 ${n(-100 * 5)} ${n(-10 * 3)}"`)
    if (!xml.includes(`gainprm="${n(0.01568627451 * 5)} 0 0"`)) throw new Error('could not patch the Franka gripper actuator')
    handTag = /<body name="hand"[^>]*>/
    handInner = [
      `<site name="tcp" pos="0 0 ${n(TCP_OFFSET)}" size="0.004 0 0" group="4"/>`,
      '<site name="ft" pos="0 0 0" size="0.004 0 0" group="4"/>',
      `<camera name="wrist_cam" pos="0 0 0.06" quat="0 1 0 0" fovy="${n(cfg.sim.cameras.wrist.fovy)}"/>`,
    ].join('\n')
    xml = xml.replace('</mujoco>', '<sensor>\n<force name="wrist_force" site="ft"/>\n<torque name="wrist_torque" site="ft"/>\n</sensor>\n</mujoco>')
  }
  if (!handTag.test(xml)) throw new Error('hand body not found in the robot MJCF')
  xml = xml.replace(handTag, (m) => `${m}\n${handInner}`)
  xml = xml.replace('</worldbody>', `${world.join('\n')}\n</worldbody>`)
  return xml
}
