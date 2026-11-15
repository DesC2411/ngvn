// Trang thử giao diện học sinh (client/ui-test.html): world giả + api giả, không cần server.
// Mở: npm run dev rồi vào /ui-test.html (hoặc build riêng bằng client/src/ui/vite.ui-test.config.js).
import { createUI } from './index.js';
import teachersJson from '../../../data/teachers.json';
import configJson from '../../../data/config.json';

const params = new URLSearchParams(location.search);
const flags = { fail: false, closed: false, emptyQuiz: params.has('emptyQuiz'), delay: 450 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = Date.now();
const iso = (minAgo) => new Date(now - minAgo * 60000).toISOString();

// ------------------------------------------------------------------ dữ liệu mẫu (giả, chỉ để thử giao diện)
const teachers = teachersJson.map((t, i) => ({
  ...t,
  reply: i === 0 ? 'Cảm ơn các con rất nhiều! Cô đọc từng tấm thiệp và thấy vui lắm. (lời hồi âm mẫu để thử giao diện)' : null,
  cardCount: [12, 3, 31, 0, 52][i] ?? (i * 7) % 9,
  hasQuiz: i < 2,
}));

function sigDataUrl(text) {
  const c = document.createElement('canvas');
  c.width = 360;
  c.height = 120;
  const g = c.getContext('2d');
  g.strokeStyle = '#F6F3EA';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(20, 80);
  for (let x = 20; x < 340; x += 12) g.lineTo(x, 60 + Math.sin(x / 18) * 26);
  g.stroke();
  g.font = '28px sans-serif';
  g.fillStyle = '#F7D774';
  g.fillText(text, 30, 112);
  return c.toDataURL('image/png');
}

const sampleCards = [
  { id: 'c1', teacherId: 't01', from: 'Nguyễn Minh Anh', cls: '8A1', anonymous: false, template: 'cuc', message: 'Con chúc cô luôn mạnh khoẻ, vui vẻ và mãi là người cô tuyệt vời nhất của tụi con!', drawingUrl: null, stickers: [{ id: 'tim', x: 0.82, y: 0.2, s: 0.8, r: 12 }, { id: 'hoa', x: 0.16, y: 0.86, s: 0.9, r: -8 }], createdAt: iso(5) },
  { id: 'c2', teacherId: 't01', from: 'Một bạn học sinh', cls: '', anonymous: true, template: 'phan', message: 'Cảm ơn cô vì những buổi học thú vị. Con hứa sẽ cố gắng hơn nữa!', drawingUrl: null, stickers: [{ id: 'sao', x: 0.85, y: 0.15, s: 0.7, r: 0 }], createdAt: iso(20) },
  { id: 'c3', teacherId: 't01', from: 'Trần Bảo Ngọc', cls: '9A2', anonymous: false, template: 'sach', message: 'Kính chúc cô 20/11 thật nhiều niềm vui.\nCon cảm ơn cô đã luôn kiên nhẫn giảng lại cho con những bài khó, và luôn động viên con mỗi khi con bị điểm kém. Nhờ cô mà con thấy học Toán không còn đáng sợ nữa. Con chúc cô luôn trẻ đẹp, hạnh phúc và thành công trong sự nghiệp trồng người. Tụi con yêu cô nhiều lắm ạ!', drawingUrl: null, stickers: [{ id: 'but', x: 0.8, y: 0.88, s: 1, r: 0 }, { id: 'huy-hieu', x: 0.15, y: 0.1, s: 0.8, r: -10 }], createdAt: iso(60) },
  { id: 'c4', teacherId: 't01', from: 'Lê Hoàng', cls: '7B', anonymous: false, template: 'la-thu', message: 'Mùa thu tới rồi, chúc cô một mùa 20/11 thật ấm áp!', drawingUrl: null, stickers: [{ id: 'la', x: 0.5, y: 0.82, s: 1.3, r: 20 }], createdAt: iso(90) },
  { id: 'c5', teacherId: 't01', from: 'Phạm Thu', cls: '6A3', anonymous: false, template: 'sen', message: 'Con cảm ơn cô ạ!', drawingUrl: null, stickers: [], createdAt: iso(120) },
  { id: 'c6', teacherId: 't01', from: 'Đỗ Khang', cls: '8A1', anonymous: false, template: 'sao', message: 'Cô là ngôi sao sáng nhất của lớp 8A1!', drawingUrl: null, stickers: [{ id: 'mu', x: 0.78, y: 0.86, s: 1.1, r: -12 }, { id: 'bong-bay', x: 0.15, y: 0.84, s: 0.9, r: 6 }], createdAt: iso(200) },
  { id: 'c7', teacherId: 't01', from: 'Ngô Gia Hân', cls: '7A2', anonymous: false, template: 'hoa-dao', message: 'Con chúc cô một mùa 20/11 thật nhiều niềm vui, luôn mạnh khoẻ và hạnh phúc!', drawingUrl: null, style: { font: 'nghieng', color: '#C2416E', size: 'L', align: 'center', frame: 'doi', bg: 'trang' }, texts: [{ t: 'Happy 20/11', x: 0.5, y: 0.9, s: 1.2, r: -4, color: '#E9973B', font: 'co' }], stickers: [{ id: 'bo-hoa', x: 0.14, y: 0.86, s: 1, r: -10 }, { id: 'thank-you', x: 0.82, y: 0.12, s: 1.2, r: 8 }], createdAt: iso(230) },
  { id: 'c8', teacherId: 't01', from: '', cls: '', anonymous: false, seed: true, template: 'may-academy', message: 'Kính chúc thầy cô luôn mạnh khoẻ, hạnh phúc. (thiệp seed mẫu, không ký tên)', drawingUrl: null, style: { frame: 'goc', bg: 'kem', font: 'tron' }, stickers: [{ id: 'cup', x: 0.84, y: 0.84, s: 0.9, r: 0 }], createdAt: iso(400) },
];

let state = {
  config: { ...configJson, classes: params.has('classes') ? ['6A1', '6A2', '7A1', '8A1', '9A2'] : configJson.classes },
  teachers,
  stats: {
    cards: 214, cranes: 386, signatures: 157, via: 902,
    viaBySubject: { 'Toán': 210, 'Ngữ văn': 140 },
    perTeacher: {},
    leaderboard: [
      { cls: '9A2', score: 96, cards: 40, cranes: 31, signatures: 25 },
      { cls: '8A1', score: 84, cards: 36, cranes: 28, signatures: 20 },
      { cls: '7B', score: 61, cards: 22, cranes: 25, signatures: 14 },
      { cls: '6A3', score: 40, cards: 15, cranes: 14, signatures: 11 },
      { cls: '9A1', score: 33, cards: 12, cranes: 10, signatures: 11 },
    ],
    eventDate: configJson.eventDate,
    submissionsOpen: true,
  },
  cranes: [
    { id: 'k1', from: 'Minh Anh', cls: '8A1', message: 'Cảm ơn thầy cô đã luôn tận tâm với tụi em!', color: '#E5484D', createdAt: iso(3) },
    { id: 'k2', from: 'Bảo Ngọc', cls: '9A2', message: 'Chúc thầy cô 20/11 vui vẻ!', color: '#4A90E2', createdAt: iso(9) },
    { id: 'k3', from: 'Khang', cls: '8A1', message: 'Em cảm ơn ạ', color: '#F6C453', createdAt: iso(30) },
  ],
  signatures: [
    { id: 's1', name: 'Minh Anh', cls: '8A1', drawingUrl: sigDataUrl('Minh Anh'), createdAt: iso(2) },
    { id: 's2', name: 'Bảo Ngọc', cls: '9A2', drawingUrl: null, createdAt: iso(4) },
    { id: 's3', name: 'Hoàng', cls: '7B', drawingUrl: null, createdAt: iso(8) },
    { id: 's4', name: 'Thu Phạm', cls: '6A3', drawingUrl: sigDataUrl('Thu'), createdAt: iso(11) },
  ],
};

const quiz = [
  { teacherId: 't01', questions: [
    { id: 'q1', q: '(Câu mẫu để thử giao diện) 2 + 3 bằng mấy?', options: ['4', '5', '6', '7'], answer: 1 },
    { id: 'q2', q: '(Câu mẫu) Ngày Nhà giáo Việt Nam là ngày nào?', options: ['20/10', '20/11', '1/6', '2/9'], answer: 1 },
  ] },
  { teacherId: 't19', questions: [
    { id: 'q3', q: '(Câu mẫu) Màu chủ đạo của May Academy là gì?', options: ['Xanh navy', 'Tím', 'Xám', 'Hồng'], answer: 0 },
  ] },
];

// ------------------------------------------------------------------ api giả
async function call(fn) {
  await sleep(flags.delay);
  if (flags.fail) throw new Error('Lời nhắn có từ chưa phù hợp, bạn sửa lại nhé.');
  return fn();
}
const guard = () => {
  if (flags.closed) throw new Error('Đã hết hạn gửi, cảm ơn bạn!');
};
const status = () => (params.has('approve') ? 'approved' : 'pending');
const api = {
  getState: () => call(() => structuredClone(state)),
  getStats: () => call(() => structuredClone(state.stats)),
  getCards: (id) => call(() => sampleCards.filter((c) => c.teacherId === id || id !== 't04').map((c) => ({ ...c, teacherId: id }))).then((list) => (id === 't04' ? [] : list)),
  postCard: (b) => call(() => {
    guard();
    console.log('[api] postCard', { ...b, drawing: b.drawing ? `${b.drawing.slice(0, 30)}… (${Math.round(b.drawing.length * 0.75 / 1024)} KB)` : null });
    if (status() === 'approved') sampleCards.unshift({ id: 'n' + Date.now(), ...b, drawingUrl: b.drawing || null, from: b.anonymous ? 'Một bạn học sinh' : b.from, cls: b.anonymous ? '' : b.cls, createdAt: new Date().toISOString() });
    return { ok: true, id: 'x' + Date.now(), status: status() };
  }),
  postCrane: (b) => call(() => {
    guard();
    console.log('[api] postCrane', b);
    if (status() === 'approved') { state.cranes.unshift({ id: 'k' + Date.now(), ...b, createdAt: new Date().toISOString() }); state.stats.cranes += 1; }
    return { ok: true, id: 'k', status: status() };
  }),
  postSignature: (b) => call(() => {
    guard();
    console.log('[api] postSignature', { ...b, drawing: b.drawing ? `${Math.round(b.drawing.length * 0.75 / 1024)} KB` : null });
    if (status() === 'approved') state.signatures.unshift({ id: 's' + Date.now(), name: b.name, cls: b.cls, drawingUrl: b.drawing || null });
    return { ok: true, id: 's', status: status() };
  }),
  postSecret: (b) => call(() => { guard(); console.log('[api] postSecret', b); return { ok: true, id: 'z' }; }),
  getQuiz: () => call(() => (flags.emptyQuiz ? [] : quiz.map((x) => ({ teacherId: x.teacherId, questions: x.questions.map(({ id, q, options }) => ({ id, q, options })) })))),
  answerQuiz: ({ questionId, choice }) => call(() => {
    const q = quiz.flatMap((x) => x.questions).find((x) => x.id === questionId);
    return { correct: !!q && q.answer === choice, answer: q ? q.answer : 0 };
  }),
  postVia: ({ subject }) => call(() => {
    state.stats.via += 1;
    state.stats.viaBySubject[subject] = (state.stats.viaBySubject[subject] || 0) + 1;
    return { subject, mine: null, subjectTotal: state.stats.viaBySubject[subject], total: state.stats.via };
  }),
};

// ---- chế độ thầy cô (?teacher): giả /api/teacher/*
const TEACHER_ID = params.get('teacher') && params.get('teacher').startsWith('t') ? params.get('teacher') : 't01';
const teacherDb = {
  reply: params.has('noreply') ? null : teachers.find((t) => t.id === TEACHER_ID).reply,
  includeSecretsInBook: false,
  quiz: quiz.find((x) => x.teacherId === TEACHER_ID)?.questions.map((q) => ({ ...q })) || [],
  secrets: [
    { id: 'z1', from: 'Một bạn học sinh', cls: '', anonymous: true, message: 'Em xin lỗi cô vì hôm trước em nói chuyện riêng trong giờ. Em cảm ơn cô đã không mắng em mà còn hỏi han em. (thư mẫu để thử giao diện)', createdAt: iso(40) },
    { id: 'z2', from: 'Trần Bảo Ngọc', cls: '9A2', anonymous: false, message: 'Con cảm ơn cô rất nhiều vì năm lớp 6 cô đã kèm con môn Toán.\nNhờ cô mà giờ con thích học Toán. (thư mẫu)', createdAt: iso(300) },
  ],
};
api.teacher = {
  me: (token) => call(() => {
    if (token !== 'test-token') throw new Error('Link không đúng.');
    const t = state.teachers.find((x) => x.id === TEACHER_ID);
    return structuredClone({ teacher: { ...t, reply: teacherDb.reply }, cards: sampleCards.map((c) => ({ ...c, teacherId: TEACHER_ID })), secrets: teacherDb.secrets, quiz: teacherDb.quiz, reply: teacherDb.reply, includeSecretsInBook: teacherDb.includeSecretsInBook });
  }),
  reply: (token, text) => call(() => { teacherDb.reply = text || null; state.teachers.find((x) => x.id === TEACHER_ID).reply = teacherDb.reply; console.log('[api] teacher.reply', text); return { ok: true }; }),
  saveQuiz: (token, questions) => call(() => { teacherDb.quiz = questions.map((q, i) => ({ id: 'tq' + i, ...q })); console.log('[api] teacher.saveQuiz', questions); return { ok: true }; }),
  settings: (token, body) => call(() => { teacherDb.includeSecretsInBook = body.includeSecretsInBook; console.log('[api] teacher.settings', body); return { ok: true }; }),
  mediaUrl: (token, url) => (!url || /[?&]token=/.test(url) || url.startsWith('data:') ? url : `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`),
};

// ------------------------------------------------------------------ world giả
const ui = createUI({ root: document.getElementById('ui-root'), api });
let near = null;
const world = {
  inputEnabled: true,
  applyState() {},
  setInputEnabled(b) { this.inputEnabled = b; console.log('[world] setInputEnabled', b); },
  playEffect(name, data) { console.log('[world] playEffect', name, data || ''); },
  interact() { if (near) ui.openZone(near); },
  async capturePhoto({ pose }) {
    await sleep(700);
    const c = document.createElement('canvas');
    c.width = 1080;
    c.height = 1350;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 1350);
    gr.addColorStop(0, '#F7C88A');
    gr.addColorStop(1, '#2B4A85');
    g.fillStyle = gr;
    g.fillRect(0, 0, 1080, 1350);
    g.fillStyle = '#0F2247';
    g.beginPath();
    g.arc(540, 520, 120, 0, Math.PI * 2);
    g.fill();
    g.fillRect(420, 640, 240, 420);
    g.fillStyle = '#fff';
    g.font = '700 64px sans-serif';
    g.textAlign = 'center';
    g.fillText('Tư thế: ' + pose, 540, 1180);
    return c.toDataURL('image/jpeg', 0.9);
  },
  getPlayerState: () => ({ x: 0, z: 0, ry: 0, anim: 'idle' }),
  async startPrayer() { console.log('[world] startPrayer'); await sleep(500); },
  endPrayer() { console.log('[world] endPrayer'); },
  ...(params.has('noguide') ? {} : {
    setGuide(id) { console.log('[world] setGuide', id); },
    async autoWalkTo(id) { console.log('[world] autoWalkTo', id); await sleep(1200); return true; },
    getZone(id) { return ZONES.find((z) => z.id === id) || null; },
    highlightTree(id) { console.log('[world] highlightTree', id); },
  }),
  upsertRemote() {}, removeRemote() {}, dispose() {},
};

const ZONES = [
  { id: 'gate', kind: 'gate', label: 'Xem đếm ngược' },
  { id: 'tree:t01', kind: 'tree', label: 'Treo thiệp tặng Cô Nguyễn Hồng Ngọc', teacherId: 't01' },
  { id: 'tree:t04', kind: 'tree', label: 'Treo thiệp tặng Cô Mai Bảo Trinh', teacherId: 't04' },
  { id: 'crane-lake', kind: 'crane', label: 'Thả hạc giấy' },
  { id: 'chalkboard', kind: 'chalkboard', label: 'Ký tên lên bảng' },
  { id: 'secret-box', kind: 'secret', label: 'Gửi lời chưa nói' },
  { id: 'photo-stage', kind: 'photo', label: 'Chụp ảnh kỷ niệm' },
  { id: 'quiz-board', kind: 'quiz', label: 'Đố vui về thầy cô' },
  { id: 'leaderboard', kind: 'leaderboard', label: 'Bảng lớp tri ân' },
  { id: 'shrine', kind: 'shrine', label: 'Vào xin vía' },
];

// ------------------------------------------------------------------ khởi động giống main.js
// Tham số thử: ?teacher (chế độ thầy cô, kèm ?noguide ?noreply)  ?autologin  ?open=<kind>  ?near=tree  ?click=<selector>|<selector>…  ?approve  ?emptyQuiz  ?classes
async function boot() {
  if (params.has('autologin')) {
    try { localStorage.setItem('ma_profile', JSON.stringify({ name: 'Nguyễn Minh Anh', cls: '8A1', look: { gender: 'nu', outfit: 3 } })); } catch { /* bỏ qua */ }
  }
  ui.showLoading(0, 'Đang mở cổng trường…');
  const s = await api.getState();
  ui.hideLoading();
  let profile;
  let teacherMe = null;
  if (params.has('teacher')) {
    try { sessionStorage.setItem('ma_test_teacher_token', 'test-token'); } catch { /* bỏ qua */ }
    teacherMe = await api.teacher.me('test-token');
    const wp = ui.showTeacherWelcome(teacherMe);
    if (params.has('autologin')) setTimeout(() => document.querySelector('.ma-twelcome .ma-btn-primary')?.click(), 50);
    await wp;
    const t = teacherMe.teacher;
    profile = { role: 'teacher', teacherId: t.id, token: 'test-token', name: `${t.title} ${t.name}`, cls: '', look: { gender: t.title === 'Cô' ? 'nu' : 'nam', outfit: 3, role: 'teacher' } };
  } else {
    const loginP = ui.showLogin(s.config);
    if (params.has('autologin')) setTimeout(() => document.querySelector('.ma-welcome ~ .ma-btn-primary')?.click(), 50);
    profile = { role: 'student', ...(await loginP) };
  }
  for (let p = 0; p <= 1; p += 0.1) {
    ui.showLoading(0.05 + p * 0.95, 'Đang dựng khuôn viên May Academy…');
    await sleep(params.has('autologin') ? 10 : 120);
  }
  ui.hideLoading();
  const refresh = async () => {
    const st = await api.getState();
    world.applyState(st);
    ui.applyState(st);
  };
  ui.attach({ world, state: s, profile, net: { close() {} }, refresh, teacherMe });
  if (profile.role === 'teacher') { world.highlightTree?.(profile.teacherId); world.setGuide?.(`tree:${profile.teacherId}`); }
  ui.setOnline(37);
  buildDev();
  if (params.get('near')) { near = ZONES.find((z) => z.kind === params.get('near')); ui.setPrompt(near); }
  const auto = params.get('open');
  if (auto) ui.openZone(ZONES.find((z) => z.kind === auto || z.id === auto) || (auto.startsWith('tree:') ? { id: auto, kind: 'tree', teacherId: auto.slice(5), label: auto } : { id: auto, kind: auto, label: auto }));
  // bước dạng "selector" (bấm) hoặc "selector::giá trị" (gõ vào ô)
  for (const step of (params.get('click') || '').split('|').filter(Boolean)) {
    await sleep(700);
    const [sel, val] = step.split('::');
    const el = document.querySelector(sel);
    if (!el) { console.warn('[test] không thấy', sel); continue; }
    if (val != null) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); } else el.click();
  }
}

function buildDev() {
  const dev = document.getElementById('dev');
  const btn = (label, fn, cls) => {
    const b = document.createElement('button');
    b.textContent = label;
    if (cls) b.className = cls;
    b.onclick = fn;
    dev.append(b);
    return b;
  };
  btn('–', () => dev.classList.toggle('is-min'), 'dev-toggle');
  for (const z of ZONES) btn(z.kind === 'tree' ? z.id : z.kind, () => ui.openZone(z));
  btn('gần cây t01', () => { near = ZONES[1]; ui.setPrompt(near); });
  btn('gần hồ', () => { near = ZONES[3]; ui.setPrompt(near); });
  btn('rời xa', () => { near = null; ui.setPrompt(null); });
  btn('toast', () => ui.toast('Thông báo thử nghiệm', 'ok'));
  btn('online+', () => ui.setOnline(Math.floor(Math.random() * 300)));
  const chk = (label, key) => {
    const l = document.createElement('label');
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.onchange = () => {
      flags[key] = c.checked;
      if (key === 'closed') { state.stats.submissionsOpen = !c.checked; ui.applyState(structuredClone(state)); }
    };
    l.append(c, label);
    dev.append(l);
  };
  chk('giả lỗi API', 'fail');
  chk('hết hạn gửi', 'closed');
}

boot();
