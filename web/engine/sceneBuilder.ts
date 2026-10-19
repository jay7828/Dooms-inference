/**
 * Build the MuJoCo model of a task for one arm. The Python server does this with MjSpec (sim/scenes/builder.py);
 * the browser build assembles the same model by injecting MJCF into the robot's base XML, which compiles to the
 * identical physics (same bodies, geoms, sites, sensors, cameras, in the same order).
 */
import { cross, mat2Quat, normalize, sub, type Vec3 } from './linalg'
import { LAB, capTopZ, type Config, type Dims, type ObjectSpec, type RobotProfile, type TaskSpec } from './data'

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

// ------------------------------------------------------------------------------------------------ lab glassware

const VIS = 'contype="0" conaffinity="0" group="1"' // decoration only: rendered, never collides, invisible to the height map
const zq = (a: number): string => `${n(Math.cos(a / 2))} 0 0 ${n(Math.sin(a / 2))}`
const LIQUID_RGBA = '0.1 0.38 0.95 0.92'
/** conaffinity of the surfaces liquid drops rest on (bit 1: everything else, bit 2: drops) */
const LIQUID_SOLID = 'conaffinity="3"'
/** Wall segments of a beaker. A graspable one is octagonal: its 2.2 cm flats are wider than the Franka's 1.7 cm finger
 *  pads, so the pads press flat on one face and the grip holds against the twist of a pour (on the narrower faces of a
 *  16-gon the pads touch only segment edges and the beaker turns out of the fingers). */
const beakerSegments = (r: number): number => (r <= 0.035 ? 8 : 16)

/** Open glass beaker: a floor disc and a ring of thin wall boxes. Site `<name>_rim` = centre of its mouth. */
function beakerXml(o: ObjectSpec): string {
  const r = o.radius ?? LAB.beaker_r
  const h = o.height ?? LAB.beaker_h
  const t = LAB.wall
  const rc = r - t / 2
  const segs = beakerSegments(r)
  const halfChord = rc * Math.tan(Math.PI / segs) + t / 2 // segments overlap: no gaps for a drop to slip through
  const glass = rgba(o.color, 0.32)
  const walls = Array.from({ length: segs }, (_, i) => {
    const a = (2 * Math.PI * i) / segs
    return `  <geom name="${o.name}_wall${i}" type="box" size="${n(t / 2)} ${n(halfChord)} ${n(h / 2)}" pos="${n(rc * Math.cos(a))} ${n(rc * Math.sin(a))} ${n(h / 2)}" quat="${zq(a)}" rgba="${glass}" mass="${n(0.064 / segs)}" friction="1.2 0.05 0.001" condim="4" ${LIQUID_SOLID} solref="0.005 1" solimp="0.95 0.99 0.001"/>`
  })
  const marks = [0.35, 0.55, 0.75].map((f, i) => // graduation marks on the side facing the scene camera
    `  <geom type="box" size="0.0004 ${n(i === 1 ? 0.007 : 0.004)} 0.0006" pos="${n(r * Math.cos(-0.9) + 0.0002)} ${n(r * Math.sin(-0.9))} ${n(f * h)}" quat="${zq(-0.9)}" rgba="0.95 0.97 1 0.9" ${VIS} mass="0"/>`)
  return `<body name="${o.name}" pos="0.5 0 0.001">
  <freejoint name="${o.name}_free"/>
  <geom name="${o.name}_floor" type="cylinder" size="${n(r)} ${n(LAB.floor / 2)} 0" pos="0 0 ${n(LAB.floor / 2)}" rgba="${glass}" mass="0.02" friction="0.6 0.005 0.0001" ${LIQUID_SOLID}/>
${walls.join('\n')}
${marks.join('\n')}
  <site name="${o.name}_rim" pos="0 0 ${n(h)}" size="0.003 0 0" group="4"/>
</body>`
}

/** The liquid: frictionless drops, each its own free body (placed inside their beaker by MuJoCoEnv.reset). A drop has
 *  contype 2 and conaffinity 0, so it touches only geoms whose conaffinity has bit 2 (LIQUID_SOLID: glass, bench,
 *  floor): drops pass through each other (they pool into one layer that flows over the rim like a liquid, at a fraction
 *  of the contact cost of a granular pile) and through the arm (a drop pinched between the palm and the rim would be
 *  shot out fast enough to pass through glass). priority="1" makes their frictionless condim="1" win over the glass's
 *  friction (a contact otherwise takes the larger condim of the pair). Joint damping is the liquid's viscosity: a drop
 *  slides and falls at a few tenths of a metre per second instead of shooting out of the beaker like a puck. */
function dropsXml(o: ObjectSpec): string {
  return Array.from({ length: o.liquid ?? 0 }, (_, i) => `<body name="${o.name}_drop${i}" pos="0.5 0 ${n(0.02 + 0.01 * i)}">
  <joint type="free" damping="${n(LAB.drop_drag)}"/>
  <geom type="sphere" size="${n(LAB.drop_r)}" rgba="${LIQUID_RGBA}" mass="0.0008" condim="1" priority="1" contype="2" conaffinity="0"/>
</body>`).join('\n')
}

/** Tube geometry in its body frame: a glass cylinder with a round bottom; the body origin is the cylinder centre. */
export const tubeHalf = (): number => (LAB.tube_len - LAB.tube_r) / 2
/** Height of a tube's body origin above the surface its bottom rests on. */
export const tubeRestZ = (): number => tubeHalf() + LAB.tube_r

function tubeGeoms(prefix: string, x: number, z: number, sample: string, cap: string | null, collide = true): string[] {
  const hh = tubeHalf()
  const r = LAB.tube_r
  const glass = '0.86 0.93 0.97 0.35'
  const c = collide ? 'friction="1.2 0.02 0.001" condim="4"' : VIS
  const out = [
    `  <geom ${prefix ? `name="${prefix}_glass"` : ''} type="cylinder" size="${n(r)} ${n(hh)} 0" pos="${n(x)} 0 ${n(z)}" rgba="${glass}" mass="0.01" ${c}/>`,
    `  <geom type="sphere" size="${n(r)}" pos="${n(x)} 0 ${n(z - hh)}" rgba="${glass}" mass="0.002" ${c}/>`,
    `  <geom type="cylinder" size="${n(r * 0.8)} ${n(0.016)} 0" pos="${n(x)} 0 ${n(z - hh + 0.016)}" rgba="${sample}" ${VIS} mass="0"/>`,
    `  <geom type="sphere" size="${n(r * 0.8)}" pos="${n(x)} 0 ${n(z - hh)}" rgba="${sample}" ${VIS} mass="0"/>`,
    `  <geom type="cylinder" size="${n(r + 0.0012)} 0.002 0" pos="${n(x)} 0 ${n(z + hh - 0.002)}" rgba="0.9 0.95 1 0.6" ${VIS} mass="0"/>`,
  ]
  if (cap) out.push(`  <geom type="cylinder" size="${n(r + 0.0015)} 0.007 0" pos="${n(x)} 0 ${n(z + hh + 0.004)}" rgba="${cap}" ${VIS} mass="0"/>`)
  return out
}

function tubeXml(o: ObjectSpec): string {
  return `<body name="${o.name}" pos="0.5 0 ${n(tubeRestZ() + 0.002)}">
  <freejoint name="${o.name}_free"/>
${tubeGeoms(o.name, 0, 0, rgba(o.color, 0.95), null).join('\n')}
  <site name="${o.name}_top" pos="0 0 ${n(tubeHalf())}" size="0.003 0 0" group="4"/>
</body>`
}

/** Hole centres (x, rack frame) of a rack with `slots` holes in a row. */
export const rackSlotX = (o: ObjectSpec): number[] => Array.from({ length: o.slots ?? 1 }, (_, i) => (i - ((o.slots ?? 1) - 1) / 2) * LAB.pitch)
/** Index of the first empty slot. */
export const rackEmpty = (o: ObjectSpec): number => {
  for (let i = 0; i < (o.slots ?? 1); i++) if (!(o.filled ?? []).includes(i + 1)) return i
  return 0
}

const SAMPLE_COLORS = ['0.95 0.6 0.15 0.95', '0.85 0.25 0.45 0.95', '0.2 0.45 0.95 0.95', '0.6 0.3 0.85 0.95']
const CAP_COLORS = ['0.95 0.85 0.2 1', '0.9 0.3 0.3 1', '0.25 0.55 0.95 1', '0.55 0.85 0.4 1']

/** Test-tube rack: a base, a top plate with a row of square holes, two end walls; `filled` slots carry capped tubes.
 *  Site `<name>_slot` = centre of the first empty hole at the top plate's height. */
function rackXml(o: ObjectSpec): string {
  const xs = rackSlotX(o)
  const hole = LAB.hole
  const W = LAB.rack_w
  const L = xs.length * LAB.pitch + 0.014
  const zt = LAB.rack_top - 0.003
  const col = rgba(o.color)
  const fr = 'friction="0.6 0.005 0.0001"'
  const g: string[] = [
    `  <geom name="${o.name}_base" type="box" size="${n(L / 2)} ${n(W / 2)} ${n(LAB.rack_base / 2)}" pos="0 0 ${n(LAB.rack_base / 2)}" rgba="${col}" mass="0.3" ${fr}/>`,
  ]
  const bar = (W - hole) / 4
  for (const s of [1, -1])
    g.push(`  <geom type="box" size="${n(L / 2)} ${n(bar)} 0.003" pos="0 ${n(s * (hole / 2 + bar))} ${n(zt)}" rgba="${col}" mass="0.05" ${fr}/>`)
  // separators: the top plate between and beside the holes
  const edges = [-L / 2, ...xs.flatMap((x) => [x - hole / 2, x + hole / 2]), L / 2]
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i]!
    const b = edges[i + 1]!
    if (b - a > 1e-4) g.push(`  <geom type="box" size="${n((b - a) / 2)} ${n(hole / 2)} 0.003" pos="${n((a + b) / 2)} 0 ${n(zt)}" rgba="${col}" mass="0.02" ${fr}/>`)
  }
  for (const s of [1, -1])
    g.push(`  <geom type="box" size="0.004 ${n(W / 2)} ${n(LAB.rack_top / 2)}" pos="${n(s * (L / 2 - 0.004))} 0 ${n(LAB.rack_top / 2)}" rgba="${col}" mass="0.05" ${fr}/>`)
  ;(o.filled ?? []).forEach((k, j) => {
    const x = xs[k - 1]
    if (x !== undefined) g.push(...tubeGeoms('', x, LAB.rack_base + tubeRestZ(), SAMPLE_COLORS[j % 4]!, CAP_COLORS[j % 4]!))
  })
  return `<body name="${o.name}" pos="0.5 0 0.001">
  <freejoint name="${o.name}_free"/>
${g.join('\n')}
  <site name="${o.name}_slot" pos="${n(xs[rackEmpty(o)]!)} 0 ${n(LAB.rack_top)}" size="0.003 0 0" group="4"/>
</body>`
}

/** A biochemistry bench around the workspace: back wall, a reagent shelf, glassware and a stirrer. Decoration only. */
function labDecorXml(): string {
  const box = (x: number, y: number, z: number, sx: number, sy: number, sz: number, c: string): string =>
    `<geom type="box" size="${n(sx)} ${n(sy)} ${n(sz)}" pos="${n(x)} ${n(y)} ${n(z)}" rgba="${c}" ${VIS}/>`
  const cyl = (x: number, y: number, z: number, r: number, hh: number, c: string): string =>
    `<geom type="cylinder" size="${n(r)} ${n(hh)} 0" pos="${n(x)} ${n(y)} ${n(z)}" rgba="${c}" ${VIS}/>`
  const out: string[] = []
  // back wall with a tiled splash band, and a two-board reagent shelf
  out.push(box(0.45, 0.72, 0.45, 0.62, 0.012, 0.45, '0.84 0.87 0.9 1'))
  out.push(box(0.45, 0.705, 0.09, 0.62, 0.004, 0.09, '0.93 0.95 0.96 1'))
  for (const x of [-0.08, 0.98]) out.push(box(x, 0.62, 0.34, 0.012, 0.085, 0.34, '0.72 0.75 0.78 1'))
  for (const z of [0.32, 0.56]) out.push(box(0.45, 0.62, z, 0.54, 0.085, 0.008, '0.78 0.8 0.83 1'))
  // reagent bottles: amber glass with black caps, clear media bottles with blue caps
  const bottles: [number, number, string, string, string | null][] = [
    [0.02, 0.32, '0.5 0.27 0.07 0.92', '0.08 0.08 0.09 1', null], [0.11, 0.32, '0.5 0.27 0.07 0.92', '0.08 0.08 0.09 1', null],
    [0.26, 0.32, '0.85 0.92 0.96 0.4', '0.15 0.35 0.85 1', '0.95 0.8 0.2 0.85'], [0.36, 0.32, '0.85 0.92 0.96 0.4', '0.15 0.35 0.85 1', '0.9 0.92 0.95 0.7'],
    [0.62, 0.32, '0.5 0.27 0.07 0.92', '0.85 0.2 0.2 1', null], [0.8, 0.32, '0.85 0.92 0.96 0.4', '0.15 0.35 0.85 1', '0.55 0.2 0.75 0.85'],
    [0.08, 0.56, '0.85 0.92 0.96 0.4', '0.95 0.55 0.1 1', '0.2 0.7 0.4 0.85'], [0.3, 0.56, '0.5 0.27 0.07 0.92', '0.08 0.08 0.09 1', null],
    [0.4, 0.56, '0.5 0.27 0.07 0.92', '0.08 0.08 0.09 1', null], [0.7, 0.56, '0.85 0.92 0.96 0.4', '0.15 0.35 0.85 1', '0.95 0.95 0.97 0.7'],
  ]
  for (const [x, zs, glass, cap, liquid] of bottles) {
    const z0 = zs + 0.008
    out.push(cyl(x, 0.62, z0 + 0.055, 0.03, 0.055, glass))
    if (liquid) out.push(cyl(x, 0.62, z0 + 0.035, 0.026, 0.033, liquid))
    out.push(cyl(x, 0.62, z0 + 0.118, 0.014, 0.008, glass))
    out.push(cyl(x, 0.62, z0 + 0.132, 0.016, 0.008, cap))
  }
  // Erlenmeyer flasks on the bench (stacked rings make the cone), with coloured solutions
  const flask = (x: number, y: number, s: number, liquid: string): void => {
    const rings = [0.042, 0.036, 0.03, 0.024, 0.018, 0.013]
    rings.forEach((r, i) => out.push(cyl(x, y, (0.01 + 0.02 * i) * s, r * s, 0.0101 * s, '0.86 0.93 0.97 0.32')))
    out.push(cyl(x, y, 0.14 * s, 0.011 * s, 0.025 * s, '0.86 0.93 0.97 0.32'))
    out.push(cyl(x, y, 0.015 * s, 0.038 * s, 0.014 * s, liquid))
    out.push(cyl(x, y, 0.038 * s, 0.031 * s, 0.01 * s, liquid))
  }
  flask(0.18, 0.5, 1, '0.85 0.25 0.55 0.85')
  flask(0.3, 0.53, 0.8, '0.95 0.75 0.15 0.85')
  // magnetic stirrer hot plate with a beaker of blue buffer on it
  out.push(box(0.68, 0.5, 0.025, 0.075, 0.075, 0.025, '0.2 0.21 0.23 1'))
  out.push(box(0.68, 0.5, 0.052, 0.068, 0.068, 0.003, '0.92 0.93 0.94 1'))
  out.push(box(0.68, 0.422, 0.022, 0.03, 0.003, 0.012, '0.12 0.12 0.13 1'))
  out.push(cyl(0.66, 0.42, 0.022, 0.006, 0.004, '0.85 0.2 0.2 1'))
  out.push(cyl(0.68, 0.5, 0.1, 0.035, 0.045, '0.86 0.93 0.97 0.32'))
  out.push(cyl(0.68, 0.5, 0.08, 0.032, 0.024, '0.1 0.38 0.95 0.8'))
  // micropipettes in a stand, a waste bin with a yellow biohazard band
  out.push(box(0.86, 0.5, 0.004, 0.04, 0.03, 0.004, '0.25 0.27 0.3 1'))
  for (const [k, c] of [[-0.02, '0.95 0.95 0.96 1'], [0, '0.85 0.86 0.88 1'], [0.02, '0.95 0.95 0.96 1']] as [number, string][]) {
    out.push(cyl(0.86 + k, 0.5, 0.09, 0.006, 0.07, c))
    out.push(cyl(0.86 + k, 0.5, 0.165, 0.008, 0.008, k === 0 ? '0.2 0.45 0.9 1' : '0.9 0.3 0.3 1'))
  }
  out.push(box(1.0, -0.5, 0.11, 0.07, 0.07, 0.15, '0.8 0.15 0.15 1'))
  out.push(box(1.0, -0.5, 0.2, 0.0705, 0.0705, 0.02, '0.98 0.82 0.1 1'))
  return out.join('\n')
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
  const lab = task.environment === 'lab'
  const world: string[] = [
    `<light pos="${n(tcx)} 0 2" dir="0 0 -1" diffuse="0.4 0.4 0.4" castshadow="false"/>`,
    `<geom name="floor" type="plane" size="3 3 0.05" pos="0 0 -0.04" rgba="${lab ? '0.55 0.58 0.6 1' : '0.12 0.13 0.15 1'}" ${LIQUID_SOLID}/>`,
    `<geom name="table" type="box" size="${n(thx)} ${n(thy)} 0.02" pos="${n(tcx)} ${n(tcy)} -0.02" rgba="${lab ? '0.9 0.91 0.92 1' : '0.62 0.62 0.6 1'}" friction="0.5 0.005 0.0001" ${LIQUID_SOLID}/>`,
  ]
  if (lab) world.push(labDecorXml())
  const build: Record<ObjectSpec['type'], (o: ObjectSpec) => string> = {
    bottle: (o) => bottleXml(o, profile.dims), tray: (o) => trayXml(o, profile.dims), cube: cubeXml,
    beaker: beakerXml, tube: tubeXml, rack: rackXml,
  }
  for (const o of task.objects) world.push(build[o.type](o))
  // Drops go last: the constraint solver factorises from the last degree of freedom back, so a beaker declared AFTER
  // the drops resting in it would couple all of them into one dense system (~10x slower per step).
  for (const o of task.objects) if (o.type === 'beaker' && o.liquid) world.push(dropsXml(o))
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
