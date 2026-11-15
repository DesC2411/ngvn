// Dựng khuôn viên tĩnh: nền, lối đi, hàng rào, cổng, dãy lớp, sân, sân khấu, bảng, miếu, hồ, cây nền
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { place, tint, instanced, bounds, texturedPlane } from './assets.js';
import {
  gateSignTexture, bannerTexture, countdownTexture, leaderboardTexture, chalkboardTexture,
  backdropTexture, plaqueTexture, quizBoardTexture, flagVNTexture, schoolFlagTexture, woodSignTexture,
  grassTexture, pavingTexture, skyGradientTexture,
} from './textures.js';
import {
  CAMPUS, FORECOURT, GATE, SCHOOL, CHALKBOARD, SECRET_BOX, FLAG, STAGE, QUIZ, LEADER, SHRINE, LAKE, PIER,
  GARDEN_C, LANE_CO, LANE_THAY, LANE_W, PORCH, DAITHU_YARD, ROAD, REAL,
} from './layout.js';
import { CUSTOM_CLIPS } from './character.js';
import { createWater } from './lake.js';

export const CAMPUS_MODELS = [
  'town/pillar-wood.glb', 'town/roof-high-point.glb', 'town/lantern.glb', 'town/banner-red.glb', 'town/banner-green.glb',
  'town/hedge-large.glb', 'town/planks.glb', 'town/stairs-wide-stone.glb',
  'graveyard/altar-stone.glb', 'graveyard/urn-round.glb', 'graveyard/candle-multiple.glb', 'graveyard/lantern-candle.glb',
  'graveyard/lightpost-single.glb', 'graveyard/bench.glb', 'graveyard/pillar-square.glb', 'graveyard/iron-fence.glb',
  'graveyard/iron-fence-border-column.glb', 'graveyard/border-pillar.glb',
  'holiday/floor-wood.glb', 'holiday/present-a-cube.glb', 'holiday/lights-colored.glb', 'holiday/lantern-hanging.glb', 'holiday/bench.glb',
  'buildings/building-window-wide.glb', 'buildings/building-windows.glb', 'buildings/building-door-window.glb',
  'buildings/building-window.glb', 'buildings/roof-flat-center.glb', 'buildings/roof-flat-border-straight.glb',
  'city/low-detail-building-a.glb', 'city/low-detail-building-b.glb', 'city/low-detail-building-c.glb',
  'city/low-detail-building-d.glb', 'city/low-detail-building-e.glb', 'city/low-detail-building-wide-a.glb', 'city/low-detail-building-wide-b.glb',
  'nature/tree_oak_fall.glb', 'nature/tree_default_fall.glb', 'nature/tree_fat_fall.glb', 'nature/tree_plateau_fall.glb',
  'nature/tree_cone_fall.glb', 'nature/tree_tall_fall.glb', 'nature/tree_small_fall.glb', 'nature/tree_default.glb', 'nature/tree_oak.glb',
  'nature/plant_bush.glb', 'nature/plant_bushLarge.glb', 'nature/plant_bushDetailed.glb',
  'nature/flower_redA.glb', 'nature/flower_yellowA.glb', 'nature/flower_purpleA.glb', 'nature/grass_large.glb',
  'nature/lily_large.glb', 'nature/lily_small.glb', 'nature/stone_largeA.glb', 'nature/stone_smallA.glb', 'nature/rock_largeA.glb',
  'nature/bridge_wood.glb', 'nature/stump_round.glb', 'nature/mushroom_red.glb', 'nature/statue_block.glb',
  'characters/character-male-b.glb',
];

// Hạt giống ngẫu nhiên cố định để mọi máy thấy cùng một khuôn viên
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function buildCampus({ scene, M, colliders, quality }) {
  const R = rng(20112026);
  const out = { tick: [], flags: [] };
  const add = (o) => { scene.add(o); return o; };
  const g = (p) => M[p];

  /* ---------- Bầu trời, nền ---------- */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(380, 24, 12),
    new THREE.MeshBasicMaterial({ map: skyGradientTexture(), side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  sky.renderOrder = -10;
  add(sky);
  out.sky = sky;

  const grass = grassTexture();
  grass.repeat.set(70, 70);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshLambertMaterial({ map: grass }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  add(ground);

  const pave = pavingTexture('#E3D7C1', '#D3C4A8', 64);
  const pave2 = pavingTexture('#D9CBB2', '#C6B597', 128);
  const flat = (tex, w, d, x, z, y = 0.02, rep = 4, rot = 0) => {
    const t = tex.clone(); t.needsUpdate = true; t.repeat.set(w / rep, d / rep);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, y, z); m.receiveShadow = true;
    return add(m);
  };
  // sân giữa
  flat(pave, 40, 54, 0, 5, 0.02, 4);
  // trục cổng → sân, sân trước cổng
  flat(pave2, 6, 12, 0, 36.5, 0.025, 4);
  flat(pave2, 28, 20, 0, 52, 0.02, 4);
  // lối sang miếu, sang hồ
  flat(pave2, 15, 4.5, 27, -16.5, 0.022, 3);
  // lối ra bến hồ
  flat(pave2, 6, 4.2, 18.5, PIER.z, 0.022, 3);
  // lối vào vườn (bán kính, theo hướng tây ở z = 6)
  flat(pave2, 31, LANE_W, -35.5, GARDEN_C.z, 0.022, 3);
  // sân lát đá trước 2 cây Đại Thụ
  flat(pave, 12, 26, -55, GARDEN_C.z, 0.024, 4);
  // hai lối vòng cung
  const arc = (lane) => {
    const t = pave2.clone(); t.needsUpdate = true; t.repeat.set(8, 1);
    const a0 = (lane.arcs[0][0] - 10) * Math.PI / 180, a1 = (lane.arcs[1][1] + 10) * Math.PI / 180;
    const geo = new THREE.RingGeometry(lane.r - LANE_W / 2, lane.r + LANE_W / 2, 72, 1, -a1, a1 - a0);
    const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(GARDEN_C.x, 0.021, GARDEN_C.z);
    m.receiveShadow = true;
    add(m);
  };
  arc(LANE_CO); arc(LANE_THAY);

  /* ---------- Hàng rào bao quanh ---------- */
  const hedgeT = [];
  const hb = bounds(g('town/hedge-large.glb'));
  const HS = 2.2; // 1m → 2.2m, cao 1.3m
  const hedgeLine = (x1, z1, x2, z2) => {
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
    const n = Math.max(1, Math.round(len / HS));
    const ry = Math.atan2(dx, dz);
    const ox = hb.center.x * HS, oz = hb.center.z * HS;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const cx = x1 + dx * t, cz = z1 + dz * t;
      // bù tâm mô hình (lệch theo trục x cục bộ)
      const wx = ox * Math.cos(ry) + oz * Math.sin(ry);
      const wz = -ox * Math.sin(ry) + oz * Math.cos(ry);
      hedgeT.push({ x: cx - wx, z: cz - wz, ry, s: HS, sz: (len / n) / 1.0 });
    }
    colliders.segment(x1, z1, x2, z2, 1.0, 1.4);
  };
  const { minX, maxX, minZ, maxZ } = CAMPUS;
  hedgeLine(minX, minZ, maxX, minZ);
  // tường tây có "túi" mở rộng cho sân Đại Thụ ở cuối trục vườn
  const DY = DAITHU_YARD;
  hedgeLine(minX, minZ, minX, DY.z0);
  hedgeLine(minX, DY.z0, DY.x0, DY.z0);
  hedgeLine(DY.x0, DY.z0, DY.x0, DY.z1);
  hedgeLine(DY.x0, DY.z1, minX, DY.z1);
  hedgeLine(minX, DY.z1, minX, maxZ);
  hedgeLine(maxX, minZ, maxX, maxZ);
  // phía nam: hàng rào sắt từ tường cánh ra hai góc
  const ironT = [];
  const ironLine = (x1, x2) => {
    const len = Math.abs(x2 - x1), n = Math.round(len / 2), step = len / n;
    for (let i = 0; i < n; i++) ironT.push({ x: Math.min(x1, x2) + step * (i + 0.5), z: maxZ + 0.35, ry: 0, s: 2, sx: step / 1.0 });
    colliders.segment(x1, maxZ, x2, maxZ, 0.8, 1.8);
  };
  ironLine(minX, -12.2); ironLine(12.2, maxX);
  // sân trước cổng: hàng rào thấp hai bên + phía nam
  hedgeLine(-FORECOURT.maxX, maxZ + 0.6, -FORECOURT.maxX, FORECOURT.maxZ);
  hedgeLine(FORECOURT.maxX, maxZ + 0.6, FORECOURT.maxX, FORECOURT.maxZ);
  // lối mở giữa hàng rào phía nam sân trước → ra con đường (realschool.js)
  hedgeLine(-FORECOURT.maxX, FORECOURT.maxZ, -3.5, FORECOURT.maxZ);
  hedgeLine(3.5, FORECOURT.maxZ, FORECOURT.maxX, FORECOURT.maxZ);
  add(instanced(g('town/hedge-large.glb'), hedgeT, { shadow: quality.high }));
  add(instanced(g('graveyard/iron-fence.glb'), ironT, { shadow: quality.high }));
  const colT = [];
  for (let x = minX; x <= -12; x += 8) colT.push({ x, z: maxZ + 0.35, s: 2.2 });
  for (let x = 12.2; x <= maxX; x += 8) colT.push({ x, z: maxZ + 0.35, s: 2.2 });
  add(instanced(g('graveyard/border-pillar.glb'), colT));

  /* ---------- Cổng trường ---------- */
  const gate = new THREE.Group();
  gate.position.set(GATE.x, 0, GATE.z);
  add(gate);
  for (const sx of [-1, 1]) {
    const p = place(g('graveyard/pillar-square.glb'), { x: sx * 5.0, s: 4.6 });
    gate.add(p);
    colliders.box(GATE.x + sx * 5.0, GATE.z, 1.7, 1.7, 0, 6, true);
    const lan = place(g('graveyard/lantern-candle.glb'), { x: sx * 5.0, y: 5.25, s: 2.4 });
    gate.add(lan);
    // tường cánh
    for (let k = 0; k < 2; k++) {
      const w = place(g('graveyard/iron-fence-border-column.glb'), { x: sx * (6.8 + k * 3.4), z: 0.35, s: 3.4 });
      gate.add(w);
    }
    colliders.box(GATE.x + sx * 8.5, GATE.z + 0.2, 7.2, 1.0, 0, 3, true);
  }
  const sign = gateSignTexture();
  const beamBack = place(g('town/planks.glb'), { y: 5.6, z: 0, sx: 11.2, sy: 2.4, sz: 2.6 });
  beamBack.rotation.x = Math.PI / 2;
  beamBack.position.z = -0.12;
  gate.add(beamBack);
  const signF = texturedPlane(sign.texture, 10.4, 2.6);
  signF.position.set(0, 5.6, 0.1);
  gate.add(signF);
  const signB = signF.clone(); signB.rotation.y = Math.PI; signB.position.z = -0.2;
  gate.add(signB);
  out.gateSign = sign;
  // băng rôn dưới biển tên
  const ban = bannerTexture('CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM 20/11');
  const banner = texturedPlane(ban.texture, 8.4, 1.05, { side: THREE.DoubleSide });
  banner.position.set(0, 3.75, 0.25);
  gate.add(banner);
  out.flags.push(makeWaver(banner, 0.05, 1.3));
  // đồng hồ đếm ngược trên tường cánh phải (quay ra ngoài)
  const cd = countdownTexture();
  const cdBoard = texturedPlane(cd.texture, 4.4, 2.2, { lit: false });
  cdBoard.position.set(8.5, 2.35, 1.03);
  cdBoard.material.polygonOffset = true; cdBoard.material.polygonOffsetFactor = -2; cdBoard.material.polygonOffsetUnits = -2;
  gate.add(cdBoard);
  const cdBack = place(g('town/planks.glb'), { x: 8.5, y: 2.35, z: 0.84, sx: 4.8, sy: 1.2, sz: 2.6 });
  cdBack.rotation.x = Math.PI / 2;
  gate.add(cdBack);
  // bản sao nhìn từ trong sân
  const cdIn = cdBoard.clone(); cdIn.rotation.y = Math.PI; cdIn.position.set(-8.5, 2.35, -0.25);
  gate.add(cdIn);
  out.countdown = cd;
  // tấm logo tường cánh trái (phía ngoài)
  const sf = schoolFlagTexture();
  const plaque = texturedPlane(sf.texture, 3.3, 2.2);
  plaque.position.set(-8.5, 2.35, 0.95);
  gate.add(plaque);
  const ban2 = bannerTexture('MÙA TRI ÂN · MAY ACADEMY · 2026');
  const banIn = texturedPlane(ban2.texture, 6.6, 0.82);
  banIn.rotation.y = Math.PI; banIn.position.set(8.5, 2.35, -0.25);
  gate.add(banIn);

  /* ---------- Dãy lớp học (Kenney Modular Buildings) ---------- */
  const S = SCHOOL.module;
  const n = Math.round(SCHOOL.width / S);
  const fh = 0.63 * S; // chiều cao tầng
  const types = {
    'buildings/building-window-wide.glb': [], 'buildings/building-windows.glb': [], 'buildings/building-door-window.glb': [],
    'buildings/building-window.glb': [], 'buildings/roof-flat-center.glb': [], 'buildings/roof-flat-border-straight.glb': [],
  };
  const zf = SCHOOL.z + S / 2, zb = SCHOOL.z - S / 2;
  for (let i = 0; i < n; i++) {
    const x = SCHOOL.x - SCHOOL.width / 2 + S / 2 + i * S;
    const center = Math.abs(i - (n - 1) / 2) < 1.6;
    const floors = center ? 3 : 2;
    for (let f = 0; f < floors; f++) {
      let front = (i + f) % 2 ? 'buildings/building-windows.glb' : 'buildings/building-window-wide.glb';
      if (f === 0 && i === (n - 1) / 2) front = 'buildings/building-door-window.glb';
      types[front].push({ x, y: f * fh, z: zf, s: S });
      types['buildings/building-window.glb'].push({ x, y: f * fh, z: zb, ry: Math.PI, s: S });
    }
    types['buildings/roof-flat-border-straight.glb'].push({ x, y: floors * fh, z: zf, s: S });
    types['buildings/roof-flat-border-straight.glb'].push({ x, y: floors * fh, z: zb, ry: Math.PI, s: S });
  }
  for (const [p, list] of Object.entries(types)) add(instanced(g(p), list));
  colliders.box(SCHOOL.x, SCHOOL.z, SCHOOL.width, SCHOOL.depth, 0, 9, true);
  // hiên đá trước dãy lớp (bước lên được)
  const porchD = PORCH.z1 - PORCH.z0;
  add(place(g('nature/statue_block.glb'), { x: SCHOOL.x, z: (PORCH.z0 + PORCH.z1) / 2, sx: SCHOOL.width / 0.4, sy: PORCH.h / 0.4, sz: porchD / 0.4 }));
  colliders.platform(SCHOOL.x, (PORCH.z0 + PORCH.z1) / 2, SCHOOL.width, porchD, 0, PORCH.h);
  // biển tên + băng rôn trên mặt tiền
  const facade = SCHOOL.z + S + 0.06;
  const sSign = texturedPlane(sign.texture, 9.6, 2.4);
  sSign.position.set(0, fh * 2 + 1.25, facade + 0.02);
  add(sSign);
  const fb = texturedPlane(ban.texture, 18, 2.25);
  fb.position.set(0, fh + 1.25, facade + 0.02);
  add(fb);
  // dây đèn màu dọc mái tầng 1
  const lights = [];
  for (let x = -SCHOOL.width / 2 + 1; x < SCHOOL.width / 2; x += 2) lights.push({ x, y: fh - 0.55, z: facade + 0.05, s: 2 });
  add(instanced(g('holiday/lights-colored.glb'), lights, { shadow: false }));

  /* ---------- Bảng đen ký tên ---------- */
  const cb = new THREE.Group();
  cb.position.set(CHALKBOARD.x, 0, CHALKBOARD.z);
  add(cb);
  for (const sx of [-1, 1]) cb.add(place(g('town/pillar-wood.glb'), { x: sx * (CHALKBOARD.w / 2 + 0.2), sx: 2.4, sy: CHALKBOARD.h + 1.0, sz: 2.4 }));
  const cbBack = place(g('town/planks.glb'), { y: 0.55 + CHALKBOARD.h / 2, z: -0.12, sx: CHALKBOARD.w + 0.4, sy: 1.6, sz: CHALKBOARD.h + 0.4 });
  cbBack.rotation.x = Math.PI / 2;
  cb.add(cbBack);
  const chalk = chalkboardTexture();
  const board = texturedPlane(chalk.texture, CHALKBOARD.w, CHALKBOARD.h);
  board.material.roughness = 1;
  board.position.set(0, 0.55 + CHALKBOARD.h / 2, 0.06);
  cb.add(board);
  const cbTitle = woodSignTexture([], { w: 512, h: 96, title: 'BẢNG KÝ TÊN TẬP THỂ' });
  const cbT = texturedPlane(cbTitle.texture, 3.6, 0.68);
  cbT.position.set(0, 0.55 + CHALKBOARD.h + 0.45, 0.04);
  cb.add(cbT);
  // khay phấn
  cb.add(place(g('town/planks.glb'), { y: 0.5, z: 0.1, sx: CHALKBOARD.w, sy: 1, sz: 0.3 }));
  colliders.box(CHALKBOARD.x, CHALKBOARD.z, CHALKBOARD.w + 0.8, 0.7, 0, 4.6, true);
  out.chalk = chalk;
  out.chalkPos = new THREE.Vector3(CHALKBOARD.x, 2.2, CHALKBOARD.z + 0.3);

  /* ---------- Hòm thư đỏ "Lời chưa nói" ---------- */
  const sb = new THREE.Group();
  sb.position.set(SECRET_BOX.x, 0, SECRET_BOX.z);
  add(sb);
  sb.add(place(g('town/pillar-wood.glb'), { sx: 3, sy: 1.05, sz: 3 }));
  const box = tint(place(g('holiday/present-a-cube.glb'), { y: 1.0, s: 2.2 }), '#ff5a4f');
  sb.add(box);
  const sbp = plaqueTexture('Lời chưa nói', 'gửi riêng thầy cô', { w: 384, h: 192 });
  const sbPlate = texturedPlane(sbp.texture, 0.95, 0.48);
  sbPlate.position.set(0, 0.62, 0.27);
  sb.add(sbPlate);
  colliders.circle(SECRET_BOX.x, SECRET_BOX.z, 0.7);

  /* ---------- Cột cờ ---------- */
  const fg = new THREE.Group();
  fg.position.set(FLAG.x, 0, FLAG.z);
  add(fg);
  fg.add(place(g('nature/statue_block.glb'), { s: 4 }));
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 10, 10), new THREE.MeshStandardMaterial({ color: '#E8ECF2', metalness: 0.6, roughness: 0.35 }));
  pole.position.y = 6.5; pole.castShadow = true;
  fg.add(pole);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), new THREE.MeshStandardMaterial({ color: '#E9C04A', metalness: 0.8, roughness: 0.3 }));
  knob.position.y = 11.55; fg.add(knob);
  const fvn = flagVNTexture();
  const flag = texturedPlane(fvn.texture, 2.6, 1.73, { side: THREE.DoubleSide });
  flag.geometry = new THREE.PlaneGeometry(2.6, 1.73, 16, 8);
  flag.geometry.translate(1.3, 0, 0);
  flag.position.set(0.06, 10.4, 0);
  flag.castShadow = true;
  fg.add(flag);
  out.flags.push(makeWaver(flag, 0.16, 2.2, true));
  colliders.circle(FLAG.x, FLAG.z, 1.2);
  // vòng hoa quanh chân cột
  const flowerRing = [];
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; flowerRing.push({ x: FLAG.x + Math.cos(a) * 1.6, z: FLAG.z + Math.sin(a) * 1.6, ry: a, s: 3.2 }); }
  add(instanced(g('nature/flower_redA.glb'), flowerRing.filter((_, i) => i % 2 === 0), { shadow: false }));
  add(instanced(g('nature/flower_yellowA.glb'), flowerRing.filter((_, i) => i % 2 === 1), { shadow: false }));

  /* ---------- Sân khấu – góc chụp ảnh (quay mặt về phía tây) ---------- */
  const st = new THREE.Group();
  st.position.set(STAGE.x, 0, STAGE.z);
  add(st);
  const tiles = [];
  const nx = 4, nz = 6, tw = STAGE.d / nx, td = STAGE.w / nz;
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    tiles.push({ x: -STAGE.d / 2 + tw * (i + 0.5), y: STAGE.h - 0.08, z: -STAGE.w / 2 + td * (j + 0.5), sx: tw, sy: 1, sz: td });
  }
  st.add(instanced(g('holiday/floor-wood.glb'), tiles));
  // bệ đá dưới sàn gỗ
  st.add(place(g('nature/statue_block.glb'), { sx: STAGE.d / 0.4, sy: (STAGE.h - 0.06) / 0.4, sz: STAGE.w / 0.4 }));
  // bậc lên sân khấu (phía tây, mô hình bậc dâng theo +x)
  st.add(place(g('town/stairs-wide-stone.glb'), { x: -STAGE.d / 2 - 0.55, sx: 1.1, sy: STAGE.h, sz: 4.4 }));
  // khung phông
  const bx = STAGE.d / 2 - 0.3;
  for (const sz of [-1, 1]) st.add(place(g('town/pillar-wood.glb'), { x: bx, y: STAGE.h, z: sz * (STAGE.w / 2 - 0.3), sx: 2.6, sy: 5, sz: 2.6 }));
  const topBeam = place(g('town/pillar-wood.glb'), { x: bx, y: STAGE.h + 5, z: -(STAGE.w / 2 - 0.1), sx: 2.6, sy: STAGE.w - 0.2, sz: 2.6 });
  topBeam.rotation.x = Math.PI / 2;
  st.add(topBeam);
  const bd = backdropTexture(1024, 560);
  const backdrop = texturedPlane(bd.texture, STAGE.w - 1.0, 4.6);
  backdrop.rotation.y = -Math.PI / 2;
  backdrop.position.set(bx - 0.05, STAGE.h + 2.45, 0);
  st.add(backdrop);
  const backB = backdrop.clone(); backB.rotation.y = Math.PI / 2; backB.position.x = bx + 0.06;
  st.add(backB);
  out.backdropTex = bd.texture;
  // dây đèn + đèn lồng
  const sl = [];
  for (let z = -STAGE.w / 2 + 1; z < STAGE.w / 2; z += 1.9) sl.push({ x: bx - 0.15, y: STAGE.h + 4.7, z, ry: -Math.PI / 2, s: 1.9 });
  st.add(instanced(g('holiday/lights-colored.glb'), sl, { shadow: false }));
  for (const sz of [-1, 1]) {
    const l = place(g('holiday/lantern-hanging.glb'), { x: bx - 0.6, y: STAGE.h + 4.95, z: sz * 2.6, s: 1.6 });
    st.add(l);
  }
  // cờ trường hai bên
  const sflag = schoolFlagTexture();
  for (const sz of [-1, 1]) {
    const fp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 4.6, 8), pole.material);
    fp.position.set(-STAGE.d / 2 + 0.4, STAGE.h + 2.3, sz * (STAGE.w / 2 - 0.4));
    fp.castShadow = true;
    st.add(fp);
    const f = texturedPlane(sflag.texture, 1.4, 0.93, { side: THREE.DoubleSide });
    f.geometry = new THREE.PlaneGeometry(1.4, 0.93, 10, 6); f.geometry.translate(0.7, 0, 0);
    f.position.set(-STAGE.d / 2 + 0.4, STAGE.h + 4.0, sz * (STAGE.w / 2 - 0.4));
    f.rotation.y = sz > 0 ? Math.PI / 2 : -Math.PI / 2;
    st.add(f);
    out.flags.push(makeWaver(f, 0.1, 2.6, true));
  }
  // chậu hoa mép sân khấu
  const sfl = [];
  for (let j = 0; j < 8; j++) {
    const z = STAGE.z - STAGE.w / 2 + 0.6 + j * ((STAGE.w - 1.2) / 7);
    if (Math.abs(z - STAGE.z) < 2.5) continue; // chừa chỗ bậc thang (rộng 4,4 m)
    sfl.push({ x: STAGE.x - STAGE.d / 2 - 0.2, z, s: 3, ry: j });
  }
  add(instanced(g('nature/flower_yellowA.glb'), sfl.filter((_, i) => i % 2), { shadow: false }));
  add(instanced(g('nature/flower_redA.glb'), sfl.filter((_, i) => !(i % 2)), { shadow: false }));
  colliders.platform(STAGE.x, STAGE.z, STAGE.d, STAGE.w, 0, STAGE.h);
  colliders.ramp(STAGE.x - STAGE.d / 2 - 0.55, STAGE.z, 1.1, 4.4, 0, 0.05, STAGE.h);
  colliders.box(STAGE.x + bx, STAGE.z, 0.6, STAGE.w, 0, 6, true);
  out.photoSpot = { x: STAGE.x + 0.4, y: STAGE.h, z: STAGE.z, ry: -Math.PI / 2 };
  out.stageCenter = new THREE.Vector3(STAGE.x, STAGE.h, STAGE.z);

  /* ---------- Bảng đố vui ---------- */
  const qb = new THREE.Group();
  qb.position.set(QUIZ.x, 0, QUIZ.z);
  qb.rotation.y = -Math.PI / 2;
  add(qb);
  for (const sx of [-1, 1]) qb.add(place(g('town/pillar-wood.glb'), { x: sx * 1.45, sx: 2.2, sy: 3.6, sz: 2.2 }));
  const qback = place(g('town/planks.glb'), { y: 2.05, z: -0.1, sx: 2.7, sy: 1.6, sz: 2.7 }); qback.rotation.x = Math.PI / 2; qb.add(qback);
  const qt = quizBoardTexture();
  const qp = texturedPlane(qt.texture, 2.4, 2.4); qp.position.set(0, 2.05, 0.06); qb.add(qp);
  qb.add(place(g('town/lantern.glb'), { x: 1.9, s: 1.5 }));
  colliders.box(QUIZ.x, QUIZ.z, 0.6, 3.2, 0, 3.8, true);

  /* ---------- Bảng điện tử xếp hạng ---------- */
  const lb = new THREE.Group();
  lb.position.set(LEADER.x, 0, LEADER.z);
  lb.rotation.y = Math.PI / 2;
  add(lb);
  for (const sx of [-1, 1]) lb.add(place(g('graveyard/pillar-square.glb'), { x: sx * 2.5, sx: 1.4, sy: 2.6, sz: 1.4 }));
  const lback = place(g('town/planks.glb'), { y: 3.1, z: -0.14, sx: 4.7, sy: 1.6, sz: 3.6 }); lback.rotation.x = Math.PI / 2;
  lb.add(tint(lback, '#3a4660'));
  const lt = leaderboardTexture();
  const lp = texturedPlane(lt.texture, 4.4, 3.3, { lit: false }); lp.position.set(0, 3.1, 0.02); lb.add(lp);
  const lbBack = texturedPlane(sign.texture, 4.4, 1.1); lbBack.rotation.y = Math.PI; lbBack.position.set(0, 3.1, -0.3); lb.add(lbBack);
  colliders.box(LEADER.x, LEADER.z, 0.8, 5.4, 0, 4.8, true);
  out.leader = lt;

  /* ---------- Miếu "Thần Điểm 10" (góc đông-bắc) ---------- */
  const sh = new THREE.Group();
  sh.position.set(SHRINE.x, 0, SHRINE.z);
  add(sh);
  const platH = 0.6;
  const plat = place(g('nature/statue_block.glb'), { sx: 16, sy: platH / 0.4, sz: 13 });
  sh.add(plat);
  // bậc đá phía trước (nam)
  sh.add(place(g('town/stairs-wide-stone.glb'), { z: 2.6 + 0.45, ry: Math.PI / 2, sx: 0.9, sy: platH, sz: 3 }));
  const PW = 2.3, PD = 1.8, PH = 3.0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    sh.add(tint(place(g('town/pillar-wood.glb'), { x: sx * PW, y: platH, z: sz * PD, sx: 2.6, sy: PH, sz: 2.6 }), '#ff6a4a'));
  }
  const roof = place(g('town/roof-high-point.glb'), { y: platH + PH, sx: 5.6, sy: 2.6, sz: 4.8 });
  sh.add(roof);
  // hoành phi
  const hp = plaqueTexture('THẦN ĐIỂM 10', 'Miếu xin vía · May Academy');
  const hpl = texturedPlane(hp.texture, 1.8, 0.9);
  hpl.position.set(0, platH + PH - 0.45, PD + 0.32);
  sh.add(hpl);
  // bàn thờ + tượng
  const altar = tint(place(g('graveyard/altar-stone.glb'), { y: platH, z: -0.9, s: 2.4 }), '#f2c9a0');
  sh.add(altar);
  const altarTop = platH + 0.49 * 2.4;
  const statue = makeStatue(g('characters/character-male-b.glb'));
  statue.position.set(0, altarTop, -1.0);
  statue.scale.setScalar(1.35);
  sh.add(statue);
  const ten = plaqueTexture('10', null, { w: 256, h: 256, bg: '#C62A2F', fg: '#FFE15A' });
  const tenP = texturedPlane(ten.texture, 0.55, 0.55, { emissive: 0.25 });
  tenP.position.set(0.0, altarTop + 0.28, -0.4);
  sh.add(tenP);
  // lư hương + nến
  const urn = tint(place(g('graveyard/urn-round.glb'), { y: platH, z: 0.75, s: 3.2 }), '#e0a35a', { metal: 0.5, rough: 0.4 });
  sh.add(urn);
  sh.add(place(g('graveyard/candle-multiple.glb'), { x: -1.0, y: altarTop, z: -0.6, s: 1.6 }));
  sh.add(place(g('graveyard/candle-multiple.glb'), { x: 1.0, y: altarTop, z: -0.6, s: 1.6 }));
  const incenseTop = platH + 0.28 * 3.2 + 0.32;
  const stickMat = new THREE.MeshStandardMaterial({ color: '#B23A2A', roughness: 0.8 });
  const emberMat = new THREE.MeshBasicMaterial({ color: '#FF8A3A' });
  for (let i = -1; i <= 1; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 5), stickMat);
    s.position.set(i * 0.08, incenseTop - 0.15, 0.75); s.rotation.z = i * 0.12;
    sh.add(s);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 4), emberMat);
    e.position.set(i * 0.08 - Math.sin(i * 0.12) * 0.3, incenseTop + 0.14, 0.75);
    sh.add(e);
  }
  out.incensePos = new THREE.Vector3(SHRINE.x, incenseTop + 0.2, SHRINE.z + 0.75);
  // đèn lồng hai góc trước + biển nhỏ
  for (const sx of [-1, 1]) {
    sh.add(place(g('graveyard/lantern-candle.glb'), { x: sx * 3.4, z: 3.4, s: 2.2 }));
    sh.add(place(g('holiday/lantern-hanging.glb'), { x: sx * (PW - 0.1), y: platH + PH - 0.05, z: PD + 0.05, s: 1.3 }));
  }
  const vs = woodSignTexture(['Vía để vui,', 'ôn bài mới là chính.'], { w: 512, h: 220, title: 'Góc Xin Vía' });
  const vsg = new THREE.Group();
  vsg.position.set(-3.9, 0, 4.4); vsg.rotation.y = 0.35;
  vsg.add(place(g('town/pillar-wood.glb'), { sx: 2, sy: 1.6, sz: 2 }));
  const vsp = texturedPlane(vs.texture, 1.6, 0.69); vsp.position.set(0, 1.4, 0.2); vsg.add(vsp);
  sh.add(vsg);
  // bục miếu đứng lên được (lên bằng bậc phía nam); cột, bàn thờ, lư hương là vật cản
  colliders.platform(SHRINE.x, SHRINE.z, 6.4, 5.2, 0, platH);
  colliders.ramp(SHRINE.x, SHRINE.z + 2.6 + 0.45, 0.9, 3, Math.PI / 2, 0.05, platH);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) colliders.circle(SHRINE.x + sx * PW, SHRINE.z + sz * PD, 0.3);
  colliders.box(SHRINE.x, SHRINE.z - 0.9, 2.6, 1.6, 0, 3, false);
  colliders.circle(SHRINE.x, SHRINE.z + 0.75, 0.5);
  colliders.box(SHRINE.x, SHRINE.z - 2.4, 6.4, 0.4, 0, 3.6, true); // vách sau (chắn camera)
  colliders.circle(SHRINE.x - 3.4, SHRINE.z + 3.4, 0.4);
  colliders.circle(SHRINE.x + 3.4, SHRINE.z + 3.4, 0.4);
  // cây & hoa quanh miếu
  const shT = [[-6, -3], [6.5, -2], [-5, -6], [5, -6.5], [0, -7]].map(([dx, dz]) => ({ x: SHRINE.x + dx, z: SHRINE.z + dz }));
  shT.forEach((t) => colliders.circle(t.x, t.z, 0.6));
  add(instanced(g('nature/tree_plateau_fall.glb'), shT.map((t, i) => ({ ...t, ry: i, s: 4.2 + (i % 3) * 0.5 }))));
  const shF = [];
  for (let i = 0; i < 16; i++) { const dx = -4 + (i % 8) * 1.15; if (Math.abs(dx) < 2) continue; shF.push({ x: SHRINE.x + dx, z: SHRINE.z + 4.3 + Math.floor(i / 8) * 0.7, s: 3, ry: i }); }
  add(instanced(g('nature/flower_purpleA.glb'), shF.filter((_, i) => i % 3 === 0), { shadow: false }));
  add(instanced(g('nature/flower_yellowA.glb'), shF.filter((_, i) => i % 3 === 1), { shadow: false }));
  add(instanced(g('nature/flower_redA.glb'), shF.filter((_, i) => i % 3 === 2), { shadow: false }));

  /* ---------- Hồ hạc giấy (đông-nam) ---------- */
  const water = createWater(LAKE);
  add(water.mesh);
  out.water = water;
  colliders.ellipse(LAKE.x, LAKE.z, LAKE.rx - 0.2, LAKE.rz - 0.2);
  const shore = [], shoreS = [];
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI) < 0.16) continue; // chừa chỗ bến
    const x = LAKE.x + Math.cos(a) * (LAKE.rx + 0.25), z = LAKE.z + Math.sin(a) * (LAKE.rz + 0.25);
    (i % 3 ? shore : shoreS).push({ x, z, ry: a * 2.3, s: 2.2 + R() * 1.2 });
  }
  add(instanced(g('nature/stone_largeA.glb'), shore));
  add(instanced(g('nature/stone_smallA.glb'), shoreS));
  const lilies = [];
  for (let i = 0; i < 14; i++) {
    const a = R() * Math.PI * 2, rr = 0.55 + R() * 0.35;
    const lx = LAKE.x + Math.cos(a) * LAKE.rx * rr, lz = LAKE.z + Math.sin(a) * LAKE.rz * rr;
    if (lx < PIER.x1 + 1.5 && Math.abs(lz - PIER.z) < 2.5) continue;
    lilies.push({ x: lx, y: 0.03, z: lz, ry: R() * 6, s: 3 + R() * 2 });
  }
  add(instanced(g('nature/lily_large.glb'), lilies.slice(0, 8), { shadow: false }));
  add(instanced(g('nature/lily_small.glb'), lilies.slice(8), { shadow: false }));
  // bến gỗ
  // bến gỗ liền mạch từ bờ tây ra mặt hồ (đứng lên được)
  const pierLen = PIER.x1 - PIER.x0, nT = 5, tl = pierLen / nT;
  const deck = [];
  for (let i = 0; i < nT; i++) deck.push({ x: PIER.x0 + tl * (i + 0.5), y: PIER.h - 0.06, z: PIER.z, sx: tl * 1.01, sy: 1, sz: PIER.w });
  add(instanced(g('town/planks.glb'), deck));
  const posts = [];
  for (let i = 0; i <= nT; i++) for (const sz of [-1, 1]) posts.push({ x: PIER.x0 + 0.15 + (pierLen - 0.3) * (i / nT), y: -0.4, z: PIER.z + sz * (PIER.w / 2 - 0.08), sx: 1.4, sy: 1.25, sz: 1.4 });
  add(instanced(g('town/pillar-wood.glb'), posts));
  colliders.platform((PIER.x0 + PIER.x1) / 2, PIER.z, pierLen, PIER.w, 0, PIER.h);
  colliders.hole(PIER.x0 - 0.5, PIER.x1 - 0.3, PIER.z - PIER.w / 2 + 0.05, PIER.z + PIER.w / 2 - 0.05);
  // lan can vô hình hai bên + đầu bến để không rơi xuống nước
  const wx0 = LAKE.x - LAKE.rx - 0.3;
  colliders.segment(wx0, PIER.z - PIER.w / 2 - 0.1, PIER.x1 + 0.1, PIER.z - PIER.w / 2 - 0.1, 0.2, 1);
  colliders.segment(wx0, PIER.z + PIER.w / 2 + 0.1, PIER.x1 + 0.1, PIER.z + PIER.w / 2 + 0.1, 0.2, 1);
  colliders.segment(PIER.x1 + 0.1, PIER.z - PIER.w / 2, PIER.x1 + 0.1, PIER.z + PIER.w / 2, 0.2, 1);
  add(place(g('graveyard/lantern-candle.glb'), { x: PIER.x0 - 0.9, z: PIER.z - 2.4, s: 2.2 }));
  add(place(g('graveyard/lantern-candle.glb'), { x: PIER.x0 - 0.9, z: PIER.z + 2.4, s: 2.2 }));
  colliders.circle(PIER.x0 - 0.9, PIER.z - 2.4, 0.35);
  colliders.circle(PIER.x0 - 0.9, PIER.z + 2.4, 0.35);
  add(place(g('graveyard/lantern-candle.glb'), { x: PIER.x1 - 0.25, y: PIER.h, z: PIER.z - PIER.w / 2 + 0.25, s: 1.6 }));
  add(place(g('graveyard/lantern-candle.glb'), { x: PIER.x1 - 0.25, y: PIER.h, z: PIER.z + PIER.w / 2 - 0.25, s: 1.6 }));
  const ls = woodSignTexture(['Gấp hạc · gửi lời cảm ơn'], { w: 512, h: 200, title: 'Hồ Hạc Giấy' });
  const lsg = new THREE.Group();
  lsg.position.set(PIER.x0 - 2.2, 0, PIER.z - 3.6); lsg.rotation.y = -0.6;
  lsg.add(place(g('town/pillar-wood.glb'), { sx: 2, sy: 1.6, sz: 2 }));
  const lsp = texturedPlane(ls.texture, 1.7, 0.66); lsp.position.set(0, 1.45, 0.2); lsg.add(lsp);
  add(lsg);
  colliders.circle(PIER.x0 - 2.2, PIER.z - 3.6, 0.3);
  out.craneDrop = new THREE.Vector3(PIER.x1 - 0.4, PIER.h + 0.1, PIER.z);

  /* ---------- Cây nền, bụi, ghế, đèn ---------- */
  const yardTrees = [];
  const pushTree = (x, z, s) => { yardTrees.push({ x, z, s, ry: R() * 6 }); colliders.circle(x, z, 0.55); };
  // hàng cây hai bên trục cổng (trong sân)
  for (const z of [26, 31.5, 37]) { pushTree(-6.5, z, 4.2); pushTree(6.5, z, 4.2); }
  // dọc mép đông của sân (giữa sân và hồ/miếu)
  for (const z of [-6, 3, 12]) pushTree(22.5, z, 4.6);
  // trước dãy lớp
  for (const x of [-19, 15, 19]) pushTree(x, -23, 4.4);
  // dọc hàng rào bắc phía sau dãy lớp
  for (let x = -46; x <= 46; x += 7) if (Math.abs(x) > 24) pushTree(x, -39.5, 4.5 + R());
  // dọc hàng rào phía nam
  for (let x = -46; x <= 46; x += 6.5) if (Math.abs(x) > 15 && !(x > 20 && x < 46 && false)) pushTree(x, 39.5, 4.2 + R());
  // dọc hàng rào đông
  for (let z = -10; z <= 36; z += 7) if (z < 11 || z > 33) pushTree(47.5, z, 4.5 + R());
  const kinds = ['nature/tree_oak_fall.glb', 'nature/tree_default_fall.glb', 'nature/tree_fat_fall.glb', 'nature/tree_cone_fall.glb', 'nature/tree_oak.glb'];
  kinds.forEach((k, ki) => add(instanced(g(k), yardTrees.filter((_, i) => i % kinds.length === ki))));

  // rừng cây bên ngoài khuôn viên (không va chạm, không đổ bóng)
  const outside = [];
  for (let i = 0; i < (quality.high ? 130 : 80); i++) {
    let x, z;
    for (let tries = 0; tries < 20; tries++) {
      x = -95 + R() * 190; z = -85 + R() * 165;
      const inCampus = (x > CAMPUS.minX - 3 && x < CAMPUS.maxX + 3 && z > CAMPUS.minZ - 3 && z < CAMPUS.maxZ + 3)
        || (x > DAITHU_YARD.x0 - 4 && x < CAMPUS.minX && z > DAITHU_YARD.z0 - 4 && z < DAITHU_YARD.z1 + 4);
      const inFore = x > FORECOURT.minX - 3 && x < FORECOURT.maxX + 3 && z >= CAMPUS.maxZ && z < FORECOURT.maxZ + 3;
      const road = (z > ROAD.z0 - 2 && z < ROAD.z1 + 3) || (x > REAL.x0 - 4 && x < REAL.x1 + 4 && z > REAL.z0 - 4 && z < REAL.z1);
      if (!inCampus && !inFore && !road) break;
    }
    outside.push({ x, z, s: 4.5 + R() * 3, ry: R() * 6 });
  }
  const okinds = ['nature/tree_oak_fall.glb', 'nature/tree_default_fall.glb', 'nature/tree_tall_fall.glb', 'nature/tree_cone_fall.glb', 'nature/tree_fat_fall.glb', 'nature/tree_default.glb'];
  okinds.forEach((k, ki) => add(instanced(g(k), outside.filter((_, i) => i % okinds.length === ki), { shadow: false })));
  // đường phía trước trường
  // (con đường trước trường dựng trong realschool.js)
  // nhà phố xa (bóng dáng thành phố)
  const city = ['a', 'b', 'c', 'd', 'e', 'wide-a', 'wide-b'];
  const cityT = {};
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + R() * 0.1;
    const rr = 135 + R() * 20;
    const k = city[i % city.length];
    const cx = Math.cos(a) * rr, cz = Math.sin(a) * rr;
    const cs = 8 + R() * 5;
    if (Math.abs(cz - ROAD.zc) < 16 && cx > ROAD.x0 - 10 && cx < ROAD.x1 + 10) continue; // không chắn con đường
    (cityT[k] ??= []).push({ x: cx, z: cz, ry: -a + Math.PI / 2, s: cs });
  }
  for (const [k, list] of Object.entries(cityT)) add(instanced(g(`city/low-detail-building-${k}.glb`), list, { shadow: false, receive: false }));

  // bụi cây, hoa ven sân
  const bushes = [];
  for (let x = -18; x <= 18; x += 3) if (Math.abs(x) > 4) bushes.push({ x, z: -24.6, s: 3.2, ry: x });
  for (let z = -16; z <= 30; z += 4) { if (Math.abs(z - GARDEN_C.z) > 3) bushes.push({ x: -20.6, z, s: 3, ry: z }); }
  add(instanced(g('nature/plant_bushDetailed.glb'), bushes.filter((_, i) => i % 2 === 0), { shadow: quality.high }));
  add(instanced(g('nature/plant_bushLarge.glb'), bushes.filter((_, i) => i % 2 === 1), { shadow: quality.high }));
  // không đặt cỏ/nấm vào hồ, lối vườn, lối đi, bục
  const offLimits = (x, z) => {
    const ex = (x - LAKE.x) / (LAKE.rx + 1.5), ez = (z - LAKE.z) / (LAKE.rz + 1.5);
    if (ex * ex + ez * ez < 1) return true;
    const rr = Math.hypot(x - GARDEN_C.x, z - GARDEN_C.z);
    if (x < GARDEN_C.x + 4 && (Math.abs(rr - LANE_CO.r) < LANE_W / 2 + 0.6 || Math.abs(rr - LANE_THAY.r) < LANE_W / 2 + 0.6)) return true;
    if (Math.abs(z - GARDEN_C.z) < LANE_W / 2 + 0.6 && x < -19) return true;
    if (Math.abs(z + 16.5) < 3 && x > 18 && x < 36) return true;
    return colliders.groundAt(x, z) > 0 || colliders.blocked(x, z, 0.6);
  };
  const grassT = [];
  for (let i = 0; i < 120; i++) {
    const x = -48 + R() * 96, z = -40 + R() * 80;
    if (x > -21 && x < 21 && z > -25 && z < 33) continue;
    if (offLimits(x, z)) continue;
    grassT.push({ x, z, s: 2.5 + R() * 1.5, ry: R() * 6 });
  }
  add(instanced(g('nature/grass_large.glb'), grassT, { shadow: false }));
  const mush = []; for (let i = 0; i < 18; i++) { const x = -48 + R() * 30, z = -20 + R() * 55; if (!offLimits(x, z)) mush.push({ x, z, s: 2.5, ry: R() * 6 }); }
  add(instanced(g('nature/mushroom_red.glb'), mush, { shadow: false }));

  // ghế đá + đèn
  const benches = [
    { x: -17.5, z: 20, ry: Math.PI / 2 }, { x: -17.5, z: -8, ry: Math.PI / 2 }, { x: 18, z: 20, ry: -Math.PI / 2 },
    { x: 26, z: 32, ry: Math.PI }, { x: 37, z: 34, ry: Math.PI }, { x: -10, z: 47, ry: Math.PI / 2 }, { x: 10, z: 47, ry: -Math.PI / 2 },
  ];
  add(instanced(g('holiday/bench.glb'), benches.map((b) => ({ ...b, s: 1.8 }))));
  benches.forEach((b) => colliders.box(b.x, b.z, 2.0, 1.1, b.ry, 1, false));
  const lamps0 = [{ x: -50.6, z: 1.2 }, { x: -50.6, z: 10.8 }, { x: -59.4, z: 6 }];
  const lamps = [...lamps0, 
    { x: -3.6, z: 28 }, { x: 3.6, z: 28 }, { x: -3.6, z: 18 }, { x: 3.6, z: 18 }, { x: -12, z: -18 }, { x: 12, z: -18 },
    { x: -7, z: 50 }, { x: 7, z: 50 }, { x: 24, z: -14.5 }, { x: -21, z: 3 }, { x: -21, z: 9 },
  ];
  add(instanced(g('graveyard/lightpost-single.glb'), lamps.map((l) => ({ ...l, s: 2.8, ry: l.x > 0 ? -Math.PI / 2 : Math.PI / 2 }))));
  lamps.forEach((l) => colliders.circle(l.x, l.z, 0.3));

  /* ---------- Biển Vườn Tri Ân ---------- */
  const gs = new THREE.Group();
  gs.position.set(-20.8, 0, GARDEN_C.z);
  gs.rotation.y = Math.PI / 2;
  add(gs);
  for (const sx of [-1, 1]) gs.add(place(g('town/pillar-wood.glb'), { x: sx * 2.6, sx: 2.6, sy: 4.4, sz: 2.6 }));
  const gsT = woodSignTexture(['28 cây · 28 thầy cô'], { w: 768, h: 240, title: 'VƯỜN TRI ÂN' });
  const gsb = place(g('town/planks.glb'), { y: 3.7, z: -0.08, sx: 4.9, sy: 1.6, sz: 1.3 }); gsb.rotation.x = Math.PI / 2; gs.add(gsb);
  const gsp = texturedPlane(gsT.texture, 4.6, 1.31); gsp.position.set(0, 3.7, 0.09); gs.add(gsp);
  const gsp2 = gsp.clone(); gsp2.rotation.y = Math.PI; gsp2.position.z = -0.2; gs.add(gsp2);
  colliders.circle(-20.8, GARDEN_C.z - 2.6, 0.3);
  colliders.circle(-20.8, GARDEN_C.z + 2.6, 0.3);
  const laneSign = (text, sub, r) => {
    const t = woodSignTexture([sub], { w: 512, h: 200, title: text });
    const grp = new THREE.Group();
    grp.position.set(GARDEN_C.x - (r - LANE_W / 2 - 0.8), 0, GARDEN_C.z + LANE_W / 2 + 0.9);
    grp.rotation.y = Math.PI / 2 + 0.6;
    grp.add(place(g('town/pillar-wood.glb'), { sx: 2, sy: 1.7, sz: 2 }));
    const p = texturedPlane(t.texture, 1.6, 0.62); p.position.set(0, 1.5, 0.2); grp.add(p);
    add(grp);
    colliders.circle(grp.position.x, grp.position.z, 0.25);
  };
  laneSign('Lối các thầy', '10 cây · đi vòng cung', LANE_THAY.r);
  laneSign('Lối các cô', '18 cây · đi vòng cung', LANE_CO.r);

  /* ---------- Cờ / băng rôn cập nhật ---------- */
  out.tick.push((t) => { for (const f of out.flags) f(t); });
  return out;
}

/** Cờ bay: cập nhật đỉnh trên CPU (lưới nhỏ). */
function makeWaver(mesh, amp, speed, fromPole = false) {
  const pos = mesh.geometry.attributes.position;
  const base = pos.array.slice();
  let w = 0;
  for (let i = 0; i < pos.count; i++) w = Math.max(w, Math.abs(base[i * 3]));
  return (t) => {
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      const k = fromPole ? Math.max(0, x) / (w || 1) : 0.4 + 0.6 * Math.abs(Math.sin((x / (w || 1)) * 1.5));
      pos.array[i * 3 + 2] = Math.sin(t * speed + x * 2.2 + y * 0.6) * amp * k;
    }
    pos.needsUpdate = true;
  };
}

/** Tượng "Thần Điểm 10": nhân vật Kenney mạ vàng, tư thế chữ V. */
function makeStatue(gltf) {
  const s = SkeletonUtils.clone(gltf.scene);
  const gold = new THREE.MeshStandardMaterial({ color: '#F2C14E', metalness: 0.25, roughness: 0.4, emissive: '#7a4f0a', emissiveIntensity: 0.45 });
  s.traverse((o) => {
    if (o.isMesh) {
      const m = gold.clone();
      m.map = o.material.map || null;
      if (m.map) m.color.set('#FFD36B');
      o.material = m; o.castShadow = true; o.receiveShadow = true;
    }
  });
  const mixer = new THREE.AnimationMixer(s);
  const a = mixer.clipAction(CUSTOM_CLIPS.peace);
  a.play(); mixer.update(0.3);
  a.paused = true;
  return s;
}
