// Bố cục khuôn viên (mét). Bắc = -z, Nam = +z, Tây = -x, Đông = +x. Cổng ở phía nam.
export const CAMPUS = { minX: -50, maxX: 50, minZ: -42, maxZ: 42 };
export const FORECOURT = { minX: -14, maxX: 14, minZ: 42, maxZ: 62 }; // sân trước cổng (bên ngoài)

export const START = { x: 0, z: 50, ry: Math.PI }; // đứng trước cổng, nhìn vào trường (hướng bắc)

export const GATE = { x: 0, z: 42, halfOpen: 4.2 };
export const SCHOOL = { x: 0, z: -31, width: 44, depth: 8, module: 4 }; // dãy lớp học
export const CHALKBOARD = { x: -9, z: -21.5, w: 9, h: 3.4 };
export const SECRET_BOX = { x: 4.2, z: -24.6 };
export const PORCH = { z0: -27, z1: -25.8, h: 0.25 };            // hiên trước dãy lớp
export const FLAG = { x: 0, z: -14 };
export const STAGE = { x: 14, z: -1, w: 9, d: 5.5, h: 0.75 };   // sân khấu, quay mặt về phía tây (-x)
export const QUIZ = { x: 12.5, z: 9.5 };
export const LEADER = { x: -11, z: 6 };
export const SHRINE = { x: 35, z: -22, w: 6.4, d: 5.2, h: 0.6 };
export const LAKE = { x: 33, z: 22, rx: 11, rz: 8.5 };
export const PIER = { x0: 20.6, x1: 27.2, z: 22, w: 2.6, h: 0.3 }; // bến gỗ từ bờ tây ra mặt hồ

// Vườn Tri Ân: vòng cung quanh tâm GARDEN_C về phía tây. Lối rộng 4 m, chừa khoảng trống ở hướng 180° cho lối vào.
export const GARDEN_C = { x: -14, z: 6 };
export const LANE_W = 4;
export const LANE_CO = { r: 29, rIn: 24.6, rOut: 33.4, sIn: 26.25, sOut: 31.75, arcs: [[116, 170], [190, 244]] };   // 18 cây các cô
export const LANE_THAY = { r: 17.5, rIn: 13.5, rOut: 21.5, sIn: 14.75, sOut: 20.25, arcs: [[122, 168], [192, 238]] }; // 10 cây các thầy

// Sân Đại Thụ: phần khuôn viên mở rộng về phía tây ở cuối trục Vườn Tri Ân (hàng rào có "túi" ra ngoài)
export const DAITHU_YARD = { x0: -76, x1: CAMPUS.minX, z0: -12, z1: 24 };
// 2 đại thụ: d01 (bắc), d02 (nam) – biển tên lớn đặt phía đông gốc cây, quay về phía lối vào
export const DAITHU = [
  { x: -65, z: -3.5, sign: { x: -54.6, z: -3.5, ry: Math.PI / 2 }, approach: { x: -52.6, z: -3.5 } },
  { x: -65, z: 15.5, sign: { x: -54.6, z: 15.5, ry: Math.PI / 2 }, approach: { x: -52.6, z: 15.5 } },
];

// Con đường trước sân ngoài cổng (chạy theo trục x) + Trường MAY thật (bên phải/đông của đường)
// vỉa hè bắc z 62..64.5 · lòng đường 64.5..72.5 · vỉa hè nam 72.5..75
export const ROAD = { x0: -40, x1: 160, z0: 62, z1: 75, roadZ0: 64.5, roadZ1: 72.5, zc: 68.5 };
// Khu đất trường thật (đã thu nhỏ ~0,7): hai dãy dọc hai bên + khối ngang phía sau (chữ U), cổng quay ra đường ở z = 61.6
export const REAL = { x0: 62, x1: 112, z0: -10, z1: 62, gateX: 87, gateW: 8, wallZ: 61.6 };
// Các vùng được đi lại (hợp các hình chữ nhật). Tường/hàng rào/toà nhà là va chạm riêng.
export const WALK_RECTS = [
  { minX: CAMPUS.minX, maxX: CAMPUS.maxX, minZ: CAMPUS.minZ, maxZ: CAMPUS.maxZ },
  { minX: DAITHU_YARD.x0, maxX: DAITHU_YARD.x1, minZ: DAITHU_YARD.z0, maxZ: DAITHU_YARD.z1 },
  { minX: FORECOURT.minX, maxX: FORECOURT.maxX, minZ: FORECOURT.minZ, maxZ: FORECOURT.maxZ },
  { minX: ROAD.x0, maxX: ROAD.x1, minZ: ROAD.z0, maxZ: ROAD.z1 },
  { minX: REAL.x0, maxX: REAL.x1, minZ: REAL.z0, maxZ: REAL.z1 },
];

const deg = (d) => (d * Math.PI) / 180;
const SIGN_SHIFT = 3.0; // m, khoảng dời biển tên khỏi gốc cây dọc theo lối
export const lanePoint = (lane, aDeg) => ({ x: GARDEN_C.x + Math.cos(deg(aDeg)) * lane.r, z: GARDEN_C.z + Math.sin(deg(aDeg)) * lane.r });

/** Vị trí 28 cây theo thứ tự danh sách (t01–t18 các cô, t19–t28 các thầy). */
export function treeSlots(teachers) {
  // đại thụ (special) không thuộc lối cô/thầy
  const normal = teachers.filter((t) => !t.special);
  const co = normal.filter((t) => t.title !== 'Thầy');
  const thay = normal.filter((t) => t.title === 'Thầy');
  const out = [];
  const lay = (list, lane) => {
    const n = list.length;
    const half = Math.ceil(n / 2);
    list.forEach((t, i) => {
      const [a0, a1] = i < half ? lane.arcs[0] : lane.arcs[1];
      const k = i < half ? i : i - half;
      const m = i < half ? half : n - half;
      const aDeg = m > 1 ? a0 + ((a1 - a0) * k) / (m - 1) : (a0 + a1) / 2;
      const a = deg(aDeg);
      const side = i % 2;
      const r = side ? lane.rOut : lane.rIn;
      const x = GARDEN_C.x + Math.cos(a) * r;
      const z = GARDEN_C.z + Math.sin(a) * r;
      // biển tên đặt ngay mép lối (ngoài phần đường đi), quay mặt vào lối.
      // Tán cây Kenney thấp (đáy ~1–2 m) → dời biển dọc lối SIGN_SHIFT m ra khỏi tán,
      // về phía đầu cung (xa lối vào vườn ở 180°) để không chắn lối vào.
      const rs = side ? lane.sOut : lane.sIn;
      const dir = i < half ? -1 : 1;
      const sDeg = aDeg + dir * (SIGN_SHIFT / rs) * (180 / Math.PI);
      const sa = deg(sDeg);
      const sx = GARDEN_C.x + Math.cos(sa) * rs;
      const sz = GARDEN_C.z + Math.sin(sa) * rs;
      const lp = lanePoint(lane, sDeg);
      const signRy = Math.atan2(lp.x - sx, lp.z - sz);
      out.push({ teacher: t, x, z, a, aDeg, side, sign: { x: sx, z: sz, ry: signRy }, approach: lp, lane: lane === LANE_CO ? 'co' : 'thay' });
    });
  };
  lay(co, LANE_CO);
  lay(thay, LANE_THAY);
  teachers.filter((t) => t.special === 'daithu').slice(0, DAITHU.length).forEach((t, i) => {
    const d = DAITHU[i];
    out.push({ teacher: t, x: d.x, z: d.z, a: Math.PI, aDeg: 180, side: 0, sign: { ...d.sign }, approach: { ...d.approach }, lane: 'daithu', special: 'daithu' });
  });
  return out;
}

export function treeLabel(t) {
  return `Treo thiệp tặng ${t.title || ''} ${t.name || ''}`.replace(/\s+/g, ' ').trim();
}

/** Các zone cố định (trừ cây). r = bán kính tương tác; ax/az = điểm đứng khi tự đi tới. */
export const STATIC_ZONES = [
  { id: 'real-gate', kind: 'gate', label: 'Trường MAY thật', x: REAL.gateX, z: 64.6, r: 4.5, ax: REAL.gateX, az: 64.6 },
  { id: 'gate', kind: 'gate', label: 'Xem đếm ngược', x: 0, z: 45.5, r: 4.5 },
  { id: 'crane-lake', kind: 'crane', label: 'Thả hạc giấy', x: 23.6, z: PIER.z, r: 3.9, ax: 24.6, az: PIER.z },
  { id: 'chalkboard', kind: 'chalkboard', label: 'Ký tên lên bảng', x: CHALKBOARD.x, z: CHALKBOARD.z + 2.6, r: 4 },
  { id: 'secret-box', kind: 'secret', label: 'Gửi lời chưa nói', x: SECRET_BOX.x, z: SECRET_BOX.z + 1.6, r: 2.8 },
  { id: 'photo-stage', kind: 'photo', label: 'Chụp ảnh kỷ niệm', x: STAGE.x - STAGE.d / 2 - 1.9, z: STAGE.z + 2.2, r: 3.8 },
  { id: 'quiz-board', kind: 'quiz', label: 'Đố vui về thầy cô', x: QUIZ.x - 2, z: QUIZ.z, r: 3 },
  { id: 'leaderboard', kind: 'leaderboard', label: 'Bảng lớp tri ân', x: LEADER.x + 2.4, z: LEADER.z, r: 3.2 },
  { id: 'shrine', kind: 'shrine', label: 'Vào xin vía', x: SHRINE.x - 3, z: SHRINE.z + 5.5, r: 4, ax: SHRINE.x - 1.5, az: SHRINE.z + 5.2 },
];

/** Đồ thị điểm mốc dọc các lối đi (dùng cho chỉ đường / tự đi). */
export function waypointGraph() {
  const N = {
    G0: [0, 50], G1: [0, 39], Y1: [0, 26], Y2: [0, 4], YW: [-11, 12], YN: [-4, -17.5], YD: [3.6, -21.2],
    E1: [18, -16.5], SH: [31.5, -16.5], L1: [16, 24.5], PR: [21.6, PIER.z], GW0: [-18, GARDEN_C.z],
  };
  const E = [['G0', 'G1'], ['G1', 'Y1'], ['Y1', 'Y2'], ['Y2', 'YW'], ['Y1', 'YW'], ['YW', 'GW0'], ['Y2', 'YN'], ['Y2', 'YD'], ['YN', 'YD'],
    ['Y2', 'E1'], ['E1', 'SH'], ['Y2', 'L1'], ['L1', 'PR']];
  const lane = (key, ln, angles, cross) => {
    let prev = null;
    for (const a of angles) {
      const id = a === 180 ? cross : `${key}${a}`;
      const p = lanePoint(ln, a);
      N[id] = [p.x, p.z];
      if (prev) E.push([prev, id]);
      prev = id;
    }
  };
  lane('T', LANE_THAY, [116, 128, 140, 152, 166, 180, 194, 208, 220, 232, 244], 'GW1');
  lane('C', LANE_CO, [112, 124, 136, 148, 160, 172, 180, 188, 200, 212, 224, 236, 248], 'GW2');
  E.push(['GW0', 'GW1'], ['GW1', 'GW2']);
  // lối tới sân Đại Thụ ở cuối trục vườn
  N.DT0 = [-48, GARDEN_C.z]; N.DT1 = [-53, GARDEN_C.z]; N.DTa = [-52.6, -3.5]; N.DTb = [-52.6, 15.5];
  E.push(['GW2', 'DT0'], ['DT0', 'DT1'], ['DT1', 'DTa'], ['DT1', 'DTb']);
  // ra đường qua lối mở giữa hàng rào sân trước, theo lòng đường sang trường thật rồi vào sân
  N.RD0 = [0, ROAD.zc]; N.RD1 = [REAL.gateX, ROAD.zc]; N.RG0 = [REAL.gateX, 64.6]; N.RG1 = [REAL.gateX, 56]; N.RC = [REAL.gateX, 24];
  E.push(['G0', 'RD0'], ['RD0', 'RD1'], ['RD1', 'RG0'], ['RG0', 'RG1'], ['RG1', 'RC']);
  return { nodes: N, edges: E };
}

/* ---------------- Va chạm 2D (mặt phẳng xz) + độ cao mặt đất ---------------- */
export const STEP_UP = 0.45;
export class Colliders {
  constructor() {
    this.circles = [];
    this.boxes = [];   // {x,z,hw,hd,rot,c,s,h,cam}
    this.ellipses = [];
    this.surfaces = [];  // mặt đi được: bục/sàn (h) hoặc bậc dốc (h0→h1 theo trục x cục bộ)
    this.holes = [];     // vùng được đi qua elip (bến gỗ trên hồ)
  }
  circle(x, z, r) { this.circles.push({ x, z, r }); }
  /** Bục phẳng cao h (đứng lên được nếu bước ≤ STEP_UP hoặc lên bằng bậc) */
  platform(x, z, w, d, rot, h) { this.surfaces.push({ x, z, hw: w / 2, hd: d / 2, c: Math.cos(rot), s: Math.sin(rot), h0: h, h1: h }); }
  /** Bậc thang/dốc: len theo hướng đi lên (trục x cục bộ, hướng thế giới (cos rot, -sin rot)), rộng width */
  ramp(x, z, len, width, rot, h0, h1) { this.surfaces.push({ x, z, hw: len / 2, hd: width / 2, c: Math.cos(rot), s: Math.sin(rot), h0, h1 }); }
  hole(minX, maxX, minZ, maxZ) { this.holes.push({ minX, maxX, minZ, maxZ }); }
  inHole(x, z) { for (const h of this.holes) if (x > h.minX && x < h.maxX && z > h.minZ && z < h.maxZ) return true; return false; }

  /** Độ cao mặt đất tại (x,z) */
  groundAt(x, z) {
    let g = 0;
    for (const sf of this.surfaces) {
      const dx = x - sf.x, dz = z - sf.z;
      const lx = dx * sf.c - dz * sf.s, lz = dx * sf.s + dz * sf.c;
      if (Math.abs(lx) > sf.hw || Math.abs(lz) > sf.hd) continue;
      const h = sf.h0 + (sf.h1 - sf.h0) * ((lx + sf.hw) / (2 * sf.hw));
      if (h > g) g = h;
    }
    return g;
  }

  /** Điểm có bị vật cản chiếm không (dùng cho tìm đường). */
  blocked(x, z, pad = 0.4) {
    for (const c of this.circles) { const dx = x - c.x, dz = z - c.z, rr = c.r + pad; if (dx * dx + dz * dz < rr * rr) return true; }
    for (const b of this.boxes) {
      const dx = x - b.x, dz = z - b.z;
      const lx = dx * b.c - dz * b.s, lz = dx * b.s + dz * b.c;
      if (Math.abs(lx) < b.hw + pad && Math.abs(lz) < b.hd + pad) return true;
    }
    if (!this.inHole(x, z)) for (const e of this.ellipses) { const nx = (x - e.x) / (e.rx + pad), nz = (z - e.z) / (e.rz + pad); if (nx * nx + nz * nz < 1) return true; }
    return false;
  }

  /** Đoạn thẳng a→b đi được không (không xuyên vật, không leo bậc quá cao). */
  segmentClear(ax, az, bx, bz, pad = 0.4) {
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / 0.4));
    let prevG = this.groundAt(ax, az);
    for (let i = 1; i <= n; i++) {
      const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (this.blocked(x, z, pad)) return false;
      const g = this.groundAt(x, z);
      if (g - prevG > STEP_UP) return false;
      prevG = g;
    }
    return true;
  }
  box(x, z, w, d, rot = 0, h = 3, cam = false) {
    this.boxes.push({ x, z, hw: w / 2, hd: d / 2, rot, c: Math.cos(rot), s: Math.sin(rot), h, cam });
  }
  ellipse(x, z, rx, rz) { this.ellipses.push({ x, z, rx, rz }); }
  /** Đoạn thẳng dày (hàng rào) */
  segment(x1, z1, x2, z2, thick = 0.6, h = 1.2) {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const rot = Math.atan2(dx, dz);
    this.box((x1 + x2) / 2, (z1 + z2) / 2, thick, len, rot, h);
  }

  /** Đẩy điểm (p.x,p.z) bán kính r ra khỏi vật cản. */
  resolve(p, r) {
    for (let iter = 0; iter < 2; iter++) {
      for (const c of this.circles) {
        const dx = p.x - c.x, dz = p.z - c.z;
        const rr = c.r + r;
        if (Math.abs(dx) > rr || Math.abs(dz) > rr) continue;
        const d2 = dx * dx + dz * dz;
        if (d2 < rr * rr) {
          const d = Math.sqrt(d2) || 1e-4;
          p.x = c.x + (dx / d) * rr; p.z = c.z + (dz / d) * rr;
        }
      }
      for (const b of this.boxes) {
        const dx = p.x - b.x, dz = p.z - b.z;
        const reach = (b.reach ??= Math.hypot(b.hw, b.hd)) + r;
        if (Math.abs(dx) > reach || Math.abs(dz) > reach) continue;
        // sang hệ toạ độ hộp (local x theo hướng (c,-s), local z theo (s,c))
        const lx = dx * b.c - dz * b.s;
        const lz = dx * b.s + dz * b.c;
        const cx = Math.max(-b.hw, Math.min(b.hw, lx));
        const cz = Math.max(-b.hd, Math.min(b.hd, lz));
        let ox = lx - cx, oz = lz - cz;
        const d2 = ox * ox + oz * oz;
        let nlx = lx, nlz = lz;
        if (d2 > 1e-8) {
          if (d2 >= r * r) continue;
          const d = Math.sqrt(d2);
          nlx = cx + (ox / d) * r; nlz = cz + (oz / d) * r;
        } else {
          // tâm nằm trong hộp: đẩy theo trục gần mép nhất
          const px = b.hw - Math.abs(lx), pz = b.hd - Math.abs(lz);
          if (px < pz) nlx = Math.sign(lx || 1) * (b.hw + r); else nlz = Math.sign(lz || 1) * (b.hd + r);
        }
        // về lại hệ thế giới
        p.x = b.x + nlx * b.c + nlz * b.s;
        p.z = b.z - nlx * b.s + nlz * b.c;
      }
      if (!this.inHole(p.x, p.z)) for (const e of this.ellipses) {
        const nx = (p.x - e.x) / (e.rx + r), nz = (p.z - e.z) / (e.rz + r);
        const k = nx * nx + nz * nz;
        if (k < 1) {
          const s = 1 / Math.sqrt(k || 1e-4);
          p.x = e.x + nx * s * (e.rx + r);
          p.z = e.z + nz * s * (e.rz + r);
        }
      }
    }
    // giới hạn cứng: phải nằm trong hợp các vùng đi lại; ra ngoài thì kéo về điểm gần nhất
    let inside = false;
    for (const q of WALK_RECTS) if (p.x >= q.minX && p.x <= q.maxX && p.z >= q.minZ && p.z <= q.maxZ) { inside = true; break; }
    if (!inside) {
      let bx = p.x, bz = p.z, bd = Infinity;
      for (const q of WALK_RECTS) {
        const cx = Math.max(q.minX + r, Math.min(q.maxX - r, p.x)), cz = Math.max(q.minZ + r, Math.min(q.maxZ - r, p.z));
        const d = (cx - p.x) ** 2 + (cz - p.z) ** 2;
        if (d < bd) { bd = d; bx = cx; bz = cz; }
      }
      p.x = bx; p.z = bz;
    }
  }

  /** Tia từ (ox,oy,oz) theo hướng d (đơn vị) – trả khoảng cách gần nhất chạm hộp chắn camera. */
  /** Khối chỉ chắn camera (tán cây…), không chặn người đi. Hộp thẳng trục theo toạ độ thế giới. */
  camBox(minX, minY, minZ, maxX, maxY, maxZ) {
    (this.camBoxes ||= []).push({ minX, minY, minZ, maxX, maxY, maxZ });
  }

  raycastCam(o, d, maxDist) {
    let best = maxDist;
    for (const b of this.camBoxes || []) {
      const t = slab3(o.x, o.y, o.z, d.x, d.y, d.z, b.minX, b.minY, b.minZ, b.maxX, b.maxY, b.maxZ);
      if (t !== null && t < best) best = t;
    }
    for (const b of this.boxes) {
      if (!b.cam) continue;
      // về hệ hộp
      const dx = o.x - b.x, dz = o.z - b.z;
      const lox = dx * b.c - dz * b.s, loz = dx * b.s + dz * b.c;
      const ldx = d.x * b.c - d.z * b.s, ldz = d.x * b.s + d.z * b.c;
      const t = slab3(lox, o.y, loz, ldx, d.y, ldz, -b.hw, 0, -b.hd, b.hw, b.h, b.hd);
      if (t !== null && t < best) best = t;
    }
    return best;
  }
}

function slab3(ox, oy, oz, dx, dy, dz, minx, miny, minz, maxx, maxy, maxz) {
  let tmin = 0, tmax = Infinity;
  const axes = [[ox, dx, minx, maxx], [oy, dy, miny, maxy], [oz, dz, minz, maxz]];
  for (const [o, d, mn, mx] of axes) {
    if (Math.abs(d) < 1e-8) { if (o < mn || o > mx) return null; continue; }
    let t1 = (mn - o) / d, t2 = (mx - o) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin > 0 ? tmin : null;
}
