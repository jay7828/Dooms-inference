/**
 * The slice of the MuJoCo WebAssembly API (public/vendor/mujoco, MuJoCo 3.x JS bindings) the Dooms engine uses.
 * Typed here so the engine needs no `any`; the real module is cast to MujocoApi once, in loadMujoco().
 */
export interface MjModel {
  nbody: number
  ngeom: number
  nq: number
  nv: number
  nu: number
  nmesh: number
  nkey: number
  opt: { timestep: number }
  body_pos: Float64Array
  jnt_qposadr: Int32Array
  jnt_dofadr: Int32Array
  jnt_range: Float64Array
  sensor_adr: Int32Array
  key_qpos: Float64Array
  cam_fovy: Float64Array
  geom_type: Int32Array
  geom_group: Int32Array
  geom_bodyid: Int32Array
  geom_dataid: Int32Array
  geom_matid: Int32Array
  geom_size: Float64Array
  geom_pos: Float64Array
  geom_quat: Float64Array
  geom_rgba: Float32Array
  mat_rgba: Float32Array
  mesh_vertadr: Int32Array
  mesh_vertnum: Int32Array
  mesh_faceadr: Int32Array
  mesh_facenum: Int32Array
  mesh_vert: Float32Array
  mesh_face: Int32Array
  delete(): void
}

export interface MjData {
  time: number
  qpos: Float64Array
  qvel: Float64Array
  ctrl: Float64Array
  xpos: Float64Array
  xquat: Float64Array
  xmat: Float64Array
  site_xpos: Float64Array
  site_xmat: Float64Array
  geom_xpos: Float64Array
  geom_xmat: Float64Array
  cam_xpos: Float64Array
  cam_xmat: Float64Array
  cvel: Float64Array
  sensordata: Float64Array
  delete(): void
}

export interface DoubleBuffer {
  GetView(): Float64Array
  delete(): void
}

type ObjType = { value: number }

export interface MujocoApi {
  FS: {
    mkdir(path: string): void
    writeFile(path: string, data: string | Uint8Array): void
    analyzePath(path: string): { exists: boolean }
  }
  MjModel: { from_xml_path(path: string): MjModel }
  MjData: new (model: MjModel) => MjData
  DoubleBuffer: { FromArray(a: Float64Array): DoubleBuffer }
  mjtObj: Record<'mjOBJ_BODY' | 'mjOBJ_JOINT' | 'mjOBJ_SITE' | 'mjOBJ_GEOM' | 'mjOBJ_SENSOR' | 'mjOBJ_CAMERA' | 'mjOBJ_KEY', ObjType>
  mj_name2id(m: MjModel, type: number, name: string): number
  mj_step(m: MjModel, d: MjData): void
  mj_forward(m: MjModel, d: MjData): void
  mj_kinematics(m: MjModel, d: MjData): void
  mj_resetData(m: MjModel, d: MjData): void
  mj_resetDataKeyframe(m: MjModel, d: MjData, key: number): void
  mj_jac(m: MjModel, d: MjData, jacp: DoubleBuffer, jacr: DoubleBuffer, point: Float64Array, body: number): void
  mj_ray(
    m: MjModel, d: MjData, pnt: Float64Array, vec: Float64Array, geomgroup: Uint8Array, flgStatic: number,
    bodyExclude: number, geomIdOut: Int32Array, normalOut: Float64Array,
  ): number
}
