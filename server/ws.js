// WebSocket /ws – nhiều người chơi, đúng docs/CONTRACT.md mục 4.
import { WebSocketServer } from 'ws';
import { hasBadWords } from './badwords.js';
import { normCls, teacherByToken, TEACHER_CLS } from './core.js';

const MAX_CONN = 300;
const NEAREST = 30;
const TICK_MS = 100;          // players 10 Hz
const ONLINE_MS = 5000;
const PING_MS = 30_000;
const MIN_POS_GAP = 80;       // ms; gói pos dày hơn ~12 Hz thì bỏ (cho phép chút lệch nhịp)
const LIMIT = 200;            // kẹp toạ độ ±200
const ANIMS = new Set(['idle', 'walk', 'run', 'wave', 'bow', 'kneel', 'jump', 'fall', 'heart', 'peace']);
const FULL_REASON = 'Trường đang đông, bạn thử lại sau nhé';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r2 = (v) => Math.round(v * 100) / 100;

export function createGameWs() {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4 * 1024, perMessageDeflate: false });
  let nextId = 1;
  const players = new Map(); // ws → player

  const send = (ws, obj) => { if (ws.readyState === 1) ws.send(typeof obj === 'string' ? obj : JSON.stringify(obj)); };
  const broadcast = (obj) => { const s = JSON.stringify(obj); for (const ws of wss.clients) send(ws, s); };

  wss.on('connection', (ws) => {
    if (wss.clients.size > MAX_CONN) { ws.close(1013, FULL_REASON); return; }
    const p = {
      id: 'p' + (nextId++).toString(36), joined: false, name: 'Học sinh', cls: '', look: { gender: 'nam', outfit: 0, role: 'student' },
      x: 0, z: 0, ry: 0, anim: 'idle', ver: 0, lastPos: 0, lastJoin: 0,
      seen: new Set(), lastKey: '', alive: true,
    };
    players.set(ws, p);
    ws.on('pong', () => { p.alive = true; });

    ws.on('message', (raw, isBinary) => {
      if (isBinary) return;
      let m;
      try { m = JSON.parse(raw.toString()); } catch { return; }
      if (!m || typeof m !== 'object') return;
      const now = Date.now();

      if (m.t === 'join') {
        if (now - p.lastJoin < 1000) return;
        p.lastJoin = now;
        // Thầy cô: chỉ tin token (CONTRACT 6.5) – tên/lớp lấy từ teachers.json, bỏ qua tên client gửi
        const teacher = typeof m.teacherToken === 'string' ? teacherByToken(m.teacherToken) : null;
        let name, cls;
        if (teacher) {
          name = `${teacher.title} ${teacher.name}`;
          cls = TEACHER_CLS;
        } else {
          name = typeof m.name === 'string' ? m.name.normalize('NFC').trim().slice(0, 40) : '';
          cls = typeof m.cls === 'string' ? normCls(m.cls).slice(0, 12) : '';
          // Tên/lớp bậy → "Học sinh", bỏ lớp
          if (!name || hasBadWords(name) || hasBadWords(cls)) { name = 'Học sinh'; if (hasBadWords(cls)) cls = ''; }
        }
        const look = m.look || {};
        p.name = name;
        p.cls = cls;
        p.look = {
          gender: look.gender === 'nu' ? 'nu' : 'nam',
          outfit: Number.isInteger(look.outfit) ? clamp(look.outfit, 0, 3) : 0,
          role: teacher ? 'teacher' : 'student', // client tự gửi role='teacher' cũng không được tính
        };
        p.ver++;
        if (!p.joined) { p.joined = true; send(ws, { t: 'welcome', id: p.id }); send(ws, { t: 'online', n: onlineCount() }); }
        return;
      }

      if (m.t === 'pos' && p.joined) {
        if (now - p.lastPos < MIN_POS_GAP) return; // quá 10 Hz → bỏ
        const { x, z, ry } = m;
        if (!Number.isFinite(x) || !Number.isFinite(z)) return;
        p.lastPos = now;
        p.x = r2(clamp(x, -LIMIT, LIMIT));
        p.z = r2(clamp(z, -LIMIT, LIMIT));
        p.ry = Number.isFinite(ry) ? r2(Math.atan2(Math.sin(ry), Math.cos(ry))) : 0;
        p.anim = ANIMS.has(m.anim) ? m.anim : 'idle';
        p.ver++;
      }
    });

    ws.on('close', () => {
      players.delete(ws);
      if (p.joined) {
        const s = JSON.stringify({ t: 'leave', id: p.id });
        for (const [ows, op] of players) if (op.joined) { op.seen.delete(p.id); send(ows, s); }
      }
    });
    ws.on('error', () => {});
  });

  const onlineCount = () => { let n = 0; for (const p of players.values()) if (p.joined) n++; return n; };

  // Mỗi tick: gửi cho từng người ≤30 người gần nhất. Không gửi lại nếu danh sách & vị trí không đổi.
  // Ai rơi khỏi danh sách gần nhất thì gửi "leave" để client gỡ nhân vật đó.
  const tick = setInterval(() => {
    const all = [];
    for (const p of players.values()) if (p.joined) all.push(p);
    if (all.length === 0) return;
    for (const [ws, me] of players) {
      if (!me.joined || ws.readyState !== 1) continue;
      let near;
      if (all.length - 1 <= NEAREST) near = all.filter((o) => o !== me);
      else {
        near = all.filter((o) => o !== me)
          .map((o) => ({ o, d: (o.x - me.x) ** 2 + (o.z - me.z) ** 2 }))
          .sort((a, b) => a.d - b.d).slice(0, NEAREST).map((e) => e.o);
      }
      const key = near.map((o) => o.id + ':' + o.ver).join(',');
      if (key === me.lastKey) continue;
      me.lastKey = key;
      const ids = new Set(near.map((o) => o.id));
      for (const id of me.seen) if (!ids.has(id)) send(ws, { t: 'leave', id });
      me.seen = ids;
      if (!near.length) continue;
      send(ws, { t: 'players', list: near.map((o) => ({ id: o.id, name: o.name, cls: o.cls, look: o.look, x: o.x, z: o.z, ry: o.ry, anim: o.anim })) });
    }
  }, TICK_MS);

  const online = setInterval(() => {
    const s = JSON.stringify({ t: 'online', n: onlineCount() });
    for (const [ws, p] of players) if (p.joined) send(ws, s);
  }, ONLINE_MS);

  // Ping/pong 30 giây: không trả pong → ngắt
  const ping = setInterval(() => {
    for (const [ws, p] of players) {
      if (!p.alive) { ws.terminate(); continue; }
      p.alive = false;
      try { ws.ping(); } catch {}
    }
  }, PING_MS);

  // update: gom lại tối đa 1 lần/giây cho mỗi (kind, teacherId) để không dội tin khi nhiều người xin vía
  const pending = new Map();
  let flushTimer = null;
  function notify(kind, teacherId) {
    pending.set(kind + '|' + (teacherId || ''), { t: 'update', kind, ...(teacherId ? { teacherId } : {}) });
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        for (const msg of pending.values()) broadcast(msg);
        pending.clear();
      }, 1000);
    }
  }

  function close() {
    clearInterval(tick); clearInterval(online); clearInterval(ping);
    for (const ws of wss.clients) ws.terminate();
    wss.close();
  }

  return { wss, notify, close, onlineCount };
}
