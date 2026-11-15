// Tải mô hình GLB (CC0 – Kenney), nhân bản, instancing
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const MODEL_BASE = '/models/';

export class Assets {
  constructor(onProgress) {
    this.manager = new THREE.LoadingManager();
    this.total = 0;
    this.done = 0;
    this.onProgress = onProgress || (() => {});
    this.loader = new GLTFLoader(this.manager);
    this.cache = new Map();
  }

  /** path tương đối trong /models, ví dụ 'nature/tree_oak_fall.glb' */
  load(path) {
    if (this.cache.has(path)) return this.cache.get(path);
    this.total++;
    const p = this.loader.loadAsync(MODEL_BASE + path).then((g) => {
      prepareScene(g.scene);
      return g;
    }).catch((e) => {
      console.warn('[world] Không tải được mô hình', path, e);
      return { scene: new THREE.Group(), animations: [] };
    }).finally(() => {
      this.done++;
      this.onProgress(this.done / Math.max(1, this.total));
    });
    this.cache.set(path, p);
    return p;
  }

  async loadAll(paths) {
    const out = {};
    await Promise.all(paths.map(async (p) => { out[p] = await this.load(p); }));
    return out;
  }
}

function prepareScene(root) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m.map) { m.map.anisotropy = 4; }
        if (m.metalness !== undefined) { m.metalness = Math.min(m.metalness, 0.1); m.roughness = Math.max(m.roughness ?? 1, 0.75); }
      }
    }
  });
}

/** Nhân bản tĩnh (dùng chung geometry/material). */
export function place(gltf, { x = 0, y = 0, z = 0, ry = 0, s = 1, sx, sy, sz, shadow = true, receive = true } = {}) {
  const o = gltf.scene.clone(true);
  o.position.set(x, y, z);
  o.rotation.y = ry;
  o.scale.set(sx ?? s, sy ?? s, sz ?? s);
  o.traverse((m) => { if (m.isMesh) { m.castShadow = shadow; m.receiveShadow = receive; } });
  return o;
}

/** Đổi màu (nhân) cho bản sao – clone material. */
export function tint(obj, color, { emissive = null, emissiveIntensity = 0, metal = null, rough = null, filter = null } = {}) {
  const c = new THREE.Color(color);
  obj.traverse((m) => {
    if (!m.isMesh) return;
    const apply = (mat) => {
      if (filter && !filter(mat)) return mat;
      const n = mat.clone();
      n.color = n.color ? n.color.clone().multiply(c) : c.clone();
      if (emissive) { n.emissive = new THREE.Color(emissive); n.emissiveIntensity = emissiveIntensity; }
      if (metal !== null) n.metalness = metal;
      if (rough !== null) n.roughness = rough;
      return n;
    };
    m.material = Array.isArray(m.material) ? m.material.map(apply) : apply(m.material);
  });
  return obj;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();

export function composeMatrix({ x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1, sx, sy, sz }, out = new THREE.Matrix4()) {
  _p.set(x, y, z);
  _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ'));
  _s.set(sx ?? s, sy ?? s, sz ?? s);
  return out.compose(_p, _q, _s);
}

/**
 * Tạo InstancedMesh cho mọi mesh con của mô hình.
 * transforms: [{x,y,z,ry,s,...}] ; colorFn(i) -> THREE.Color (tuỳ chọn, nhân màu)
 */
export function instanced(gltf, transforms, { shadow = true, receive = true, colorFn = null, materialFn = null } = {}) {
  const group = new THREE.Group();
  if (!transforms.length) return group;
  const src = gltf.scene;
  src.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(src.matrixWorld).invert();
  src.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const local = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld);
    let mat = mesh.material;
    if (materialFn) mat = materialFn(mat);
    const im = new THREE.InstancedMesh(mesh.geometry, mat, transforms.length);
    transforms.forEach((t, i) => {
      composeMatrix(t, _m);
      _m.multiply(local);
      im.setMatrixAt(i, _m);
      if (colorFn) im.setColorAt(i, colorFn(i, t));
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = shadow;
    im.receiveShadow = receive;
    im.computeBoundingSphere();
    im.computeBoundingBox?.();
    group.add(im);
  });
  return group;
}

/** Kích thước hộp bao của mô hình gốc. */
export function bounds(gltf) {
  const b = new THREE.Box3().setFromObject(gltf.scene);
  return { box: b, size: b.getSize(new THREE.Vector3()), center: b.getCenter(new THREE.Vector3()) };
}

/** Mesh phẳng có texture canvas (biển chữ). */
export function texturedPlane(texture, w, h, { transparent = false, emissive = 0, side = THREE.FrontSide, lit = true } = {}) {
  const mat = lit
    ? new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85, metalness: 0, transparent, side, emissive: emissive ? 0xffffff : 0x000000, emissiveMap: emissive ? texture : null, emissiveIntensity: emissive })
    : new THREE.MeshBasicMaterial({ map: texture, transparent, side, toneMapped: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.receiveShadow = lit;
  return m;
}
