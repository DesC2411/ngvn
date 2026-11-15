import { api } from './api.js';
import { createUI } from './ui/index.js';
import { createWorld } from './world/index.js';
import { connectNet } from './net.js';

const ui = createUI({ root: document.getElementById('ui-root'), api });

// Chế độ thầy cô (CONTRACT mục 6): link /?teacher=<token>
function readTeacherToken() {
  const params = new URLSearchParams(location.search);
  const fromUrl = params.get('teacher');
  if (fromUrl) {
    try { localStorage.setItem('ma_teacher_token', fromUrl); } catch { /* bỏ qua */ }
    history.replaceState(null, '', '/?gv=1'); // không để token nằm trên thanh địa chỉ
    return fromUrl;
  }
  if (params.has('gv')) {
    try { return localStorage.getItem('ma_teacher_token'); } catch { return null; }
  }
  return null;
}

async function boot() {
  ui.showLoading(0, 'Đang mở cổng trường…');
  let state;
  try {
    state = await api.getState();
  } catch (e) {
    ui.showLoading(0, e.message);
    return;
  }

  let profile;
  let teacherMe = null;
  const token = readTeacherToken();
  if (token) {
    try {
      teacherMe = await api.teacher.me(token);
    } catch {
      ui.showLoading(0, 'Link không đúng hoặc đã được đổi. Thầy cô nhờ ban tổ chức gửi lại link mới nhé.');
      return;
    }
    ui.hideLoading();
    await ui.showTeacherWelcome(teacherMe);
    const t = teacherMe.teacher;
    profile = {
      role: 'teacher',
      teacherId: t.id,
      token,
      name: `${t.title} ${t.name}`,
      cls: '',
      look: { gender: t.title === 'Cô' ? 'nu' : 'nam', outfit: 3, role: 'teacher' },
    };
  } else {
    ui.hideLoading();
    profile = { role: 'student', ...(await ui.showLogin(state.config)) };
    profile.look = { ...(profile.look || {}), role: 'student' };
  }

  ui.showLoading(0.05, 'Đang dựng khuôn viên May Academy…');
  let worldReady = false; // sau khi vào trường, tải thêm mô hình (bạn chơi khác) không được bật lại màn chờ
  const world = await createWorld({
    container: document.getElementById('scene'),
    teachers: state.teachers,
    profile,
    onProgress: (p) => { if (!worldReady) ui.showLoading(0.05 + p * 0.95, 'Đang dựng khuôn viên May Academy…'); },
    onInteract: (zone) => ui.openZone(zone),
    onNearChange: (zone) => ui.setPrompt(zone),
  });
  world.applyState(state);
  worldReady = true;
  ui.hideLoading();

  let refreshTimer = null;
  const refresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      try {
        const s = await api.getState();
        world.applyState(s);
        ui.applyState(s);
      } catch { /* thử lại ở lần sau */ }
    }, 2000);
  };

  const net = connectNet({
    profile,
    world,
    onOnline: (n) => ui.setOnline(n),
    onUpdate: refresh,
  });

  ui.attach({ world, state, profile, net, refresh, teacherMe });
  if (profile.role === 'teacher') {
    world.highlightTree?.(profile.teacherId);
    world.setGuide?.(`tree:${profile.teacherId}`);
  }
  setInterval(refresh, 60000);
  if (import.meta.env.DEV) window.__ma = { world, ui, api, net };
}

boot();
