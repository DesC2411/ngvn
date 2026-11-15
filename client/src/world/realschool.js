// Con đường trước trường + "Trường MAY thật" (Trường Tiểu học & THCS MAY – MAY ACADEMY, KĐT Định Công)
// Dựng low-poly theo bố cục tham khảo: khu đất chữ U (2 dãy dọc + khối ngang phía sau), sân giữa có sân cỏ nhân tạo,
// sân thể thao xanh dương, sân lát gạch; cổng quay ra đường. Hình học gộp theo vật liệu để ít lệnh vẽ.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { instanced } from './assets.js';
import { canvasTexture, fitText, drawLogo, font, roundRect, NAVY, ORANGE, pavingTexture, flagVNTexture } from './textures.js';
import { ROAD, REAL } from './layout.js';

export const REAL_MODELS = ['nature/tree_palmDetailedTall.glb'];

const FH = 3.4;      // chiều cao tầng
const BAY = 3.6;     // bề rộng một ô cửa sổ

/* ---------------- texture ---------------- */
function facadeTexture() {
  const t = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = '#F3F1EA'; ctx.fillRect(0, 0, W, H);
    // dải sàn hành lang / lan can phía dưới
    ctx.fillStyle = '#E2DED4'; ctx.fillRect(0, H - 34, W, 34);
    ctx.fillStyle = '#CFC9BC'; ctx.fillRect(0, H - 36, W, 3);
    // cửa sổ ô vuông khung xanh lá
    const x0 = 56, y0 = 44, w = 144, h = 136;
    ctx.fillStyle = '#2F8A46'; ctx.fillRect(x0 - 8, y0 - 8, w + 16, h + 16);
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, '#9FC9D6'); g.addColorStop(1, '#4D7F93');
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = '#2F8A46';
    ctx.fillRect(x0 + w / 2 - 4, y0, 8, h); ctx.fillRect(x0, y0 + h * 0.38 - 4, w, 8);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x0 + 8, y0 + 6, 18, h * 0.3);
    // bậu cửa
    ctx.fillStyle = '#D9D4C8'; ctx.fillRect(x0 - 12, y0 + h + 8, w + 24, 8);
  });
  t.texture.wrapS = t.texture.wrapT = THREE.RepeatWrapping;
  return t.texture;
}

function roadTexture() {
  const t = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = '#5F5F63'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 1500; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)';
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    // vạch giữa đứt + vạch mép liền (trục u = dọc đường)
    ctx.fillStyle = '#F2F2EE';
    ctx.fillRect(0, H / 2 - 3, W * 0.55, 6);
    ctx.fillRect(0, 10, W, 5); ctx.fillRect(0, H - 15, W, 5);
  });
  t.texture.wrapS = THREE.RepeatWrapping;
  return t.texture;
}

function turfTexture() {
  return canvasTexture(512, 512, (ctx, W, H) => {
    for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#3E9B47' : '#4AAE52'; ctx.fillRect(0, (i * H) / 10, W, H / 10 + 1); }
    ctx.strokeStyle = '#F4F4F0'; ctx.lineWidth = 5;
    ctx.strokeRect(14, 14, W - 28, H - 28);
    ctx.beginPath(); ctx.moveTo(14, H / 2); ctx.lineTo(W - 14, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 54, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(W / 2 - 100, 14, 200, 70); ctx.strokeRect(W / 2 - 100, H - 84, 200, 70);
    ctx.strokeRect(W / 2 - 50, 14, 100, 28); ctx.strokeRect(W / 2 - 50, H - 42, 100, 28);
  }).texture;
}

function courtTexture() {
  return canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = '#2E6FB8'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3F86CF'; ctx.fillRect(16, 16, W - 32, H - 32);
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, W - 32, H - 32);
    ctx.beginPath(); ctx.moveTo(16, H / 2); ctx.lineTo(W - 16, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 26, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, 16, 56, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H - 16, 56, Math.PI, 0); ctx.stroke();
  }).texture;
}

function sloganTexture() {
  return canvasTexture(2048, 64, (ctx, W, H) => {
    ctx.fillStyle = '#C5161D'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFE15A'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    fitText(ctx, 'THẦY CÔ TRÁCH NHIỆM, TẬN TÂM, SÁNG TẠO  –  HỌC SINH KỶ LUẬT, CHĂM CHỈ, THÀNH CÔNG', W / 2, H / 2 + 2, W - 40, 900, 42);
  }).texture;
}

function panoTexture() {
  return canvasTexture(768, 384, (ctx, W, H) => {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#16336B'); g.addColorStop(1, NAVY);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ORANGE; ctx.fillRect(0, H - 40, W, 40);
    drawLogo(ctx, 150, H / 2 - 18, 220);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    fitText(ctx, 'MAY ACADEMY', 280, 120, W - 300, 900, 76);
    ctx.fillStyle = '#FFD9A0';
    fitText(ctx, 'Trường Tiểu học & THCS MAY', 280, 192, W - 300, 700, 38);
    fitText(ctx, 'Hệ song ngữ Cambridge', 280, 244, W - 300, 700, 34);
    ctx.fillStyle = NAVY; ctx.textAlign = 'center';
    fitText(ctx, 'Lô 18 KĐT Định Công · Hà Nội', W / 2, H - 20, W - 40, 800, 26);
  }).texture;
}

function gateSignTexture() {
  return canvasTexture(1536, 288, (ctx, W, H) => {
    ctx.fillStyle = '#FBFBF8'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = NAVY; ctx.lineWidth = 12; ctx.strokeRect(6, 6, W - 12, H - 12);
    drawLogo(ctx, 150, H / 2, 230);
    drawLogo(ctx, W - 150, H / 2, 230);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = NAVY;
    fitText(ctx, 'TRƯỜNG TIỂU HỌC & THCS MAY', W / 2, 88, W - 560, 900, 70);
    ctx.fillStyle = ORANGE;
    fitText(ctx, 'MAY ACADEMY', W / 2, 196, W - 560, 900, 116);
  }).texture;
}

function fenceBannerTexture() {
  return canvasTexture(1024, 256, (ctx, W, H) => {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, '#C8161E'); g.addColorStop(1, '#E9732B');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(130, H / 2, 104, 0, Math.PI * 2); ctx.fill();
    drawLogo(ctx, 130, H / 2, 196);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    fitText(ctx, 'MAY ACADEMY', 262, 96, W - 290, 900, 92);
    ctx.fillStyle = '#FFE8A8';
    fitText(ctx, 'Hệ song ngữ Cambridge', 262, 186, W - 290, 800, 50);
  }).texture;
}

/* ---------------- tiện ích hình học ---------------- */
class Batch {
  constructor() { this.parts = new Map(); }
  add(key, geo, { x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0 } = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    g.deleteAttribute && g.attributes.color && g.deleteAttribute('color');
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m);
    if (!this.parts.has(key)) this.parts.set(key, []);
    this.parts.get(key).push(g);
  }
  box(key, x0, y0, z0, x1, y1, z1) {
    this.add(key, new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2 });
  }
  /** Mặt phẳng dựng đứng có UV lặp (mặt tiền). normal theo hướng ry (0 = +z). */
  facade(key, cx, cz, y0, w, h, ry, uRep, vRep) {
    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * uRep, uv.getY(i) * vRep);
    this.add(key, g, { x: cx, y: y0 + h / 2, z: cz, ry });
  }
  ground(key, x0, z0, x1, z1, y, rep = 0) {
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
    if (rep) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (x1 - x0) / rep, uv.getY(i) * (z1 - z0) / rep); }
    this.add(key, g, { x: (x0 + x1) / 2, y, z: (z0 + z1) / 2, rx: -Math.PI / 2 });
  }
  build(materials, scene, { shadowKeys = [] } = {}) {
    let calls = 0;
    for (const [key, list] of this.parts) {
      const mat = materials[key];
      if (!mat) { console.warn('[realschool] thiếu vật liệu', key); continue; }
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = shadowKeys.includes(key);
      mesh.receiveShadow = true;
      scene.add(mesh);
      calls++;
    }
    return calls;
  }
}

/** Mái tôn hai dốc (lăng trụ tam giác) dọc theo trục z, gốc ở đáy mái. */
function gableRoof(width, length, height) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0); s.lineTo(width / 2, 0); s.lineTo(0, height); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false });
  g.translate(0, 0, -length / 2);
  return g;
}

/* ---------------- dựng ---------------- */
export function buildRealSchool({ scene, M, colliders, quality }) {
  const root = new THREE.Group();
  root.name = 'real-school';
  scene.add(root);
  const B = new Batch();
  const R = REAL;
  const facadeTex = facadeTexture();
  const brick = pavingTexture('#A65C40', '#8A4532', 64);
  const walkTex = pavingTexture('#CDBEA6', '#B09F86', 64);

  /* --- Con đường --- */
  const rt = roadTexture();
  const roadGeoLen = ROAD.x1 - ROAD.x0;
  rt.repeat.set(roadGeoLen / 14, 1);
  B.ground('road', ROAD.x0, ROAD.roadZ0, ROAD.x1, ROAD.roadZ1, 0.03);
  B.ground('walk', ROAD.x0, ROAD.z0, ROAD.x1, ROAD.roadZ0, 0.12, 3);
  B.ground('walk', ROAD.x0, ROAD.roadZ1, ROAD.x1, ROAD.z1, 0.12, 3);
  B.box('curb', ROAD.x0, 0, ROAD.roadZ0 - 0.18, ROAD.x1, 0.14, ROAD.roadZ0);
  B.box('curb', ROAD.x0, 0, ROAD.roadZ1, ROAD.x1, 0.14, ROAD.roadZ1 + 0.18);
  B.box('curb', ROAD.x0, 0, ROAD.z0 - 0.02, ROAD.x1, 0.11, ROAD.roadZ0 - 0.18);  // nền vỉa hè bắc
  B.box('curb', ROAD.x0, 0, ROAD.roadZ1 + 0.18, ROAD.x1, 0.11, ROAD.z1);       // nền vỉa hè nam
  // vỉa hè cao 0,12 m (bước lên được)
  colliders.platform((ROAD.x0 + ROAD.x1) / 2, (ROAD.z0 + ROAD.roadZ0) / 2, ROAD.x1 - ROAD.x0, ROAD.roadZ0 - ROAD.z0, 0, 0.12);
  colliders.platform((ROAD.x0 + ROAD.x1) / 2, (ROAD.roadZ1 + ROAD.z1) / 2, ROAD.x1 - ROAD.x0, ROAD.z1 - ROAD.roadZ1, 0, 0.12);
  // vạch qua đường trước 2 cổng
  for (const cx of [0, R.gateX]) for (let i = -3; i <= 3; i++) B.ground('stripe', cx + i * 0.9 - 0.25, ROAD.roadZ0 + 0.3, cx + i * 0.9 + 0.25, ROAD.roadZ1 - 0.3, 0.035);
  // cột đèn hai bên đường
  const lamps = [];
  for (let x = ROAD.x0 + 6; x < ROAD.x1; x += 16) {
    if (Math.abs(x) > 6 && Math.abs(x - R.gateX) > 7) lamps.push({ x, z: ROAD.roadZ0 - 0.5, ry: Math.PI / 2, s: 2.8 });
    lamps.push({ x: x + 8, z: ROAD.roadZ1 + 0.5, ry: -Math.PI / 2, s: 2.8 });
  }
  root.add(instanced(M['graveyard/lightpost-single.glb'], lamps, { shadow: false }));
  lamps.forEach((l) => colliders.circle(l.x, l.z, 0.3));
  // cây xanh hai bên đường (Kenney – nhẹ)
  const roadTrees = [];
  for (let x = ROAD.x0 + 2; x < ROAD.x1; x += 9) {
    roadTrees.push({ x, z: ROAD.z1 + 2.2 + ((x * 7) % 3) * 0.6, s: 4.6 + ((x * 13) % 5) * 0.3, ry: x });
    const northFree = (x > 16 && x < 50) || x > R.x1 + 3 || x < -16;
    if (northFree) roadTrees.push({ x: x + 4, z: ROAD.z0 - 1.6, s: 4.4, ry: x });
  }
  // rừng cây bao quanh khu đất trường thật
  const belt = [];
  for (let z = R.z0 - 6; z < R.z1 - 2; z += 6) { belt.push({ x: R.x0 - 4.5, z, s: 5 + ((z * 3) % 4) * 0.4, ry: z }); belt.push({ x: R.x1 + 4.5, z: z + 3, s: 5 + ((z * 5) % 4) * 0.4, ry: z }); }
  for (let x = R.x0 - 4; x < R.x1 + 6; x += 6) belt.push({ x, z: R.z0 - 5, s: 5.4, ry: x });
  const allTrees = [...roadTrees, ...belt];
  root.add(instanced(M['nature/tree_default.glb'], allTrees.filter((_, i) => i % 2 === 0), { shadow: quality.high }));
  root.add(instanced(M['nature/tree_oak.glb'], allTrees.filter((_, i) => i % 2 === 1), { shadow: quality.high }));
  roadTrees.forEach((t) => colliders.circle(t.x, t.z, 0.45));

  /* --- Nền sân trường --- */
  const cx0 = R.x0 + 9, cx1 = R.x1 - 9;   // sân giữa nằm giữa 2 dãy
  B.ground('brick', cx0, R.z0 + 8, cx1, R.z1, 0.03, 3);
  const turf = { x0: cx0 + 2.5, x1: cx1 - 2.5, z0: 26, z1: 54 };
  B.ground('turf', turf.x0, turf.z0, turf.x1, turf.z1, 0.045);
  const court = { x0: R.gateX - 9, x1: R.gateX + 9, z0: 4, z1: 20 };
  B.ground('court', court.x0, court.z0, court.x1, court.z1, 0.045);
  // khung thành (trắng)
  for (const [gz, dir] of [[turf.z0 + 0.6, 1], [turf.z1 - 0.6, -1]]) {
    for (const sx of [-1, 1]) {
      B.box('white', R.gateX + sx * 3.6 - 0.08, 0, gz - 0.08, R.gateX + sx * 3.6 + 0.08, 2.2, gz + 0.08);
      B.box('white', R.gateX + sx * 3.6 - 0.05, 0, gz, R.gateX + sx * 3.6 + 0.05, 0.08, gz - dir * 1.4);
      colliders.circle(R.gateX + sx * 3.6, gz, 0.15);
    }
    B.box('white', R.gateX - 3.68, 2.12, gz - 0.08, R.gateX + 3.68, 2.28, gz + 0.08);
  }
  // cột bóng rổ hai đầu sân xanh
  for (const [bz, d] of [[court.z0 - 0.6, 1], [court.z1 + 0.6, -1]]) {
    B.box('dark', R.gateX - 0.1, 0, bz - 0.1, R.gateX + 0.1, 3.2, bz + 0.1);
    B.box('white', R.gateX - 0.9, 2.7, bz + d * 0.15 - 0.04, R.gateX + 0.9, 3.75, bz + d * 0.15 + 0.04);
    colliders.circle(R.gateX, bz, 0.2);
  }

  /* --- Toà nhà --- */
  const building = ({ x0, x1, z0, z1, floors, facadeSides, roof = 'gable', corridor = null, chop = false }) => {
    const h = floors * FH;
    B.box('white', x0, 0, z0, x1, h, z1);
    const lx = x1 - x0, lz = z1 - z0;
    const off = 0.03;
    for (const side of facadeSides) {
      if (side === '+x') B.facade('facade', x1 + off, (z0 + z1) / 2, 0, lz, h, Math.PI / 2, lz / BAY, floors);
      if (side === '-x') B.facade('facade', x0 - off, (z0 + z1) / 2, 0, lz, h, -Math.PI / 2, lz / BAY, floors);
      if (side === '+z') B.facade('facade', (x0 + x1) / 2, z1 + off, 0, lx, h, 0, lx / BAY, floors);
      if (side === '-z') B.facade('facade', (x0 + x1) / 2, z0 - off, 0, lx, h, Math.PI, lx / BAY, floors);
    }
    // hành lang/ban công các tầng ở mặt nhìn ra sân
    if (corridor) {
      const { side, depth } = corridor;
      const sgn = side === '+x' ? 1 : -1;
      const xa = side === '+x' ? x1 : x0 - depth, xb = side === '+x' ? x1 + depth : x0;
      const xe = side === '+x' ? xb - 0.15 : xa + 0.15; // mép ngoài
      for (let f = 1; f <= floors; f++) {
        const y = f * FH;
        B.box('slab', xa, y - 0.25, z0, xb, y, z1);                       // sàn hành lang
        if (f < floors) B.box('white', Math.min(xe, xe + sgn * 0.15) - 0.08, y, z0, Math.max(xe, xe + sgn * 0.15) + 0.08, y + 1.0, z1); // lan can
      }
      // cột đỡ
      for (let z = z0 + 0.3; z <= z1 - 0.2; z += BAY * 2) {
        B.box('white', xe - 0.18, 0, z - 0.18, xe + 0.18, h, z + 0.18);
        colliders.circle(xe, z, 0.3);
      }
      colliders.camBox(Math.min(xa, xb), FH - 0.3, z0, Math.max(xa, xb), h + 0.5, z1);
    }
    // mái
    const cxm = (x0 + x1) / 2, czm = (z0 + z1) / 2;
    if (roof === 'gable') {
      const along = lz >= lx;
      const ov = corridor ? corridor.depth + 0.6 : 0.6;
      const w = (along ? lx : lz) + ov * 2, L = (along ? lz : lx) + 1.2;
      const shift = corridor ? (corridor.side === '+x' ? corridor.depth / 2 : -corridor.depth / 2) : 0;
      B.add('roof', gableRoof(w, L, 2.4), { x: cxm + (along ? shift : 0), y: h, z: czm, ry: along ? 0 : Math.PI / 2 });
      if (chop) {
        // mái chóp nhỏ giữa nhà
        B.add('roof', new THREE.ConeGeometry(3.4, 2.6, 4), { x: cxm + shift, y: h + 2.4 + 0.9, z: czm, ry: Math.PI / 4 });
        B.box('white', cxm + shift - 2.2, h + 1.4, czm - 2.2, cxm + shift + 2.2, h + 2.5, czm + 2.2);
      }
    } else {
      // mái bằng: lan can + mảng xanh sân thượng + mái kính
      B.box('white', x0, h, z0, x1, h + 0.9, z0 + 0.25); B.box('white', x0, h, z1 - 0.25, x1, h + 0.9, z1);
      B.box('white', x0, h, z0, x0 + 0.25, h + 0.9, z1); B.box('white', x1 - 0.25, h, z0, x1, h + 0.9, z1);
      B.box('green', x0 + 1, h, z0 + 1, cxm - 2, h + 0.35, z1 - 1);
      B.box('glass', cxm + 1, h, z0 + 1.2, x1 - 1.2, h + 1.6, z1 - 1.2);
      B.box('roof', cxm + 0.8, h + 1.6, z0 + 1, x1 - 1, h + 1.75, z1 - 1);
    }
    const ext = corridor ? corridor.depth : 0;
    const bx0 = corridor && corridor.side === '-x' ? x0 - ext : x0, bx1 = corridor && corridor.side === '+x' ? x1 + ext : x1;
    colliders.box((x0 + x1) / 2, (z0 + z1) / 2, lx, lz, 0, h + 3, false);
    colliders.camBox(bx0 - 0.6, 0, z0 - 0.6, bx1 + 0.6, h + 3.5, z1 + 0.6);
    colliders.camBox(x0, 0, z0, x1, h + 3.5, z1);
  };

  // dãy chính (tây) 4 tầng, nhìn ra sân (+x), hành lang các tầng, mái chóp giữa
  const MAIN = { x0: R.x0, x1: R.x0 + 7.4, z0: R.z0, z1: 52 };
  building({ ...MAIN, floors: 4, facadeSides: ['+x', '-x'], corridor: { side: '+x', depth: 1.6 }, chop: true });
  // dãy thấp (đông) 2 tầng, hành lang cột vàng + giàn cây leo
  const LOW = { x0: R.x1 - 7.4, x1: R.x1, z0: R.z0, z1: 52 };
  building({ ...LOW, floors: 2, facadeSides: ['-x', '+x'] });
  // khối ngang phía sau 3 tầng mái bằng (sân thượng xanh + mái kính)
  const BACK = { x0: MAIN.x1, x1: LOW.x0, z0: R.z0, z1: R.z0 + 7 };
  building({ ...BACK, floors: 3, facadeSides: ['+z'], roof: 'flat' });

  /* --- Băng rôn + pano mặt tiền dãy chính --- */
  const faceX = MAIN.x1 + 1.6;          // mép ngoài hành lang
  const slogan = new THREE.Mesh(new THREE.PlaneGeometry(42, 0.82), new THREE.MeshBasicMaterial({ map: sloganTexture(), toneMapped: false }));
  slogan.rotation.y = Math.PI / 2;
  slogan.position.set(faceX + 0.12, FH + 0.5, (MAIN.z0 + MAIN.z1) / 2 + 4);
  root.add(slogan);
  const pano = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.8), new THREE.MeshStandardMaterial({ map: panoTexture(), roughness: 0.6 }));
  pano.rotation.y = Math.PI / 2;
  pano.position.set(MAIN.x1 + 0.07, 1.75, (MAIN.z0 + MAIN.z1) / 2 + 4);
  root.add(pano);

  /* --- Hành lang dãy thấp: mái hiên, cột vàng nhạt, giàn cây leo, bồn gạch đỏ --- */
  const hx1 = LOW.x0, hx0 = LOW.x0 - 2.4;
  B.box('roof', hx0 - 0.2, FH - 0.1, LOW.z0 + 7, hx1, FH + 0.12, LOW.z1);
  const vines = [];
  for (let z = LOW.z0 + 8.5; z < LOW.z1 - 0.5; z += 3) {
    B.add('yellow', new THREE.CylinderGeometry(0.17, 0.2, FH - 0.1, 10), { x: hx0 + 0.2, y: (FH - 0.1) / 2, z });
    colliders.circle(hx0 + 0.2, z, 0.28);
    vines.push({ x: hx0 + 0.2, y: FH + 0.1, z: z + 1.5, ry: 0, sx: 2.6, sy: 0.9, sz: 3.1 });
  }
  root.add(instanced(M['town/hedge-large.glb'], vines, { shadow: false }));
  // bồn cây xây gạch đỏ dọc hành lang + bụi cây cắt tròn
  const pBush = [];
  for (let z = LOW.z0 + 10; z < LOW.z1 - 2; z += 6) {
    B.box('brickwall', hx0 - 2.4, 0, z - 1.6, hx0 - 1.2, 0.6, z + 1.6);
    colliders.box(hx0 - 1.8, z, 1.2, 3.2, 0, 0.8, false);
    pBush.push({ x: hx0 - 1.8, y: 0.55, z: z - 0.8, s: 2.2, ry: z }, { x: hx0 - 1.8, y: 0.55, z: z + 0.8, s: 2.0, ry: z + 1 });
  }
  // chậu cây dọc chân tường dãy chính
  for (let z = MAIN.z0 + 9; z < MAIN.z1 - 2; z += 4.2) pBush.push({ x: faceX + 0.6, y: 0, z, s: 1.8, ry: z });
  root.add(instanced(M['nature/plant_bushDetailed.glb'], pBush, { shadow: false }));

  /* --- Cột cờ + cây cọ + cây lớn trong sân --- */
  const flagX = faceX + 4.2, flagZ = (MAIN.z0 + MAIN.z1) / 2 + 4;
  B.add('pole', new THREE.CylinderGeometry(0.06, 0.09, 10, 8), { x: flagX, y: 5, z: flagZ });
  B.add('white', new THREE.CylinderGeometry(0.9, 1.1, 0.5, 12), { x: flagX, y: 0.25, z: flagZ });
  colliders.circle(flagX, flagZ, 1.1);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.46), new THREE.MeshStandardMaterial({ map: flagVNTexture().texture, side: THREE.DoubleSide, roughness: 0.8 }));
  flag.position.set(flagX, 9.1, flagZ + 1.15);
  flag.rotation.y = Math.PI / 2;
  root.add(flag);
  const palms = [];
  for (const dz of [-14, -8, 16, 22]) palms.push({ x: faceX + 1.9, z: flagZ + dz, s: 7 + (dz % 3) * 0.3, ry: dz });
  root.add(instanced(M['nature/tree_palmDetailedTall.glb'], palms));
  palms.forEach((p) => colliders.circle(p.x, p.z, 0.35));
  // cây bàng / cây lớn (Quaternius, xanh) – trong sân và rủ tán ra đường ở cổng
  const big = [
    { x: cx1 - 3, z: 2.5 }, { x: cx0 + 6, z: 58 },
    { x: R.gateX - 12, z: R.wallZ - 2.2 }, { x: R.gateX + 13, z: R.wallZ - 2.2 },
  ].map((t, i) => ({ ...t, s: 1.05 + (i % 2) * 0.12, ry: i * 1.7 }));
  const qTree = M['quaternius/CommonTree_2.gltf'];
  if (qTree) {
    const green = ['#4E9A3A', '#5DAA45'];
    root.add(instanced(qTree, big, {
      shadow: quality.high,
      materialFn: (m) => { if (/lea(f|v)/i.test(m.name)) { const c = m.clone(); c.color = new THREE.Color(green[0]); return c; } return m; },
    }));
    big.forEach((t) => colliders.circle(t.x, t.z, 0.6));
  }

  /* --- Tường rào + cổng --- */
  const wz = R.wallZ;
  const g0 = R.gateX - R.gateW / 2, g1 = R.gateX + R.gateW / 2;
  const side0 = g1 + 1.2, side1 = side0 + 2.2;   // cổng phụ
  const wallSegs = [[R.x0, g0 - 0.6], [g1 + 0.6, side0 - 0.4], [side1 + 0.4, R.x1]];
  const ironT = [];
  for (const [a, b] of wallSegs) {
    B.box('white', a, 0, wz - 0.18, b, 0.9, wz + 0.18);
    const n = Math.max(1, Math.round((b - a) / 2));
    for (let i = 0; i < n; i++) ironT.push({ x: a + ((b - a) * (i + 0.5)) / n, y: 0.9, z: wz + 0.3, s: 1.7, sx: ((b - a) / n) / 1.0 });
    for (let x = a; x <= b + 0.01; x += 6) B.box('white', x - 0.22, 0, wz - 0.22, x + 0.22, 2.4, wz + 0.22);
    colliders.segment(a, wz, b, wz, 0.5, 2.5);
  }
  // hai bên hông phía trước (z 52..62) tường + rào
  for (const x of [R.x0, R.x1]) {
    B.box('white', x - 0.18, 0, 52, x + 0.18, 0.9, wz);
    colliders.segment(x, 52, x, wz, 0.5, 2.5);
  }
  // cổng phụ (đóng) + 2 cánh cổng chính mở vào trong
  ironT.push({ x: (side0 + side1) / 2, y: 0, z: wz + 0.3, s: 2.2, sx: 2.2 });
  colliders.segment(side0, wz, side1, wz, 0.4, 2.2);
  const leafW = R.gateW / 2;
  const leaves = [
    { x: g0 + 0.2, y: 0, z: wz - leafW / 2, ry: Math.PI / 2, s: 2.6, sx: leafW },
    { x: g1 - 0.2, y: 0, z: wz - leafW / 2, ry: Math.PI / 2, s: 2.6, sx: leafW },
  ];
  const black = (m) => { const c = m.clone(); c.color = new THREE.Color('#2A2A2E'); return c; };
  root.add(instanced(M['graveyard/iron-fence.glb'], [...ironT, ...leaves], { shadow: false, materialFn: black }));
  leaves.forEach((l) => colliders.segment(l.x, wz, l.x, wz - leafW, 0.3, 2.4));
  // trụ cổng vuông trắng + biển tên
  for (const x of [g0 - 0.35, g1 + 0.35, side1 + 0.2]) {
    B.box('white', x - 0.45, 0, wz - 0.45, x + 0.45, 4.2, wz + 0.45);
    B.box('slab', x - 0.55, 4.2, wz - 0.55, x + 0.55, 4.45, wz + 0.55);
    colliders.box(x, wz, 0.9, 0.9, 0, 4.5, true);
  }
  B.box('slab', g0 - 0.8, 4.45, wz - 0.3, g1 + 0.8, 5.0, wz + 0.3);
  const gsign = new THREE.Mesh(new THREE.PlaneGeometry(R.gateW + 3.4, 1.65), new THREE.MeshStandardMaterial({ map: gateSignTexture(), roughness: 0.6 }));
  gsign.position.set(R.gateX, 5.8, wz + 0.32);
  root.add(gsign);
  B.box('white', g0 - 1.6, 4.95, wz - 0.25, g1 + 1.6, 6.65, wz + 0.25);
  // băng rôn đỏ/cam trên rào hai bên
  const fb = fenceBannerTexture();
  const banMat = new THREE.MeshStandardMaterial({ map: fb, roughness: 0.7, side: THREE.DoubleSide });
  for (const bx of [g0 - 9, g0 - 19, side1 + 7, side1 + 16]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), banMat);
    m.position.set(bx, 1.55, wz + 0.42);
    root.add(m);
  }
  // vỉa hè lát gạch trước cổng
  B.ground('walk', g0 - 2, wz, g1 + 2, ROAD.z0, 0.11, 3);

  /* --- vật liệu + gộp --- */
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const roadMat = lam({ map: rt });
  const materials = {
    road: roadMat,
    walk: lam({ map: walkTex }),
    curb: lam({ color: '#B9B6AE' }),
    stripe: lam({ color: '#F4F4EE' }),
    brick: lam({ map: brick }),
    turf: lam({ map: turfTexture() }),
    court: lam({ map: courtTexture() }),
    facade: new THREE.MeshLambertMaterial({ map: facadeTex }),
    white: lam({ color: '#F1EFE8' }),
    slab: lam({ color: '#D9D5CB' }),
    roof: new THREE.MeshStandardMaterial({ color: '#8C939B', roughness: 0.55, metalness: 0.2, flatShading: true, side: THREE.DoubleSide }),
    green: lam({ color: '#5E9E45' }),
    glass: new THREE.MeshStandardMaterial({ color: '#9CC6DA', roughness: 0.15, metalness: 0.3 }),
    yellow: lam({ color: '#EAD58C' }),
    brickwall: lam({ color: '#A3452E' }),
    pole: new THREE.MeshStandardMaterial({ color: '#E8ECF2', metalness: 0.6, roughness: 0.35 }),
    dark: lam({ color: '#33363C' }),
  };
  for (const k of ['road', 'walk', 'curb', 'stripe', 'brick', 'turf', 'court']) {
    materials[k].polygonOffset = true; materials[k].polygonOffsetFactor = -1; materials[k].polygonOffsetUnits = -2;
  }
  B.build(materials, root, { shadowKeys: ['white', 'facade', 'roof', 'slab', 'yellow', 'glass'] });
  return root;
}
