// Mặt hồ có gợn + hạc giấy trôi (instanced)
import * as THREE from 'three';
import { PIER } from './layout.js';

const MAX_CRANES = 150;
const PALETTE = ['#FFFFFF', '#FFB3C1', '#FFD166', '#9AD1FF', '#B8F2C9', '#E9973B', '#F28482', '#CDB4DB'];

export function createWater(L) {
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#2E6E8E') },
      uShallow: { value: new THREE.Color('#6FB7C2') },
      uSun: { value: new THREE.Vector3(-0.7, 0.45, 0.3).normalize() },
      uSunColor: { value: new THREE.Color('#FFD9A0') },
      uRipples: { value: [new THREE.Vector4(0, 0, -100, 0), new THREE.Vector4(0, 0, -100, 0), new THREE.Vector4(0, 0, -100, 0), new THREE.Vector4(0, 0, -100, 0)] },
    },
  ]);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    fog: true,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      varying vec3 vW;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform float uTime;
      uniform vec3 uDeep, uShallow, uSun, uSunColor;
      uniform vec4 uRipples[4];
      varying vec3 vW;
      varying vec2 vUv;
      void main() {
        vec2 p = vW.xz;
        float t = uTime;
        // đạo hàm sóng (tổng các sin)
        vec2 g = vec2(0.0);
        g += vec2(1.3, 0.0) * cos(p.x * 1.3 + t * 1.1) * 0.5;
        g += vec2(0.0, 1.7) * cos(p.y * 1.7 - t * 0.9) * 0.45;
        g += vec2(2.3, 2.3) * cos((p.x + p.y) * 2.3 + t * 1.7) * 0.18;
        g += vec2(3.1, -2.7) * cos(p.x * 3.1 - p.y * 2.7 + t * 2.3) * 0.1;
        // gợn tròn khi thả hạc
        for (int i = 0; i < 4; i++) {
          vec4 r = uRipples[i];
          float age = t - r.z;
          if (age > 0.0 && age < 4.0) {
            vec2 d = p - r.xy;
            float dist = length(d) + 1e-4;
            float rad = age * 1.6;
            float ring = exp(-pow((dist - rad) * 3.0, 2.0)) * (1.0 - age / 4.0);
            g += (d / dist) * cos((dist - rad) * 10.0) * ring * 3.0;
          }
        }
        vec3 n = normalize(vec3(-g.x * 0.08, 1.0, -g.y * 0.08));
        vec3 viewDir = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
        float edge = smoothstep(0.55, 1.0, length(vUv - 0.5) * 2.0);
        vec3 col = mix(uDeep, uShallow, edge * 0.7 + 0.15);
        col = mix(col, vec3(0.98, 0.84, 0.62), fres * 0.55); // phản chiếu trời chiều
        vec3 h = normalize(uSun + viewDir);
        float spec = pow(max(dot(n, h), 0.0), 120.0);
        col += uSunColor * spec * 1.4;
        float foam = smoothstep(0.93, 0.99, length(vUv - 0.5) * 2.0);
        col = mix(col, vec3(0.95, 0.93, 0.85), foam * 0.5);
        gl_FragColor = vec4(col, 0.92);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const geo = new THREE.CircleGeometry(1, 72);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(L.rx, L.rz, 1);
  mesh.position.set(L.x, 0.04, L.z);
  mesh.renderOrder = 1;
  // bờ cát
  const bank = new THREE.Mesh(new THREE.RingGeometry(0.97, 1.12, 72), new THREE.MeshLambertMaterial({ color: '#CDB48A', polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
  bank.rotation.x = -Math.PI / 2;
  bank.scale.set(L.rx, L.rz, 1);
  bank.position.set(L.x, 0.025, L.z);
  bank.receiveShadow = true;
  const group = new THREE.Group();
  group.add(bank, mesh);
  let ri = 0;
  return {
    mesh: group,
    update(t) { uniforms.uTime.value = t; },
    setSun(dir) { uniforms.uSun.value.copy(dir).normalize(); },
    ripple(x, z) { uniforms.uRipples.value[ri % 4].set(x, z, uniforms.uTime.value, 0); ri++; },
  };
}

/** Hình hạc giấy gấp (đa giác phẳng – đúng bản chất origami). */
export function craneGeometry() {
  const V = (x, y, z) => [x, y, z];
  const Bf = V(0, 0.02, 0.12), Bb = V(0, 0.02, -0.12), Bot = V(0, -0.035, 0);
  const L = V(0.055, 0.035, 0), Rr = V(-0.055, 0.035, 0);
  const Cf = V(0, 0.07, 0.06), Cb = V(0, 0.07, -0.07);
  const WL = V(0.36, 0.17, -0.05), WR = V(-0.36, 0.17, -0.05);
  const tris = [
    // thân
    [Bf, L, Bot], [Bf, Bot, Rr], [Bb, Bot, L], [Bb, Rr, Bot],
    [Bf, Cf, L], [Bf, Rr, Cf], [Bb, L, Cb], [Bb, Cb, Rr], [Cf, Cb, L], [Cf, Rr, Cb],
    // cánh
    [Cf, Cb, WL], [Cb, Cf, WR],
    // cổ + đầu
    [V(0, 0.02, 0.07), V(0, 0.06, 0.13), V(0, 0.31, 0.27)],
    [V(0, 0.31, 0.27), V(0, 0.27, 0.26), V(0, 0.255, 0.37)],
    // đuôi
    [V(0, 0.02, -0.07), V(0, 0.06, -0.13), V(0, 0.3, -0.3)],
  ];
  const pos = [];
  for (const t of tris) for (const v of t) pos.push(...v);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}

function parseColor(c, seed) {
  const col = new THREE.Color();
  if (typeof c === 'string' && c) {
    try { col.setStyle(c); return col; } catch { /* dùng bảng màu */ }
  }
  return col.set(PALETTE[Math.floor(seed * PALETTE.length) % PALETTE.length]);
}

export class CraneFlock {
  constructor(scene, L) {
    this.L = L;
    this.geo = craneGeometry();
    this.mat = new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, flatShading: true, roughness: 0.65 });
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, MAX_CRANES);
    this.mesh.count = 0;
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.mesh);
    this.items = [];
    this.extra = [];
    this.ids = new Set();
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3(2.1, 2.1, 2.1);
    this.flying = [];
    this.scene = scene;
  }

  _make(id, color, origin) {
    const s = hash(String(id));
    const s2 = hash(String(id) + 'x');
    const a = s * Math.PI * 2, r = 0.25 + 0.6 * Math.sqrt(s2);
    return {
      id, seed: s,
      bx: this.L.x + Math.cos(a) * this.L.rx * r * 0.85,
      bz: this.L.z + Math.sin(a) * this.L.rz * r * 0.85,
      ox: origin ? origin.x : null, oz: origin ? origin.z : null, blend: origin ? 0 : 1,
      color: parseColor(color, s),
      phase: s2 * 100,
    };
  }

  setCranes(list) {
    const sorted = [...(list || [])].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    const take = sorted.slice(0, MAX_CRANES);
    this.items = take.map((c) => this._make(c.id ?? Math.random(), c.color));
    this.ids = new Set(take.map((c) => String(c.id)));
    // hạc vừa thả (chưa có trong danh sách – đang chờ duyệt) giữ lại tạm
    this.extra = this.extra.filter((e) => !this.ids.has(String(e.id))).slice(-10);
    this._refreshColors();
  }

  _all() { return this.items.length + this.extra.length > MAX_CRANES ? [...this.extra, ...this.items].slice(0, MAX_CRANES) : [...this.extra, ...this.items]; }

  _refreshColors() {
    const all = this._all();
    all.forEach((c, i) => this.mesh.setColorAt(i, c.color));
    this.mesh.count = all.length;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  /** Hiệu ứng thả hạc mới: bay từ bến xuống mặt hồ. */
  drop(color, from, water) {
    const id = 'local-' + Math.random().toString(36).slice(2);
    const c = this._make(id, color);
    const m = new THREE.Mesh(this.geo, this.mat.clone());
    m.material.color.copy(c.color);
    m.scale.setScalar(2.4);
    m.castShadow = true;
    this.scene.add(m);
    const target = new THREE.Vector3(from.x + 2.5 + Math.random() * 2, 0.1, from.z + (Math.random() - 0.5) * 3);
    this.flying.push({ m, t: 0, from: from.clone().add(new THREE.Vector3(0, 2.2, 0)), to: target, c, water });
  }

  update(t, dt) {
    const all = this._all();
    const L = this.L;
    for (let i = 0; i < all.length; i++) {
      const c = all[i];
      const ph = c.phase;
      let x = c.bx + Math.sin(t * 0.07 + ph) * 1.6 + Math.sin(t * 0.13 + ph * 2) * 0.6;
      let z = c.bz + Math.cos(t * 0.06 + ph * 1.3) * 1.3;
      if (c.blend < 1 && c.ox !== null) {
        c.blend = Math.min(1, c.blend + dt * 0.15);
        x = c.ox + (x - c.ox) * c.blend; z = c.oz + (z - c.oz) * c.blend;
      }
      // giữ trong hồ
      const nx = (x - L.x) / (L.rx * 0.88), nz = (z - L.z) / (L.rz * 0.88);
      const k = Math.hypot(nx, nz);
      if (k > 1) { x = L.x + (nx / k) * L.rx * 0.88; z = L.z + (nz / k) * L.rz * 0.88; }
      // tránh bến gỗ
      const pd = PIER.w / 2 + 0.6;
      if (x < PIER.x1 + 0.8 && Math.abs(z - PIER.z) < pd) z = PIER.z + Math.sign(z - PIER.z || 1) * pd;
      const vx = Math.cos(t * 0.07 + ph) * 0.11 + Math.cos(t * 0.13 + ph * 2) * 0.08;
      const vz = -Math.sin(t * 0.06 + ph * 1.3) * 0.08;
      const ry = Math.atan2(vx, vz);
      this._p.set(x, 0.1 + Math.sin(t * 1.4 + ph) * 0.02, z);
      this._q.setFromEuler(this._e.set(Math.sin(t * 1.1 + ph) * 0.06, ry, Math.sin(t * 1.3 + ph) * 0.08, 'YXZ'));
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    // hạc đang bay xuống
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const f = this.flying[i];
      f.t += dt / 2.4;
      const k = Math.min(1, f.t);
      const e = 1 - Math.pow(1 - k, 2);
      f.m.position.lerpVectors(f.from, f.to, e);
      f.m.position.y = f.from.y * (1 - e) + f.to.y + Math.sin(k * Math.PI) * 1.2;
      f.m.rotation.set(Math.sin(t * 6) * 0.15 * (1 - k), Math.atan2(f.to.x - f.from.x, f.to.z - f.from.z), Math.sin(t * 9) * 0.25 * (1 - k));
      if (k >= 1) {
        f.water && f.water.ripple(f.to.x, f.to.z);
        this.scene.remove(f.m); f.m.material.dispose();
        f.c.ox = f.to.x; f.c.oz = f.to.z; f.c.blend = 0;
        this.extra.unshift(f.c);
        this._refreshColors();
        this.flying.splice(i, 1);
      }
    }
  }
}
