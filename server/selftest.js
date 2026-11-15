// Tự kiểm tra server: chạy server thật (dev + Vite) ở cổng ngẫu nhiên với thư mục dữ liệu tạm,
// gọi các endpoint chính + WebSocket, in PASS/FAIL. Chạy: node server/selftest.js
import { fork } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import WebSocket from 'ws';

const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'may-academy-test-'));
const KEY = 'test-admin-key-123';
let pass = 0, failN = 0;
const ok = (cond, name, extra = '') => {
  if (cond) { pass++; console.log('PASS', name); } else { failN++; console.log('FAIL', name, extra); }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let child, port, BASE;
let log = '';
// Khởi động server (dùng lại cùng DATA_DIR khi cần thử khởi động lại)
async function startServer() {
  child = fork(path.join(import.meta.dirname, 'index.js'), [], {
    env: { ...process.env, PORT: '0', DATA_DIR: DATA, ADMIN_KEY: KEY, TRUST_PROXY: 'true', NODE_ENV: 'development' },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  port = await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Server không khởi động:\n' + log)), 30000);
    child.on('message', (m) => { if (m?.ready) { clearTimeout(t); resolve(m.port); } });
    child.once('exit', (c) => reject(new Error('Server thoát ' + c + '\n' + log)));
  });
  BASE = `http://127.0.0.1:${port}`;
}
// Tắt êm (server ghi nốt dữ liệu) qua IPC
async function stopServer() {
  const c = child;
  await new Promise((res) => { c.removeAllListeners('exit'); c.once('exit', res); c.send('shutdown'); setTimeout(res, 4000); });
}
await startServer();
// Số lời chúc seed của đại thụ (data/seed/daithu.json)
const SEED = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', 'data', 'seed', 'daithu.json'), 'utf8'));
const SEEDN = Object.values(SEED).reduce((n, l) => n + l.length, 0);
// 13/11/2026 theo giờ Việt Nam
const inDay13 = (iso) => { const t = Date.parse(iso), d0 = Date.parse('2026-11-13T00:00:00+07:00'); return t >= d0 && t < d0 + 86_400_000; };
const NT = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '..', 'data', 'teachers.json'), 'utf8')).length;

// IP giả qua X-Forwarded-For (TRUST_PROXY=true) để mỗi nhóm test có hạn mức riêng
async function call(method, url, body, { ip = '10.0.0.1', headers = {}, raw } = {}) {
  const res = await fetch(BASE + url, {
    method,
    headers: { 'x-forwarded-for': ip, 'x-client-id': 'selftest-' + ip, ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  let data = null;
  const text = await res.text();
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}
const A = { 'x-admin-key': KEY };
// PNG 1x1 hợp lệ
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const BAD = 'Lời nhắn có từ chưa phù hợp, bạn sửa lại nhé.';

function wsOpen(pathname = '/ws', protocols) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}${pathname}`, protocols);
    ws.msgs = [];
    ws.on('message', (d) => ws.msgs.push(JSON.parse(d.toString())));
    ws.closed = new Promise((res) => ws.once('close', (code, reason) => res({ code, reason: reason.toString() })));
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}
async function waitFor(ws, pred, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const m = ws.msgs.find(pred);
    if (m) return m;
    await sleep(30);
  }
  return null;
}

try {
  // ---------- Công khai ----------
  let r = await call('GET', '/api/state');
  ok(r.status === 200 && r.data.teachers.length === NT && r.data.config.schoolName && r.data.stats, 'GET /api/state');
  const d01 = r.data.teachers.find((t) => t.id === 'd01');
  ok(d01 && d01.special === 'daithu' && d01.cardCount === SEED.d01.length && d01.hasQuiz === false && r.data.teachers[0].special === null, 'Đại thụ có special + cardCount gồm seed', JSON.stringify(d01));
  r = await call('GET', '/api/teachers/d01/cards');
  ok(r.data.length === SEED.d01.length && r.data.every((c) => c.seed === true && c.from === '' && c.cls === '' && c.id.startsWith('seed-d01-'))
    && r.data.every((c) => inDay13(c.createdAt)), 'Thiệp seed: seed:true, from/cls rỗng, ngày 13/11', JSON.stringify(r.data.find((c) => !(c.seed === true && c.from === '' && c.cls === '' && c.id.startsWith('seed-d01-') && (inDay13(c.createdAt))))));
  ok(r.data.some((c) => c.stickers.length > 0) && r.data.every((c) => c.template != null), 'Thiệp seed giữ template/stickers');
  r = await call('GET', '/api/stats');
  ok(r.data.cards === SEEDN && r.data.perTeacher.d02 === SEED.d02.length && r.data.leaderboard.length === 0, 'Seed tính perTeacher, không vào bảng lớp');
  r = await call('POST', '/api/secrets', { teacherId: 'd01', from: 'An', cls: '9A1', message: 'Con chào ông' }, { ip: '10.0.1.1' });
  ok(r.status === 400 && r.data.error === 'Không gửi được tới cây này.', 'Lời chưa nói tới đại thụ → 400');

  // Thiệp trang trí: style + texts + 60 sticker
  const STYLE = { font: 'viet', color: '#0F2247', size: 18, align: 'center', frame: 'hoa', bg: 'kem' };
  const TEXTS = [{ t: 'Chúc cô vui!', x: 0.5, y: 0.2, s: 1.2, r: -5, color: '#E9973B', font: 'tay' }, { t: 'Yêu cô', x: 2e9, y: 0.8 }];
  const ST60 = Array.from({ length: 60 }, (_, i) => ({ id: 'tim', x: i / 60, y: 0.5, s: 1, r: 0 }));
  r = await call('POST', '/api/cards', { teacherId: 't03', from: 'Hà', cls: '7A1', message: 'Thiệp đẹp', template: 'sach', style: STYLE, texts: TEXTS, stickers: ST60 }, { ip: '10.0.1.2' });
  ok(r.status === 200, 'Thiệp có style/texts/60 sticker', JSON.stringify(r.data));
  const decoCard = r.data.id;
  const bodyOf = (extra) => ({ teacherId: 't03', from: 'Hà', cls: '7A1', message: 'x', ...extra });
  r = await call('POST', '/api/cards', bodyOf({ stickers: [...ST60, ST60[0]] }), { ip: '10.0.1.3' });
  ok(r.status === 400, '61 sticker → 400');
  r = await call('POST', '/api/cards', bodyOf({ style: { font1: 'a' } }), { ip: '10.0.1.3' });
  ok(r.status === 400, 'style khoá có số → 400');
  r = await call('POST', '/api/cards', bodyOf({ style: { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9 } }), { ip: '10.0.1.3' });
  ok(r.status === 400, 'style > 8 khoá → 400');
  r = await call('POST', '/api/cards', bodyOf({ style: { font: 'x'.repeat(41) } }), { ip: '10.0.1.3' });
  ok(r.status === 400, 'style giá trị > 40 ký tự → 400');
  r = await call('POST', '/api/cards', bodyOf({ texts: Array.from({ length: 9 }, () => ({ t: 'a' })) }), { ip: '10.0.1.3' });
  ok(r.status === 400, 'texts > 8 → 400');
  r = await call('POST', '/api/cards', bodyOf({ texts: [{ t: 'x'.repeat(81) }] }), { ip: '10.0.1.3' });
  ok(r.status === 400, 'texts.t > 80 → 400');
  r = await call('POST', '/api/cards', bodyOf({ texts: [{ t: 'đồ ngu' }] }), { ip: '10.0.1.3' });
  ok(r.status === 400 && r.data.error === BAD, 'texts.t qua bộ lọc từ bậy');
  r = await call('GET', '/api/admin/queue?type=cards&status=pending', undefined, { headers: { 'x-admin-key': KEY } });
  const qd = r.data.find((c) => c.id === decoCard);
  ok(qd && qd.style.size === 18 && qd.texts.length === 2 && qd.texts[1].x === 10000 && qd.stickers.length === 60, 'Admin queue trả style/texts (số được kẹp)');
  await call('POST', '/api/admin/moderate', { type: 'cards', id: decoCard, action: 'approve' }, { headers: { 'x-admin-key': KEY } });
  r = await call('GET', '/api/teachers/t03/cards');
  const pd = r.data.find((c) => c.id === decoCard);
  ok(pd && JSON.stringify(pd.style) === JSON.stringify(STYLE) && pd.texts[0].font === 'tay' && pd.seed === false, 'Thiệp công khai trả style/texts');
  r = await call('GET', '/api/admin/book/t03', undefined, { headers: { 'x-admin-key': KEY } });
  ok(r.data.teachers[0].cards[0].style?.frame === 'hoa' && r.data.teachers[0].cards[0].texts.length === 2, 'Sổ trả style/texts');
  await call('POST', '/api/admin/moderate', { type: 'cards', id: decoCard, action: 'delete' }, { headers: { 'x-admin-key': KEY } });
  r = await call('GET', '/api/state');
  ok(r.data.teachers[0].hasQuiz === false && r.data.teachers[0].reply === null && 'cardCount' in r.data.teachers[0], 'TeacherPublic đủ trường');
  r = await call('GET', '/api/stats');
  ok(r.status === 200 && r.data.submissionsOpen === true && Array.isArray(r.data.leaderboard), 'GET /api/stats');

  r = await call('POST', '/api/cards', { teacherId: 't01', from: 'Minh An', cls: 'lop 9a1', anonymous: false, message: 'Em cảm ơn cô ạ, cặp sách mới!', template: 2, drawing: PNG, stickers: [{ id: 'heart', x: 10, y: 20, s: 1, r: 0 }] });
  ok(r.status === 200 && r.data.ok && r.data.status === 'pending', 'POST /api/cards (có hình vẽ → pending)', JSON.stringify(r.data));
  const card1 = r.data.id;

  r = await call('POST', '/api/cards', { teacherId: 't01', from: 'An', cls: '9A1', message: 'đ.m thầy' });
  ok(r.status === 400 && r.data.error === BAD, 'Bộ lọc từ bậy (đ.m)');
  r = await call('POST', '/api/cards', { teacherId: 't01', from: 'v.c.l', cls: '9A1', message: 'Chúc cô vui' });
  ok(r.status === 400 && r.data.error === BAD, 'Bộ lọc áp dụng cho from');
  r = await call('POST', '/api/cards', { teacherId: 't01', from: 'An', cls: '9A1', message: 'x'.repeat(601) });
  ok(r.status === 400 && /600/.test(r.data.error), 'Thiệp > 600 ký tự → 400');
  r = await call('POST', '/api/cards', { teacherId: 'zz', from: 'An', cls: '9A1', message: 'hi' });
  ok(r.status === 400, 'teacherId sai → 400');
  r = await call('POST', '/api/cards', { teacherId: 't01', from: 'An', cls: '9A1', message: 'hi', drawing: 'data:image/png;base64,' + Buffer.alloc(610 * 1024, 1).toString('base64') });
  ok(r.status === 400 && /600 KB/.test(r.data.error), 'Hình > 600 KB → 400', JSON.stringify(r.data).slice(0, 200));
  r = await call('POST', '/api/cards', undefined, { raw: JSON.stringify({ message: 'x'.repeat(1_200_000) }), headers: { 'content-type': 'application/json' } });
  ok(r.status === 413 && r.data.error, 'Body > 1 MB → 413');
  r = await call('POST', '/api/cards', { teacherId: 't01', from: 'An', cls: '9A1', message: 'hi', drawing: 'data:image/gif;base64,R0lGOD' });
  ok(r.status === 400, 'Hình GIF → 400');

  r = await call('POST', '/api/cards', { teacherId: 't01', from: 'Bí mật', cls: '9A2', anonymous: true, message: 'Cảm ơn cô nhiều' });
  const card2 = r.data.id;

  // ---------- Admin ----------
  r = await call('GET', '/api/admin/queue?type=cards');
  ok(r.status === 401 && r.data.error, 'Admin không key → 401');
  r = await call('GET', '/api/admin/queue?type=cards&status=pending', undefined, { headers: A });
  const q1 = r.data.find?.((x) => x.id === card1);
  ok(r.status === 200 && q1 && q1.ip === '10.0.0.1' && q1.status === 'pending' && q1.drawingUrl.startsWith('/api/admin/media/') && q1.cls === '9A1', 'GET /api/admin/queue', JSON.stringify(q1));
  const file = q1.drawingUrl.split('/').pop();
  r = await call('GET', '/media/' + file);
  ok(r.status === 404, '/media ảnh chưa duyệt → 404');
  r = await call('GET', '/api/admin/media/' + file + '?key=' + KEY);
  ok(r.status === 200 && r.headers.get('content-type').includes('image/png'), '/api/admin/media?key= → 200');

  // WebSocket mở trước để nhận update
  const w1 = await wsOpen();
  w1.send(JSON.stringify({ t: 'join', name: 'Minh An', cls: 'lớp 9a1', look: { gender: 'nu', outfit: 2 } }));
  const welcome = await waitFor(w1, (m) => m.t === 'welcome');
  ok(welcome && welcome.id, 'WS welcome');

  r = await call('POST', '/api/admin/moderate', { type: 'cards', id: card1, action: 'approve' }, { headers: A });
  ok(r.status === 200 && r.data.ok, 'POST /api/admin/moderate approve');
  r = await call('POST', '/api/admin/moderate-bulk', { type: 'cards', ids: [card2, 'khong-co'], action: 'approve' }, { headers: A });
  ok(r.status === 200 && r.data.n === 1, 'POST /api/admin/moderate-bulk');
  const upd = await waitFor(w1, (m) => m.t === 'update' && m.kind === 'cards' && m.teacherId === 't01', 3000);
  ok(!!upd, 'WS update khi duyệt thiệp');

  r = await call('GET', '/media/' + file);
  ok(r.status === 200, '/media ảnh đã duyệt → 200');
  r = await call('GET', '/api/teachers/t01/cards');
  const pub2 = r.data.find((c) => c.id === card2);
  const pub1 = r.data.find((c) => c.id === card1);
  ok(r.status === 200 && r.data.length === 2 && r.data[0].id === card2, 'GET /api/teachers/:id/cards (mới nhất trước)');
  ok(pub2.from === 'Một bạn học sinh' && pub2.cls === '' && !('ip' in pub2) && !('status' in pub2), 'Thiệp ẩn danh không lộ tên/lớp/IP');
  ok(pub1.drawingUrl === '/media/' + file && pub1.stickers.length === 1 && pub1.template === 2, 'Card có drawingUrl/stickers/template');

  // ---------- Hạc + rate limit + bảng lớp ----------
  const craneIds = [];
  for (let i = 0; i < 5; i++) {
    r = await call('POST', '/api/cranes', { from: 'Bình', cls: i < 3 ? ' Lớp 9 A1 ' : '8b', message: 'Cảm ơn thầy cô ' + i, color: '#ff0000' }, { ip: '10.0.0.2' });
    craneIds.push(r.data.id);
  }
  ok(r.status === 200 && r.data.status === 'pending', 'POST /api/cranes');
  r = await call('POST', '/api/cranes', { from: 'Bình', cls: '9A1', message: 'lần 6', color: '#ff0000' }, { ip: '10.0.0.2' });
  ok(r.status === 429 && r.data.error, 'Rate limit hạc 5/phút → 429');
  r = await call('POST', '/api/cranes', { from: 'Bình', cls: '9A1', message: 'x'.repeat(121) }, { ip: '10.0.0.3' });
  ok(r.status === 400, 'Hạc > 120 ký tự → 400');
  await call('POST', '/api/admin/moderate-bulk', { type: 'cranes', ids: craneIds, action: 'approve' }, { headers: A });

  r = await call('POST', '/api/signatures', { name: 'Chi', cls: '9a1' }, { ip: '10.0.0.4' });
  ok(r.status === 200 && r.data.status === 'pending', 'POST /api/signatures');
  await call('POST', '/api/admin/moderate', { type: 'signatures', id: r.data.id, action: 'approve' }, { headers: A });

  r = await call('GET', '/api/stats');
  const lb = r.data.leaderboard;
  ok(r.data.cards === 2 + SEEDN && r.data.cranes === 5 && r.data.signatures === 1 && r.data.perTeacher.t01 === 2, 'Stats đếm đúng approved', JSON.stringify(r.data));
  // 9A1: 1 thiệp (thiệp ẩn danh lớp 9A2 vẫn tính cho 9A2) *3 + 3 hạc + 1 chữ ký = 7
  ok(lb[0].cls === '9A1' && lb[0].score === 7 && lb[0].cards === 1 && lb[0].cranes === 3 && lb[0].signatures === 1, 'Leaderboard chuẩn hoá lớp + điểm', JSON.stringify(lb));
  r = await call('GET', '/api/state');
  ok(r.data.cranes.length === 5 && r.data.signatures.length === 1 && r.data.teachers[0].cardCount === 2 && !('ip' in r.data.cranes[0]), '/api/state có hạc/chữ ký/cardCount');

  // ---------- autoApprove ----------
  r = await call('POST', '/api/admin/settings', { autoApprove: true }, { headers: A });
  ok(r.status === 200 && r.data.autoApprove === true && r.data.schoolName, 'POST /api/admin/settings');
  r = await call('POST', '/api/signatures', { name: 'Dũng', cls: '9A1' }, { ip: '10.0.0.4' });
  ok(r.data.status === 'approved', 'autoApprove → approved ngay');
  r = await call('POST', '/api/signatures', { name: 'Dũng', cls: '9A1', drawing: PNG }, { ip: '10.0.0.4' });
  ok(r.data.status === 'pending', 'autoApprove nhưng có hình vẽ → vẫn pending');
  await call('POST', '/api/admin/settings', { autoApprove: false }, { headers: A });

  // ---------- Lời chưa nói + thầy cô ----------
  r = await call('POST', '/api/secrets', { teacherId: 't02', from: 'Lan', cls: '9A1', anonymous: true, message: 'Em xin lỗi cô vì hôm đó...' }, { ip: '10.0.0.5' });
  ok(r.status === 200 && r.data.ok && r.data.id && !('status' in r.data), 'POST /api/secrets');
  const sec = r.data.id;
  r = await call('GET', '/api/state');
  ok(!JSON.stringify(r.data).includes('Em xin lỗi cô'), 'Lời chưa nói không lộ ra /api/state');
  await call('POST', '/api/admin/moderate', { type: 'secrets', id: sec, action: 'approve' }, { headers: A });

  r = await call('GET', '/api/admin/teachers', undefined, { headers: A });
  const t02 = r.data.find((t) => t.id === 't02');
  const t01 = r.data.find((t) => t.id === 't01');
  const dAdmin = r.data.find((t) => t.id === 'd01');
  ok(dAdmin && dAdmin.token === null && dAdmin.teacherUrl === null && dAdmin.listUrl === null && dAdmin.special === 'daithu', 'Admin: đại thụ không có token/link');
  ok(r.status === 200 && r.data.length === NT && t02.token && t02.teacherUrl === '/?teacher=' + t02.token && t02.listUrl === '/teacher.html?token=' + t02.token && t02.secrets === 1, 'GET /api/admin/teachers (teacherUrl /?teacher=, listUrl)');
  const T2 = { 'x-teacher-token': t02.token };
  r = await call('GET', '/api/teacher/me', undefined, { headers: { 'x-teacher-token': 'sai' } });
  ok(r.status === 401, 'Token sai → 401');
  r = await call('GET', '/api/teacher/me', undefined, { headers: T2 });
  ok(r.status === 200 && r.data.teacher.id === 't02' && r.data.secrets.length === 1 && r.data.secrets[0].from === 'Một bạn học sinh' && r.data.includeSecretsInBook === false, 'GET /api/teacher/me', JSON.stringify(r.data).slice(0, 300));

  r = await call('POST', '/api/teacher/reply', { text: 'Cô cảm ơn các con!' }, { headers: T2 });
  ok(r.status === 200 && r.data.ok, 'POST /api/teacher/reply');
  r = await call('POST', '/api/teacher/reply', { text: 'x'.repeat(301) }, { headers: T2 });
  ok(r.status === 400, 'Hồi âm > 300 → 400');
  r = await call('GET', '/api/state');
  ok(r.data.teachers.find((t) => t.id === 't02').reply === 'Cô cảm ơn các con!', 'Hồi âm hiện trên /api/state');
  ok(!!(await waitFor(w1, (m) => m.t === 'update' && m.kind === 'reply' && m.teacherId === 't02')), 'WS update reply');

  r = await call('PUT', '/api/teacher/quiz', { questions: [{ q: 'Cô thích màu gì?', options: ['Đỏ', 'Xanh', 'Vàng', 'Tím'], answer: 3 }, { q: 'Câu 2?', options: ['a', 'b', 'c', 'd'], answer: 0 }] }, { headers: T2 });
  ok(r.status === 200 && r.data.ok, 'PUT /api/teacher/quiz');
  r = await call('PUT', '/api/teacher/quiz', { questions: [1, 2, 3, 4] }, { headers: T2 });
  ok(r.status === 400, 'Quiz > 3 câu → 400');
  r = await call('GET', '/api/quiz');
  ok(r.data.length === 1 && r.data[0].teacherId === 't02' && r.data[0].questions.length === 2 && !('answer' in r.data[0].questions[0]) && r.data[0].questions[0].options.length === 4, 'GET /api/quiz không lộ đáp án');
  const qid = r.data[0].questions[0].id;
  r = await call('POST', '/api/quiz/answer', { questionId: qid, choice: 3 });
  ok(r.data.correct === true && r.data.answer === 3, 'Quiz trả lời đúng');
  r = await call('POST', '/api/quiz/answer', { questionId: qid, choice: 1 });
  ok(r.data.correct === false && r.data.answer === 3, 'Quiz trả lời sai');
  r = await call('GET', '/api/state');
  ok(r.data.teachers.find((t) => t.id === 't02').hasQuiz === true, 'hasQuiz = true');

  // Sổ Tri Ân: chỉ có lời chưa nói khi thầy cô cho phép
  r = await call('GET', '/api/admin/book/t02', undefined, { headers: A });
  ok(r.status === 200 && r.data.teachers[0].secrets.length === 0, 'Book: chưa cho phép → không có secrets');
  await call('POST', '/api/teacher/settings', { includeSecretsInBook: true }, { headers: T2 });
  r = await call('GET', '/api/admin/book/t02', undefined, { headers: A });
  ok(r.data.teachers[0].secrets.length === 1, 'Book: cho phép → có secrets');
  r = await call('GET', '/api/admin/book/all', undefined, { headers: A });
  const b1 = r.data.teachers.find((x) => x.teacher.id === 't01');
  ok(r.data.teachers.length === NT && b1.cards.length === 2 && b1.cards.some((c) => c.drawingUrl?.startsWith('/api/admin/media/')), 'GET /api/admin/book/all');

  // Ảnh trang thầy cô
  const T1 = { 'x-teacher-token': t01.token };
  r = await call('GET', '/api/teacher/me', undefined, { headers: T1 });
  const tUrl = r.data.cards.find((c) => c.drawingUrl).drawingUrl;
  r = await call('GET', tUrl);
  ok(r.status === 200, '/api/teacher/media đúng thầy cô → 200');
  r = await call('GET', `/api/teacher/media/${file}?token=${t02.token}`);
  ok(r.status === 404, '/api/teacher/media thầy cô khác → 404');

  // Cấp lại mã
  r = await call('POST', '/api/admin/teachers/t02/token', undefined, { headers: A });
  ok(r.status === 200 && r.data.token !== t02.token && r.data.teacherUrl === '/?teacher=' + r.data.token && r.data.listUrl === '/teacher.html?token=' + r.data.token, 'Cấp lại token (teacherUrl + listUrl)');
  r = await call('GET', '/api/teacher/me', undefined, { headers: T2 });
  ok(r.status === 401, 'Token cũ hết hiệu lực');

  // ---------- Xin vía ----------
  r = await call('POST', '/api/via', { subject: 'Toán' }, { ip: '10.0.0.6' });
  ok(r.status === 200 && r.data.subject === 'Toán' && r.data.mine === null && r.data.subjectTotal === 1 && r.data.total === 1, 'POST /api/via');
  r = await call('POST', '/api/via', { subject: 'Bóng đá' }, { ip: '10.0.0.6' });
  ok(r.status === 400, 'Via môn lạ → 400');
  for (let i = 0; i < 29; i++) await call('POST', '/api/via', { subject: 'Tin học' }, { ip: '10.0.0.6' });
  r = await call('POST', '/api/via', { subject: 'Tin học' }, { ip: '10.0.0.6' });
  ok(r.status === 429, 'Via 30/phút → lần 31 bị 429');

  // ---------- Hạn nộp ----------
  await call('POST', '/api/admin/settings', { submissionsCloseAt: '2020-01-01T00:00:00+07:00' }, { headers: A });
  r = await call('POST', '/api/cards', { teacherId: 't01', from: 'An', cls: '9A1', message: 'Muộn rồi' }, { ip: '10.0.0.7' });
  ok(r.status === 403 && r.data.error === 'Đã hết hạn gửi, cảm ơn bạn!', 'Sau hạn → 403');
  r = await call('POST', '/api/via', { subject: 'Toán' }, { ip: '10.0.0.8' });
  ok(r.status === 200, 'Sau hạn vẫn xin vía được');
  r = await call('GET', '/api/stats');
  ok(r.data.submissionsOpen === false, 'stats.submissionsOpen = false');
  await call('POST', '/api/admin/settings', { submissionsCloseAt: null }, { headers: A });

  // ---------- Thầy cô gửi thiệp/hạc với cls "GV" → không tính bảng lớp ----------
  r = await call('POST', '/api/cards', { teacherId: 't02', from: 'Cô Nguyễn Hồng Ngọc', cls: 'GV', message: 'Chúc mừng đồng nghiệp!' }, { ip: '10.0.0.9' });
  const gvCard = r.data.id;
  ok(r.status === 200, 'Thiệp cls "GV" được nhận');
  r = await call('POST', '/api/cranes', { from: 'Thầy Chính', cls: 'gv', message: 'Cảm ơn các em' }, { ip: '10.0.0.9' });
  const gvCrane = r.data.id;
  await call('POST', '/api/admin/moderate', { type: 'cards', id: gvCard, action: 'approve' }, { headers: A });
  await call('POST', '/api/admin/moderate', { type: 'cranes', id: gvCrane, action: 'approve' }, { headers: A });
  r = await call('GET', '/api/teachers/t02/cards');
  ok(r.data.find((c) => c.id === gvCard)?.cls === 'GV', 'Lớp "GV" giữ nguyên sau chuẩn hoá');
  r = await call('GET', '/api/stats');
  ok(r.data.perTeacher.t02 === 1 && r.data.cranes === 6 && !r.data.leaderboard.some((x) => x.cls === 'GV'), 'Thầy cô ("GV") không vào bảng xếp hạng lớp', JSON.stringify(r.data.leaderboard));

  // ---------- Ẩn / xoá ----------
  await call('POST', '/api/admin/moderate', { type: 'cards', id: card1, action: 'hide' }, { headers: A });
  r = await call('GET', '/media/' + file);
  ok(r.status === 404, 'Ẩn thiệp → /media 404');
  await call('POST', '/api/admin/moderate', { type: 'cards', id: card1, action: 'delete' }, { headers: A });
  await sleep(100);
  ok(!fs.existsSync(path.join(DATA, 'uploads', file)), 'Xoá thiệp → xoá file ảnh');
  r = await call('GET', '/api/admin/export', undefined, { headers: A });
  ok(r.status === 200 && Array.isArray(r.data.cards) && r.data.teacherMeta && /attachment/.test(r.headers.get('content-disposition')), 'GET /api/admin/export');

  // ---------- WebSocket nhiều người ----------
  const w2 = await wsOpen();
  w2.send(JSON.stringify({ t: 'join', name: 'đồ chó', cls: '9A2', look: { gender: 'nam', outfit: 9 } }));
  const wel2 = await waitFor(w2, (m) => m.t === 'welcome');
  ok(!!(await waitFor(w2, (m) => m.t === 'online' && m.n === 2)), 'WS online');
  w2.send(JSON.stringify({ t: 'pos', x: 999, z: -5.123, ry: 1, anim: 'run' }));
  w2.send(JSON.stringify({ t: 'pos', x: 1, z: 1, ry: 0, anim: 'walk' })); // quá dày → bỏ
  await sleep(400);
  const pl = [...w1.msgs].reverse().find((m) => m.t === 'players' && m.list.some((p) => p.id === wel2.id));
  const p2 = pl?.list.find((p) => p.id === wel2.id);
  ok(p2 && p2.x === 200 && p2.z === -5.12 && p2.anim === 'run', 'WS players: kẹp toạ độ + bỏ gói dày', JSON.stringify(p2));
  ok(p2 && p2.name === 'Học sinh' && p2.look.outfit === 3 && p2.look.gender === 'nam', 'WS tên bậy → "Học sinh"', JSON.stringify(p2));
  const pl2 = [...w2.msgs].reverse().find((m) => m.t === 'players');
  const p1 = pl2?.list.find((p) => p.id === welcome.id);
  ok(p1 && p1.cls === '9A1' && p1.look.gender === 'nu' && !pl2.list.some((p) => p.id === wel2.id), 'WS players không gồm chính mình, lớp chuẩn hoá');
  ok(p1?.look.role === 'student' && p2?.look.role === 'student', 'WS look.role mặc định "student"');

  // Thầy cô vào bằng token; kẻ giả mạo tự gửi role='teacher' với token sai
  const w3 = await wsOpen();
  w3.send(JSON.stringify({ t: 'join', name: 'Tên client tự đặt', cls: '9A1', teacherToken: t01.token, look: { gender: 'nu', outfit: 3 } }));
  const wel3 = await waitFor(w3, (m) => m.t === 'welcome');
  const w4 = await wsOpen();
  w4.send(JSON.stringify({ t: 'join', name: 'Giả làm cô', cls: '9A3', teacherToken: 'sai-token', look: { gender: 'nu', outfit: 1, role: 'teacher' } }));
  const wel4 = await waitFor(w4, (m) => m.t === 'welcome');
  await sleep(350);
  const lastList = () => [...w1.msgs].reverse().find((m) => m.t === 'players' && m.list.some((p) => p.id === wel3.id) && m.list.some((p) => p.id === wel4.id));
  const L = lastList();
  const p3 = L?.list.find((p) => p.id === wel3.id), p4 = L?.list.find((p) => p.id === wel4.id);
  ok(p3 && p3.name === 'Cô Nguyễn Hồng Ngọc' && p3.cls === 'GV' && p3.look.role === 'teacher', 'WS join teacherToken đúng → thầy cô', JSON.stringify(p3));
  ok(p4 && p4.name === 'Giả làm cô' && p4.cls === '9A3' && p4.look.role === 'student', 'WS token sai + role tự nhận → vẫn student', JSON.stringify(p4));
  w3.close(); w4.close();
  w2.close();
  ok(!!(await waitFor(w1, (m) => m.t === 'leave' && m.id === wel2.id)), 'WS leave');

  // HMR của Vite vẫn chạy chung cổng
  try {
    const hmr = await wsOpen('/', 'vite-hmr');
    ok(true, 'Vite HMR websocket cùng cổng');
    hmr.close();
  } catch (e) { ok(false, 'Vite HMR websocket cùng cổng', e.message); }

  // Giới hạn 300 kết nối
  const many = [];
  for (let i = 0; i < 300; i++) many.push(wsOpen().catch(() => null));
  const socks = (await Promise.all(many)).filter(Boolean);
  const closes = await Promise.all(socks.map((s) => Promise.race([s.closed, sleep(1500).then(() => null)])));
  const rejected = closes.filter((c) => c && c.code === 1013);
  ok(rejected.length === 1 && rejected[0].reason === 'Trường đang đông, bạn thử lại sau nhé', 'Tối đa 300 kết nối', `bị từ chối: ${rejected.length}`);
  for (const s of socks) s.terminate();
  w1.close();

  // ---------- Lưu file ----------
  await sleep(800);
  const saved = JSON.parse(fs.readFileSync(path.join(DATA, 'db', 'cranes.json'), 'utf8'));
  ok(saved.length === 6 && saved.every((c) => c.status === 'approved'), 'Ghi data/db/cranes.json');
  ok(fs.existsSync(path.join(DATA, 'db', 'teacherMeta.json')) && fs.existsSync(path.join(DATA, 'db', 'quiz.json')), 'Ghi teacherMeta.json, quiz.json');
  r = await call('POST', '/api/admin/teachers/d01/token', undefined, { headers: A });
  ok(r.status === 400, 'Không cấp token cho đại thụ');
  r = await call('GET', '/api/quiz');
  ok(!r.data.some((x) => x.teacherId.startsWith('d')), '/api/quiz bỏ qua đại thụ');

  // Khởi động lại cùng dữ liệu → seed không nhân đôi
  const before = (await call('GET', '/api/stats')).data.cards;
  await stopServer();
  await startServer();
  const after = (await call('GET', '/api/stats')).data.cards;
  const savedCards = JSON.parse(fs.readFileSync(path.join(DATA, 'db', 'cards.json'), 'utf8'));
  ok(before === after && savedCards.filter((c) => c.seed).length === SEEDN, 'Khởi động lại: seed không nhân đôi', `${before} → ${after}`);
} catch (e) {
  failN++;
  console.log('FAIL (ngoại lệ)', e.stack);
} finally {
  child.kill();
  await sleep(300);
  fs.rmSync(DATA, { recursive: true, force: true });
  console.log(`\nKết quả: ${pass} PASS, ${failN} FAIL`);
  if (failN) console.log('--- log server ---\n' + log.slice(-3000));
  process.exit(failN ? 1 : 0);
}
