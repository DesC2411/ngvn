// REST API – đúng docs/CONTRACT.md mục 3.
import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { hasBadWords } from './badwords.js';
import {
  db, store, TYPES, UPLOAD_DIR, FILE_RE, getConfig, getTeachers, getTeacher, submissionsOpen,
  teacherMeta, teacherByToken, newToken, teacherUrl, listUrl, isSpecial, findItem, fileOwnerOf, addItem, setStatus, deleteItem,
  parseDrawing, saveDrawing, normCls, cardView, secretView, adminView, approvedCardsOf,
  teacherPublic, getStats, getStateJson, invalidate, newestFirst,
} from './core.js';

const MSG = {
  bad: 'Lời nhắn có từ chưa phù hợp, bạn sửa lại nhé.',
  closed: 'Đã hết hạn gửi, cảm ơn bạn!',
  rate: 'Bạn gửi nhanh quá, đợi một chút rồi thử lại nhé.',
  noTeacher: 'Không tìm thấy thầy cô này.',
  admin: 'Sai mật khẩu quản trị.',
  token: 'Mã truy cập không đúng hoặc đã được cấp lại.',
  notFound: 'Không tìm thấy.',
};

// Lỗi có mã HTTP + thông điệp tiếng Việt
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new HttpError(status, msg); };
// Bọc handler: lỗi ném ra → { error }
const h = (fn) => (req, res, next) => { try { const r = fn(req, res, next); if (r?.catch) r.catch(next); } catch (e) { next(e); } };

// ---------- Giới hạn tần suất theo IP (cửa sổ trượt 60 giây, giữ trong bộ nhớ) ----------
const hits = new Map(); // "loại|ip" → [mốc thời gian]
function rateCheck(kind, ip, max) {
  const key = kind + '|' + ip;
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < 60_000);
  hits.set(key, arr);
  if (arr.length >= max) fail(429, MSG.rate);
  return () => arr.push(now); // gọi khi gửi thành công mới tính lượt
}
// Cả lớp dùng chung wifi trường = chung 1 IP (NAT) → giới hạn chính theo từng máy (x-client-id),
// IP chỉ có trần cao (gấp 40 lần) để chặn spam lớn.
const IP_FACTOR = 40;
function rateLimit(kind, req, ipAddr, max) {
  const cid = String(req.get('x-client-id') || '').replace(/[^\w-]/g, '').slice(0, 64);
  const checks = [rateCheck(kind, 'ip:' + ipAddr, max * IP_FACTOR)];
  checks.push(rateCheck(kind, cid ? 'c:' + cid : 'ipc:' + ipAddr, cid ? max : max * 4));
  return () => checks.forEach((c) => c());
}
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of hits) if (!arr.length || now - arr[arr.length - 1] > 60_000) hits.delete(k);
}, 60_000).unref();

// ---------- Kiểm tra dữ liệu ----------
function str(v, max, label, { required = false } = {}) {
  const s = typeof v === 'string' ? v.normalize('NFC').trim() : v == null ? '' : fail(400, `${label} không hợp lệ.`);
  if (required && !s) fail(400, `Bạn chưa nhập ${label.toLowerCase()}.`);
  if ([...s].length > max) fail(400, `${label} dài quá (tối đa ${max} ký tự).`);
  return s;
}
function clean(...texts) { if (texts.some((t) => hasBadWords(t))) fail(400, MSG.bad); }
function readCls(v) {
  const c = normCls(str(v, 24, 'Tên lớp'));
  if ([...c].length > 12) fail(400, 'Tên lớp dài quá (tối đa 12 ký tự).');
  return c;
}
function readDrawing(v) {
  if (v == null || v === '') return null;
  try { return parseDrawing(v); } catch (e) { fail(400, e.message); }
}
// Kẹp số như sticker: x, y, s (tỉ lệ), r (góc)
const num = (x, lo, hi, d) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d);
const place = (o) => ({ x: num(o.x, -10000, 10000, 0), y: num(o.y, -10000, 10000, 0), s: num(o.s, 0.05, 20, 1), r: num(o.r, -1000, 1000, 0) });
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
function readStickers(v) {
  if (v == null) return [];
  if (!Array.isArray(v) || v.length > 60) fail(400, 'Sticker không hợp lệ (tối đa 60).');
  return v.map((s) => {
    if (!isObj(s)) fail(400, 'Sticker không hợp lệ.');
    const id = String(s.id ?? '').slice(0, 40);
    if (!id) fail(400, 'Sticker không hợp lệ.');
    return { id, ...place(s) };
  });
}
// Card.style (CONTRACT 7.2): ≤ 8 khoá chỉ chữ cái, giá trị chuỗi ≤ 40 ký tự hoặc số hữu hạn
function readStyle(v) {
  if (v == null) return undefined;
  if (!isObj(v)) fail(400, 'Kiểu trang trí không hợp lệ.');
  const keys = Object.keys(v);
  if (keys.length > 8) fail(400, 'Kiểu trang trí không hợp lệ (tối đa 8 mục).');
  const out = {};
  for (const k of keys) {
    const val = v[k];
    const okVal = (typeof val === 'string' && val.length <= 40) || (typeof val === 'number' && Number.isFinite(val));
    if (!/^[a-zA-Z]{1,20}$/.test(k) || !okVal) fail(400, 'Kiểu trang trí không hợp lệ.');
    out[k] = val;
  }
  return out;
}
// Card.texts: ≤ 8 ô chữ { t ≤ 80, x, y, s, r, color?, font? }
function readTexts(v) {
  if (v == null) return undefined;
  if (!Array.isArray(v) || v.length > 8) fail(400, 'Ô chữ không hợp lệ (tối đa 8).');
  return v.map((o, i) => {
    if (!isObj(o)) fail(400, 'Ô chữ không hợp lệ.');
    const out = { t: str(o.t, 80, `Ô chữ ${i + 1}`, { required: true }), ...place(o) };
    for (const k of ['color', 'font']) {
      if (o[k] == null) continue;
      if (typeof o[k] !== 'string' || o[k].length > 40) fail(400, 'Ô chữ không hợp lệ.');
      out[k] = o[k];
    }
    return out;
  });
}
function readTemplate(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.length <= 40) return v;
  if (v == null) return 0;
  fail(400, 'Mẫu thiệp không hợp lệ.');
}
const COLOR_RE = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{1,20})$/;

export function createApi({ notify, getIp }) {
  const api = express.Router();
  const ip = (req) => getIp(req);
  // 600 KB ảnh ≈ 800 KB base64 + phần chữ → giới hạn 1 MB
  api.use(express.json({ limit: '1mb' }));

  // Hạn nộp (trừ via / quiz answer)
  const open = () => { if (!submissionsOpen()) fail(403, MSG.closed); };
  // autoApprove chỉ áp dụng cho nội dung KHÔNG có hình vẽ: CLAUDE.md 4.10 "ảnh vẽ tay luôn qua duyệt"
  const initialStatus = (hasDrawing) => (getConfig().autoApprove && !hasDrawing ? 'approved' : 'pending');
  const base = (req) => ({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ip: ip(req) });

  // ================= Công khai =================
  api.get('/state', (req, res) => { res.type('json').set('Cache-Control', 'no-cache').send(getStateJson()); });
  api.get('/stats', (req, res) => res.json(getStats()));

  api.get('/teachers/:id/cards', h((req, res) => {
    if (!getTeacher(req.params.id)) fail(404, MSG.noTeacher);
    res.json(approvedCardsOf(req.params.id).map((c) => cardView(c)));
  }));

  api.post('/cards', h((req, res) => {
    open();
    const b = req.body || {};
    if (!getTeacher(b.teacherId)) fail(400, MSG.noTeacher);
    const anonymous = !!b.anonymous;
    const from = str(b.from, 40, 'Tên');
    const cls = readCls(b.cls);
    const drawing = readDrawing(b.drawing);
    const message = str(b.message, 600, 'Lời chúc', { required: !drawing });
    const stickers = readStickers(b.stickers);
    const template = readTemplate(b.template);
    const style = readStyle(b.style);
    const texts = readTexts(b.texts);
    clean(message, from, cls, ...(texts || []).map((x) => x.t));
    const commit = rateLimit('cards', req, ip(req), 5);
    const status = initialStatus(!!drawing);
    const item = { ...base(req), teacherId: b.teacherId, from, cls, anonymous, message, template,
      stickers, ...(style ? { style } : {}), ...(texts ? { texts } : {}),
      drawing: drawing ? saveDrawing(drawing) : null, status };
    addItem('cards', item);
    commit();
    if (status === 'approved') notify('cards', item.teacherId);
    res.json({ ok: true, id: item.id, status });
  }));

  api.post('/cranes', h((req, res) => {
    open();
    const b = req.body || {};
    const from = str(b.from, 40, 'Tên');
    const cls = readCls(b.cls);
    const message = str(b.message, 120, 'Lời nhắn', { required: true });
    const color = typeof b.color === 'string' && COLOR_RE.test(b.color) ? b.color : '#E9973B';
    clean(message, from, cls);
    const commit = rateLimit('cranes', req, ip(req), 5);
    const status = initialStatus(false);
    const item = { ...base(req), from, cls, message, color, status };
    addItem('cranes', item);
    commit();
    if (status === 'approved') notify('cranes');
    res.json({ ok: true, id: item.id, status });
  }));

  api.post('/signatures', h((req, res) => {
    open();
    const b = req.body || {};
    const name = str(b.name, 40, 'Tên', { required: true });
    const cls = readCls(b.cls);
    const drawing = readDrawing(b.drawing);
    clean(name, cls);
    const commit = rateLimit('signatures', req, ip(req), 5);
    const status = initialStatus(!!drawing);
    const item = { ...base(req), name, cls, drawing: drawing ? saveDrawing(drawing) : null, status };
    addItem('signatures', item);
    commit();
    if (status === 'approved') notify('signatures');
    res.json({ ok: true, id: item.id, status });
  }));

  api.post('/secrets', h((req, res) => {
    open();
    const b = req.body || {};
    const target = getTeacher(b.teacherId) || fail(400, MSG.noTeacher);
    if (isSpecial(target)) fail(400, 'Không gửi được tới cây này.');
    const anonymous = !!b.anonymous;
    const from = str(b.from, 40, 'Tên');
    const cls = readCls(b.cls);
    const message = str(b.message, 1000, 'Lời nhắn', { required: true });
    clean(message, from, cls);
    const commit = rateLimit('secrets', req, ip(req), 5);
    // Lời chưa nói: luôn chờ ban tổ chức lọc, chỉ thầy cô đó đọc được
    const item = { ...base(req), teacherId: b.teacherId, from, cls, anonymous, message, status: 'pending' };
    addItem('secrets', item);
    commit();
    res.json({ ok: true, id: item.id });
  }));

  api.get('/quiz', (req, res) => {
    const out = [];
    for (const t of getTeachers()) {
      if (isSpecial(t)) continue;
      const qs = db.quiz[t.id];
      if (Array.isArray(qs) && qs.length) out.push({ teacherId: t.id, questions: qs.map(({ id, q, options }) => ({ id, q, options })) });
    }
    res.json(out);
  });

  api.post('/quiz/answer', h((req, res) => {
    const { questionId, choice } = req.body || {};
    for (const qs of Object.values(db.quiz)) {
      const q = Array.isArray(qs) && qs.find((x) => x.id === questionId);
      if (q) return res.json({ correct: Number(choice) === q.answer, answer: q.answer });
    }
    fail(404, 'Không tìm thấy câu hỏi.');
  }));

  api.post('/via', h((req, res) => {
    const subject = typeof req.body?.subject === 'string' ? req.body.subject : '';
    if (!(getConfig().subjects || []).includes(subject)) fail(400, 'Môn học không hợp lệ.');
    rateLimit('via', req, ip(req), 30)();
    db.via.total++;
    db.via.bySubject[subject] = (db.via.bySubject[subject] || 0) + 1;
    store.save('via');
    invalidate();
    notify('via');
    res.json({ subject, mine: null, subjectTotal: db.via.bySubject[subject], total: db.via.total });
  }));

  // ================= Quản trị =================
  const admin = express.Router();
  const adminFails = new Map();
  admin.use((req, res, next) => {
    const key = req.get('x-admin-key') || (req.path.startsWith('/media/') ? String(req.query.key || '') : '');
    const want = process.env.ADMIN_KEY;
    const ok = key && key.length === want.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(want));
    if (ok) return next();
    // Chặn dò mật khẩu: tối đa 20 lần sai / phút / IP
    const k = ip(req), now = Date.now();
    const arr = (adminFails.get(k) || []).filter((t) => now - t < 60_000);
    arr.push(now); adminFails.set(k, arr);
    res.status(arr.length > 20 ? 429 : 401).json({ error: arr.length > 20 ? MSG.rate : MSG.admin });
  });

  const readType = (t) => (TYPES.includes(t) ? t : fail(400, 'Loại nội dung không hợp lệ.'));
  const ACTIONS = { approve: 'approved', hide: 'hidden' };
  // Áp dụng 1 hành động; trả teacherId nếu có để báo client
  function moderate(type, id, action) {
    const it = findItem(type, id);
    if (!it) return false;
    if (action === 'delete') deleteItem(type, id);
    else if (ACTIONS[action]) setStatus(type, id, ACTIONS[action]);
    else fail(400, 'Hành động không hợp lệ.');
    return it;
  }
  const notifyFor = (type, it) => { if (type !== 'secrets') notify(type, type === 'cards' ? it.teacherId : undefined); };

  admin.get('/queue', h((req, res) => {
    const type = readType(req.query.type);
    const status = req.query.status || 'pending';
    if (!['pending', 'approved', 'hidden', 'all'].includes(status)) fail(400, 'Trạng thái không hợp lệ.');
    const list = db[type].filter((x) => status === 'all' || x.status === status).sort(newestFirst);
    res.json(list.map((x) => adminView(type, x)));
  }));

  admin.post('/moderate', h((req, res) => {
    const { type, id, action } = req.body || {};
    readType(type);
    if (!['approve', 'hide', 'delete'].includes(action)) fail(400, 'Hành động không hợp lệ.');
    const it = moderate(type, id, action);
    if (!it) fail(404, MSG.notFound);
    notifyFor(type, it);
    res.json({ ok: true });
  }));

  admin.post('/moderate-bulk', h((req, res) => {
    const { type, ids, action } = req.body || {};
    readType(type);
    if (!['approve', 'hide', 'delete'].includes(action)) fail(400, 'Hành động không hợp lệ.');
    if (!Array.isArray(ids) || ids.length > 2000) fail(400, 'Danh sách không hợp lệ.');
    let n = 0;
    const teachers = new Set();
    for (const id of ids) {
      const it = moderate(type, id, action);
      if (it) { n++; teachers.add(it.teacherId); }
    }
    if (n && type !== 'secrets') {
      if (type === 'cards') for (const t of teachers) notify('cards', t);
      else notify(type);
    }
    res.json({ ok: true, n });
  }));

  admin.get('/teachers', h((req, res) => {
    res.json(getTeachers().map((t) => {
      const m = teacherMeta(t.id);
      const sp = isSpecial(t); // đại thụ: không có trang thầy cô
      return {
        ...teacherPublic(t), token: sp ? null : m.token,
        teacherUrl: sp ? null : teacherUrl(m.token), listUrl: sp ? null : listUrl(m.token),
        pendingCards: db.cards.filter((c) => c.teacherId === t.id && c.status === 'pending').length,
        secrets: db.secrets.filter((s) => s.teacherId === t.id).length,
      };
    }));
  }));

  admin.post('/teachers/:id/token', h((req, res) => {
    const t = getTeacher(req.params.id) || fail(404, MSG.noTeacher);
    if (isSpecial(t)) fail(400, 'Cây đại thụ không có trang thầy cô.');
    const m = teacherMeta(req.params.id);
    m.token = newToken();
    store.save('teacherMeta');
    res.json({ token: m.token, teacherUrl: teacherUrl(m.token), listUrl: listUrl(m.token) });
  }));

  admin.get('/settings', (req, res) => res.json(getConfig()));
  admin.post('/settings', h((req, res) => {
    const b = req.body || {};
    const s = db.settings;
    if ('autoApprove' in b) {
      if (typeof b.autoApprove !== 'boolean') fail(400, 'autoApprove phải là true/false.');
      s.autoApprove = b.autoApprove;
    }
    if ('submissionsCloseAt' in b) {
      const v = b.submissionsCloseAt;
      if (v !== null && (typeof v !== 'string' || Number.isNaN(Date.parse(v)))) fail(400, 'Thời hạn không hợp lệ.');
      s.submissionsCloseAt = v; // null = không khoá
    }
    store.save('settings');
    invalidate();
    notify('settings');
    res.json(getConfig());
  }));

  admin.get('/book/:teacherId', h((req, res) => {
    const id = req.params.teacherId;
    const list = id === 'all' ? getTeachers() : [getTeacher(id) || fail(404, MSG.noTeacher)];
    res.json({
      teachers: list.map((t) => {
        const cards = approvedCardsOf(t.id);
        const entry = { teacher: teacherPublic(t, cards.length), cards: cards.map((c) => cardView(c, '/api/admin/media/')) };
        entry.secrets = teacherMeta(t.id).includeSecretsInBook
          ? db.secrets.filter((s) => s.teacherId === t.id && s.status === 'approved').sort(newestFirst).map(secretView)
          : [];
        return entry;
      }),
    });
  }));

  admin.get('/media/:file', h((req, res) => sendUpload(res, req.params.file, 'private, no-store')));

  admin.get('/export', (req, res) => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    res.set('Content-Disposition', `attachment; filename="may-academy-db-${stamp}.json"`);
    res.json({ exportedAt: new Date().toISOString(), ...db });
  });

  api.use('/admin', admin);

  // ================= Thầy cô =================
  const teacher = express.Router();
  teacher.use((req, res, next) => {
    // Nhận token qua header hoặc ?token= (cắt phần thừa nếu client nối "?token=" hai lần)
    const raw = req.get('x-teacher-token') || String(req.query.token || '').split('?')[0];
    const t = teacherByToken(raw);
    if (!t) return res.status(401).json({ error: MSG.token });
    req.teacher = t;
    req.teacherToken = raw;
    next();
  });

  teacher.get('/me', (req, res) => {
    const t = req.teacher, m = teacherMeta(t.id);
    const cards = approvedCardsOf(t.id);
    const suffix = '?token=' + encodeURIComponent(m.token);
    res.json({
      teacher: teacherPublic(t, cards.length),
      cards: cards.map((c) => cardView(c, '/api/teacher/media/', suffix)),
      secrets: db.secrets.filter((s) => s.teacherId === t.id && s.status === 'approved').sort(newestFirst).map(secretView),
      quiz: db.quiz[t.id] || [],
      reply: m.reply || null,
      includeSecretsInBook: !!m.includeSecretsInBook,
    });
  });

  teacher.post('/reply', h((req, res) => {
    const text = str(req.body?.text, 300, 'Lời hồi âm');
    teacherMeta(req.teacher.id).reply = text || null;
    store.save('teacherMeta');
    invalidate();
    notify('reply', req.teacher.id);
    res.json({ ok: true });
  }));

  teacher.put('/quiz', h((req, res) => {
    const qs = req.body?.questions;
    if (!Array.isArray(qs) || qs.length > 3) fail(400, 'Tối đa 3 câu hỏi.');
    const old = db.quiz[req.teacher.id] || [];
    const list = qs.map((x, i) => {
      if (!x || typeof x !== 'object') fail(400, `Câu ${i + 1} không hợp lệ.`);
      const q = str(x.q, 200, `Câu hỏi ${i + 1}`, { required: true });
      if (!Array.isArray(x.options) || x.options.length !== 4) fail(400, `Câu ${i + 1} cần đúng 4 lựa chọn.`);
      const options = x.options.map((o, j) => str(o, 100, `Lựa chọn ${j + 1} của câu ${i + 1}`, { required: true }));
      if (!Number.isInteger(x.answer) || x.answer < 0 || x.answer > 3) fail(400, `Câu ${i + 1} chưa chọn đáp án đúng.`);
      // Giữ id cũ nếu câu hỏi không đổi nội dung
      const same = old.find((o) => o.q === q);
      return { id: same?.id || crypto.randomUUID(), q, options, answer: x.answer };
    });
    db.quiz[req.teacher.id] = list;
    store.save('quiz');
    invalidate();
    res.json({ ok: true });
  }));

  teacher.post('/settings', h((req, res) => {
    const v = req.body?.includeSecretsInBook;
    if (typeof v !== 'boolean') fail(400, 'Giá trị không hợp lệ.');
    teacherMeta(req.teacher.id).includeSecretsInBook = v;
    store.save('teacherMeta');
    res.json({ ok: true });
  }));

  // Ảnh: chỉ ảnh thuộc thiệp đã duyệt của chính thầy cô đó
  teacher.get('/media/:file', h((req, res) => {
    const o = fileOwnerOf(req.params.file);
    if (!o?.item || o.type !== 'cards' || o.item.teacherId !== req.teacher.id || o.item.status !== 'approved') fail(404, MSG.notFound);
    sendUpload(res, req.params.file, 'private, max-age=300');
  }));

  api.use('/teacher', teacher);

  // 404 + lỗi chung cho /api
  api.use((req, res) => res.status(404).json({ error: MSG.notFound }));
  api.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Dữ liệu gửi lên quá lớn (hình vẽ tối đa 600 KB).' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Dữ liệu gửi lên không hợp lệ.' });
    console.error('[api]', err);
    res.status(500).json({ error: 'Máy chủ gặp lỗi, bạn thử lại sau nhé.' });
  });

  return api;
}

/** Gửi file ảnh trong data/uploads (đã kiểm tra tên) */
export function sendUpload(res, file, cacheControl) {
  if (!FILE_RE.test(file)) fail(404, MSG.notFound);
  res.set('Cache-Control', cacheControl);
  res.set('X-Content-Type-Options', 'nosniff');
  res.sendFile(path.join(UPLOAD_DIR, file), (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: MSG.notFound });
  });
}

/** /media/:file – công khai, chỉ ảnh của nội dung đã duyệt (không bao giờ là lời chưa nói) */
export function publicMedia(req, res) {
  const o = fileOwnerOf(req.params.file);
  if (!o?.item || o.item.status !== 'approved' || !['cards', 'signatures'].includes(o.type)) {
    return res.status(404).json({ error: MSG.notFound });
  }
  try { sendUpload(res, req.params.file, 'public, max-age=300'); } catch { res.status(404).json({ error: MSG.notFound }); }
}
