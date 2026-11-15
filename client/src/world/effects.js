// Hiệu ứng: lá vàng rơi, khói hương, pháo hoa, pháo giấy, phong bì bay, bụi phấn
import * as THREE from 'three';
import { leafTexture, softDotTexture, envelopeTexture } from './textures.js';

const LEAF_COLORS = ['#E9973B', '#F2B544', '#D8622B', '#C0392B', '#F4D35E', '#B5651D'];

export class Effects {
  constructor(scene, quality) {
    this.scene = scene;
    this.quality = quality;
    this.dot = softDotTexture();
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._p = new THREE.Vector3();
    this._s = new THREE.Vector3(1, 1, 1);
    this._c = new THREE.Color();
    this.updaters = [];

    /* Lá rơi (instanced) */
    const N = quality.high ? 260 : 130;
    this.leafN = N;
    const lg = new THREE.PlaneGeometry(0.22, 0.22);
    const lm = new THREE.MeshLambertMaterial({ map: leafTexture(), alphaTest: 0.5, side: THREE.DoubleSide });
    this.leaves = new THREE.InstancedMesh(lg, lm, N);
    this.leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.leaves.frustumCulled = false;
    this.leafData = [];
    for (let i = 0; i < N; i++) {
      const d = { x: 0, y: 0, z: 0, vy: 0.5 + Math.random() * 0.6, ph: Math.random() * 10, sp: 1 + Math.random() * 2, rest: 0, rx: 0, ry: 0, rz: 0 };
      this._spawnLeaf(d, new THREE.Vector3(), true);
      this.leafData.push(d);
      this.leaves.setColorAt(i, this._c.set(LEAF_COLORS[i % LEAF_COLORS.length]));
    }
    scene.add(this.leaves);

    /* Khói hương (Points) */
    this.smokeN = 70;
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(this.smokeN * 3), 3));
    sg.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(this.smokeN), 1));
    sg.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(this.smokeN), 1));
    this.smoke = new THREE.Points(sg, softPointsMaterial(this.dot, '#E8E2D8', THREE.NormalBlending));
    this.smoke.frustumCulled = false;
    this.smokeData = Array.from({ length: this.smokeN }, () => ({ life: Math.random() * 4, max: 4, x: 0, y: 0, z: 0 }));
    this.smokeBoost = 0;
    this.smokePos = null;
    scene.add(this.smoke);

    this.bursts = [];
    this.flyers = [];
    this.envTex = envelopeTexture().texture;
  }

  _spawnLeaf(d, center, initial) {
    const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 26;
    d.x = center.x + Math.cos(a) * r;
    d.z = center.z + Math.sin(a) * r;
    d.y = initial ? Math.random() * 9 : 7 + Math.random() * 4;
    d.rest = 0;
  }

  setIncense(pos) { this.smokePos = pos.clone(); }

  update(t, dt, playerPos) {
    /* lá */
    const L = this.leafData;
    for (let i = 0; i < L.length; i++) {
      const d = L[i];
      if (d.y > 0.03) {
        d.y -= d.vy * dt;
        d.x += Math.sin(t * d.sp + d.ph) * 0.6 * dt + 0.25 * dt;
        d.z += Math.cos(t * d.sp * 0.8 + d.ph) * 0.5 * dt;
        d.rx = t * d.sp + d.ph; d.ry = t * 0.7 + d.ph; d.rz = Math.sin(t * d.sp) * 0.8;
      } else {
        d.y = 0.03; d.rx = -Math.PI / 2; d.rz = 0;
        d.rest += dt;
        if (d.rest > 6) this._spawnLeaf(d, playerPos, false);
      }
      const dx = d.x - playerPos.x, dz = d.z - playerPos.z;
      if (dx * dx + dz * dz > 34 * 34) this._spawnLeaf(d, playerPos, false);
      this._p.set(d.x, d.y, d.z);
      this._q.setFromEuler(this._e.set(d.rx, d.ry, d.rz));
      this._m.compose(this._p, this._q, this._s);
      this.leaves.setMatrixAt(i, this._m);
    }
    this.leaves.instanceMatrix.needsUpdate = true;

    /* khói */
    if (this.smokePos) {
      const pos = this.smoke.geometry.attributes.position, al = this.smoke.geometry.attributes.alpha, sz = this.smoke.geometry.attributes.size;
      this.smokeBoost = Math.max(0, this.smokeBoost - dt);
      const boost = this.smokeBoost > 0 ? 1 : 0;
      for (let i = 0; i < this.smokeN; i++) {
        const s = this.smokeData[i];
        s.life += dt * (boost ? 1.4 : 1);
        if (s.life >= s.max) {
          s.life = 0; s.max = 3 + Math.random() * 2;
          s.x = this.smokePos.x + (Math.random() - 0.5) * 0.15;
          s.y = this.smokePos.y;
          s.z = this.smokePos.z + (Math.random() - 0.5) * 0.15;
          s.on = boost || i % 3 === 0;
        }
        const k = s.life / s.max;
        pos.setXYZ(i, s.x + Math.sin(t * 1.2 + i) * 0.25 * k, s.y + k * (boost ? 3.2 : 2.2), s.z + Math.cos(t + i) * 0.2 * k);
        al.setX(i, s.on ? Math.sin(k * Math.PI) * (boost ? 0.55 : 0.28) : 0);
        sz.setX(i, 0.25 + k * (boost ? 1.4 : 0.9));
      }
      pos.needsUpdate = al.needsUpdate = sz.needsUpdate = true;
    }

    /* pháo hoa / pháo giấy / tia sáng */
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      if (!b.update(t, dt)) { b.dispose(); this.bursts.splice(i, 1); }
    }
    for (let i = this.flyers.length - 1; i >= 0; i--) {
      const f = this.flyers[i];
      if (!f(dt)) this.flyers.splice(i, 1);
    }
  }

  incense() { this.smokeBoost = 7; }

  /** Pháo hoa tại vị trí (bắn nhiều quả). */
  fireworks(pos, shells = 5) {
    for (let s = 0; s < shells; s++) {
      setTimeout(() => {
        const p = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, 8 + Math.random() * 6, (Math.random() - 0.5) * 6));
        this.bursts.push(new Burst(this.scene, this.dot, p, {
          n: this.quality.high ? 260 : 150,
          colors: [['#FFD54A', '#FF8A3A'], ['#FF5A7A', '#FFC1D6'], ['#7FD3FF', '#FFFFFF'], ['#E9973B', '#FFF3B0'], ['#B98CFF', '#FFE6FF']][s % 5],
          speed: 6 + Math.random() * 3, gravity: 4, life: 2.4, size: 0.5,
        }));
      }, s * 380);
    }
  }

  confetti(pos) {
    this.bursts.push(new Confetti(this.scene, pos, this.quality.high ? 220 : 120));
  }

  sparkle(pos, color = '#FFF3C2', n = 60) {
    this.bursts.push(new Burst(this.scene, this.dot, pos.clone(), { n, colors: [color, '#FFFFFF'], speed: 2.2, gravity: -0.6, life: 1.4, size: 0.28 }));
  }

  /** Phong bì bay từ from → to (vòng cung). */
  card(from, to, onArrive) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), new THREE.MeshBasicMaterial({ map: this.envTex, side: THREE.DoubleSide, transparent: true }));
    this.scene.add(m);
    let t = 0;
    const dur = 1.6;
    const p0 = from.clone(), p1 = to.clone();
    this.flyers.push((dt) => {
      t += dt / dur;
      const k = Math.min(1, t), e = k * k * (3 - 2 * k);
      m.position.lerpVectors(p0, p1, e);
      m.position.y += Math.sin(k * Math.PI) * 3;
      m.rotation.set(Math.sin(k * 12) * 0.3, k * 6, Math.cos(k * 9) * 0.3);
      m.scale.setScalar(1 - k * 0.5);
      if (k >= 1) {
        this.scene.remove(m); m.geometry.dispose(); m.material.dispose();
        this.sparkle(p1, '#FFE08A', 50);
        onArrive && onArrive();
        return false;
      }
      return true;
    });
  }
}

function softPointsMaterial(tex, color, blending = THREE.AdditiveBlending) {
  return new THREE.ShaderMaterial({
    uniforms: { uTex: { value: tex }, uColor: { value: new THREE.Color(color) }, uScale: { value: 300 } },
    transparent: true, depthWrite: false, blending,
    vertexShader: /* glsl */`
      attribute float alpha; attribute float size;
      varying float vA;
      uniform float uScale;
      void main() {
        vA = alpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uTex; uniform vec3 uColor; varying float vA;
      void main() { vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA); }`,
  });
}

class Burst {
  constructor(scene, tex, pos, { n, colors, speed, gravity, life, size }) {
    this.scene = scene; this.n = n; this.g = gravity; this.life = life; this.t = 0;
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3), c = new Float32Array(n * 3);
    this.v = new Float32Array(n * 3);
    const c1 = new THREE.Color(colors[0]), c2 = new THREE.Color(colors[1]);
    for (let i = 0; i < n; i++) {
      p[i * 3] = pos.x; p[i * 3 + 1] = pos.y; p[i * 3 + 2] = pos.z;
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      const sp = speed * (0.75 + Math.random() * 0.35);
      this.v[i * 3] = r * Math.cos(th) * sp; this.v[i * 3 + 1] = u * sp; this.v[i * 3 + 2] = r * Math.sin(th) * sp;
      const col = Math.random() < 0.5 ? c1 : c2;
      c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    this.mat = new THREE.PointsMaterial({ size, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }
  update(t, dt) {
    this.t += dt;
    const k = this.t / this.life;
    if (k >= 1) return false;
    const p = this.points.geometry.attributes.position;
    const drag = Math.pow(0.35, dt);
    for (let i = 0; i < this.n; i++) {
      this.v[i * 3] *= drag; this.v[i * 3 + 1] = this.v[i * 3 + 1] * drag - this.g * dt; this.v[i * 3 + 2] *= drag;
      p.array[i * 3] += this.v[i * 3] * dt; p.array[i * 3 + 1] += this.v[i * 3 + 1] * dt; p.array[i * 3 + 2] += this.v[i * 3 + 2] * dt;
    }
    p.needsUpdate = true;
    this.mat.opacity = 1 - k * k;
    return true;
  }
  dispose() { this.scene.remove(this.points); this.points.geometry.dispose(); this.mat.dispose(); }
}

class Confetti {
  constructor(scene, pos, n) {
    this.scene = scene; this.n = n; this.t = 0; this.life = 4.5;
    const geo = new THREE.PlaneGeometry(0.12, 0.07);
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), n);
    this.mesh.frustumCulled = false;
    this.d = [];
    const cols = ['#E9973B', '#0F2247', '#FFFFFF', '#E23A3A', '#F7C843', '#2F9ED6'];
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 3;
      this.d.push({ x: pos.x, y: pos.y + 1.5, z: pos.z, vx: Math.cos(a) * s, vy: 4 + Math.random() * 4, vz: Math.sin(a) * s, r: Math.random() * 6, rs: 4 + Math.random() * 8 });
      this.mesh.setColorAt(i, c.set(cols[i % cols.length]));
    }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1);
    scene.add(this.mesh);
  }
  update(t, dt) {
    this.t += dt;
    if (this.t > this.life) return false;
    for (let i = 0; i < this.n; i++) {
      const d = this.d[i];
      d.vy -= 6 * dt; d.vx *= Math.pow(0.4, dt); d.vz *= Math.pow(0.4, dt);
      if (d.vy < -1.2) d.vy = -1.2;
      d.x += d.vx * dt; d.y = Math.max(0.03, d.y + d.vy * dt); d.z += d.vz * dt;
      d.r += d.rs * dt;
      this._p.set(d.x + Math.sin(d.r) * 0.1, d.y, d.z);
      this._q.setFromEuler(this._e.set(d.r, d.r * 0.7, d.r * 0.3));
      this._m.compose(this._p, this._q, this._s);
      this.mesh.setMatrixAt(i, this._m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    return true;
  }
  dispose() { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.mesh.dispose(); }
}
