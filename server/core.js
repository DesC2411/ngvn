// Lõi dữ liệu: đọc teachers/config, kho JSON, ảnh vẽ tay, các "view" công khai và thống kê.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { openStore } from './store.js';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const SOURCE_DATA = path.join(ROOT, 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const store = openStore(path.join(DATA_DIR, 'db'));
const db = store.data;

export const TYPES = ['cards', 'cranes', 'signatures', 'secrets'];
export const MAX_DRAWING_BYTES = 600 * 1024;
export const ANON_NAME = 'Một bạn học sinh';

// ---------- Dữ liệu gốc (đọc lại khi file đổi, để sửa teachers.json không cần khởi động lại) ----------
function sourceFile(name) {
  const p = path.join(DATA_DIR, name);
  return fs.existsSync(p) ? p : path.join(SOURCE_DATA, name);
}
const fileCache = {};
function readJsonCached(name) {
  const file = sourceFile(name);
  const c = fileCache[name];
  if (c && Date.now() - c.checked < 2000) return c.value;
  const mtime = fs.statSync(file).mtimeMs;
  if (c && c.mtime === mtime && c.file === file) { c.checked = Date.now(); return c.value; }
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  fileCache[name] = { file, mtime, value, checked: Date.now() };
  if (name === 'teachers.json') onTeachersLoaded(value);
  invalidate();
  return value;
}

export function getTeachers() { return readJsonCached('teachers.json'); }
export function getTeacher(id) { return getTeachers().find((t) => t.id === id) || null; }

/** config.json + settings.json (admin ghi đè) */
export function getConfig() {
  const base = readJsonCached('config.json');
  return { ...base, ...db.settings };
}
export function submissionsOpen() {
  const close = getConfig().submissionsCloseAt;
  if (!close) return true;
  const t = Date.parse(close);
  return Number.isNaN(t) || Date.now() < t;
}

// ---------- Mã truy cập thầy cô ----------
export function newToken() { return crypto.randomBytes(12).toString('base64url'); }
// CONTRACT 6.1: link chính vào thế giới 3D; listUrl = bản xem nhanh dạng danh sách
export function teacherUrl(token) { return `/?teacher=${token}`; }
export function listUrl(token) { return `/teacher.html?token=${token}`; }
export const TEACHER_CLS = 'GV'; // lớp của thầy cô – không tính vào bảng xếp hạng lớp
// Cây đại thụ (CONTRACT 7.1): không có trang thầy cô/token/hồi âm/câu đố/lời chưa nói
export const isSpecial = (t) => !!t?.special;

function onTeachersLoaded(list) {
  let changed = false;
  for (const t of list) {
    const m = db.teacherMeta[t.id] || (db.teacherMeta[t.id] = { token: null, reply: null, includeSecretsInBook: false });
    if (isSpecial(t)) { if (m.token) { m.token = null; changed = true; } continue; }
    if (!m.token) { m.token = newToken(); changed = true; }
  }
  if (changed) store.save('teacherMeta');
}
export function teacherMeta(id) {
  getTeachers(); // đảm bảo đã sinh token
  return db.teacherMeta[id] || { token: null, reply: null, includeSecretsInBook: false };
}
export function teacherByToken(token) {
  if (!token || typeof token !== 'string') return null;
  getTeachers();
  for (const [id, m] of Object.entries(db.teacherMeta)) {
    if (m.token && m.token.length === token.length &&
        crypto.timingSafeEqual(Buffer.from(m.token), Buffer.from(token))) {
      const t = getTeacher(id);
      return t && !isSpecial(t) ? t : null;
    }
  }
  return null;
}

// ---------- Chỉ mục id + ảnh ----------
const byId = Object.fromEntries(TYPES.map((t) => [t, new Map()]));
const fileOwner = new Map(); // tên file ảnh → { type, id }
for (const type of TYPES) {
  for (const it of db[type]) {
    byId[type].set(it.id, it);
    if (it.drawing) fileOwner.set(it.drawing, { type, id: it.id });
  }
}
export function findItem(type, id) { return byId[type]?.get(id) || null; }
export function fileOwnerOf(file) {
  const o = fileOwner.get(file);
  return o ? { ...o, item: findItem(o.type, o.id) } : null;
}

export function addItem(type, item) {
  db[type].push(item);
  byId[type].set(item.id, item);
  if (item.drawing) fileOwner.set(item.drawing, { type, id: item.id });
  store.save(type);
  invalidate();
}
export function setStatus(type, id, status) {
  const it = findItem(type, id);
  if (!it) return false;
  it.status = status;
  store.save(type);
  invalidate();
  return true;
}
export function deleteItem(type, id) {
  const it = findItem(type, id);
  if (!it) return false;
  const arr = db[type];
  const i = arr.indexOf(it);
  if (i >= 0) arr.splice(i, 1);
  byId[type].delete(id);
  if (it.drawing) {
    fileOwner.delete(it.drawing);
    fs.rm(path.join(UPLOAD_DIR, it.drawing), { force: true }, () => {});
  }
  store.save(type);
  invalidate();
  return true;
}

// ---------- Lời chúc viết sẵn cho đại thụ (data/seed/daithu.json) ----------
// { d01: [{ i, message, template, stickers, style?, texts? }], ... } → thiệp approved, seed:true, id cố định
// nên chạy lại không nhân đôi. createdAt rải đều trong ngày 13/11/2026 (giờ VN).
function loadSeed() {
  const file = [path.join(DATA_DIR, 'seed', 'daithu.json'), path.join(SOURCE_DATA, 'seed', 'daithu.json')].find((f) => fs.existsSync(f));
  if (!file) return 0;
  let seed;
  try { seed = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error('[seed] Lỗi đọc', file, e.message); return 0; }
  const ids = new Set(getTeachers().map((t) => t.id));
  const day0 = Date.parse('2026-11-13T00:00:00+07:00');
  let added = 0;
  for (const [teacherId, list] of Object.entries(seed || {})) {
    if (!ids.has(teacherId) || !Array.isArray(list)) continue;
    list.forEach((s, k) => {
      const id = `seed-${teacherId}-${s.i ?? k}`;
      if (byId.cards.has(id)) return;
      const item = {
        id, teacherId, from: '', cls: '', anonymous: false, message: String(s.message || ''),
        template: s.template ?? 0, stickers: Array.isArray(s.stickers) ? s.stickers : [], drawing: null,
        createdAt: new Date(day0 + Math.floor(((k + 0.5) / list.length) * 86_400_000)).toISOString(),
        ip: '', status: 'approved', seed: true,
      };
      if (s.style && typeof s.style === 'object') item.style = s.style;
      if (Array.isArray(s.texts)) item.texts = s.texts;
      db.cards.push(item);
      byId.cards.set(id, item);
      added++;
    });
  }
  if (added) { store.save('cards'); invalidate(); }
  return added;
}
// ---------- Ảnh vẽ tay ----------
const MAGIC = {
  png: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  jpg: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  webp: (b) => b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
};
/** Kiểm tra data URL; trả { buf, ext } hoặc ném lỗi tiếng Việt */
export function parseDrawing(dataUrl) {
  if (typeof dataUrl !== 'string') throw new Error('Hình vẽ không hợp lệ.');
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!m) throw new Error('Hình vẽ không hợp lệ (chỉ nhận PNG, JPEG, WebP).');
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  if (m[2].length > Math.ceil(MAX_DRAWING_BYTES * 4 / 3) + 16) throw new Error('Hình vẽ nặng quá (tối đa 600 KB).');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_DRAWING_BYTES) throw new Error('Hình vẽ nặng quá (tối đa 600 KB).');
  if (!MAGIC[ext](buf)) throw new Error('Hình vẽ không hợp lệ.');
  return { buf, ext };
}
export function saveDrawing({ buf, ext }) {
  const file = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, file), buf);
  return file;
}
export const FILE_RE = /^[0-9a-f-]{36}\.(png|jpg|webp)$/;

// ---------- Chuẩn hoá lớp: "lop 9a1" / "Lớp 9 A1" → "9A1" ----------
export function normCls(s) {
  let c = String(s ?? '').normalize('NFC').trim().toUpperCase().replace(/\s+/g, '');
  c = c.replace(/^(LỚP|LOP|L\.)/, '');
  return c;
}

// ---------- View công khai ----------
// mediaBase: '/media/' (công khai) | '/api/admin/media/' | '/api/teacher/media/' ; suffix vd '?token=...'
function url(file, mediaBase, suffix = '') { return file ? mediaBase + file + suffix : null; }

export function cardView(c, mediaBase = '/media/', suffix = '') {
  const anon = c.anonymous || !c.from;
  return {
    id: c.id, teacherId: c.teacherId,
    // Thiệp seed (đại thụ): không có chữ ký người gửi → from/cls rỗng
    from: c.seed ? '' : anon ? ANON_NAME : c.from, cls: c.anonymous || c.seed ? '' : c.cls,
    anonymous: !!c.anonymous, message: c.message, template: c.template,
    drawingUrl: url(c.drawing, mediaBase, suffix), stickers: c.stickers || [],
    style: c.style || {}, texts: c.texts || [], seed: !!c.seed, createdAt: c.createdAt,
  };
}
export const craneView = (c) => ({ id: c.id, from: c.from || ANON_NAME, cls: c.cls, message: c.message, color: c.color, createdAt: c.createdAt });
export const signatureView = (s) => ({ id: s.id, name: s.name, cls: s.cls, drawingUrl: url(s.drawing, '/media/'), createdAt: s.createdAt });
export const secretView = (s) => ({
  id: s.id, from: s.anonymous || !s.from ? ANON_NAME : s.from, cls: s.anonymous ? '' : s.cls,
  anonymous: !!s.anonymous, message: s.message, createdAt: s.createdAt,
});
/** Bản đầy đủ cho admin */
export function adminView(type, it) {
  const { drawing, ...rest } = it;
  const out = { ...rest };
  if (type !== 'secrets' && type !== 'cranes') out.drawingUrl = url(drawing, '/api/admin/media/');
  return out;
}

export const approved = (type) => db[type].filter((x) => x.status === 'approved');
export const newestFirst = (a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0);

export function approvedCardsOf(teacherId) {
  return db.cards.filter((c) => c.teacherId === teacherId && c.status === 'approved').sort(newestFirst);
}

export function teacherPublic(t, cardCount) {
  const m = teacherMeta(t.id);
  const qz = db.quiz[t.id];
  return {
    id: t.id, title: t.title, name: t.name, dept: t.dept, role: t.role, tree: t.tree, photo: t.photo,
    special: t.special || null,
    reply: isSpecial(t) ? null : m.reply || null,
    cardCount: cardCount ?? approvedCardsOf(t.id).length,
    hasQuiz: !isSpecial(t) && Array.isArray(qz) && qz.length > 0,
  };
}

// ---------- Thống kê + bảng lớp (có cache, xoá khi dữ liệu đổi) ----------
let statsCache = null;
let stateCache = null;
export function invalidate() { statsCache = null; stateCache = null; }

export function getStats() {
  if (statsCache && Date.now() - statsCache.at < 5000) return statsCache.value;
  const perTeacher = {};
  for (const t of getTeachers()) perTeacher[t.id] = 0;
  const classes = new Map();
  const bump = (cls, key, w) => {
    const c = normCls(cls);
    if (!c || c === TEACHER_CLS) return; // thầy cô gửi (cls "GV") không tính xếp hạng lớp
    const row = classes.get(c) || { cls: c, score: 0, cards: 0, cranes: 0, signatures: 0 };
    row[key]++; row.score += w;
    classes.set(c, row);
  };
  let cards = 0, cranes = 0, signatures = 0;
  for (const c of db.cards) if (c.status === 'approved') {
    cards++; perTeacher[c.teacherId] = (perTeacher[c.teacherId] || 0) + 1;
    if (!c.seed) bump(c.cls, 'cards', 3); // thiệp seed không tính bảng lớp
  }
  for (const c of db.cranes) if (c.status === 'approved') { cranes++; bump(c.cls, 'cranes', 1); }
  for (const s of db.signatures) if (s.status === 'approved') { signatures++; bump(s.cls, 'signatures', 1); }
  const leaderboard = [...classes.values()]
    .sort((a, b) => b.score - a.score || a.cls.localeCompare(b.cls, 'vi'))
    .slice(0, 10);
  const cfg = getConfig();
  const value = {
    cards, cranes, signatures,
    via: db.via.total, viaBySubject: { ...db.via.bySubject },
    perTeacher, leaderboard,
    eventDate: cfg.eventDate, submissionsOpen: submissionsOpen(),
  };
  statsCache = { at: Date.now(), value };
  return value;
}

/** /api/state – chuỗi JSON dựng sẵn, dùng chung cho mọi client */
export function getStateJson() {
  if (stateCache && Date.now() - stateCache.at < 5000) return stateCache.json;
  const stats = getStats();
  const json = JSON.stringify({
    config: getConfig(),
    teachers: getTeachers().map((t) => teacherPublic(t, stats.perTeacher[t.id] || 0)),
    stats,
    cranes: approved('cranes').sort(newestFirst).slice(0, 300).map(craneView),
    signatures: approved('signatures').sort(newestFirst).slice(0, 500).map(signatureView),
  });
  stateCache = { at: Date.now(), json };
  return json;
}

// Nạp seed sau cùng (cần các biến cache ở trên đã khai báo)
export const seededCount = loadSeed();

export { db };
