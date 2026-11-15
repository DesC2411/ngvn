// Dữ liệu giả để tự thử 3 trang khi server chưa xong. Bật bằng ?mock=1.
// Giả lập đúng các endpoint trong docs/CONTRACT.md mục 3 bằng cách thay window.fetch.
// Mã quản trị giả: gõ gì cũng được, trừ "sai" (để thử báo lỗi). Mã thầy cô: mock-t01 … mock-t28.
// Dữ liệu lưu localStorage 'ma_mock_db' để 3 trang dùng chung; xoá bằng ?mock=1&reset=1.
import teachersJson from '../../../data/teachers.json';
import configJson from '../../../data/config.json';

const LS = 'ma_mock_db';

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ['Minh Anh', 'Gia Huy', 'Bảo Ngọc', 'Khánh Linh', 'Đức Minh', 'Thảo Vy', 'Quang Huy', 'Hà My', 'Tuấn Kiệt', 'Ngọc Hân', 'Phương Nhi', 'Hoàng Nam', 'An Nhiên', 'Thanh Tùng'];
const CLASSES = ['6A1', '6A2', '7A1', '7A3', '8A2', '9A1', '10A1', '11A2'];
const TEMPLATES = ['cuc', 'phan', 'sach', 'la-thu', 'sen', 'sao']; // khớp ui/cardRender.js
const STICKERS = ['hoa', 'tim', 'sao', 'sach', 'hac', 'la', 'tao', 'mu'];
const MESSAGES = [
  'Chúc thầy cô luôn mạnh khoẻ, vui vẻ và mãi yêu nghề ạ!',
  'Em cảm ơn vì những giờ học thú vị. Nhờ có thầy cô mà em thấy đi học vui hơn nhiều.',
  'Nhân ngày 20/11, em chúc thầy cô có thật nhiều niềm vui, bớt chấm bài một chút để nghỉ ngơi nhé ạ!',
  'Cảm ơn thầy cô đã kiên nhẫn giảng lại cho em bao nhiêu lần. Em hứa sẽ cố gắng hơn trong học kỳ này.',
  'Lớp em chúc thầy cô ngày Nhà giáo thật ý nghĩa!',
  'Mỗi buổi sáng được gặp thầy cô ở cổng trường là em thấy ấm áp. Em chúc thầy cô luôn tươi cười như vậy.',
  'Em biết hôm trước em làm thầy cô buồn. Em xin lỗi và cảm ơn vì thầy cô vẫn tin em. Chúc thầy cô một ngày 20/11 thật hạnh phúc, mãi là người lái đò tận tâm của chúng em. Em sẽ nhớ mãi những lời dặn dò của thầy cô.',
  'Thầy cô là người truyền lửa cho cả lớp. Chúng em yêu thầy cô nhiều lắm!',
  'Chúc thầy cô 20/11 vui vẻ!',
  'Cảm ơn thầy cô đã dạy em không chỉ kiến thức mà còn cách làm người tử tế.',
];
const CRANE_MSG = ['Cảm ơn thầy cô!', 'Chúc cả trường 20/11 vui vẻ', 'Mãi yêu May Academy', 'Biết ơn thầy cô nhiều lắm', 'Một con hạc cho một lời cảm ơn', '(giả lập) lời cần xem lại'];
const SECRET_MSG = [
  'Em chưa bao giờ dám nói, nhưng năm lớp 6 thầy cô đã giúp em vượt qua giai đoạn khó nhất. Em cảm ơn nhiều lắm.',
  'Em xin lỗi vì hôm kiểm tra em đã nói dối là quên vở. Thật ra em chưa làm bài. Từ đó em không làm vậy nữa.',
  'Em muốn nói là em rất thích cách thầy cô kể chuyện trong giờ học, em nhớ từng câu chuyện.',
  'Cảm ơn thầy cô đã ngồi nghe em nói chuyện hôm em buồn. Em chưa kịp cảm ơn.',
];
const COLORS = ['#E9973B', '#E85D75', '#4C8BF5', '#3FB37F', '#F2C94C', '#9B6BDF', '#FFFFFF'];

// ---------- Ảnh vẽ giả (vẽ bằng canvas, chỉ để thử) ----------
// Giống bản thật: nền trong suốt, tỉ lệ 4:5 (400×500), phủ cả mặt thiệp.
const drawCache = new Map();
function drawing(k) {
  if (drawCache.has(k)) return drawCache.get(k);
  const r = rng(1000 + k);
  const c = document.createElement('canvas');
  c.width = 400; c.height = 500;
  const g = c.getContext('2d');
  g.translate(-40, 170); g.scale(0.95, 0.95);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const col = () => COLORS[Math.floor(r() * (COLORS.length - 1))];
  // mặt trời
  g.strokeStyle = '#F2B233'; g.fillStyle = '#FFD45A'; g.lineWidth = 6;
  g.beginPath(); g.arc(400, 70, 34, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.beginPath(); g.moveTo(400 + Math.cos(a) * 44, 70 + Math.sin(a) * 44); g.lineTo(400 + Math.cos(a) * 60, 70 + Math.sin(a) * 60); g.stroke();
  }
  // trái tim
  g.fillStyle = col(); g.save(); g.translate(120 + r() * 80, 150); g.scale(1.6, 1.6);
  g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-60, -10, -25, -55, 0, -22); g.bezierCurveTo(25, -55, 60, -10, 0, 30); g.fill(); g.restore();
  // hoa
  const fx = 300, fy = 210;
  g.fillStyle = col();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.beginPath(); g.arc(fx + Math.cos(a) * 22, fy + Math.sin(a) * 22, 16, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#F2C94C'; g.beginPath(); g.arc(fx, fy, 13, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#3FB37F'; g.lineWidth = 7; g.beginPath(); g.moveTo(fx, fy + 30); g.quadraticCurveTo(fx - 10, 270, fx, 315); g.stroke();
  // nét nguệch ngoạc
  g.strokeStyle = col(); g.lineWidth = 5; g.beginPath(); g.moveTo(20, 290);
  for (let x = 20; x < 460; x += 20) g.lineTo(x, 290 + Math.sin(x / 25 + k) * 10);
  g.stroke();
  const url = c.toDataURL('image/png');
  drawCache.set(k, url);
  return url;
}

// ---------- Tạo dữ liệu ----------
function seed() {
  const r = rng(2011);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const now = Date.now();
  const st = () => { const x = r(); return x < 0.45 ? 'pending' : x < 0.9 ? 'approved' : 'hidden'; };
  const ip = () => `113.${160 + Math.floor(r() * 20)}.${Math.floor(r() * 255)}.${Math.floor(r() * 255)}`;
  const db = { cards: [], cranes: [], signatures: [], secrets: [], tokens: {}, replies: {}, quiz: {}, includeSecrets: {}, via: {}, config: { ...configJson, classes: CLASSES } };
  const focus = ['t01', 't04', 't07', 't09', 't19'];
  for (let i = 0; i < 70; i++) {
    const tid = i < 30 ? focus[i % focus.length] : teachersJson[Math.floor(r() * teachersJson.length)].id;
    const anon = r() < 0.15;
    db.cards.push({
      id: `c${i + 1}`, teacherId: tid, from: pick(NAMES), cls: pick(CLASSES), anonymous: anon,
      message: pick(MESSAGES), template: pick(TEMPLATES),
      drawing: r() < 0.6 ? Math.floor(r() * 6) : null,
      stickers: Array.from({ length: Math.floor(r() * 4) }, () => ({ id: pick(STICKERS), x: 0.1 + r() * 0.8, y: 0.1 + r() * 0.8, s: 0.6 + r() * 0.5, r: Math.round((r() - 0.5) * 40) })),
      createdAt: new Date(now - i * 37 * 60000).toISOString(), status: i < 30 ? (r() < 0.7 ? 'approved' : 'pending') : st(), ip: ip(),
    });
  }
  for (let i = 0; i < 26; i++) {
    db.cranes.push({ id: `h${i + 1}`, from: pick(NAMES), cls: pick(CLASSES), message: pick(CRANE_MSG), color: pick(COLORS), createdAt: new Date(now - i * 23 * 60000).toISOString(), status: st(), ip: ip() });
  }
  for (let i = 0; i < 30; i++) {
    db.signatures.push({ id: `k${i + 1}`, name: pick(NAMES), cls: pick(CLASSES), drawing: r() < 0.4 ? Math.floor(r() * 6) : null, createdAt: new Date(now - i * 19 * 60000).toISOString(), status: st(), ip: ip() });
  }
  for (let i = 0; i < 14; i++) {
    const anon = r() < 0.4;
    db.secrets.push({ id: `s${i + 1}`, teacherId: i < 6 ? 't01' : pick(focus), from: pick(NAMES), cls: pick(CLASSES), anonymous: anon, message: pick(SECRET_MSG), createdAt: new Date(now - i * 51 * 60000).toISOString(), status: st(), ip: ip() });
  }
  // Thiệp viết sẵn cho cây đại thụ (giống data/seed/daithu.json: seed, from rỗng, đã duyệt)
  const SEED_MSG = ['Kính chúc sức khoẻ dồi dào, luôn bình an và vui vẻ.', 'Cảm ơn vì đã vun trồng mái trường này.', 'Chúc cây đại thụ mãi xanh tươi, che bóng cho bao thế hệ học trò.'];
  for (const t of teachersJson.filter((x) => x.special === 'daithu')) {
    for (let i = 0; i < 9; i++) {
      db.cards.push({ id: `seed-${t.id}-${i}`, teacherId: t.id, from: '', cls: '', anonymous: false, seed: true, message: SEED_MSG[i % SEED_MSG.length], template: TEMPLATES[i % TEMPLATES.length], drawing: null, stickers: [{ id: pick(STICKERS), x: 0.8, y: 0.85, s: 0.7, r: 10 }], createdAt: new Date(now - 86400000).toISOString(), status: 'approved', ip: '' });
    }
  }
  for (const t of teachersJson) db.tokens[t.id] = `mock-${t.id}`;
  db.replies.t04 = 'Cô cảm ơn các con rất nhiều! Đọc thiệp cô vui cả tuần.';
  db.quiz.t04 = [{ id: 'q-t04-1', q: '(Ví dụ giả lập) Câu hỏi thử số 1?', options: ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'], answer: 2 }];
  db.includeSecrets.t01 = true;
  db.config.subjects.forEach((s, i) => { db.via[s] = 40 + ((i * 37) % 90); });
  return db;
}

let db;
function load() {
  if (new URLSearchParams(location.search).get('reset') === '1') localStorage.removeItem(LS);
  try { db = JSON.parse(localStorage.getItem(LS) || 'null'); } catch { db = null; }
  if (!db || !db.cards) { db = seed(); save(); }
}
function save() { try { localStorage.setItem(LS, JSON.stringify(db)); } catch { /* bỏ qua */ } }

// ---------- Chuyển đổi kiểu dữ liệu ----------
const teacherById = (id) => teachersJson.find((t) => t.id === id);
function publicCard(c, admin) {
  const out = {
    id: c.id, teacherId: c.teacherId, from: c.anonymous && !admin ? 'Một bạn học sinh' : c.from,
    cls: c.anonymous && !admin ? '' : c.cls, anonymous: c.anonymous, message: c.message, template: c.template,
    drawingUrl: c.drawing === null || c.drawing === undefined ? null : drawing(c.drawing), stickers: c.stickers || [], createdAt: c.createdAt,
  };
  if (c.seed) out.seed = true;
  if (admin) { out.status = c.status; out.ip = c.ip; }
  return out;
}
function teacherPublic(t) {
  return {
    id: t.id, title: t.title, name: t.name, dept: t.dept, role: t.role, tree: t.tree, photo: t.photo, ...(t.special ? { special: t.special } : {}),
    reply: db.replies[t.id] || null,
    cardCount: db.cards.filter((c) => c.teacherId === t.id && c.status === 'approved').length,
    hasQuiz: !!(db.quiz[t.id] && db.quiz[t.id].length),
  };
}
function stats() {
  const ok = (a) => a.filter((x) => x.status === 'approved');
  const perTeacher = {};
  for (const c of ok(db.cards)) perTeacher[c.teacherId] = (perTeacher[c.teacherId] || 0) + 1;
  const lb = {};
  const add = (cls, k) => { if (!cls) return; lb[cls] = lb[cls] || { cls, score: 0, cards: 0, cranes: 0, signatures: 0 }; lb[cls][k]++; lb[cls].score++; };
  ok(db.cards).forEach((c) => add(c.cls, 'cards'));
  ok(db.cranes).forEach((c) => add(c.cls, 'cranes'));
  ok(db.signatures).forEach((c) => add(c.cls, 'signatures'));
  return {
    cards: ok(db.cards).length, cranes: ok(db.cranes).length, signatures: ok(db.signatures).length,
    via: Object.values(db.via).reduce((a, b) => a + b, 0), viaBySubject: { ...db.via }, perTeacher,
    leaderboard: Object.values(lb).sort((a, b) => b.score - a.score).slice(0, 10),
    eventDate: db.config.eventDate, submissionsOpen: new Date(db.config.submissionsCloseAt) > new Date(),
  };
}
const isDT = (id) => (teachersJson.find((t) => t.id === id) || {}).special === 'daithu';
const teacherUrl = (id) => (isDT(id) ? null : `/?teacher=${db.tokens[id]}`); // CONTRACT mục 6, đại thụ = null (mục 7)
const listUrl = (id) => (isDT(id) ? null : `/teacher.html?token=${db.tokens[id]}`);

// ---------- Định tuyến ----------
class HttpErr extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function route(method, path, query, headers, body) {
  const m = (re) => path.match(re);
  if (path === '/api/state' && method === 'GET') return { config: db.config, teachers: teachersJson.map(teacherPublic), stats: stats(), cranes: [], signatures: [] };
  if (path === '/api/stats') return stats();

  if (path.startsWith('/api/admin/')) {
    const key = headers['x-admin-key'];
    if (!key || key === 'sai') throw new HttpErr(401, 'Mã quản trị không đúng.');
    if (path === '/api/admin/queue') {
      const type = query.get('type') || 'cards';
      const status = query.get('status') || 'pending';
      const list = db[type];
      if (!list) throw new HttpErr(400, 'Loại nội dung không hợp lệ.');
      return list.filter((x) => status === 'all' || x.status === status).map((x) => {
        if (type === 'cards') return publicCard(x, true);
        if (type === 'signatures') { const { drawing: d, ...rest } = x; return { ...rest, drawingUrl: d === null || d === undefined ? null : drawing(d) }; }
        return { ...x };
      });
    }
    if (path === '/api/admin/moderate' || path === '/api/admin/moderate-bulk') {
      const ids = body.ids || [body.id];
      const list = db[body.type];
      if (!list) throw new HttpErr(400, 'Loại nội dung không hợp lệ.');
      let n = 0;
      if (body.action === 'delete') { const before = list.length; db[body.type] = list.filter((x) => !ids.includes(x.id)); n = before - db[body.type].length; }
      else { const st = body.action === 'approve' ? 'approved' : 'hidden'; list.forEach((x) => { if (ids.includes(x.id)) { x.status = st; n++; } }); }
      save();
      return path.endsWith('bulk') ? { ok: true, n } : { ok: true };
    }
    if (path === '/api/admin/teachers') {
      return teachersJson.map((t) => ({
        ...teacherPublic(t), token: db.tokens[t.id], teacherUrl: teacherUrl(t.id), listUrl: listUrl(t.id),
        pendingCards: db.cards.filter((c) => c.teacherId === t.id && c.status === 'pending').length,
        secrets: db.secrets.filter((s) => s.teacherId === t.id && s.status !== 'hidden').length,
      }));
    }
    let mm = m(/^\/api\/admin\/teachers\/([^/]+)\/token$/);
    if (mm && method === 'POST') {
      db.tokens[mm[1]] = `mock-${mm[1]}-${Math.random().toString(36).slice(2, 8)}`; save();
      return { token: db.tokens[mm[1]], teacherUrl: teacherUrl(mm[1]), listUrl: listUrl(mm[1]) };
    }
    if (path === '/api/admin/settings') {
      if (method === 'POST') {
        if (typeof body.autoApprove === 'boolean') db.config.autoApprove = body.autoApprove;
        if (body.submissionsCloseAt) db.config.submissionsCloseAt = body.submissionsCloseAt;
        save();
      }
      return db.config;
    }
    mm = m(/^\/api\/admin\/book\/([^/]+)$/);
    if (mm) {
      const ids = mm[1] === 'all' ? teachersJson.map((t) => t.id) : [mm[1]];
      if (!ids.every(teacherById)) throw new HttpErr(404, 'Không tìm thấy thầy cô.');
      return {
        teachers: ids.map((id) => ({
          teacher: teacherPublic(teacherById(id)),
          cards: db.cards.filter((c) => c.teacherId === id && c.status === 'approved').map((c) => publicCard(c, false)),
          secrets: db.includeSecrets[id] ? db.secrets.filter((s) => s.teacherId === id && s.status !== 'hidden').map(({ ip, status, ...s }) => (s.anonymous ? { ...s, from: 'Một bạn học sinh', cls: '' } : s)) : [],
        })),
      };
    }
    if (path === '/api/admin/export') return { exportedAt: new Date().toISOString(), ...db };
    throw new HttpErr(404, 'Không có đường dẫn này (mock).');
  }

  if (path.startsWith('/api/teacher/')) {
    const token = headers['x-teacher-token'];
    const id = Object.keys(db.tokens).find((k) => db.tokens[k] === token);
    if (!id) throw new HttpErr(401, 'Mã truy cập không đúng.');
    if (path === '/api/teacher/me') {
      return {
        teacher: teacherPublic(teacherById(id)),
        cards: db.cards.filter((c) => c.teacherId === id && c.status === 'approved').map((c) => publicCard(c, false)),
        secrets: db.secrets.filter((s) => s.teacherId === id && s.status !== 'hidden').map((s) => ({ id: s.id, from: s.anonymous ? 'Một bạn học sinh' : s.from, cls: s.anonymous ? '' : s.cls, anonymous: s.anonymous, message: s.message, createdAt: s.createdAt })),
        quiz: db.quiz[id] || [], reply: db.replies[id] || null, includeSecretsInBook: !!db.includeSecrets[id],
      };
    }
    if (path === '/api/teacher/reply') {
      const text = String(body.text || '').trim();
      if (text.length > 300) throw new HttpErr(400, 'Lời hồi âm tối đa 300 ký tự.');
      db.replies[id] = text || null; save(); return { ok: true };
    }
    if (path === '/api/teacher/quiz') {
      const qs = body.questions || [];
      if (qs.length > 3) throw new HttpErr(400, 'Tối đa 3 câu hỏi.');
      db.quiz[id] = qs.map((q, i) => ({ id: `q-${id}-${i + 1}`, ...q })); save(); return { ok: true };
    }
    if (path === '/api/teacher/settings') { db.includeSecrets[id] = !!body.includeSecretsInBook; save(); return { ok: true }; }
    throw new HttpErr(404, 'Không có đường dẫn này (mock).');
  }
  throw new HttpErr(404, 'Không có đường dẫn này (mock).');
}

export function installMock() {
  load();
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, 'http://mock.local'); // không dùng location: file:// trên Windows giữ ổ đĩa
    if (!url.pathname.startsWith('/api/')) return realFetch(input, init);
    const method = (init.method || 'GET').toUpperCase();
    const headers = {};
    for (const [k, v] of Object.entries(init.headers || {})) headers[k.toLowerCase()] = v;
    let body = {};
    try { body = init.body ? JSON.parse(init.body) : {}; } catch { body = {}; }
    await new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
    try {
      const data = route(method, url.pathname, url.searchParams, headers, body);
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      const status = e.status || 500;
      return new Response(JSON.stringify({ error: e.message || 'Lỗi giả lập' }), { status, headers: { 'Content-Type': 'application/json' } });
    }
  };
  const flag = document.createElement('div');
  flag.className = 'mock-flag';
  flag.textContent = 'DỮ LIỆU GIẢ';
  document.body.append(flag);
  console.info('[mock] Đang dùng dữ liệu giả. Mã thầy cô: mock-t01 … mock-t28. Xoá dữ liệu: thêm &reset=1.');
}
