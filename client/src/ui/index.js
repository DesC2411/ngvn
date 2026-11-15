// Giao diện học sinh – lớp HTML/CSS phủ lên cảnh 3D. Hợp đồng: docs/CONTRACT.md mục 5.
import '../styles/ui.css';
import '../styles/teacher.css';
import { h, store, countdown, pad2, fmtNum, isTouch, teacherName, clear } from './dom.js';
import { icon } from './icons.js';
import { createOverlayHost } from './sheet.js';
import { createLoading, showLogin as showLoginScreen, LOGO } from './screens.js';
import { PANELS } from './panels/index.js';
import teacherTree from './panels/teacherTree.js';
import teacherMail from './panels/teacherMail.js';
import { showTeacherWelcome as showTeacherWelcomeScreen, createTeacherTasks } from './teacherHud.js';

export const PENDING_MSG = 'Đã gửi! Thầy cô sẽ thấy sau khi ban tổ chức duyệt.';

const KIND_ICON = { gate: 'gate', tree: 'tree', crane: 'crane', chalkboard: 'board', secret: 'mail', photo: 'camera', quiz: 'quiz', leaderboard: 'trophy', shrine: 'shrine' };

export function createUI({ root, api } = {}) {
  root = root || document.body;
  const layer = h('div', { class: 'ma-ui' });
  root.append(layer);

  const S = {
    state: null, config: null, profile: null, world: null, net: null, refresh: null,
    online: null, zone: null, sheet: null, panel: null, attached: false, teacherMe: null, tasks: null,
  };

  const host = createOverlayHost(layer);
  const loading = createLoading(layer);
  const toast = host.toast;

  // ---------------------------------------------------------------- đếm ngược dùng chung
  const tickers = new Set();
  const eventDate = () => (S.state && S.state.config && S.state.config.eventDate) || (S.config && S.config.eventDate) || '2026-11-20T07:00:00+07:00';
  setInterval(() => {
    const c = countdown(eventDate());
    tickers.forEach((fn) => { try { fn(c); } catch { /* bỏ qua */ } });
  }, 1000);
  const onTick = (fn) => {
    tickers.add(fn);
    fn(countdown(eventDate()));
    return () => tickers.delete(fn);
  };

  // ---------------------------------------------------------------- HUD
  const hud = h('div', { class: 'ma-hud', hidden: true });
  layer.insertBefore(hud, layer.firstChild);

  const cdText = h('span', { class: 'ma-cd-text' });
  const cdChip = h('button', { type: 'button', class: 'ma-chip ma-cd', title: 'Đếm ngược tới 20/11', onclick: () => openZone({ id: 'gate', kind: 'gate', label: 'Xem đếm ngược' }) }, icon('clock'), cdText);
  const onlineNum = h('b', null, '–');
  const onlineChip = h('div', { class: 'ma-chip ma-online', title: 'Số bạn đang ở trong trường' }, h('i', { class: 'ma-dot' }), onlineNum, h('span', null, ' đang online'));
  const musicBtn = h('button', { type: 'button', class: 'ma-iconbtn ma-top-btn', hidden: true, 'aria-label': 'Bật nhạc nền', 'aria-pressed': 'false' }, icon('musicOff'));
  const helpBtn = h('button', { type: 'button', class: 'ma-iconbtn ma-top-btn', 'aria-label': 'Trợ giúp và bản đồ', onclick: () => openZone({ id: 'help', kind: 'help', label: 'Trợ giúp' }) }, icon('help'));
  const whoChip = h('div', { class: 'ma-chip ma-who', hidden: true });
  const top = h('header', { class: 'ma-top' },
    h('div', { class: 'ma-top-row' },
      h('div', { class: 'ma-brand' }, h('img', { src: LOGO, alt: '', width: 36, height: 36 }), h('div', { class: 'ma-brand-t' }, h('b', null, 'May Academy'), h('span', null, ' · Mùa Tri Ân'))),
      h('div', { class: 'ma-top-chips' }, whoChip, cdChip, onlineChip),
      h('div', { class: 'ma-top-btns' }, musicBtn, helpBtn),
    ),
  );
  onTick((c) => {
    if (c.done) {
      cdText.textContent = 'Chúc mừng 20/11!';
    } else {
      const long = `Còn ${c.d} ngày ${pad2(c.h)}:${pad2(c.m)}:${pad2(c.s)}`;
      cdText.textContent = long;
    }
  });

  // Nút hành động khi đứng gần
  const promptIc = h('span', { class: 'ma-prompt-ic' });
  const promptLabel = h('span', { class: 'ma-prompt-label' });
  const promptKey = h('kbd', { class: 'ma-kbd' }, 'E');
  const promptBtn = h('button', { type: 'button', class: 'ma-prompt', hidden: true, onclick: () => interact() }, promptIc, promptLabel, promptKey);
  const interactBtn = h('button', { type: 'button', class: 'ma-interact', hidden: true, 'aria-label': 'Tương tác', onclick: () => interact() }, icon('hand'), h('span', null, 'Tương tác'));
  // Nút Nhảy (điện thoại). Dùng pointerdown để nhảy ngay, không chờ nhấc tay.
  const jumpBtn = h('button', { type: 'button', class: 'ma-jump', hidden: true, 'aria-label': 'Nhảy' }, h('span', { class: 'ma-jump-ic', 'aria-hidden': 'true' }, '⤒'), h('span', null, 'Nhảy'));
  jumpBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); S.world?.jump?.(); });

  const touch = isTouch();
  layer.classList.toggle('is-touch', touch);

  // Thanh hướng dẫn phím ở đầu trang (thu gọn được, nhớ lựa chọn)
  const keyItem = (keys, text) => h('span', { class: 'ma-gd-item' }, ...keys.map((k) => h('kbd', { class: 'ma-kbd' }, k)), h('span', null, text));
  // Máy có chuột (kể cả laptop màn cảm ứng) → hướng dẫn phím; chỉ máy không có chuột mới hiện kiểu chạm
  const hasMouse = typeof matchMedia === 'function' && matchMedia('(any-pointer: fine)').matches;
  const guideItems = touch && !hasMouse
    ? [keyItem(['Kéo bên trái'], 'Đi'), keyItem(['Vuốt bên phải'], 'Xoay'), keyItem(['2 ngón'], 'Phóng')]
    : [keyItem(['W', 'A', 'S', 'D'], 'Đi'), keyItem(['Shift'], 'Chạy'), keyItem(['Space'], 'Nhảy'), keyItem(['E'], 'Tương tác'), keyItem(['Kéo chuột'], 'Xoay'), keyItem(['Cuộn'], 'Phóng to/nhỏ')];
  const guideFull = h('div', { class: 'ma-gd-full' }, ...guideItems,
    h('button', { type: 'button', class: 'ma-gd-x', 'aria-label': 'Ẩn hướng dẫn', onclick: () => setGuide(false) }, '×'));
  const guideMini = h('button', { type: 'button', class: 'ma-gd-mini', onclick: () => setGuide(true) }, h('kbd', { class: 'ma-kbd' }, '?'), h('span', null, 'Hướng dẫn phím'));
  const guideBar = h('div', { class: 'ma-guide', role: 'note', 'aria-label': 'Hướng dẫn điều khiển' }, guideFull, guideMini);
  function setGuide(open) {
    guideFull.hidden = !open;
    guideMini.hidden = open;
    store.set('ma_guide_open', open);
  }
  setGuide(store.get('ma_guide_open', true));
  top.append(guideBar);

  hud.append(top, promptBtn, interactBtn, jumpBtn);

  function renderPrompt() {
    const z = S.zone;
    const show = !!z && !S.sheet && S.attached;
    promptBtn.hidden = !show;
    interactBtn.hidden = !(show && touch);
    jumpBtn.hidden = !(touch && S.attached && !S.sheet);
    if (!z) return;
    clear(promptIc).append(icon(KIND_ICON[z.kind] || 'sparkle'));
    promptLabel.textContent = z.label || 'Tương tác';
    promptKey.hidden = touch;
  }

  function interact() {
    const w = S.world;
    if (w && typeof w.interact === 'function') {
      try { w.interact(); return; } catch (e) { console.warn(e); }
    }
    if (S.zone) openZone(S.zone);
  }

  // ---------------------------------------------------------------- nhạc nền (chỉ khi có /ui/music.mp3)
  let audio = null;
  const MUSIC_URL = '/ui/music.mp3';
  (async () => {
    try {
      const res = await fetch(MUSIC_URL, { method: 'HEAD' });
      const type = res.headers.get('content-type') || '';
      if (!res.ok || !/audio|mpeg|octet-stream/i.test(type)) return;
      audio = new Audio(MUSIC_URL);
      audio.loop = true;
      audio.volume = 0.35;
      audio.preload = 'none';
      musicBtn.hidden = false;
      const want = store.get('ma_music', false);
      if (want) {
        const start = () => { setMusic(true); window.removeEventListener('pointerdown', start, true); };
        window.addEventListener('pointerdown', start, true);
      }
    } catch { /* không có nhạc → ẩn nút */ }
  })();
  function setMusic(on) {
    if (!audio) return;
    if (on) {
      audio.play().then(() => paintMusic(true)).catch(() => paintMusic(false));
    } else {
      audio.pause();
      paintMusic(false);
    }
    store.set('ma_music', on);
  }
  function paintMusic(on) {
    musicBtn.setAttribute('aria-pressed', String(on));
    musicBtn.setAttribute('aria-label', on ? 'Tắt nhạc nền' : 'Bật nhạc nền');
    musicBtn.classList.toggle('is-on', on);
    clear(musicBtn).append(icon(on ? 'music' : 'musicOff'));
  }
  musicBtn.addEventListener('click', () => setMusic(!(audio && !audio.paused)));

  // ---------------------------------------------------------------- ngữ cảnh cho các bảng
  const ctx = {
    api,
    h,
    icon,
    toast,
    lightbox: host.lightbox,
    onTick,
    get state() { return S.state; },
    get profile() { return S.profile; },
    get world() { return S.world; },
    get isTeacher() { return !!(S.profile && S.profile.role === 'teacher'); },
    get token() { return (S.profile && S.profile.token) || null; },
    get teacherMe() { return S.teacherMe; },
    setTeacherMe(me) {
      if (me) S.teacherMe = me;
      if (S.tasks) S.tasks.render();
    },
    markDone(key) { if (S.tasks) S.tasks.markDone(key); },
    get config() { return (S.state && S.state.config) || S.config || {}; },
    get stats() { return (S.state && S.state.stats) || {}; },
    teachers: () => (S.state && S.state.teachers) || [],
    teacher: (id) => ((S.state && S.state.teachers) || []).find((t) => t.id === id) || null,
    teacherName,
    fmtNum,
    effect(name, data) {
      try { S.world && S.world.playEffect && S.world.playEffect(name, data); } catch (e) { console.warn('[ui] playEffect', e); }
    },
    refresh() {
      try { S.refresh && S.refresh(); } catch { /* bỏ qua */ }
    },
    /** Báo gửi thành công + hiệu ứng + làm mới dữ liệu. */
    sent(res, effectName, effectData, approvedMsg = 'Đã gửi! Cảm ơn bạn nhé.') {
      toast(res && res.status === 'approved' ? approvedMsg : PENDING_MSG, 'ok', 4600);
      if (effectName) ctx.effect(effectName, effectData);
      ctx.refresh();
    },
    error(e) {
      toast((e && e.message) || 'Có lỗi xảy ra, bạn thử lại nhé.', 'error');
    },
    submissionsOpen: () => !(S.state && S.state.stats && S.state.stats.submissionsOpen === false),
    closedNote: () => h('div', { class: 'ma-note is-warn' }, icon('clock'), h('span', null, 'Đã hết hạn gửi, cảm ơn bạn! Bạn vẫn xem được mọi thứ nhé.')),
    openZone: (z) => openZone(z),
    close: () => S.sheet && S.sheet.close(),
  };

  // ---------------------------------------------------------------- mở/đóng bảng
  function setInput(on) {
    try { S.world && S.world.setInputEnabled && S.world.setInputEnabled(on); } catch (e) { console.warn(e); }
  }

  function openZone(zone) {
    if (!zone || !zone.kind) return;
    let make = PANELS[zone.kind];
    if (ctx.isTeacher) {
      const tid = zone.teacherId || (zone.kind === 'tree' ? String(zone.id || '').split(':')[1] : null);
      if (zone.kind === 'tree' && tid === S.profile.teacherId) make = teacherTree;
      else if (zone.kind === 'secret') make = teacherMail;
    }
    if (!make) {
      toast('Điểm này đang được chuẩn bị, bạn quay lại sau nhé.');
      return;
    }
    if (S.sheet) S.sheet.close();
    setInput(false);
    const meta = make.meta ? make.meta(ctx, zone) : {};
    const sheet = host.openSheet({ title: meta.title || zone.label || '', subtitle: meta.subtitle || '', iconName: meta.icon || KIND_ICON[zone.kind] || '', wide: !!meta.wide, cls: 'ma-k-' + zone.kind });
    S.sheet = sheet;
    hud.classList.add('has-sheet');
    renderPrompt();
    let panel = null;
    sheet.onClose = () => {
      try { panel && panel.onClose && panel.onClose(); } catch (e) { console.error(e); }
      if (S.sheet === sheet) {
        S.sheet = null;
        S.panel = null;
        hud.classList.remove('has-sheet');
        setInput(true);
        renderPrompt();
      }
    };
    try {
      panel = make(ctx, zone, sheet) || {};
      S.panel = panel;
    } catch (e) {
      console.error(e);
      sheet.setContent(h('div', { class: 'ma-empty' }, 'Có lỗi khi mở bảng này, bạn thử lại nhé.'));
    }
  }

  // ---------------------------------------------------------------- hợp đồng
  const ui = {
    showLoading(p, text) { loading.show(p, text); },
    hideLoading() { loading.hide(); },
    showLogin(config) {
      S.config = config || {};
      return showLoginScreen(layer, S.config).then((profile) => {
        S.profile = profile;
        return profile;
      });
    },
    showTeacherWelcome(me) {
      S.teacherMe = me || null;
      return showTeacherWelcomeScreen(layer, me);
    },
    attach({ world, state, profile, net, refresh, teacherMe } = {}) {
      S.world = world || S.world;
      S.net = net || null;
      S.refresh = refresh || null;
      if (profile) S.profile = profile.role === 'teacher' ? { ...profile, cls: 'GV' } : { role: 'student', ...profile };
      if (teacherMe) S.teacherMe = teacherMe;
      if (S.profile) {
        const teacher = S.profile.role === 'teacher';
        layer.classList.toggle('is-teacher', teacher);
        clear(whoChip).append(icon(teacher ? 'sparkle' : 'user'), h('span', null, teacher ? (S.teacherMe && S.teacherMe.teacher && S.teacherMe.teacher.title) || S.profile.name.split(' ')[0] || 'Thầy/Cô' : 'Lớp ' + S.profile.cls));
        whoChip.classList.toggle('is-teacher', teacher);
        whoChip.title = S.profile.name;
        whoChip.hidden = !teacher && !S.profile.cls;
        if (teacher && !S.tasks) S.tasks = createTeacherTasks({ parent: hud, ctx, getWorld: () => S.world, openZone });
      }
      if (state) S.state = state;
      S.attached = true;
      hud.hidden = false;
      requestAnimationFrame(() => hud.classList.add('is-in'));
      renderPrompt();
      // (đã bỏ toast hướng dẫn lúc mới vào – thay bằng thanh hướng dẫn phím cố định ở đầu trang)
    },
    applyState(state) {
      if (!state) return;
      S.state = state;
      if (S.panel && S.panel.onState) {
        try { S.panel.onState(state); } catch (e) { console.warn(e); }
      }
    },
    setPrompt(zone) {
      S.zone = zone || null;
      renderPrompt();
    },
    openZone,
    closeZone() { if (S.sheet) S.sheet.close(); },
    setOnline(n) {
      S.online = n;
      onlineNum.textContent = n == null ? '–' : fmtNum(n);
    },
    toast,
    get isOpen() { return !!S.sheet; },
  };
  return ui;
}

export default createUI;
