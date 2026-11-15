// Chỉ đường (vệt mũi tên trên mặt đất + cột sáng ở đích) và tìm đường theo đồ thị điểm mốc dọc các lối
import * as THREE from 'three';
import { chevronTexture, beamTexture, goldBadgeTexture } from './textures.js';

const MAX_ARROWS = 160;
const SPACING = 1.15;

export class Navigator {
  constructor(scene, colliders, graph) {
    this.scene = scene;
    this.col = colliders;
    this.nodes = Object.entries(graph.nodes).map(([id, [x, z]]) => ({ id, x, z }));
    this.index = new Map(this.nodes.map((n, i) => [n.id, i]));
    this.adj = this.nodes.map(() => []);
    for (const [a, b] of graph.edges) {
      const i = this.index.get(a), j = this.index.get(b);
      if (i === undefined || j === undefined) continue;
      const A = this.nodes[i], B = this.nodes[j];
      if (!colliders.segmentClear(A.x, A.z, B.x, B.z, 0.3)) console.warn('[world] cạnh đồ thị bị chắn:', a, b);
      const d = Math.hypot(A.x - B.x, A.z - B.z);
      this.adj[i].push([j, d]); this.adj[j].push([i, d]);
    }

    /* vệt mũi tên */
    const mat = new THREE.MeshBasicMaterial({ map: chevronTexture(), transparent: true, depthWrite: false, toneMapped: false, fog: false });
    const geo = new THREE.PlaneGeometry(0.85, 0.85);
    this.arrows = new THREE.InstancedMesh(geo, mat, MAX_ARROWS);
    this.arrows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.arrows.count = 0;
    this.arrows.frustumCulled = false;
    this.arrows.renderOrder = 5;
    this.arrows.visible = false;
    scene.add(this.arrows);

    /* cột sáng + biển nổi ở đích */
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 1.0, 14, 24, 1, true),
      new THREE.MeshBasicMaterial({ map: beamTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }),
    );
    beam.visible = false;
    beam.renderOrder = 4;
    scene.add(beam);
    this.beam = beam;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 40), new THREE.MeshBasicMaterial({ color: '#FFD45A', transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;
    scene.add(ring);
    this.ring = ring;
    this.badge = null;

    this.target = null;   // { zone, x, z, ax, az }
    this.path = [];
    this.lastFrom = null;
    this.replanT = 0;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    this._p = new THREE.Vector3(); this._s = new THREE.Vector3(1, 1, 1); this._y = new THREE.Vector3(0, 1, 0);
  }

  /** Tìm đường từ a tới b (toạ độ x,z). Trả mảng điểm (đã rút gọn). */
  findPath(a, b) {
    const col = this.col;
    const direct = Math.hypot(a.x - b.x, a.z - b.z);
    if (direct < 30 && col.segmentClear(a.x, a.z, b.x, b.z, 0.3)) return [{ x: a.x, z: a.z }, { x: b.x, z: b.z }];
    const n = this.nodes.length;
    const link = (p) => {
      const cand = this.nodes.map((nd, i) => ({ i, d: Math.hypot(nd.x - p.x, nd.z - p.z) })).sort((u, v) => u.d - v.d);
      const out = [];
      for (const c of cand) {
        if (c.d > 45 || out.length >= 4) break;
        if (col.segmentClear(p.x, p.z, this.nodes[c.i].x, this.nodes[c.i].z, 0.3)) out.push(c);
      }
      if (!out.length && cand.length) out.push(cand[0]);
      return out;
    };
    const sl = link(a), el = link(b);
    // Dijkstra: chỉ số n = điểm xuất phát, n+1 = đích
    const dist = new Array(n + 2).fill(Infinity), prev = new Array(n + 2).fill(-1), done = new Array(n + 2).fill(false);
    dist[n] = 0;
    const endLinks = new Map(el.map((c) => [c.i, c.d]));
    for (;;) {
      let u = -1, best = Infinity;
      for (let i = 0; i < n + 2; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u < 0 || u === n + 1) break;
      done[u] = true;
      const edges = u === n ? sl.map((c) => [c.i, c.d]) : this.adj[u];
      for (const [v, w] of edges) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
      if (u < n && endLinks.has(u) && dist[u] + endLinks.get(u) < dist[n + 1]) { dist[n + 1] = dist[u] + endLinks.get(u); prev[n + 1] = u; }
    }
    if (!Number.isFinite(dist[n + 1])) return [{ x: a.x, z: a.z }, { x: b.x, z: b.z }];
    const pts = [];
    for (let v = n + 1; v !== -1; v = prev[v]) pts.push(v === n ? { x: a.x, z: a.z } : v === n + 1 ? { x: b.x, z: b.z } : { x: this.nodes[v].x, z: this.nodes[v].z });
    pts.reverse();
    // rút gọn: bỏ điểm giữa nếu đi thẳng được
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !col.segmentClear(pts[i].x, pts[i].z, pts[j].x, pts[j].z, 0.35)) j--;
      out.push(pts[j]);
      i = j;
    }
    return out;
  }

  /** zone: { x, z, ax?, az?, label, kind, teacherId }, title: chữ trên biển nổi */
  setTarget(zone, title, sub) {
    this.clearVisuals();
    if (!zone) { this.target = null; return; }
    this.target = { zone, x: zone.x, z: zone.z, ax: zone.ax ?? zone.x, az: zone.az ?? zone.z, fx: zone.tx ?? zone.x, fz: zone.tz ?? zone.z };
    const g = this.col.groundAt(this.target.fx, this.target.fz);
    this.beam.position.set(this.target.fx, g + 7, this.target.fz);
    this.beam.visible = true;
    this.ring.position.set(this.target.ax, this.col.groundAt(this.target.ax, this.target.az) + 0.07, this.target.az);
    this.ring.visible = true;
    const tex = goldBadgeTexture(title || zone.label || 'Đích đến', sub || 'Đi theo mũi tên vàng');
    this.badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.texture, transparent: true, depthWrite: false, fog: false }));
    this.badge.scale.set(3.4, 1.06, 1);
    this.badge.position.set(this.target.fx, g + 6.2, this.target.fz);
    this.badge.renderOrder = 12;
    this.scene.add(this.badge);
    this.arrows.visible = true;
    this.lastFrom = null;
  }

  clearVisuals() {
    this.arrows.visible = false;
    this.arrows.count = 0;
    this.beam.visible = false;
    this.ring.visible = false;
    if (this.badge) { this.scene.remove(this.badge); this.badge.material.map.dispose(); this.badge.material.dispose(); this.badge = null; }
    this.path = [];
  }

  update(t, dt, playerPos) {
    if (!this.target) return;
    this.replanT -= dt;
    const moved = !this.lastFrom || Math.hypot(playerPos.x - this.lastFrom.x, playerPos.z - this.lastFrom.z) > 0.8;
    if (moved && this.replanT <= 0) {
      this.path = this.findPath(playerPos, { x: this.target.ax, z: this.target.az });
      this.lastFrom = { x: playerPos.x, z: playerPos.z };
      this.replanT = 0.5;
    }
    if (this.path.length) this.path[0] = { x: playerPos.x, z: playerPos.z };
    // đặt mũi tên dọc đường
    const P = this.path;
    let count = 0;
    const offset = (t * 1.6) % SPACING;
    let acc = 0;
    let next = 1.2 + offset;
    for (let k = 0; k < P.length - 1 && count < MAX_ARROWS; k++) {
      const a = P[k], b = P[k + 1];
      const seg = Math.hypot(b.x - a.x, b.z - a.z);
      if (seg < 1e-3) continue;
      const dx = (b.x - a.x) / seg, dz = (b.z - a.z) / seg;
      this._q.setFromAxisAngle(this._y, Math.atan2(-dx, -dz)).multiply(this._qx);
      while (next <= acc + seg && count < MAX_ARROWS) {
        const u = next - acc;
        const x = a.x + dx * u, z = a.z + dz * u;
        this._p.set(x, this.col.groundAt(x, z) + 0.06, z);
        const fade = Math.min(1, (next - 1.2) / 1.5);
        this._s.setScalar(0.55 + 0.45 * fade);
        this._m.compose(this._p, this._q, this._s);
        this.arrows.setMatrixAt(count++, this._m);
        next += SPACING;
      }
      acc += seg;
    }
    this.arrows.count = count;
    this.arrows.instanceMatrix.needsUpdate = true;
    const k = 0.5 + 0.5 * Math.sin(t * 3);
    this.beam.material.opacity = 0.65 + 0.35 * k;
    this.ring.scale.setScalar(0.9 + 0.25 * k);
    if (this.badge) this.badge.position.y = this.beam.position.y - 0.8 + Math.sin(t * 2) * 0.12;
  }
}
