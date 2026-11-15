// Trang thử riêng cho thế giới 3D (dữ liệu giả, không cần server)
import { createWorld } from './index.js';
import teachersRaw from '../../../data/teachers.json';

const $ = (s) => document.querySelector(s);
const log = (m) => { const d = $('#log'); d.textContent = `${new Date().toLocaleTimeString()} ${m}\n` + d.textContent; };

const params = new URLSearchParams(location.search);
window.addEventListener('error', (e) => log('LỖI ' + e.message));
window.addEventListener('unhandledrejection', (e) => log('LỖI promise ' + (e.reason && e.reason.message)));
const origErr = console.error; console.error = (...a) => { log('console.error ' + a.map(String).join(' ')); origErr(...a); };
// ?teacher=t23 → chế độ thầy cô (CONTRACT mục 6)
const tId = params.get('teacher');
const tRec = tId ? teachersRaw.find((t) => t.id === tId) : null;
const profile = tRec ? {
  role: 'teacher', teacherId: tRec.id, token: 'thu', name: `${tRec.title} ${tRec.name}`, cls: '',
  look: { gender: tRec.title === 'Cô' ? 'nu' : 'nam', outfit: 3, role: 'teacher' },
} : {
  role: 'student',
  name: params.get('name') || 'Minh Anh',
  cls: params.get('cls') || '8A1',
  look: { gender: params.get('g') === 'nu' ? 'nu' : 'nam', outfit: Number(params.get('o') || 0) },
};

let counts = teachersRaw.map((t, i) => (i * 7) % 23);
const fakeCranes = Array.from({ length: 60 }, (_, i) => ({ id: 'c' + i, from: 'HS', cls: '7A', message: 'Cảm ơn thầy cô', color: ['#ffffff', '#FFB3C1', '#FFD166', '#9AD1FF', '#E9973B'][i % 5], createdAt: new Date(Date.now() - i * 60000).toISOString() }));
const fakeSigs = Array.from({ length: 64 }, (_, i) => ({ id: 's' + i, name: ['Lan', 'Huy', 'Ngọc Ánh', 'Đức', 'Thảo My', 'Quân', 'Bảo Ngọc', 'Tuấn'][i % 8], cls: ['6A', '7B', '8A1', '9C', '10A2', '11B', '12A'][i % 7], drawingUrl: null, createdAt: '' }));

function state() {
  return {
    config: { eventDate: '2026-11-20T07:00:00+07:00' },
    teachers: teachersRaw.map((t, i) => ({ ...t, reply: i % 9 === 0 ? 'Cảm ơn các con!' : null, cardCount: t.special ? 45 + counts[i] : counts[i], hasQuiz: false })),
    stats: {
      eventDate: '2026-11-20T07:00:00+07:00',
      leaderboard: [
        { cls: '8A1', score: 128, cards: 60, cranes: 40, signatures: 28 },
        { cls: '10A2', score: 97, cards: 40, cranes: 30, signatures: 27 },
        { cls: '7B', score: 75, cards: 30, cranes: 25, signatures: 20 },
        { cls: '12A', score: 61, cards: 20, cranes: 21, signatures: 20 },
        { cls: '6A', score: 40, cards: 12, cranes: 18, signatures: 10 },
      ],
    },
    cranes: fakeCranes,
    signatures: fakeSigs,
  };
}

async function main() {
const t0 = performance.now();
const world = await createWorld({
  container: $('#scene'),
  teachers: teachersRaw.map((t) => ({ ...t, cardCount: 0, reply: null })),
  profile,
  onProgress: (p) => { $('#pct').textContent = Math.round(p * 100) + '%'; },
  onInteract: (z) => log('Tương tác: ' + z.label),
  onNearChange: (z) => {
    const b = $('#zone');
    if (z) { b.textContent = z.label; b.style.display = 'block'; } else b.style.display = 'none';
  },
});
window.world = world;
$('#load').style.display = 'none';
log(`Sẵn sàng sau ${Math.round(performance.now() - t0)} ms`);
world.applyState(state());
setTimeout(() => log('Hiệu năng: ' + JSON.stringify(world.debugInfo())), 1500);
if (params.get('perf')) setInterval(() => { const d = world.debugInfo(); log(`perf ${JSON.stringify(world.debugScene())}`); }, 2000);
$('#zone').onclick = () => world.interact();
if (profile.role === 'teacher') { world.highlightTree(profile.teacherId); world.setGuide('tree:' + profile.teacherId); }
const zid = (k) => (k === 'tree' ? 'tree:' + (profile.teacherId || 't23') : k);
document.querySelectorAll('[data-guide]').forEach((b) => b.onclick = () => { world.setGuide(b.dataset.guide ? zid(b.dataset.guide) : null); log('Chỉ đường ' + (b.dataset.guide || 'tắt')); });
document.querySelectorAll('[data-auto]').forEach((b) => b.onclick = async () => { log('Tự đi ' + b.dataset.auto); const ok = await world.autoWalkTo(zid(b.dataset.auto)); log('Tự đi xong: ' + ok); });
if (params.get('auto')) world.autoWalkTo(params.get('auto')).then((ok) => log('Tự đi xong: ' + ok));
if (params.get('guide')) world.setGuide(params.get('guide'));
if (params.get('simall')) {
  (async () => {
    const out = [];
    for (const id of ['real-gate', 'tree:d01', 'tree:d02', 'tree:t23', 'secret-box', 'shrine', 'crane-lake', 'photo-stage', 'chalkboard', 'tree:t01', 'tree:t18', 'tree:t28', 'leaderboard', 'quiz-board', 'gate']) {
      const p = world.autoWalkTo(id);
      let r = null;
      for (let k = 0; k < 60 && (r = world.debugStep(1)).auto; k++);
      world.cancelAutoWalk();
      const ok = await p;
      out.push(`${id}:${ok}@${r.x.toFixed(1)},${r.z.toFixed(1)} y${r.y.toFixed(2)} near=${r.near}`);
    }
    log(out.join(' | '));
  })();
}
if (params.get('nopanel')) $('#panel').style.display = 'none';
const prayFlow = async () => {
  if (params.get('bar')) $('#uibar').style.display = 'block';
  log('startPrayer…');
  await world.startPrayer();
  log('Đã tới chiếu, thắp hương + vái ×3');
  world.playEffect('incense');
  world.playEffect('bow'); world.playEffect('bow'); world.playEffect('bow');
  if (params.get('adv')) world.debugStep(Number(params.get('adv')));
  if (params.get('again')) { await world.startPrayer(); log('startPrayer lần 2 ok'); }
};
$('#pray').onclick = prayFlow;
$('#pray-end').onclick = () => { world.endPrayer(); $('#uibar').style.display = 'none'; log('endPrayer'); };
if (params.get('pray')) prayFlow();
if (params.get('drive')) setTimeout(() => { world.debugStep(Number(params.get('drive'))); log('drive xong ' + JSON.stringify(world.getPlayerState())); }, 300);
if (params.get('trace')) setInterval(() => log(JSON.stringify(world.getPlayerState()) + ' ' + JSON.stringify((({ frames, dt, auto }) => ({ frames, dt, auto }))(world.debugInfo()))), 1500);

document.querySelectorAll('[data-fx]').forEach((b) => b.onclick = () => {
  const fx = b.dataset.fx;
  world.playEffect(fx, fx === 'card' ? { teacherId: 't01' } : fx === 'crane' ? { color: '#FFD166' } : {});
  if (fx === 'signature') { fakeSigs.unshift({ id: 'n' + Date.now(), name: profile.name, cls: profile.cls }); world.applyState(state()); }
  log('Hiệu ứng ' + fx);
});
document.querySelectorAll('[data-photo]').forEach((b) => b.onclick = async () => {
  const t = performance.now();
  const url = await world.capturePhoto({ pose: b.dataset.photo });
  const img = $('#photo'); img.src = url; img.style.display = 'block';
  log(`Ảnh ${b.dataset.photo}: ${Math.round(url.length / 1024)} KB, ${Math.round(performance.now() - t)} ms`);
});
document.querySelectorAll('[data-cards]').forEach((b) => b.onclick = () => {
  const n = Number(b.dataset.cards);
  counts = counts.map(() => n);
  world.applyState(state());
  log('Đặt mọi cây = ' + n + ' thiệp');
});
const spots = { road: [0, 66, 0], real: [87, 40, Math.PI], daithu: [-51, 6, -Math.PI / 2], sign1: [-28.75, 31.5, -2.6], school: [-3, -12, Math.PI], altar: [35, -15.5, Math.PI], gate: [0, 47, Math.PI], garden: [-24, 6, -Math.PI / 2], shrine: [32, -15, Math.PI], lake: [19, 22, Math.PI / 2], stage: [8, -1, Math.PI / 2] };
document.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => { const s = spots[b.dataset.go]; world.teleport(s[0], s[1], s[2]); });
if (params.get('go') && spots[params.get('go')]) { const s = spots[params.get('go')]; world.teleport(s[0], s[1], s[2]); }
if (params.get('at')) { const [x, z, r] = params.get('at').split(',').map(Number); world.teleport(x, z, Number.isFinite(r) ? r : undefined); }
if (params.get('cam')) { const [d, pi, y] = params.get('cam').split(',').map(Number); world.setCameraView({ dist: d, pitch: pi, yaw: y, free: !!params.get('free') }); world.debugStep(4); }
if (params.get('cards')) { counts = counts.map(() => Number(params.get('cards'))); world.applyState(state()); }
if (params.get('fx')) setTimeout(() => { for (const f of params.get('fx').split(',')) world.playEffect(f, { teacherId: 't01' }); }, 300);
if (params.get('photo')) world.capturePhoto({ pose: params.get('photo') }).then((u) => { const img = $('#photo'); img.src = u; img.style.display = 'block'; img.style.width = '420px'; });

// người chơi giả đi vòng quanh
const bots = [];
$('#more').onclick = () => {
  for (let i = 0; i < 5; i++) {
    const id = 'bot' + bots.length;
    bots.push({ id, name: ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khoa', 'Linh'][bots.length % 8], cls: '9A' + (bots.length % 3), look: { gender: bots.length % 2 ? 'nu' : 'nam', outfit: bots.length % 4 }, a: Math.random() * 6, r: 6 + Math.random() * 10 });
  }
  log('Số bạn giả: ' + bots.length);
};
for (let k = 0; k < Number(params.get('bots') || 0) / 5; k++) $('#more').onclick();
let bt = 0;
setInterval(() => {
  bt += 0.1;
  for (const b of bots) {
    const a = b.a + bt * 0.12;
    world.upsertRemote({ id: b.id, name: b.name, cls: b.cls, look: b.look, x: Math.cos(a) * b.r, z: 5 + Math.sin(a) * b.r, ry: Math.atan2(-Math.sin(a), Math.cos(a)), anim: 'walk' });
  }
}, 100);
}

main().catch((e) => { console.error(e); document.querySelector('#load').textContent = 'Lỗi: ' + e.message; });
