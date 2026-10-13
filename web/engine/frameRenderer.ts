/**
 * Agent-camera frames rendered in the browser: three.js on an OffscreenCanvas inside the worker, from the same scene
 * data the 3D viewer gets (the MuJoCo WASM build has no renderer of its own). Returns null from create() where WebGL
 * on an OffscreenCanvas is unavailable; the session then simply streams no camera frames.
 */
import * as THREE from 'three'
import type { SceneData, SceneGeom, SceneMesh } from '../types'
import type { CameraParams } from './env'
import type { FrameRenderer } from './session'

function b64(s: string): Uint8Array {
  const bin = atob(s)
  const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  return u8
}

function geometryFor(g: SceneGeom, meshes: Record<string, SceneMesh>, cache: Map<number, THREE.BufferGeometry>): THREE.BufferGeometry | null {
  const [sx = 0, sy = 0, sz = 0] = g.size
  switch (g.type) {
    case 'plane':
      return new THREE.PlaneGeometry(2 * Math.min(sx || 3, 6), 2 * Math.min(sy || 3, 6))
    case 'box':
      return new THREE.BoxGeometry(2 * sx, 2 * sy, 2 * sz)
    case 'cylinder': {
      const c = new THREE.CylinderGeometry(sx, sx, 2 * sy, 40)
      c.rotateX(Math.PI / 2)
      return c
    }
    case 'sphere':
      return new THREE.SphereGeometry(sx, 24, 16)
    case 'mesh': {
      if (g.mesh === undefined) return null
      const hit = cache.get(g.mesh)
      if (hit) return hit
      const m = meshes[String(g.mesh)]
      if (!m) return null
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(b64(m.v).buffer), 3))
      const idx = b64(m.f).buffer
      geo.setIndex(new THREE.BufferAttribute(m.f32 ? new Uint32Array(idx) : new Uint16Array(idx), 1))
      geo.computeVertexNormals()
      cache.set(g.mesh, geo)
      return geo
    }
  }
}

class ThreeFrameRenderer implements FrameRenderer {
  private scene = new THREE.Scene()
  private world = new THREE.Group()
  private bodies: THREE.Group[] = []
  private camera = new THREE.PerspectiveCamera(55, 4 / 3, 0.02, 30)

  constructor(private renderer: THREE.WebGLRenderer, private canvas: OffscreenCanvas) {
    this.scene.add(this.world)
    this.scene.background = new THREE.Color(0x14151a)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4252, 0.9))
    const sun = new THREE.DirectionalLight(0xffffff, 2.2)
    sun.position.set(1.2, -1.0, 2.6)
    this.scene.add(sun)
  }

  setScene(data: SceneData): void {
    this.world.clear()
    this.bodies = Array.from({ length: data.nbody }, () => new THREE.Group())
    for (const b of this.bodies) this.world.add(b)
    const cache = new Map<number, THREE.BufferGeometry>()
    for (const g of data.geoms) {
      const geo = geometryFor(g, data.meshes, cache)
      if (!geo) continue
      const [r = 0.5, gg = 0.5, b = 0.5, a = 1] = g.rgba
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(r, gg, b), roughness: g.type === 'mesh' ? 0.45 : 0.75, metalness: g.type === 'mesh' ? 0.08 : 0,
        transparent: a < 1, opacity: a, side: g.type === 'plane' ? THREE.DoubleSide : THREE.FrontSide,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(g.pos[0]!, g.pos[1]!, g.pos[2]!)
      mesh.quaternion.set(g.quat[1]!, g.quat[2]!, g.quat[3]!, g.quat[0]!)
      this.bodies[g.body]?.add(mesh)
    }
    this.updatePoses(Float32Array.from(data.poses.flat()))
  }

  updatePoses(P: Float32Array): void {
    for (let i = 0; i < this.bodies.length; i++) {
      const o = 7 * i
      if (o + 6 >= P.length) break
      this.bodies[i]!.position.set(P[o]!, P[o + 1]!, P[o + 2]!)
      this.bodies[i]!.quaternion.set(P[o + 4]!, P[o + 5]!, P[o + 6]!, P[o + 3]!)
    }
  }

  async render(cam: CameraParams, opts: { width: number; height: number; mime: 'image/jpeg' | 'image/png'; quality?: number }): Promise<Uint8Array | null> {
    const { width, height } = opts
    this.renderer.setSize(width, height, false)
    // MuJoCo cameras share three.js' convention (looks down -z, y up), so the camera-to-world pose maps over directly.
    const T = cam.T_world_cam
    const M = new THREE.Matrix4().set(T[0]!, T[1]!, T[2]!, T[3]!, T[4]!, T[5]!, T[6]!, T[7]!, T[8]!, T[9]!, T[10]!, T[11]!, 0, 0, 0, 1)
    this.camera.position.setFromMatrixPosition(M)
    this.camera.quaternion.setFromRotationMatrix(M)
    this.camera.fov = (2 * Math.atan((0.5 * cam.height) / cam.fy) * 180) / Math.PI
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.camera.updateMatrixWorld(true)
    this.renderer.render(this.scene, this.camera)
    const blob = await this.canvas.convertToBlob({ type: opts.mime, quality: opts.quality })
    return new Uint8Array(await blob.arrayBuffer())
  }
}

export function createFrameRenderer(): FrameRenderer | null {
  try {
    if (typeof OffscreenCanvas === 'undefined') return null
    const canvas = new OffscreenCanvas(480, 360)
    const renderer = new THREE.WebGLRenderer({ canvas: canvas as unknown as HTMLCanvasElement, antialias: true, preserveDrawingBuffer: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    return new ThreeFrameRenderer(renderer, canvas)
  } catch {
    return null
  }
}
