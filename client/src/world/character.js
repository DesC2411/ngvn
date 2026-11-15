// Nhân vật học sinh: Kenney Mini Characters (CC0) + tô màu đồng phục + hoạt ảnh tự làm (vái, vẫy, tim, chữ V)
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { nameTagTexture, teacherNameTagTexture } from './textures.js';

export const CHAR_SCALE = 2.0; // mô hình gốc cao ~0.78 → ~1.56 m

const BASES = {
  nam: ['characters/character-male-e.glb', 'characters/character-male-f.glb'],
  nu: ['characters/character-female-e.glb', 'characters/character-female-f.glb'],
};

// Ô màu tự vẽ vào hàng trên cùng (đang đen, không dùng) của colormap 512×512 (16 cột × 4 hàng)
const CELLS = {
  white: [0, '#FAFAF6', '#D9DCE3'],
  navy: [1, '#22386B', '#0F2247'],
  orange: [2, '#F2AE5C', '#D9822A'],
  jacket: [3, '#2A4682', '#15295A'],
  red: [4, '#E23A3A', '#B71E25'],
  shoe: [5, '#3A3A44', '#1E1E26'],
  lightblue: [6, '#E9F1FF', '#C4D3EE'],
  navyMid: [7, '#3A5287', '#2B3F6B'],
  vest: [8, '#1A2E5A', '#0C1C3E'],
};

// Khớp OUTFITS của giao diện (client/src/ui/screens.js): 0 sơ mi trắng, 1 thể thao cam, 2 áo khoác navy viền cam, 3 lễ phục
export const OUTFITS = [
  { name: 'Sơ mi trắng', shirt: 'white', pants: 'navy', scarf: '#D9262E', tri: true },          // + khăn quàng đỏ
  { name: 'Thể thao', shirt: 'orange', pants: 'navy', scarf: null },
  { name: 'Áo khoác', shirt: 'jacket', pants: 'navyMid', scarf: '#E9973B', tri: false },        // viền cổ cam
  { name: 'Lễ phục', shirt: 'vest', pants: 'navy', scarf: '#D9262E', tri: true,                 // vest + cà vạt đỏ (nam)
    nu: { shirt: 'white', pants: 'navy', scarf: '#9AC3F0', tri: false } },                     // áo dài trắng, viền cổ xanh nhạt (nữ)
];

function normLook(look) {
  const gender = look && look.gender === 'nu' ? 'nu' : 'nam';
  let outfit = Number(look && look.outfit);
  if (!Number.isInteger(outfit) || outfit < 0 || outfit > 3) outfit = 0;
  return { gender, outfit };
}

/* ---------- Hoạt ảnh tư thế tự làm (xoay xương) ---------- */
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
function poseClip(name, keys, duration) {
  const bones = new Set();
  keys.forEach((k) => Object.keys(k.b).forEach((b) => bones.add(b)));
  const tracks = [];
  for (const b of bones) {
    const times = [], vals = [];
    for (const k of keys) {
      const r = k.b[b] || [0, 0, 0];
      _q.setFromEuler(_e.set(r[0], r[1], r[2], 'XYZ'));
      times.push(k.t); vals.push(_q.x, _q.y, _q.z, _q.w);
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(`${b}.quaternion`, times, vals));
  }
  // dịch vị trí xương (vd hạ 'root' khi quỳ) – đơn vị mô hình gốc
  const pbones = new Set();
  keys.forEach((k) => k.p && Object.keys(k.p).forEach((b) => pbones.add(b)));
  for (const b of pbones) {
    const times = [], vals = [];
    for (const k of keys) { const v = (k.p && k.p[b]) || [0, 0, 0]; times.push(k.t); vals.push(v[0], v[1], v[2]); }
    tracks.push(new THREE.VectorKeyframeTrack(`${b}.position`, times, vals));
  }
  return new THREE.AnimationClip(name, duration, tracks);
}

const CHAP = { 'arm-left': [-1.25, 0, -0.5], 'arm-right': [-1.25, 0, 0.5] };
// Quỳ gối: hai chân gập ra sau (khối chân nằm ngang), hông hạ xuống, chắp tay trước ngực
const KNEEL_B = { 'leg-left': [1.42, 0, 0.04], 'leg-right': [1.42, 0, -0.04], 'arm-left': [-1.35, 0, -0.55], 'arm-right': [-1.35, 0, 0.55] };
const KNEEL_P = { root: [0, -0.125, 0.03] };
const KNEEL_BOW = { ...KNEEL_B, torso: [0.95, 0, 0], head: [0.3, 0, 0] };
const kneelBowKeys = [
  { t: 0, b: KNEEL_B, p: KNEEL_P },
  { t: 0.55, b: KNEEL_BOW, p: { root: [0, -0.135, 0.06] } },
  { t: 0.85, b: KNEEL_BOW, p: { root: [0, -0.135, 0.06] } },
  { t: 1.45, b: KNEEL_B, p: KNEEL_P },
  { t: 1.6, b: KNEEL_B, p: KNEEL_P },
];

export const CUSTOM_CLIPS = {
  kneel: poseClip('kneel', [
    { t: 0, b: {}, p: { root: [0, 0, 0] } },
    { t: 0.45, b: { 'leg-left': [0.8, 0, 0.04], 'leg-right': [0.8, 0, -0.04], 'arm-left': [-0.7, 0, -0.3], 'arm-right': [-0.7, 0, 0.3], torso: [0.15, 0, 0] }, p: { root: [0, -0.07, 0.02] } },
    { t: 0.9, b: KNEEL_B, p: KNEEL_P },
  ], 0.9),
  kneelidle: poseClip('kneelidle', [
    { t: 0, b: KNEEL_B, p: KNEEL_P },
    { t: 1.2, b: { ...KNEEL_B, torso: [0.04, 0, 0], head: [0.06, 0, 0] }, p: KNEEL_P },
    { t: 2.4, b: KNEEL_B, p: KNEEL_P },
  ], 2.4),
  kneelbow: poseClip('kneelbow', kneelBowKeys, 1.6),
  kneelbowloop: poseClip('kneelbowloop', kneelBowKeys, 1.6),
  bow: poseClip('bow', [
    { t: 0, b: {} },
    { t: 0.35, b: { ...CHAP } },
    { t: 0.9, b: { ...CHAP, torso: [0.55, 0, 0], head: [0.25, 0, 0] } },
    { t: 1.35, b: { ...CHAP, torso: [0.55, 0, 0], head: [0.25, 0, 0] } },
    { t: 1.85, b: { ...CHAP } },
    { t: 2.2, b: {} },
  ], 2.2),
  wave: poseClip('wave', [
    { t: 0, b: { 'arm-right': [0, 0, -2.45], head: [0, 0, 0.08] } },
    { t: 0.25, b: { 'arm-right': [0, 0.2, -2.9], head: [0, 0, 0.12] } },
    { t: 0.5, b: { 'arm-right': [0, 0, -2.45], head: [0, 0, 0.08] } },
    { t: 0.75, b: { 'arm-right': [0, -0.2, -2.9], head: [0, 0, 0.12] } },
    { t: 1.0, b: { 'arm-right': [0, 0, -2.45], head: [0, 0, 0.08] } },
  ], 1.0),
  heart: poseClip('heart', [
    { t: 0, b: { 'arm-left': [0, 0, 2.85], 'arm-right': [0, 0, -2.85], head: [0, 0, 0.1] } },
    { t: 0.6, b: { 'arm-left': [0, 0, 2.95], 'arm-right': [0, 0, -2.95], head: [0, 0, -0.1] } },
    { t: 1.2, b: { 'arm-left': [0, 0, 2.85], 'arm-right': [0, 0, -2.85], head: [0, 0, 0.1] } },
  ], 1.2),
  peace: poseClip('peace', [
    { t: 0, b: { 'arm-right': [-2.3, 0, 0.2], 'arm-left': [0, 0, 0.45], head: [0, 0, 0.15], torso: [0, 0, -0.05] } },
    { t: 0.6, b: { 'arm-right': [-2.4, 0, 0.25], 'arm-left': [0, 0, 0.5], head: [0, 0, 0.2], torso: [0, 0, -0.07] } },
    { t: 1.2, b: { 'arm-right': [-2.3, 0, 0.2], 'arm-left': [0, 0, 0.45], head: [0, 0, 0.15], torso: [0, 0, -0.05] } },
  ], 1.2),
};

const ANIM_MAP = { idle: 'idle', walk: 'walk', run: 'sprint', wave: 'wave', bow: 'bow', heart: 'heart', peace: 'peace' };

export class CharacterFactory {
  constructor(assets) {
    this.assets = assets;
    this.templates = new Map();
    this.atlas = null; // texture colormap đã tô thêm ô đồng phục
  }

  makeAtlas(srcTex) {
    if (this.atlas) return this.atlas;
    const img = srcTex && srcTex.image;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const x = c.getContext('2d');
    if (img) x.drawImage(img, 0, 0, 512, 512);
    for (const [col, top, bot] of Object.values(CELLS)) {
      const g = x.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, top); g.addColorStop(1, bot);
      x.fillStyle = g;
      x.fillRect(col * 32, 0, 32, 128);
    }
    const t = new THREE.CanvasTexture(c);
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestMipmapLinearFilter;
    this.atlas = t;
    return t;
  }

  async loadBase(path) { return this.assets.load(path); }

  async template(look) {
    const { gender, outfit } = normLook(look);
    const path = BASES[gender][outfit % 2];
    const key = `${path}|${outfit}`;
    if (this.templates.has(key)) return this.templates.get(key);
    const p = (async () => {
      const gltf = await this.assets.load(path);
      const scene = SkeletonUtils.clone(gltf.scene);
      scene.updateMatrixWorld(true);
      const of = gender === 'nu' && OUTFITS[outfit].nu ? { ...OUTFITS[outfit], ...OUTFITS[outfit].nu } : OUTFITS[outfit];
      let body = null, head = null;
      scene.traverse((o) => {
        if (o.isSkinnedMesh) {
          if (/head/i.test(o.name)) head = o; else body = o;
          o.castShadow = true; o.receiveShadow = false;
          o.frustumCulled = false;
        }
      });
      if (body && head) {
        const atlas = this.makeAtlas(body.material.map);
        const mat = body.material.clone();
        mat.map = atlas;
        mat.metalness = 0; mat.roughness = 0.8;
        // ô da = ô của khối mặt (≈220 đỉnh) trong head-mesh
        const huv = head.geometry.attributes.uv;
        const hcount = new Map();
        for (let i = 0; i < huv.count; i++) {
          const k = Math.floor(huv.getX(i) * 16) + ',' + Math.floor(huv.getY(i) * 4);
          hcount.set(k, (hcount.get(k) || 0) + 1);
        }
        let skin = null;
        for (const [k, n] of hcount) if (n === 220) skin = k;
        if (!skin) { let best = 0; for (const [k, n] of hcount) if (k.endsWith(',2') && n > best) { best = n; skin = k; } }

        const geo = body.geometry.clone();
        const uv = geo.attributes.uv;
        const pos = geo.attributes.position;
        const si = geo.attributes.skinIndex, sw = geo.attributes.skinWeight;
        const torsoBox = new THREE.Box3();
        for (let i = 0; i < uv.count; i++) {
          const u = uv.getX(i), v = uv.getY(i);
          const col = Math.floor(u * 16), row = Math.floor(v * 4);
          // xương chiếm trọng số lớn nhất
          let bj = si.getX(i), bw = sw.getX(i);
          if (sw.getY(i) > bw) { bw = sw.getY(i); bj = si.getY(i); }
          if (sw.getZ(i) > bw) { bw = sw.getZ(i); bj = si.getZ(i); }
          if (sw.getW(i) > bw) { bw = sw.getW(i); bj = si.getW(i); }
          const boneName = body.skeleton.bones[bj] ? body.skeleton.bones[bj].name : '';
          if (/torso/.test(boneName)) torsoBox.expandByPoint(new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)));
          // tay giữ màu da (bàn tay/tay áo ngắn); thân & chân luôn là đồ đồng phục
          if (`${col},${row}` === skin && !/torso|leg/.test(boneName)) continue;
          let cell = null;
          if (/leg/.test(boneName)) cell = pos.getY(i) < 0.045 ? CELLS.shoe[0] : CELLS[of.pants][0];
          else if (/torso|arm/.test(boneName)) cell = CELLS[of.shirt][0];
          if (cell === null) continue;
          const fu = u * 16 - col, fv = v * 4 - row;
          uv.setXY(i, (cell + Math.min(0.98, Math.max(0.02, fu))) / 16, Math.min(0.98, Math.max(0.02, fv)) / 4);
        }
        uv.needsUpdate = true;
        body.geometry = geo;
        body.material = mat;
        head.material = mat;

        // khăn quàng / nơ gắn vào xương torso
        if (of.scarf && !torsoBox.isEmpty()) {
          const torso = body.skeleton.bones.find((b) => /torso/.test(b.name));
          if (torso) {
            const tp = new THREE.Vector3();
            torso.getWorldPosition(tp);
            const sm = new THREE.MeshStandardMaterial({ color: of.scarf, roughness: 0.7 });
            const tw = torsoBox.max.x - torsoBox.min.x, td = torsoBox.max.z - torsoBox.min.z;
            const band = new THREE.Mesh(new THREE.BoxGeometry(tw * 0.8, 0.02, td + 0.012), sm);
            band.position.set((torsoBox.min.x + torsoBox.max.x) / 2 - tp.x, torsoBox.max.y - 0.012 - tp.y, (torsoBox.min.z + torsoBox.max.z) / 2 - tp.z);
            const shape = new THREE.Shape();
            shape.moveTo(-0.045, 0); shape.lineTo(0.045, 0); shape.lineTo(0.0, -0.07); shape.closePath();
            const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: false }), sm);
            tri.position.set(band.position.x, band.position.y - 0.004, torsoBox.max.z - tp.z + 0.002);
            band.castShadow = tri.castShadow = true;
            torso.add(band);
            if (of.tri !== false) torso.add(tri);
          }
        }
      }
      const clips = [...gltf.animations, ...Object.values(CUSTOM_CLIPS)];
      return { scene, clips };
    })();
    this.templates.set(key, p);
    return p;
  }

  async create(look, { nameTag = null } = {}) {
    const tpl = await this.template(look);
    return new Character(tpl, nameTag, { teacher: !!(look && look.role === 'teacher') });
  }
}

export class Character {
  constructor(tpl, nameTag, { teacher = false } = {}) {
    this.root = new THREE.Group();
    this.teacher = teacher;
    this.model = SkeletonUtils.clone(tpl.scene);
    // thầy cô trông người lớn hơn: cao hơn ~15%, dáng thon hơn một chút
    this.model.scale.set(CHAR_SCALE * (teacher ? 1.1 : 1), CHAR_SCALE * (teacher ? 1.15 : 1), CHAR_SCALE * (teacher ? 1.1 : 1));
    this.root.add(this.model);
    this.mixer = new THREE.AnimationMixer(this.model);
    this.clips = new Map(tpl.clips.map((c) => [c.name, c]));
    this.actions = new Map();
    this.current = null;
    this.currentName = '';
    this.onceDone = null;
    this.mixer.addEventListener('finished', (e) => {
      if (this.onceDone && e.action === this.actions.get(this.currentName)) {
        const cb = this.onceDone; this.onceDone = null; cb();
      }
    });
    if (nameTag) this.setNameTag(nameTag.name, nameTag.cls);
    this.play('idle', 0);
  }

  setNameTag(name, cls) {
    if (this.tag) { this.tag.material.map.dispose(); this.tag.material.dispose(); this.root.remove(this.tag); }
    const t = this.teacher ? teacherNameTagTexture(name) : nameTagTexture(name, cls);
    const mat = new THREE.SpriteMaterial({ map: t.texture, transparent: true, depthWrite: false });
    this.tag = new THREE.Sprite(mat);
    if (this.teacher) { this.tag.scale.set(2.4, 0.525, 1); this.tag.position.y = 2.35; }
    else { this.tag.scale.set(2.0, 0.5, 1); this.tag.position.y = 2.05; }
    this.tag.renderOrder = 10;
    this.root.add(this.tag);
  }

  action(name) {
    const clipName = ANIM_MAP[name] || name;
    if (this.actions.has(clipName)) return this.actions.get(clipName);
    const clip = this.clips.get(clipName);
    if (!clip) return null;
    const a = this.mixer.clipAction(clip);
    if (clipName === 'bow' || clipName === 'jump' || clipName === 'kneel' || clipName === 'kneelbow') { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
    this.actions.set(clipName, a);
    return a;
  }

  /** anim: idle|walk|run|wave|bow|heart|peace */
  play(anim, fade = 0.2, onDone = null, force = false) {
    const clipName = ANIM_MAP[anim] || anim;
    if (clipName === this.currentName && !onDone && !force) return;
    const a = this.action(anim);
    if (!a) return;
    a.reset();
    a.enabled = true;
    a.setEffectiveWeight(1);
    a.setEffectiveTimeScale(1);
    if (this.current && this.current !== a) {
      a.play();
      this.current.crossFadeTo(a, fade, false);
    } else a.fadeIn(fade).play();
    this.current = a;
    this.currentName = clipName;
    this.onceDone = onDone;
  }

  /** Đặt tư thế tĩnh (dùng cho ảnh chụp). */
  pose(anim, t = 0.3) {
    this.mixer.stopAllAction();
    const a = this.action(anim);
    if (!a) return;
    a.reset().play();
    a.time = t;
    a.paused = true;
    this.current = a; this.currentName = ANIM_MAP[anim] || anim;
    this.mixer.update(0);
  }

  setTimeScale(s) { if (this.current) this.current.setEffectiveTimeScale(s); }

  update(dt) { this.mixer.update(dt); }

  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.model);
    if (this.tag) { this.tag.material.map.dispose(); this.tag.material.dispose(); }
    this.root.removeFromParent();
  }
}
