// Vườn Tri Ân: 28 cây (Quaternius Stylized Nature MegaKit – CC0) tô màu thu, đèn nháy quấn tán, ruy băng, đèn lồng,
// bồn đá dưới gốc + 2 cây Đại Thụ ở cuối vườn. Biển tên, quả châu/phong bì, hoa, phát sáng.
import * as THREE from 'three';
import { place, texturedPlane, instanced } from './assets.js';
import { treeSignTexture, giantSignTexture, envelopeTexture, softDotTexture, blossomTexture, goldBadgeTexture, twinkleTexture } from './textures.js';
import { treeSlots, treeLabel } from './layout.js';

const Q = 'quaternius/';
export const GARDEN_MODELS = [
  `${Q}CommonTree_2.gltf`, `${Q}CommonTree_3.gltf`, `${Q}CommonTree_4.gltf`, `${Q}CommonTree_5.gltf`,
  `${Q}Pine_1.gltf`, `${Q}Bush_Common_Flowers.gltf`,
  'town/pillar-wood.glb', 'town/planks.glb', 'graveyard/lantern-candle.glb', 'holiday/lantern-hanging.glb',
  'nature/stone_smallA.glb', 'nature/flower_redA.glb', 'nature/flower_yellowA.glb', 'nature/flower_purpleA.glb',
];
const TREE_KINDS = GARDEN_MODELS.slice(0, 4);
const GIANT_KINDS = { d01: `${Q}Pine_1.gltf`, d02: `${Q}CommonTree_3.gltf` };

// Bảng màu thu: vàng, cam, đỏ là chính, điểm vài cây hồng / tím nhạt
const LEAF_PALETTE = [
  '#F2B33D', '#EE8A2F', '#D9483B', '#F6CB4C', '#E8673A', '#F4A6BD', '#F09C38', '#C93F33',
  '#F7D15A', '#BFA2E0', '#EC7B33', '#E2563C', '#F3BA46', '#F29BB4', '#E9973B', '#D4513A',
  '#F8C94F', '#EF8F3B', '#C9A6E8', '#E35E3B', '#F5C04A', '#EA7436', '#F6A9C0', '#D84A3C',
  '#F4B740', '#EE8434', '#E15A3D', '#F7CF58',
];
const GIANT_LEAF = { d01: '#2E7346', d02: '#F2B53B' }; // Tùng Bách xanh thẫm · Phúc Thọ vàng ruộm
const RIBBON = ['#D7262E', '#F2C14E', '#E9973B', '#C2185B', '#D7262E', '#0F2247'];
const ORN_COLORS = ['#E23A3A', '#E9973B', '#F7C843', '#2F6FD6', '#C04BC9', '#F4F4F4', '#1FA37A', '#FF7AA2'];
const LIGHT_COLORS = ['#FFE6A8', '#FFD27A', '#FFF4D6', '#FFB15A', '#FF8FB0', '#9FD8FF', '#FFE6A8', '#C6FF9F'];

const MAX_ORN = 60, MAX_ORN_GIANT = 250;
const BLOOM_PER = 26, BLOOM_GIANT = 90;
const LIGHTS_PER = 48, LIGHTS_GIANT = 220;

export class Garden {
  constructor({ scene, M, colliders, teachers, quality, envMap = null }) {
    this.scene = scene;
    this.trees = new Map();
    this.slots = treeSlots(teachers);
    this.quality = quality;
    const envTex = envelopeTexture().texture;
    const rnd = mulberry(28);
    const giantCount = this.slots.filter((s) => s.special).length;
    const normalCount = this.slots.length - giantCount;

    /* --- trang trí dùng chung (instanced) --- */
    const totalOrn = normalCount * MAX_ORN + giantCount * MAX_ORN_GIANT;
    this.orbs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 1),
      new THREE.MeshStandardMaterial({ roughness: 0.16, metalness: 0.45, envMap, envMapIntensity: 1.25 }), totalOrn);
    this.envs = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.25), new THREE.MeshStandardMaterial({ map: envTex, side: THREE.DoubleSide, roughness: 0.8 }), totalOrn);
    this.blooms = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshStandardMaterial({ map: blossomTexture(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7, emissive: '#3a1020', emissiveIntensity: 0.15 }),
      normalCount * BLOOM_PER + giantCount * BLOOM_GIANT);
    for (const im of [this.orbs, this.envs, this.blooms]) {
      im.count = 0;
      im.frustumCulled = false;
      im.castShadow = false;
      im.setColorAt(0, new THREE.Color('#ffffff'));
      scene.add(im);
    }
    const halo = new THREE.SpriteMaterial({ map: softDotTexture(), color: '#FFD27A', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.0 });

    const signGroup = new THREE.Group();
    scene.add(signGroup);
    const lanternsLane = [], flowers = [], stones = [], soils = [], bushes = [], hangLanterns = [];
    const ribbonBands = [], ribbonLoops = [], ribbonTails = [];
    const lightPos = [], lightCol = [], lightPhase = [];
    const kindCache = new Map();
    const tmpC = new THREE.Color();

    this.slots.forEach((slot, idx) => {
      const t = slot.teacher;
      const special = slot.special === 'daithu';
      const kind = special ? (GIANT_KINDS[t.id] || `${Q}CommonTree_3.gltf`) : TREE_KINDS[idx % TREE_KINDS.length];
      const gltf = M[kind];
      const info = kindInfo(kindCache, kind, gltf, special);
      const H = special ? 19 : 7.0 + ((idx * 37) % 5) * 0.3;
      const s = H / Math.max(0.5, info.height);
      // đại thụ: tán xoè rộng hơn (giãn ngang), cây thường giữ tỉ lệ
      const sw = s * (special ? 1.45 : 1);
      const ry = rnd() * Math.PI * 2;
      const tree = place(gltf, { x: slot.x, z: slot.z, sx: sw, sy: s, sz: sw, ry });
      // material lá riêng từng cây: màu thu + phát sáng
      const leafColor = special ? (GIANT_LEAF[t.id] || '#F2B53B') : LEAF_PALETTE[idx % LEAF_PALETTE.length];
      const leafMeshes = [];
      tree.traverse((o) => {
        if (o.isMesh && /lea(f|v)/i.test(o.material.name)) {
          o.material = o.material.clone();
          o.material.color = new THREE.Color(leafColor);
          o.castShadow = quality.high || special; // điện thoại: tán cây thường không đổ bóng (đỡ nặng)
          leafMeshes.push(o);
        }
      });
      scene.add(tree);
      tree.updateMatrixWorld(true);
      const M4 = tree.matrixWorld;
      const qRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry);

      const leafBox = info.leafBox.clone().applyMatrix4(M4);
      const trunkR = Math.max(0.12, info.trunkR * sw);
      const planterR = special ? 3.0 : 1.35;
      colliders.circle(slot.x, slot.z, planterR + 0.05);
      // tán lá + thân chắn camera (không cho camera chui vào trong cây)
      colliders.camBox(leafBox.min.x, leafBox.min.y, leafBox.min.z, leafBox.max.x, leafBox.max.y, leafBox.max.z);
      const tw = special ? 1.4 : 0.5;
      colliders.camBox(slot.x - tw, 0, slot.z - tw, slot.x + tw, leafBox.min.y + 0.1, slot.z + tw);
      const c = leafBox.getCenter(new THREE.Vector3());
      const size = leafBox.getSize(new THREE.Vector3());
      const pts = info.pts.map((q) => ({ p: q.p.clone().applyMatrix4(M4), n: q.n.clone().applyQuaternion(qRot) }));

      /* --- biển tên --- */
      const sg = new THREE.Group();
      sg.position.set(slot.sign.x, 0, slot.sign.z);
      sg.rotation.y = slot.sign.ry;
      let st, plate;
      if (special) {
        st = giantSignTexture(t);
        for (const sx of [-1, 1]) sg.add(place(M['town/pillar-wood.glb'], { x: sx * 2.05, sx: 2.8, sy: 3.3, sz: 2.8 }));
        const back = place(M['town/planks.glb'], { y: 2.25, z: -0.08, sx: 4.2, sy: 1.4, sz: 1.95 });
        back.rotation.x = Math.PI / 2;
        sg.add(back);
        plate = texturedPlane(st.texture, 3.9, 1.6);
        plate.position.set(0, 2.25, 0.08);
        sg.add(plate, place(M['graveyard/lantern-candle.glb'], { x: -2.05, y: 3.3, s: 1.6 }), place(M['graveyard/lantern-candle.glb'], { x: 2.05, y: 3.3, s: 1.6 }));
        const plateB = plate.clone(); plateB.rotation.y = Math.PI; plateB.position.z = -0.14;
        sg.add(plateB);
        colliders.box(slot.sign.x, slot.sign.z, 4.4, 0.45, slot.sign.ry, 3.4, true);
      } else {
        st = treeSignTexture(t);
        for (const sx of [-1, 1]) sg.add(place(M['town/pillar-wood.glb'], { x: sx * 0.95, sx: 1.8, sy: 1.95, sz: 1.8 }));
        const back = place(M['town/planks.glb'], { y: 1.45, z: -0.07, sx: 1.95, sy: 1.2, sz: 1.0 });
        back.rotation.x = Math.PI / 2;
        sg.add(back);
        plate = texturedPlane(st.texture, 1.62, 0.91);
        plate.position.set(0, 1.45, 0.06);
        sg.add(plate);
        const plateB = plate.clone(); plateB.rotation.y = Math.PI; plateB.position.z = -0.12;
        sg.add(plateB);
        colliders.box(slot.sign.x, slot.sign.z, 2.1, 0.35, slot.sign.ry, 2.2, true); // chắn camera: không để biển che khung hình
      }
      signGroup.add(sg);

      const glow = new THREE.Sprite(halo.clone());
      glow.position.copy(c).add(new THREE.Vector3(0, 0.3, 0));
      glow.scale.set(size.x * 2.2, size.y * 2.0, 1);
      glow.visible = false;
      scene.add(glow);

      /* --- bồn đá + hoa dưới gốc --- */
      const nStone = special ? 22 : 12;
      for (let k = 0; k < nStone; k++) {
        const a = (k / nStone) * Math.PI * 2 + idx;
        stones.push({ x: slot.x + Math.cos(a) * planterR, z: slot.z + Math.sin(a) * planterR, ry: a * 3, s: special ? 3.0 : 1.6 });
      }
      soils.push({ x: slot.x, y: 0.035, z: slot.z, s: planterR - 0.05 });
      const nFl = special ? 14 : 6;
      for (let k = 0; k < nFl; k++) {
        const a = (k / nFl) * Math.PI * 2 + 0.3;
        const rr = trunkR + 0.35 + ((k * 7) % 3) * (special ? 0.45 : 0.18);
        flowers.push({ x: slot.x + Math.cos(a) * rr, z: slot.z + Math.sin(a) * rr, s: special ? 3.4 : 2.6, ry: a, k: (k + idx) % 3 });
      }
      if (quality.high || special) {
        const a0 = rnd() * Math.PI * 2;
        const nb = special ? 4 : 1;
        for (let k = 0; k < nb; k++) {
          const a = a0 + (k / nb) * Math.PI * 2;
          const rr = planterR * 0.62;
          bushes.push({ x: slot.x + Math.cos(a) * rr, z: slot.z + Math.sin(a) * rr, ry: a, s: special ? 0.75 : 0.42 });
        }
      }
      if (!special && idx % 3 === 0) lanternsLane.push({ x: slot.sign.x + Math.cos(slot.sign.ry) * 1.6, z: slot.sign.z - Math.sin(slot.sign.ry) * 1.6, s: 2 });

      /* --- ruy băng + nơ quấn thân, quay về phía lối đi --- */
      const toLane = Math.atan2(slot.approach.x - slot.x, slot.approach.z - slot.z);
      const bandY = special ? 2.4 : 1.45;
      const bandR = info.trunkRAt(bandY / s) * sw + 0.03;
      const rc = special ? '#D7262E' : RIBBON[idx % RIBBON.length];
      ribbonBands.push({ x: slot.x, y: bandY, z: slot.z, sx: bandR, sy: special ? 0.42 : 0.2, sz: bandR, c: rc });
      const fx = Math.sin(toLane), fz = Math.cos(toLane);
      const bs = special ? 2.6 : 1;
      for (const side of [-1, 1]) {
        ribbonLoops.push({ x: slot.x + fx * (bandR + 0.02) + Math.cos(toLane) * side * 0.1 * bs, y: bandY + 0.02 * bs, z: slot.z + fz * (bandR + 0.02) - Math.sin(toLane) * side * 0.1 * bs, ry: toLane, rz: side * 0.55, s: bs, c: rc });
        ribbonTails.push({ x: slot.x + fx * (bandR + 0.03) + Math.cos(toLane) * side * 0.05 * bs, y: bandY - 0.15 * bs, z: slot.z + fz * (bandR + 0.03) - Math.sin(toLane) * side * 0.05 * bs, ry: toLane, rz: side * 0.35, s: bs, c: rc });
      }

      /* --- đèn lồng nhỏ treo dưới tán --- */
      const hangN = special ? 8 : 2;
      const lowPts = pts.filter((q) => q.p.y < leafBox.min.y + size.y * 0.45 && q.p.y > 2.4).sort((a, b) => a.p.y - b.p.y);
      for (let k = 0; k < hangN && lowPts.length; k++) {
        const q = lowPts[Math.floor((k + 0.5) * lowPts.length / hangN) % lowPts.length];
        hangLanterns.push({ x: q.p.x, y: q.p.y - 0.05, z: q.p.z, ry: k, s: special ? 1.7 : 1.05 });
      }

      /* --- đèn nháy quấn tán --- */
      for (const lp of info.spiral) {
        const w = lp.clone().applyMatrix4(M4);
        lightPos.push(w.x, w.y, w.z);
        tmpC.set(LIGHT_COLORS[(lightPhase.length * 7 + idx) % LIGHT_COLORS.length]);
        lightCol.push(tmpC.r, tmpC.g, tmpC.b);
        lightPhase.push(rnd() * 6.283);
      }

      this.trees.set(t.id, {
        teacher: t, slot, special, tree, leafMeshes, leafColor, pts, sign: st, signGroup: sg, plate, glow, idx,
        center: c, top: new THREE.Vector3(slot.x, leafBox.max.y, slot.z),
        count: -1, reply: null, bloom: false, lit: false, orbM: [], orbC: [], envM: [], bloomM: [], bloomC: [],
        zone: special
          ? { id: `tree:${t.id}`, kind: 'tree', label: treeLabel(t), teacherId: t.id, x: slot.sign.x + 1.4, z: slot.sign.z, r: 4.6, ax: slot.approach.x, az: slot.approach.z, tx: slot.x, tz: slot.z }
          : { id: `tree:${t.id}`, kind: 'tree', label: treeLabel(t), teacherId: t.id, x: slot.sign.x, z: slot.sign.z, r: 3.6, ax: slot.approach.x, az: slot.approach.z, tx: slot.x, tz: slot.z },
      });
    });

    /* --- gom instanced --- */
    const add = (o) => { scene.add(o); return o; };
    const stoneTint = new THREE.Color('#B8A389');
    add(instanced(M['nature/stone_smallA.glb'], stones, { shadow: false, colorFn: () => stoneTint }));
    add(instanced(M['nature/flower_redA.glb'], flowers.filter((f) => f.k === 0), { shadow: false }));
    add(instanced(M['nature/flower_yellowA.glb'], flowers.filter((f) => f.k === 1), { shadow: false }));
    add(instanced(M['nature/flower_purpleA.glb'], flowers.filter((f) => f.k === 2), { shadow: false }));
    add(instanced(M[`${Q}Bush_Common_Flowers.gltf`], bushes, { shadow: false }));
    add(instanced(M['graveyard/lantern-candle.glb'], lanternsLane));
    lanternsLane.forEach((l) => colliders.circle(l.x, l.z, 0.3));
    add(instanced(M['holiday/lantern-hanging.glb'], hangLanterns, { shadow: false }));
    // đất trong bồn
    const soil = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#6B4A2E' }), soils.length);
    soils.forEach((sd, i) => soil.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(sd.x, sd.y, sd.z), new THREE.Quaternion(), new THREE.Vector3(sd.s, 1, sd.s))));
    soil.receiveShadow = true;
    add(soil);
    // ruy băng
    const ribMat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1, side: THREE.DoubleSide });
    const mkInst = (geo, list, fn) => {
      const im = new THREE.InstancedMesh(geo, ribMat, list.length);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      list.forEach((r, i) => { fn(r, m4, q, e); im.setMatrixAt(i, m4); im.setColorAt(i, tmpC.set(r.c)); });
      im.castShadow = true;
      im.computeBoundingSphere();
      return add(im);
    };
    mkInst(new THREE.CylinderGeometry(1, 1, 1, 18, 1, true), ribbonBands, (r, m4, q) => m4.compose(new THREE.Vector3(r.x, r.y, r.z), q.identity(), new THREE.Vector3(r.sx, r.sy, r.sz)));
    const loopGeo = new THREE.TorusGeometry(0.1, 0.028, 6, 14);
    loopGeo.translate(0.1, 0, 0);
    mkInst(loopGeo, ribbonLoops, (r, m4, q, e) => {
      q.setFromEuler(e.set(0, r.ry + (r.rz > 0 ? 0 : Math.PI), Math.abs(r.rz), 'YXZ'));
      m4.compose(new THREE.Vector3(r.x, r.y, r.z), q, new THREE.Vector3(r.s, r.s * 0.8, r.s * 0.6));
    });
    const tailGeo = new THREE.PlaneGeometry(0.07, 0.3);
    mkInst(tailGeo, ribbonTails, (r, m4, q, e) => {
      q.setFromEuler(e.set(0, r.ry, r.rz, 'YXZ'));
      m4.compose(new THREE.Vector3(r.x, r.y, r.z), q, new THREE.Vector3(r.s, r.s, r.s));
    });

    /* --- đèn nháy (1 lệnh vẽ cho cả vườn) --- */
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lightPos, 3));
    lg.setAttribute('color', new THREE.Float32BufferAttribute(lightCol, 3));
    lg.setAttribute('phase', new THREE.Float32BufferAttribute(lightPhase, 1));
    this.lights = new THREE.Points(lg, new THREE.ShaderMaterial({
      uniforms: { uTex: { value: twinkleTexture() }, uTime: { value: 0 }, uScale: { value: 400 }, uSize: { value: 0.16 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: /* glsl */`
        attribute float phase;
        varying vec3 vC; varying float vA;
        uniform float uTime, uScale, uSize;
        void main() {
          vC = color;
          float tw = 0.55 + 0.45 * sin(uTime * 2.6 + phase) * sin(uTime * 1.3 + phase * 1.7);
          vA = clamp(tw, 0.15, 1.0);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * (0.7 + 0.6 * vA) * uScale / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uTex; varying vec3 vC; varying float vA;
        void main() { vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vC * (0.9 + vA), t.a * vA); }`,
    }));
    this.lights.frustumCulled = false;
    this.lights.renderOrder = 3;
    scene.add(this.lights);

    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3();
    this._c = new THREE.Color();
    this.time = 0;
  }

  /** Hệ số kích thước điểm sáng theo chiều cao khung hình (gọi khi đổi cỡ). */
  setPointScale(v) { this.lights.material.uniforms.uScale.value = v; }

  zones() { return [...this.trees.values()].map((t) => t.zone); }

  /** Cập nhật số thiệp. Trả về danh sách id cây vừa vượt mốc 50 trong phiên (để bắn pháo hoa). */
  setTeachers(teachers) {
    const crossed = [];
    for (const t of teachers || []) {
      const tr = this.trees.get(t.id);
      if (!tr) continue;
      const n = Math.max(0, Number(t.cardCount) || 0);
      const reply = t.reply || null;
      if (n !== tr.count || reply !== tr.reply) {
        // lần nhận dữ liệu đầu (count = -1) không tính là vượt mốc → đại thụ có sẵn thiệp seed không bắn pháo hoa lúc vào
        if (tr.count >= 0 && tr.count < 50 && n >= 50) crossed.push(t.id);
        tr.count = n; tr.reply = reply;
        tr.sign.redraw(n, reply);
        this._layout(tr);
      }
    }
    this._rebuild();
    return crossed;
  }

  /** Ghi liền mạch mọi quả châu/phong bì/hoa, đặt count = số đang hiện (không vẽ thừa). */
  _rebuild() {
    let no = 0, ne = 0, nb = 0;
    for (const tr of this.trees.values()) {
      for (let i = 0; i < tr.orbM.length; i++) { this.orbs.setMatrixAt(no, tr.orbM[i]); this.orbs.setColorAt(no, tr.orbC[i]); no++; }
      for (const m of tr.envM) this.envs.setMatrixAt(ne++, m);
      for (let i = 0; i < tr.bloomM.length; i++) { this.blooms.setMatrixAt(nb, tr.bloomM[i]); this.blooms.setColorAt(nb, tr.bloomC[i]); nb++; }
    }
    this.orbs.count = no; this.envs.count = ne; this.blooms.count = nb;
    for (const im of [this.orbs, this.envs, this.blooms]) {
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
  }

  _layout(tr) {
    const maxOrn = tr.special ? MAX_ORN_GIANT : MAX_ORN;
    const shown = Math.min(maxOrn, tr.count);
    const up = new THREE.Vector3(0, 1, 0);
    const np = Math.max(1, tr.pts.length);
    const step = np % 7 === 0 ? 11 : 7;
    tr.orbM = []; tr.orbC = []; tr.envM = []; tr.bloomM = []; tr.bloomC = [];
    const big = tr.special ? 1.6 : 1;
    for (let i = 0; i < shown; i++) {
      const pt = tr.pts[(i * step) % np];
      if (!pt) break;
      // khi số thiệp vượt số điểm trên tán, lệch nhẹ để không chồng nhau
      const jitter = Math.floor((i * step) / np) * 0.12;
      if (i % 2 === 0) {
        // phong bì quay ra ngoài theo pháp tuyến, hơi nghiêng
        const n = pt.n.clone(); n.y *= 0.3; n.normalize();
        this._q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
        this._q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), ((i * 37) % 9 - 4) * 0.08));
        const p = pt.p.clone().addScaledVector(up, -jitter).addScaledVector(n, jitter * 0.5);
        tr.envM.push(new THREE.Matrix4().compose(p, this._q, this._s.set(big, big, big)));
      } else {
        this._q.identity();
        const sc = (0.95 + ((i * 13) % 5) * 0.09) * big;
        tr.orbM.push(new THREE.Matrix4().compose(this._v.copy(pt.p).addScaledVector(up, -0.08 - jitter), this._q, this._s.set(sc, sc, sc)));
        tr.orbC.push(new THREE.Color(ORN_COLORS[(i * 3 + tr.idx) % ORN_COLORS.length]));
      }
    }
    // hoa (≥10; đại thụ luôn ra hoa)
    const bloom = tr.special || tr.count >= 10;
    const bn = tr.special ? BLOOM_GIANT : BLOOM_PER;
    for (let i = 0; bloom && i < bn; i++) {
      const pt = tr.pts[(i * 5 + 3) % np];
      if (!pt) break;
      const sc = (0.8 + ((i * 11) % 7) * 0.08) * big;
      this._q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pt.n);
      this._q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), i * 1.3));
      tr.bloomM.push(new THREE.Matrix4().compose(this._v.copy(pt.p).addScaledVector(pt.n, 0.03), this._q, this._s.set(sc, sc, sc)));
      tr.bloomC.push(new THREE.Color(i % 3 === 0 ? '#FFFFFF' : i % 3 === 1 ? '#FFD6E4' : '#FFB0C8'));
    }
    tr.bloom = bloom;
    // phát sáng (≥30; đại thụ luôn sáng)
    tr.lit = tr.special || tr.count >= 30;
    tr.glow.visible = tr.lit;
    for (const m of tr.leafMeshes) {
      m.material.emissive = new THREE.Color(tr.lit ? '#FFB347' : '#000000');
      m.material.emissiveIntensity = tr.lit ? 0.16 : 0;
    }
  }

  get(id) { return this.trees.get(id); }

  /** Làm nổi bật cây của thầy cô: tán lá viền vàng nhẹ, lấp lánh, biển tên sáng + biển nổi "Cây của Thầy/Cô". */
  highlightTree(id) {
    const prev = this.hl;
    if (prev) {
      prev.tr.hl = false;
      this.scene.remove(prev.sparks, prev.badge);
      prev.sparks.geometry.dispose(); prev.sparks.material.dispose();
      prev.badge.material.map.dispose(); prev.badge.material.dispose();
      prev.tr.plate.material.emissiveIntensity = 0;
      if (!prev.tr.lit) for (const m of prev.tr.leafMeshes) { m.material.emissive = new THREE.Color('#000000'); m.material.emissiveIntensity = 0; }
      this.hl = null;
    }
    const tr = id ? this.trees.get(id) : null;
    if (!tr) return false;
    tr.hl = true;
    const n = 46;
    const pos = new Float32Array(n * 3);
    const seeds = [];
    for (let i = 0; i < n; i++) {
      const pt = tr.pts[(i * 11 + 5) % Math.max(1, tr.pts.length)];
      const p = pt ? pt.p.clone().addScaledVector(pt.n, 0.25) : tr.center.clone();
      seeds.push({ p, ph: Math.random() * 6.28 });
      pos.set([p.x, p.y, p.z], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const sparks = new THREE.Points(geo, new THREE.PointsMaterial({ map: softDotTexture(), color: '#FFE08A', size: 0.42, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sparks.frustumCulled = false;
    const t = tr.teacher;
    const badgeTex = goldBadgeTexture(`Cây của ${t.title || 'Thầy Cô'}`, t.tree || '');
    const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex.texture, transparent: true, depthWrite: false }));
    badge.scale.set(2.6, 0.81, 1);
    const by = tr.special ? 4.6 : 3.1;
    badge.position.set(tr.slot.sign.x, by, tr.slot.sign.z);
    badge.renderOrder = 11;
    this.scene.add(sparks, badge);
    tr.plate.material.emissive = new THREE.Color('#ffffff');
    tr.plate.material.emissiveMap = tr.plate.material.map;
    tr.plate.material.needsUpdate = true;
    this.hl = { tr, sparks, seeds, badge, by };
    return true;
  }

  update(t) {
    this.lights.material.uniforms.uTime.value = t;
    const h = this.hl;
    if (h) {
      const k = 0.5 + 0.5 * Math.sin(t * 2.2);
      const pa = h.sparks.geometry.attributes.position;
      h.seeds.forEach((sd, i) => {
        pa.setXYZ(i, sd.p.x + Math.sin(t * 0.8 + sd.ph) * 0.15, sd.p.y + ((t * 0.25 + sd.ph) % 1) * 0.6, sd.p.z + Math.cos(t * 0.7 + sd.ph) * 0.15);
      });
      pa.needsUpdate = true;
      h.sparks.material.opacity = 0.55 + 0.45 * k;
      h.badge.position.y = h.by + Math.sin(t * 2) * 0.08;
      h.tr.plate.material.emissiveIntensity = 0.18 + 0.12 * k;
      if (!h.tr.lit) for (const m of h.tr.leafMeshes) { m.material.emissive.set('#FFC24A'); m.material.emissiveIntensity = 0.08 + 0.1 * k; }
    }
    for (const tr of this.trees.values()) {
      if (!tr.lit) continue;
      const k = 0.5 + 0.5 * Math.sin(t * 1.6 + tr.idx);
      tr.glow.material.opacity = (tr.special ? 0.22 : 0.15) + k * 0.14;
      for (const m of tr.leafMeshes) m.material.emissiveIntensity = 0.1 + k * 0.1;
    }
  }
}

/**
 * Tính một lần cho mỗi loại mô hình (toạ độ cục bộ, chưa scale): hộp tán lá, điểm trên tán (để treo thiệp),
 * đường xoắn đèn nháy, bán kính thân cây theo độ cao.
 */
function kindInfo(cache, key, gltf, special) {
  const ck = key + (special ? '#g' : '');
  if (cache.has(ck)) return cache.get(ck);
  const root = gltf.scene;
  root.updateMatrixWorld(true);
  const leaves = [], barks = [];
  root.traverse((o) => { if (o.isMesh) (/lea(f|v)/i.test(o.material.name) ? leaves : barks).push(o); });
  const all = new THREE.Box3().setFromObject(root);
  const leafBox = new THREE.Box3();
  leaves.forEach((m) => leafBox.expandByObject(m));
  if (leafBox.isEmpty()) leafBox.copy(all);
  const c = leafBox.getCenter(new THREE.Vector3());
  const size = leafBox.getSize(new THREE.Vector3());
  const rnd = mulberry(key.length * 97 + (special ? 7 : 0));
  const ray = new THREE.Raycaster();
  const height = all.max.y;
  const minY = height * 0.26;
  // điểm trên tán
  const want = special ? 420 : 130;
  const pts = [];
  const r0 = Math.max(size.x, size.y, size.z) * 1.2;
  for (let k = 0; k < want * 3 && pts.length < want; k++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2;
    const dir = new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(th), u * 0.8 - 0.15, Math.sqrt(1 - u * u) * Math.sin(th)).normalize();
    const o = c.clone().addScaledVector(dir, r0);
    ray.set(o, dir.clone().negate());
    const hit = ray.intersectObjects(leaves, false)[0];
    if (hit && hit.point.y > minY) pts.push({ p: hit.point.clone().addScaledVector(dir, size.y * 0.008), n: dir.clone() });
  }
  // đèn nháy xoắn quanh tán (tia ngang từ ngoài vào trục cây)
  const nL = special ? LIGHTS_GIANT : LIGHTS_PER;
  const spiral = [];
  const turns = special ? 5.5 : 3.2;
  for (let i = 0; i < nL; i++) {
    const t = (i + 0.5) / nL;
    const y = leafBox.min.y + size.y * (0.12 + 0.76 * t);
    const a = t * Math.PI * 2 * turns;
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const o = new THREE.Vector3(c.x, y, c.z).addScaledVector(dir, r0);
    ray.set(o, dir.clone().negate());
    const hit = ray.intersectObjects(leaves, false)[0];
    if (hit) spiral.push(hit.point.clone().addScaledVector(dir, size.x * 0.012));
  }
  // bán kính thân theo độ cao (tia ngang 4 hướng vào thân)
  const trunkRAt = (y) => {
    let sum = 0, n = 0;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const o = new THREE.Vector3(0, y, 0).addScaledVector(dir, size.x);
      ray.set(o, dir.clone().negate());
      const hit = ray.intersectObjects(barks, false)[0];
      if (hit) { sum += Math.hypot(hit.point.x, hit.point.z); n++; }
    }
    return n ? sum / n : height * 0.03;
  };
  const info = { leafBox, pts, spiral, height, trunkR: trunkRAt(height * 0.12), trunkRAt };
  cache.set(ck, info);
  return info;
}

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
