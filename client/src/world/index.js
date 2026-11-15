// Thế giới 3D May Academy – Mùa Tri Ân 20/11
// Hợp đồng: docs/CONTRACT.md mục 5. Mô hình CC0 (Kenney) – xem assets/models/CREDITS.md
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Assets } from './assets.js';
import { preloadLogo, setMaxAnisotropy, softDotTexture, chalkify, loadImage, matTexture } from './textures.js';
import { Colliders, START, STATIC_ZONES, LAKE, GATE, STEP_UP, waypointGraph, SHRINE } from './layout.js';
import { Navigator } from './guide.js';
import { buildCampus, CAMPUS_MODELS } from './campus.js';
import { Garden, GARDEN_MODELS } from './garden.js';
import { buildRealSchool, REAL_MODELS } from './realschool.js';
import { CraneFlock } from './lake.js';
import { Effects } from './effects.js';
import { CharacterFactory } from './character.js';
import { Controls } from './controls.js';
import { PhotoBooth } from './photo.js';
import { Remotes } from './remotes.js';

const WALK = 3.4, RUN = 6.4, PLAYER_R = 0.42;
const SUN_DIR = new THREE.Vector3(-0.72, 0.52, 0.42).normalize();

function detectQuality() {
  const ua = navigator.userAgent || '';
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const high = !mobile && cores >= 4;
  return { mobile, high, maxPR: mobile ? 1.5 : 2, minPR: mobile ? 0.6 : 0.75, shadowSize: high ? 2048 : 1024, shadowExtent: high ? 26 : 18 };
}

export async function createWorld({ container, teachers = [], profile = {}, onProgress = () => {}, onInteract = () => {}, onNearChange = () => {} }) {
  const quality = detectQuality();
  const isTeacher = profile.role === 'teacher' || (profile.look && profile.look.role === 'teacher');
  const look = { gender: 'nam', outfit: 0, ...(profile.look || {}), ...(isTeacher ? { role: 'teacher' } : {}) };

  /* ---------- Renderer, cảnh, camera ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: !quality.mobile, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  let pr = Math.min(window.devicePixelRatio || 1, quality.maxPR);
  renderer.setPixelRatio(pr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%', outline: 'none' });
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#F1CFA2', 48, 170);
  scene.background = new THREE.Color('#F1CFA2');
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 700);

  const hemi = new THREE.HemisphereLight('#FFE6C4', '#6A6A3A', 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFCB8E', 2.7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
  const ext = quality.shadowExtent;
  Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 140 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  // quầng mặt trời chiều
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDotTexture(), color: '#FFC27A', transparent: true, fog: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3 }));
  sunGlow.scale.set(90, 90, 1);
  scene.add(sunGlow);

  /* ---------- Tải mô hình ---------- */
  const assets = new Assets((p) => onProgress(Math.min(0.95, p * 0.95)));
  const fontsReady = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  const paths = [...new Set([...CAMPUS_MODELS, ...GARDEN_MODELS, 'nature/plant_bushDetailed.glb'])];
  const factory = new CharacterFactory(assets);
  const [M] = await Promise.all([assets.loadAll(paths), preloadLogo(), fontsReady, factory.template(look)]);

  /* ---------- Dựng thế giới ---------- */
  const colliders = new Colliders();
  const campus = buildCampus({ scene, M, colliders, quality });
  // ánh phản chiếu nhẹ cho quả châu bóng (chỉ dùng cho vật liệu quả châu)
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const garden = new Garden({ scene, M, colliders, teachers, quality, envMap });
  const cranes = new CraneFlock(scene, LAKE);
  const effects = new Effects(scene, quality);
  effects.setIncense(campus.incensePos);
  campus.water.setSun(SUN_DIR);
  const remotes = new Remotes(scene, factory, { maxVisible: quality.mobile ? 12 : 30, farDist: quality.mobile ? 45 : 60 });
  const nav = new Navigator(scene, colliders, waypointGraph());
  remotes.groundAt = (x, z) => colliders.groundAt(x, z);
  const photo = new PhotoBooth({ renderer, M, backdropTex: campus.backdropTex, factory, profile });

  const player = await factory.create(look, isTeacher ? { nameTag: { name: profile.name || '' } } : {});
  scene.add(player.root);
  const pos = new THREE.Vector3(START.x, 0, START.z);
  let ry = START.ry;
  player.root.position.copy(pos);
  player.root.rotation.y = ry;

  // zone công khai (giữ nguyên object để UI so sánh)
  const zones = [...STATIC_ZONES, ...garden.zones()].map((z) => ({
    ...z, pub: z.teacherId ? { id: z.id, kind: z.kind, label: z.label, teacherId: z.teacherId } : { id: z.id, kind: z.kind, label: z.label },
  }));
  let near = null;
  let debugFreeCam = false;
  let posY = 0;
  // Nhảy: vận tốc đứng + trạng thái đang bay (đỉnh nhảy ≈ JUMP_V²/2G ≈ 0,95 m – đủ nhảy lên sân khấu từ cạnh)
  const JUMP_V = 5.5, GRAVITY = 16;
  let vy = 0, airborne = false;
  let guideId = null;
  let auto = null; // { zone, path, i, resolve, stuckT, lastD, replans }
  const zoneById = new Map(zones.map((z) => [z.id, z]));
  const firedTrees = new Set();

  const controls = new Controls(container, { onInteract: () => world.interact() });
  controls.yaw = 0;
  controls.pitch = 0.2;
  controls.dist = 8.5;

  /* ---------- Trạng thái ---------- */
  let emote = null;        // { anim, until } – vẫy/vái
  let countdownTarget = null;
  let lastLeaderKey = '';
  let lastSigKey = '';
  let disposed = false;

  function setEmote(anim, dur) {
    emote = { anim, until: clock.elapsedTime + dur, start: clock.elapsedTime, queue: 0 };
    player.play(anim, 0.15, null, true);
  }
  // mỗi lần gọi "bow" = một cái vái; gọi liên tiếp thì xếp hàng vái tiếp
  function queueBow() {
    if (prayer) { prayer.queue++; return; }
    if (emote && emote.anim === 'bow' && clock.elapsedTime < emote.until) { emote.queue++; emote.until += 2.2; }
    else setEmote('bow', 2.2);
  }

  /* ---------- Quỳ vái ở Góc Xin Vía ---------- */
  // điểm quỳ: trên bục miếu, giữa lư hương và bậc, quay mặt vào bàn thờ (hướng bắc)
  const KNEEL = { x: SHRINE.x, z: SHRINE.z + 2.05, ry: Math.PI };
  remotes.kneelSpot = KNEEL;
  let prayer = null; // { phase: 'go'|'ready'|'kneel'|'bow'|'knelt', queue, t }
  let mat = null;
  const prayerCamPos = new THREE.Vector3();
  const prayerCamTarget = new THREE.Vector3();
  const prayerLook = new THREE.Vector3();

  function ensureMat() {
    if (mat) return;
    const g = colliders.groundAt(KNEEL.x, KNEEL.z);
    mat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.035, 1.55), new THREE.MeshStandardMaterial({ map: matTexture(), roughness: 0.95 }));
    mat.position.set(KNEEL.x, g + 0.018, KNEEL.z + 0.15);
    mat.receiveShadow = true;
    scene.add(mat);
  }

  function prayerStep(dt) {
    const P = prayer;
    P.t += dt;
    if (P.phase === 'ready' && P.queue > 0) {
      P.queue--; P.phase = 'kneel'; P.t = 0; P.pendingBow = true;
      player.play('kneel', 0.25, null, true);
    } else if (P.phase === 'kneel' && P.t >= 0.9) {
      P.phase = 'bow'; P.t = 0;
      player.play('kneelbow', 0.12, null, true);
    } else if (P.phase === 'bow' && P.t >= 1.6) {
      if (P.queue > 0) { P.queue--; P.t = 0; player.play('kneelbow', 0.05, null, true); }
      else { P.phase = 'knelt'; P.t = 0; player.play('kneelidle', 0.2, null, true); }
    } else if (P.phase === 'knelt' && P.queue > 0) {
      P.queue--; P.phase = 'bow'; P.t = 0;
      player.play('kneelbow', 0.15, null, true);
    }
    return P.phase === 'bow' ? 'bow' : P.phase === 'kneel' || P.phase === 'knelt' ? 'kneel' : 'idle';
  }

  /** Camera nghiêng phía trước-bên phải nhân vật: thấy cả người quỳ + bàn thờ, người nằm ở nửa trên khung */
  function updatePrayerCam(dt) {
    const g = colliders.groundAt(KNEEL.x, KNEEL.z);
    const portrait = camera.aspect < 1;
    // đứng ngoài hàng cột phía đông, lọt giữa hai cột
    // hướng nhìn đi qua khe giữa hai cột phía đông (sát cột trước) → thấy mặt-bên người quỳ, lư hương lệch sang phải
    // nhìn gần như ngang hông (phía đông, chếch bắc nhẹ) + cao hơn → lư hương không che đầu khi cúi rạp
    const dx = 0.42, dz = 0.91;
    const D = portrait ? 6.2 : 5.4;
    prayerCamPos.set(KNEEL.x + dx * D, g + (portrait ? 2.9 : 2.4), KNEEL.z + dz * D);
    // nhìn thấp hơn người → người nằm ở nửa trên khung (nửa dưới dành cho bảng UI)
    prayerCamTarget.set(KNEEL.x + 0.15, g + (portrait ? -0.55 : 0.05), KNEEL.z - 0.35);
    const k = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(prayerCamPos, k);
    prayerLook.lerp(prayerCamTarget, k);
    camera.lookAt(prayerLook);
  }

  /* ---------- Kích thước ---------- */
  function resize() {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // màn hình dọc (điện thoại): mở rộng góc nhìn để thấy hai bên
    camera.fov = camera.aspect < 1 ? Math.min(75, 55 + (1 - camera.aspect) * 30) : 55;
    camera.updateProjectionMatrix();
    const ptScale = (h * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    effects.smoke.material.uniforms.uScale.value = ptScale;
    garden.setPointScale(ptScale);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* ---------- Vòng lặp ---------- */
  const clock = new THREE.Clock();
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  let camDist = controls.dist;
  let zoneTimer = 0, cdTimer = 0;
  let fpsAcc = 0, fpsFrames = 0, goodWindows = 0, shadowsOff = false;
  const tmp = new THREE.Vector3();
  const dirV = new THREE.Vector3();

  /** Di chuyển có kiểm tra độ cao: bước lên ≤ STEP_UP, cao hơn thì coi như tường (trượt theo trục còn lại). */
  function moveBy(dx, dz) {
    const ox = pos.x, oz = pos.z;
    // đang bay thì so với chân nhân vật → nhảy lên được bục cao hơn bậc bước thường
    const ref = airborne ? Math.max(colliders.groundAt(ox, oz), posY) : colliders.groundAt(ox, oz);
    const tryAt = (x, z) => {
      pos.x = x; pos.z = z;
      colliders.resolve(pos, PLAYER_R);
      return colliders.groundAt(pos.x, pos.z) - ref <= STEP_UP;
    };
    if (tryAt(ox + dx, oz + dz)) return;
    if (Math.abs(dx) > 1e-5 && tryAt(ox + dx, oz)) return;
    if (Math.abs(dz) > 1e-5 && tryAt(ox, oz + dz)) return;
    pos.x = ox; pos.z = oz;
  }

  function finishAuto(ok) {
    if (!auto) return;
    const a = auto; auto = null;
    try { a.resolve(ok); } catch { /* bỏ qua */ }
  }

  function autoStep(dt) {
    const a = auto;
    let tgt = a.path[a.i];
    let d = Math.hypot(tgt.x - pos.x, tgt.z - pos.z);
    while (d < (a.i === a.path.length - 1 ? 0.35 : 0.7) && a.i < a.path.length - 1) { a.i++; tgt = a.path[a.i]; d = Math.hypot(tgt.x - pos.x, tgt.z - pos.z); }
    if (a.i === a.path.length - 1 && d < 0.35) return null; // tới nơi
    // kẹt: thử tìm lại đường, cuối cùng nhảy tới điểm mốc kế
    if (d > a.lastD - 0.02 * dt * 60) a.stuckT += dt; else a.stuckT = 0;
    a.lastD = d;
    if (a.stuckT > 1.2) {
      a.stuckT = 0; a.replans++;
      if (a.replans > 2) { pos.x = tgt.x; pos.z = tgt.z; colliders.resolve(pos, PLAYER_R); }
      else { a.path = nav.findPath(pos, { x: a.goal.x, z: a.goal.z }); a.i = 1; }
    }
    return { x: (tgt.x - pos.x) / (d || 1), z: (tgt.z - pos.z) / (d || 1), near: d };
  }

  function updatePlayer(dt) {
    const mv = controls.poll();
    if (prayer && prayer.phase !== 'go') {
      // đang quỳ vái: khoá di chuyển/nhảy, giữ đúng chỗ trên chiếu
      controls.consumeJump();
      pos.x = KNEEL.x; pos.z = KNEEL.z; ry = KNEEL.ry; airborne = false; vy = 0;
      const g0 = colliders.groundAt(pos.x, pos.z);
      posY += (g0 - posY) * Math.min(1, dt * 12);
      pos.y = posY;
      const a = prayerStep(dt);
      player.root.position.copy(pos);
      player.root.rotation.y = ry;
      player.update(dt);
      player.anim = a;
      return;
    }
    const manual = !prayer && Math.abs(mv.x) + Math.abs(mv.y) > 0.05;
    if (manual && auto) finishAuto(false);
    let anim = 'idle';
    let dir = null, speed = 0, run = false, mag = 1;
    if (manual) {
      const sy = Math.sin(controls.yaw), cy = Math.cos(controls.yaw);
      // tiến = từ camera về nhân vật; phải = vuông góc
      const fx = -sy, fz = -cy, rx = cy, rz = -sy;
      const wx = rx * mv.x + fx * mv.y, wz = rz * mv.x + fz * mv.y;
      const l = Math.hypot(wx, wz) || 1;
      dir = { x: wx / l, z: wz / l };
      mag = Math.min(1, Math.hypot(mv.x, mv.y));
      run = mv.run;
      speed = (run ? RUN : WALK) * Math.max(0.35, mag);
    } else if (auto) {
      const st = autoStep(dt);
      if (!st) {
        const z = auto.zone;
        const fx = (z.tx ?? z.x) - pos.x, fz = (z.tz ?? z.z) - pos.z;
        if (Math.hypot(fx, fz) > 0.3) ry = Math.atan2(fx, fz);
        const silent = auto.silent;
        finishAuto(true);
        if (!silent) {
          near = z.pub;
          try { onNearChange(near); } catch (e) { console.error(e); }
        }
      } else {
        dir = st; run = true;
        speed = Math.min(RUN, Math.max(WALK, st.near * 3));
      }
    }
    if (dir) {
      emote = null;
      moveBy(dir.x * speed * dt, dir.z * speed * dt);
      let da = Math.atan2(dir.x, dir.z) - ry; da = Math.atan2(Math.sin(da), Math.cos(da));
      ry += da * Math.min(1, dt * 12);
      anim = run ? 'run' : 'walk';
      if (!airborne) {
        player.play(anim);
        player.setTimeScale(run ? 1 : Math.max(0.6, mag * 1.1));
      }
    } else if (emote && clock.elapsedTime < emote.until) {
      anim = emote.anim;
      if (emote.anim === 'bow' && emote.queue > 0 && clock.elapsedTime - emote.start >= 2.15) {
        emote.queue--; emote.start = clock.elapsedTime;
        player.play('bow', 0.1, null, true);
      }
    } else {
      emote = null;
      if (!airborne) player.play('idle');
    }
    // độ cao: nhảy / bám mặt bục/bậc mượt
    const g = colliders.groundAt(pos.x, pos.z);
    if (controls.consumeJump() && !airborne && Math.abs(posY - g) < 0.12) {
      airborne = true; vy = JUMP_V; emote = null;
      if (auto) finishAuto(false);
      player.play('jump', 0.08, null, true);
    }
    if (airborne) {
      vy -= GRAVITY * dt;
      posY += vy * dt;
      if (posY <= g && vy <= 0) {
        posY = g; vy = 0; airborne = false;
        player.play(anim === 'idle' ? 'idle' : anim, 0.1, null, true);
      } else {
        anim = vy > 0 ? 'jump' : 'fall';
        player.play(anim, 0.12);
      }
    } else {
      posY += (g - posY) * Math.min(1, dt * (g > posY ? 16 : 10));
      if (Math.abs(g - posY) < 0.005) posY = g;
    }
    pos.y = posY;
    player.root.position.copy(pos);
    player.root.rotation.y = ry;
    player.update(dt);
    player.anim = anim;
  }

  function updateCamera(dt) {
    camTarget.set(pos.x, posY + (isTeacher ? 1.5 : 1.35), pos.z);
    const cp = Math.cos(controls.pitch), sp = Math.sin(controls.pitch);
    dirV.set(Math.sin(controls.yaw) * cp, sp, Math.cos(controls.yaw) * cp).normalize();
    const want = controls.dist;
    let hit = debugFreeCam ? want : colliders.raycastCam(camTarget, dirV, want);
    if (dirV.y < 0) hit = Math.min(hit, (camTarget.y - 0.3 - posY) / -dirV.y);
    const allowed = Math.max(1.2, hit - 0.35);
    const goal = Math.min(want, allowed);
    camDist = goal < camDist ? goal + (camDist - goal) * Math.exp(-dt * 25) : goal + (camDist - goal) * Math.exp(-dt * 4);
    camPos.copy(camTarget).addScaledVector(dirV, camDist);
    camera.position.lerp(camPos, 1 - Math.exp(-dt * 14));
    camera.lookAt(camTarget);
  }

  function updateZones() {
    let best = null, bd = Infinity;
    for (const z of zones) {
      const d = Math.hypot(pos.x - z.x, pos.z - z.z);
      if (d < z.r && d / z.r < bd) { bd = d / z.r; best = z; }
    }
    const pub = best ? best.pub : null;
    if (guideId && best && best.id === guideId) world.setGuide(null); // tới nơi → tắt chỉ đường
    if (auto) return; // đang tự đi: báo zone khi tới đích
    if (pub !== near) {
      near = pub;
      if (best && best.kind === 'tree') {
        const tr = garden.get(best.teacherId);
        if (tr && !tr.special && tr.count >= 50 && !firedTrees.has(best.teacherId)) {
          firedTrees.add(best.teacherId);
          effects.fireworks(tr.top, 4);
        }
      }
      try { onNearChange(near); } catch (e) { console.error(e); }
    }
  }

  function updateSun() {
    tmp.set(pos.x, 0, pos.z);
    const texel = (2 * ext) / quality.shadowSize;
    tmp.x = Math.round(tmp.x / texel) * texel;
    tmp.z = Math.round(tmp.z / texel) * texel;
    sun.target.position.copy(tmp);
    sun.position.copy(tmp).addScaledVector(SUN_DIR, 70);
    sunGlow.position.copy(camera.position).addScaledVector(SUN_DIR, 300);
    campus.sky.position.copy(camera.position);
  }

  function adapt(dt) {
    fpsAcc += dt; fpsFrames++;
    if (fpsAcc < 2) return;
    const fps = fpsFrames / fpsAcc;
    fpsAcc = 0; fpsFrames = 0;
    if (document.hidden) return;
    if (fps < 40 && pr > quality.minPR) {
      pr = Math.max(quality.minPR, pr - 0.25);
      renderer.setPixelRatio(pr); resize(); goodWindows = 0;
    } else if (fps < 26 && pr <= quality.minPR && !shadowsOff) {
      shadowsOff = true; sun.castShadow = false;
    } else if (fps > 57) {
      goodWindows++;
      const cap = Math.min(window.devicePixelRatio || 1, quality.maxPR);
      if (goodWindows >= 4 && pr < cap) { pr = Math.min(cap, pr + 0.25); renderer.setPixelRatio(pr); resize(); goodWindows = 0; }
    } else goodWindows = 0;
  }

  const dbg = { frames: 0, dt: 0 };
  function frame() {
    if (disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    dbg.frames++; dbg.dt = dt;
    updatePlayer(dt);
    if (prayer && prayer.phase !== 'go') updatePrayerCam(dt); else updateCamera(dt);
    updateSun();
    zoneTimer -= dt;
    if (zoneTimer <= 0) { zoneTimer = 0.12; updateZones(); }
    cdTimer -= dt;
    if (cdTimer <= 0) {
      const dGate = Math.hypot(pos.x - GATE.x, pos.z - GATE.z);
      cdTimer = dGate < 60 ? 1 : 10;
      campus.countdown.redraw(countdownTarget);
    }
    for (const f of campus.tick) f(t);
    campus.water.update(t);
    cranes.update(t, dt);
    garden.update(t);
    nav.update(t, dt, pos);
    effects.update(t, dt, pos);
    remotes.update(dt, pos);
    renderer.render(scene, camera);
    adapt(dt);
  }
  // khung đầu: camera ngay sau lưng nhân vật
  updateCamera(1); camera.position.copy(camPos);
  renderer.setAnimationLoop(frame);
  onProgress(1);

  // Con đường + Trường MAY thật: dựng sau khi khuôn viên chính đã hiện (không làm chậm lúc vào game)
  setTimeout(async () => {
    if (disposed) return;
    try {
      assets.onProgress = () => {}; // không bật lại màn chờ
      const extra = await assets.loadAll(REAL_MODELS);
      if (disposed) return;
      buildRealSchool({ scene, M: { ...M, ...extra }, colliders, quality });
    } catch (e) { console.error('[world] trường thật', e); }
  }, 500);

  /* ---------- API ---------- */
  const world = {
    applyState(state) {
      if (!state) return;
      try {
        if (Array.isArray(state.teachers)) {
          const crossed = garden.setTeachers(state.teachers);
          crossed.forEach((id, i) => {
            const tr = garden.get(id);
            if (tr && !firedTrees.has(id)) { firedTrees.add(id); setTimeout(() => effects.fireworks(tr.top, 6), i * 1500); }
          });
        }
        if (Array.isArray(state.cranes)) cranes.setCranes(state.cranes);
        if (Array.isArray(state.signatures)) drawSignatures(state.signatures);
        const st = state.stats || {};
        const ed = st.eventDate || (state.config && state.config.eventDate) || null;
        if (ed !== countdownTarget) { countdownTarget = ed; campus.countdown.redraw(ed); }
        const lb = Array.isArray(st.leaderboard) ? st.leaderboard : null;
        if (lb) {
          const key = JSON.stringify(lb);
          if (key !== lastLeaderKey) { lastLeaderKey = key; campus.leader.redraw(lb); }
        }
      } catch (e) { console.error('[world] applyState', e); }
    },

    setInputEnabled(v) { controls.setEnabled(v); },

    /**
     * Góc Xin Vía: đưa nhân vật tới chiếu quỳ trước bàn thờ (gần thì tự đi, xa thì dịch chuyển),
     * quay mặt vào bàn thờ, khoá di chuyển, camera nghiêng phía trước-bên. playEffect('bow') lúc này = quỳ vái.
     */
    startPrayer() {
      // gọi lại khi đang quỳ (vd "Xin môn khác") → giữ nguyên tư thế/camera, trả ngay
      if (prayer) return prayer.done;
      prayer = { phase: 'go', queue: 0, t: 0 };
      prayer.done = this._goPray(prayer);
      return prayer.done;
    },

    async _goPray(P) {
      finishAuto(false);
      emote = null;
      ensureMat();
      remotes.hideNear = { x: KNEEL.x, z: KNEEL.z - 0.5, r: 4.5 };
      remotes.sortTimer = 0;
      const d = Math.hypot(pos.x - KNEEL.x, pos.z - KNEEL.z);
      if (d > 0.5 && d < 25) {
        const zoneLike = { x: KNEEL.x, z: KNEEL.z, tx: KNEEL.x, tz: KNEEL.z - 2, pub: null };
        const goal = { x: KNEEL.x, z: KNEEL.z };
        await new Promise((resolve) => {
          auto = { zone: zoneLike, goal, path: nav.findPath(pos, goal), i: 1, resolve, stuckT: 0, lastD: Infinity, replans: 0, silent: true };
        });
      }
      if (prayer !== P) return false; // đã endPrayer trong lúc đi
      // đặt đúng chỗ quỳ (xa thì dịch chuyển; camera trượt mượt sang góc quỳ)
      pos.x = KNEEL.x; pos.z = KNEEL.z; ry = KNEEL.ry;
      if (d >= 25) posY = colliders.groundAt(KNEEL.x, KNEEL.z);
      prayerLook.set(pos.x, posY + 1, pos.z);
      prayer.phase = 'ready'; prayer.t = 0;
      player.play('idle', 0.2, null, true);
      return true;
    },

    /** Đứng dậy, trả camera và điều khiển như cũ. */
    endPrayer() {
      if (!prayer) return;
      if (prayer.phase === 'go') finishAuto(false);
      prayer = null;
      remotes.hideNear = null;
      remotes.sortTimer = 0;
      player.play('idle', 0.5, null, true);
      // camera thường tiếp nối từ vị trí hiện tại (không giật)
      const off = camera.position.clone().sub(new THREE.Vector3(pos.x, posY + (isTeacher ? 1.5 : 1.35), pos.z));
      const len = off.length() || 6;
      controls.yaw = Math.atan2(off.x, off.z);
      controls.pitch = Math.max(-0.05, Math.min(1.25, Math.asin(off.y / len)));
      controls.dist = Math.max(controls.minDist, Math.min(controls.maxDist, len));
      camDist = controls.dist;
    },

    isPraying() { return !!prayer; },

    playEffect(name, data = {}) {
      data = data || {};
      switch (name) {
        case 'incense': effects.incense(); break;
        case 'bow': queueBow(); break;
        case 'crane': cranes.drop(data.color, campus.craneDrop, campus.water); setEmote('wave', 1.5); break;
        case 'card': {
          const tr = data.teacherId ? garden.get(data.teacherId) : null;
          const to = tr ? tr.center.clone() : new THREE.Vector3(-30, 4, 6);
          effects.card(new THREE.Vector3(pos.x, 1.6, pos.z), to);
          setEmote('wave', 1.2);
          break;
        }
        case 'signature': effects.sparkle(campus.chalkPos, '#F6F1DE', 90); break;
        case 'fireworks': {
          const tr = data.teacherId ? garden.get(data.teacherId) : null;
          effects.fireworks(tr ? tr.top : new THREE.Vector3(pos.x, 0, pos.z - 6), 6);
          break;
        }
        case 'confetti': effects.confetti(new THREE.Vector3(pos.x, 0, pos.z)); break;
        default: break;
      }
    },

    async capturePhoto({ pose = 'wave' } = {}) {
      remotes.setAllVisible(false);
      try {
        const url = await photo.capture({ pose, look, name: profile.name, cls: profile.cls });
        setEmote(pose === 'bow' ? 'bow' : 'wave', 1.6);
        return url;
      } finally { remotes.setAllVisible(true); }
    },

    getPlayerState() {
      return { x: round2(pos.x), z: round2(pos.z), ry: round2(Math.atan2(Math.sin(ry), Math.cos(ry))), anim: player.anim || 'idle' };
    },

    upsertRemote(p) { remotes.upsert(p); },
    removeRemote(id) { remotes.remove(id); },
    clearRemotes() { remotes.clear(); },

    /** Nhảy (phím Space; UI gọi khi bấm nút "Nhảy" trên điện thoại) */
    jump() { controls.requestJump(); },

    /** UI gọi khi bấm nút "Tương tác" (điện thoại). Trả zone hoặc null. */
    interact() {
      if (!near) return null;
      try { onInteract(near); } catch (e) { console.error(e); }
      return near;
    },

    getNearZone() { return near; },

    /** Zone theo id (có x, z; cây có thêm ax/az = điểm đứng trên lối, tx/tz = gốc cây) */
    getZone(id) {
      const z = zoneById.get(id);
      return z ? { ...z.pub, x: z.x, z: z.z, r: z.r, ax: z.ax ?? z.x, az: z.az ?? z.z } : null;
    },

    /** Bật/tắt chỉ đường tới zone: mũi tên vàng trên mặt đất + cột sáng ở đích; tự tắt khi tới nơi. */
    setGuide(id) {
      const z = id ? zoneById.get(id) : null;
      if (!z) { guideId = null; nav.setTarget(null); return false; }
      guideId = id;
      let title = z.label, sub = 'Đi theo mũi tên vàng';
      if (z.kind === 'tree') {
        const tr = garden.get(z.teacherId);
        const own = isTeacher && profile.teacherId === z.teacherId;
        title = own ? `Cây của ${tr ? tr.teacher.title : 'Thầy Cô'}` : tr ? `${tr.teacher.title} ${tr.teacher.name}` : z.label;
        sub = tr ? tr.teacher.tree : sub;
      } else if (z.id === 'secret-box') { title = 'Hòm thư đỏ'; sub = isTeacher ? 'Lời chưa nói gửi riêng Thầy Cô' : 'Gửi lời chưa nói'; }
      nav.setTarget(z, title, sub);
      // đang đứng sẵn ở đó thì tắt luôn
      if (Math.hypot(pos.x - z.x, pos.z - z.z) < z.r) { guideId = null; nav.setTarget(null); }
      return true;
    },

    /** Tự đi theo lối tới zone. Bấm phím/joystick để huỷ (resolve false); tới nơi resolve true. */
    autoWalkTo(id) {
      const z = zoneById.get(id);
      if (!z || prayer) return Promise.resolve(false);
      finishAuto(false);
      const goal = { x: z.ax ?? z.x, z: z.az ?? z.z };
      return new Promise((resolve) => {
        const path = nav.findPath(pos, goal);
        auto = { zone: z, goal, path, i: 1, resolve, stuckT: 0, lastD: Infinity, replans: 0 };
      });
    },

    cancelAutoWalk() { finishAuto(false); },

    /** Chỉ để kiểm thử: chạy mô phỏng di chuyển nhanh (không vẽ) */
    debugStep(seconds = 1) {
      for (let k = 0; k < seconds / 0.05; k++) {
        clock.elapsedTime += 0.05; updatePlayer(0.05); updateZones();
        if (prayer && prayer.phase !== 'go') updatePrayerCam(0.05); else updateCamera(0.05);
      }
      return { x: pos.x, y: posY, z: pos.z, near: near && near.id, auto: !!auto };
    },

    /** Cây của thầy cô: viền sáng vàng nhẹ + lấp lánh + biển nổi "Cây của Thầy/Cô" */
    highlightTree(teacherId) { return garden.highlightTree(teacherId || null); },

    /** Đếm tĩnh toàn cảnh (không theo khung nhìn): số mesh (≈ lệnh vẽ tối đa) + tam giác, tách riêng khu trường thật */
    debugScene() {
      const count = (root) => {
        let meshes = 0, tris = 0;
        root.traverse((o) => {
          if (!(o.isMesh || o.isPoints) || !o.visible) return;
          meshes++;
          if (!o.isMesh) return;
          const g = o.geometry;
          const n = (g.index ? g.index.count : g.attributes.position.count) / 3;
          tris += n * (o.isInstancedMesh ? o.count : 1);
        });
        return { meshes, tris: Math.round(tris) };
      };
      const rs = scene.getObjectByName('real-school');
      return { all: count(scene), real: rs ? count(rs) : null };
    },

    /** Số liệu kiểm tra hiệu năng */
    debugInfo() {
      const r = renderer.info.render, m = renderer.info.memory;
      return { calls: r.calls, triangles: r.triangles, geometries: m.geometries, textures: m.textures, pixelRatio: pr, shadows: sun.castShadow, remotes: remotes.map.size, frames: dbg.frames, dt: dbg.dt, auto: auto ? { i: auto.i, n: auto.path.length, path: auto.path.map((p) => [Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10]), stuck: auto.stuckT, replans: auto.replans } : null };
    },

    /** Đặt góc camera (tuỳ chọn): yaw, pitch (rad), dist (m) */
    setCameraView({ yaw, pitch, dist, free } = {}) {
      if (free !== undefined) debugFreeCam = !!free; // chỉ để chụp ảnh kiểm tra
      if (Number.isFinite(yaw)) controls.yaw = yaw;
      if (Number.isFinite(pitch)) controls.pitch = pitch;
      if (Number.isFinite(dist)) controls.dist = Math.max(controls.minDist, Math.min(60, dist));
    },
    zones() { return zones.map((z) => ({ ...z.pub, x: z.x, z: z.z, r: z.r })); },

    /** Dịch chuyển nhân vật (tuỳ chọn cho UI) */
    teleport(x, z, faceRy) {
      finishAuto(false);
      pos.set(x, 0, z); colliders.resolve(pos, PLAYER_R); posY = colliders.groundAt(pos.x, pos.z);
      if (Number.isFinite(faceRy)) { ry = faceRy; controls.yaw = faceRy + Math.PI; }
    },

    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      controls.dispose();
      remotes.clear();
      photo.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        for (const m of mats) { for (const k of ['map', 'emissiveMap']) if (m[k]) m[k].dispose(); m.dispose(); }
      });
      renderer.dispose();
      canvas.remove();
    },
  };

  /* ---------- Bảng đen: vẽ chữ ký ---------- */
  const chalkCache = new Map();
  async function drawSignatures(list) {
    const sigs = list.slice(0, 500);
    const key = sigs.map((s) => s.id).join(',');
    if (key === lastSigKey) return;
    lastSigKey = key;
    const need = sigs.filter((s) => s.drawingUrl && !chalkCache.has(s.drawingUrl));
    campus.chalk.redraw(sigs, chalkCache);
    if (!need.length) return;
    await Promise.all(need.map(async (s) => {
      const im = await loadImage(s.drawingUrl);
      chalkCache.set(s.drawingUrl, im ? chalkify(im) : null);
    }));
    if (key === lastSigKey) campus.chalk.redraw(sigs, chalkCache);
  }

  return world;
}

function round2(v) { return Math.round(v * 100) / 100; }
