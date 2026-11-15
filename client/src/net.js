// Nhiều người chơi qua WebSocket – hợp đồng docs/CONTRACT.md mục 4
// connectNet({ profile, world, onOnline, onUpdate }) -> { close() }

const SEND_MS = 100;          // 10 Hz
const STALE_MS = 3000;        // không thấy trong gói "players" quá lâu → gỡ

export function connectNet({ profile = {}, world, onOnline = () => {}, onUpdate = () => {} } = {}) {
  const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  let ws = null;
  let closed = false;
  let retry = 0;
  let retryTimer = null;
  let sendTimer = null;
  let myId = null;
  let last = null;
  let lastSentAt = 0;
  const seen = new Map(); // id -> lastSeen

  const look = profile.look || { gender: 'nam', outfit: 0 };

  function send(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify(obj)); } catch { /* bỏ qua */ }
    }
  }

  function clearRemotes() {
    for (const id of seen.keys()) world && world.removeRemote(id);
    seen.clear();
  }

  function connect() {
    if (closed) return;
    try { ws = new WebSocket(url); } catch { schedule(); return; }
    ws.onopen = () => {
      retry = 0;
      last = null;
      const join = { t: 'join', name: String(profile.name || 'Học sinh').slice(0, 40), cls: String(profile.cls || '').slice(0, 12), look: { gender: look.gender === 'nu' ? 'nu' : 'nam', outfit: Math.max(0, Math.min(3, Number(look.outfit) || 0)) } };
      // thầy cô: server kiểm token rồi tự đặt tên "Thầy/Cô …", lớp "GV", look.role = 'teacher'
      if (profile.role === 'teacher' && profile.token) join.teacherToken = String(profile.token);
      send(join);
      startSending();
    };
    ws.onmessage = (ev) => {
      let m;
      try { m = JSON.parse(ev.data); } catch { return; }
      if (!m || typeof m !== 'object') return;
      switch (m.t) {
        case 'welcome': myId = m.id; break;
        case 'players': {
          const now = Date.now();
          for (const p of m.list || []) {
            if (myId !== null && String(p.id) === String(myId)) continue;
            seen.set(String(p.id), now);
            world && world.upsertRemote(p);
          }
          for (const [id, ts] of seen) {
            if (now - ts > STALE_MS) { seen.delete(id); world && world.removeRemote(id); }
          }
          break;
        }
        case 'leave':
          seen.delete(String(m.id));
          world && world.removeRemote(m.id);
          break;
        case 'online':
          try { onOnline(m.n); } catch (e) { console.error(e); }
          break;
        case 'update':
          try { onUpdate(m.kind, m); } catch (e) { console.error(e); }
          break;
        default: break;
      }
    };
    ws.onclose = (ev) => {
      stopSending();
      clearRemotes();
      ws = null;
      if (closed) return;
      // server đầy → chờ lâu hơn
      if (ev && ev.reason && /đông/i.test(ev.reason)) retry = Math.max(retry, 4);
      schedule();
    };
    ws.onerror = () => { /* onclose sẽ xử lý */ };
  }

  function schedule() {
    if (closed) return;
    clearTimeout(retryTimer);
    const base = Math.min(30000, 1000 * 2 ** retry);
    const delay = base * (0.7 + Math.random() * 0.6);
    retry = Math.min(retry + 1, 6);
    retryTimer = setTimeout(connect, delay);
  }

  function startSending() {
    stopSending();
    sendTimer = setInterval(() => {
      if (!world || document.hidden) return;
      const s = world.getPlayerState();
      const now = Date.now();
      const changed = !last || Math.abs(s.x - last.x) > 0.01 || Math.abs(s.z - last.z) > 0.01 || Math.abs(s.ry - last.ry) > 0.02 || s.anim !== last.anim;
      if (!changed) return; // chỉ gửi khi thay đổi

      last = s; lastSentAt = now;
      send({ t: 'pos', x: s.x, z: s.z, ry: s.ry, anim: s.anim });
    }, SEND_MS);
  }

  function stopSending() { clearInterval(sendTimer); sendTimer = null; }

  const onVis = () => {
    if (!document.hidden && !ws && !closed) { retry = 0; clearTimeout(retryTimer); connect(); }
  };
  document.addEventListener('visibilitychange', onVis);

  connect();

  return {
    close() {
      closed = true;
      clearTimeout(retryTimer);
      stopSending();
      document.removeEventListener('visibilitychange', onVis);
      if (ws) { try { ws.close(1000, 'bye'); } catch { /* bỏ qua */ } }
      clearRemotes();
    },
    get id() { return myId; },
    get connected() { return !!ws && ws.readyState === WebSocket.OPEN; },
  };
}
