// Live 3D viewer (three.js): renders the MuJoCo scene from streamed body poses.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let DEFAULT_VIEW = { pos: [1.62, -1.15, 1.2], target: [0.42, 0.02, 0.1] };

function b64(s) {
  const bin = atob(s), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

export function createViewer(canvas, stage) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const world = new THREE.Group(), markers = new THREE.Group();
  scene.add(world, markers);

  const camera = new THREE.PerspectiveCamera(42, 1.4, 0.03, 30);
  camera.up.set(0, 0, 1); // MuJoCo world: z up
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.49;
  const resetView = () => {
    camera.position.set(...DEFAULT_VIEW.pos);
    controls.target.set(...DEFAULT_VIEW.target);
    controls.update();
  };
  resetView();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4252, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(1.2, -1.0, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -1.3, right: 1.3, top: 1.3, bottom: -1.3, near: 0.5, far: 6 });
  sun.shadow.bias = -0.0004;
  sun.target.position.set(0.4, 0, 0);
  scene.add(sun, sun.target);

  const api = { ready: false, bodies: [], simT: 0 };

  function resize() {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();
  (function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();

  function geometryFor(g, meshes, cache) {
    const [sx, sy, sz] = g.size;
    switch (g.type) {
      case "plane": return new THREE.PlaneGeometry(2 * Math.min(sx || 3, 6), 2 * Math.min(sy || 3, 6));
      case "box": return new THREE.BoxGeometry(2 * sx, 2 * sy, 2 * sz);
      case "cylinder": { const c = new THREE.CylinderGeometry(sx, sx, 2 * sy, 40); c.rotateX(Math.PI / 2); return c; }
      case "sphere": return new THREE.SphereGeometry(sx, 24, 16);
      case "mesh": {
        if (cache[g.mesh]) return cache[g.mesh];
        const m = meshes[g.mesh], geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(b64(m.v).buffer), 3));
        const idx = b64(m.f).buffer;
        geo.setIndex(new THREE.BufferAttribute(m.f32 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
        geo.computeVertexNormals();
        return (cache[g.mesh] = geo);
      }
    }
  }

  function clearMarkers() {
    while (markers.children.length) {
      const c = markers.children[0];
      markers.remove(c);
      c.geometry?.dispose();
      c.material?.map?.dispose();
      c.material?.dispose();
    }
  }

  api.buildScene = (sc) => {
    world.clear();
    api.bodies = [];
    clearMarkers();
    for (let i = 0; i < sc.nbody; i++) { const grp = new THREE.Group(); api.bodies.push(grp); world.add(grp); }
    const cache = {};
    for (const g of sc.geoms) {
      const geo = geometryFor(g, sc.meshes, cache);
      if (!geo) continue;
      const [r, gg, b, a] = g.rgba;
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(r, gg, b), roughness: g.type === "mesh" ? 0.45 : 0.75, metalness: g.type === "mesh" ? 0.08 : 0,
        transparent: a < 1, opacity: a, side: g.type === "plane" ? THREE.DoubleSide : THREE.FrontSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...g.pos);
      mesh.quaternion.set(g.quat[1], g.quat[2], g.quat[3], g.quat[0]);
      mesh.castShadow = g.type !== "plane";
      mesh.receiveShadow = true;
      api.bodies[g.body].add(mesh);
    }
    api.applyPoses(Float32Array.from(sc.poses.flat()));
    api.ready = true;
  };

  api.applyPoses = (P) => {
    for (let i = 0; i < api.bodies.length; i++) {
      const o = 7 * i, b = api.bodies[i];
      b.position.set(P[o], P[o + 1], P[o + 2]);
      b.quaternion.set(P[o + 4], P[o + 5], P[o + 6], P[o + 3]);
    }
  };

  function labelSprite(text, k = 1) {
    const c = document.createElement("canvas");
    c.width = 320; c.height = 64;
    const x = c.getContext("2d");
    x.font = "600 26px ui-monospace, Menlo, monospace";
    const w = Math.min(300, x.measureText(text).width + 28);
    x.fillStyle = "rgba(9,11,16,.86)";
    x.beginPath(); x.roundRect((320 - w) / 2, 10, w, 42, 10); x.fill();
    x.strokeStyle = "rgba(124,140,255,.7)"; x.lineWidth = 2; x.stroke();
    x.fillStyle = "#c9d0ff"; x.textAlign = "center"; x.fillText(text, 160, 40);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
    s.scale.set(0.2 * k, 0.04 * k, 1);
    return s;
  }

  api.showMarkers = (kps) => {
    clearMarkers();
    for (const [name, k] of Object.entries(kps)) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.011 * (DEFAULT_VIEW.scale || 1), 20, 14), new THREE.MeshBasicMaterial({ color: 0x7c8cff, depthTest: false }));
      s.position.set(...k.pos); s.renderOrder = 10;
      const l = labelSprite(name, DEFAULT_VIEW.scale || 1);
      l.position.set(k.pos[0], k.pos[1], k.pos[2] + 0.06 * (DEFAULT_VIEW.scale || 1)); l.renderOrder = 11;
      markers.add(s, l);
      if (k.normal) {
        const a = new THREE.ArrowHelper(new THREE.Vector3(...k.normal), new THREE.Vector3(...k.pos), 0.05 * (DEFAULT_VIEW.scale || 1), 0x7c8cff, 0.012 * (DEFAULT_VIEW.scale || 1), 0.008 * (DEFAULT_VIEW.scale || 1));
        a.line.material.depthTest = false; a.cone.material.depthTest = false;
        markers.add(a);
      }
    }
  };
  api.clearMarkers = clearMarkers;
  api.resetView = resetView;
  api.setDefaultView = (v) => { if (v?.pos && v?.target) { DEFAULT_VIEW = v; resetView(); } else { DEFAULT_VIEW = { pos: [1.62, -1.15, 1.2], target: [0.42, 0.02, 0.1] }; resetView(); } };   // per-robot camera
  return api;
}
