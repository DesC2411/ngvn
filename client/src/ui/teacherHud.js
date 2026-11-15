// Chế độ thầy cô: màn chào + thẻ "Việc của Thầy/Cô" trên HUD. (CONTRACT mục 6)
import { h, clear, store } from './dom.js';
import { icon } from './icons.js';
import { LOGO } from './screens.js';

const listUrl = (token) => (token ? `/teacher.html?token=${encodeURIComponent(token)}` : null);

function photoOf(t, size) {
  const img = h('img', { class: 'ma-tphoto' + (t.photo ? '' : ' is-logo'), src: t.photo || LOGO, alt: '', width: size, height: size });
  img.onerror = () => { img.onerror = null; img.src = LOGO; img.classList.add('is-logo'); };
  return img;
}

// ------------------------------------------------------------------ màn chào
export function showTeacherWelcome(layer, me) {
  return new Promise((resolve) => {
    const t = (me && me.teacher) || {};
    const title = t.title || 'Thầy/Cô';
    const nCards = (me && me.cards && me.cards.length) || t.cardCount || 0;
    const nSecrets = (me && me.secrets && me.secrets.length) || 0;
    const wrap = h('div', { class: 'ma-login ma-twelcome' });
    const go = () => {
      wrap.classList.add('is-out');
      setTimeout(() => wrap.remove(), 420);
      resolve();
    };
    wrap.append(
      h('div', { class: 'ma-login-scroll' },
        h('div', { class: 'ma-login-hero' },
          h('div', { class: 'ma-tw-photo' }, photoOf(t, 104)),
          h('div', { class: 'ma-tw-hi' }, 'Kính chào'),
          h('h1', null, `${title} ${t.name || ''}`.trim()),
        ),
        h('div', { class: 'ma-login-card' },
          h('div', { class: 'ma-tiles is-3' },
            h('div', { class: 'ma-tile' }, icon('tree'), h('b', { class: 'ma-tw-tree' }, t.tree || ''), h('span', null, `cây của ${title}`)),
            h('div', { class: 'ma-tile' }, icon('mail'), h('b', null, String(nCards)), h('span', null, 'thiệp đã nhận')),
            h('div', { class: 'ma-tile' }, icon('lock'), h('b', null, String(nSecrets)), h('span', null, 'lời chưa nói')),
          ),
          h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg ma-tw-go', onclick: go }, 'Vào trường'),
        ),
      ),
    );
    layer.append(wrap);
  });
}

// ------------------------------------------------------------------ thẻ "Việc của Thầy/Cô"
export function createTeacherTasks({ parent, ctx, getWorld, openZone }) {
  const tid = ctx.profile.teacherId;
  const DONE_KEY = 'ma_tdone_' + tid;
  const OPEN_KEY = 'ma_ttasks_open_' + tid;
  let done = store.get(DONE_KEY, {}) || {};
  let open = store.get(OPEN_KEY, true) !== false;
  const el = h('section', { class: 'ma-tasks', 'aria-label': 'Việc của thầy cô' });
  parent.append(el);

  const me = () => ctx.teacherMe || {};
  const t = () => me().teacher || ctx.teacher(tid) || {};
  const title = () => t().title || 'Thầy/Cô';

  const steps = () => {
    const m = me();
    const nCards = (m.cards && m.cards.length) || 0;
    const secrets = m.secrets || [];
    const read = new Set(store.get('ma_tread_' + tid, []) || []);
    const unread = secrets.filter((s) => !read.has(s.id)).length;
    return [
      { key: 'cards', zone: { id: `tree:${tid}`, kind: 'tree', teacherId: tid }, title: `Đến ${t().tree || 'cây của mình'} đọc thiệp`, sub: `${nCards} thiệp đã nhận`, ic: 'tree' },
      { key: 'secrets', zone: { id: 'secret-box', kind: 'secret' }, title: 'Đến Hòm thư đỏ đọc lời chưa nói', sub: secrets.length ? `${secrets.length} lá thư${unread ? ` · ${unread} chưa đọc` : ''}` : 'Chưa có thư', ic: 'mail' },
      { key: 'reply', zone: { id: `tree:${tid}`, kind: 'tree', teacherId: tid, focus: 'reply' }, title: 'Viết lời hồi âm', sub: m.reply ? 'Đã viết · bấm để sửa' : 'Hiện trên biển cây cho các con đọc', ic: 'heart', quiz: true },
    ];
  };
  const isDone = (k) => (k === 'reply' ? !!(me().reply) || !!done.reply : !!done[k]);

  function zoneFor(z) {
    const w = getWorld();
    let found = null;
    try { found = w && w.getZone ? w.getZone(z.id) : null; } catch { /* bỏ qua */ }
    return { label: '', ...(found || {}), ...z };
  }

  async function walk(step, btn) {
    const w = getWorld();
    if (!w || typeof w.autoWalkTo !== 'function') return;
    setOpen(false);
    btn.classList.add('is-busy');
    const dismiss = ctx.toast('Đang đi tới…', 'info', 60000);
    let ok = false;
    try { ok = await w.autoWalkTo(step.zone.id); } catch (e) { console.warn(e); }
    btn.classList.remove('is-busy');
    if (dismiss) dismiss();
    if (ok) openZone(zoneFor(step.zone));
  }
  function guide(step) {
    const w = getWorld();
    if (!w || typeof w.setGuide !== 'function') return;
    try { w.setGuide(step.zone.id); } catch (e) { console.warn(e); }
    setOpen(false);
    ctx.toast('Đã bật chỉ đường.', 'ok');
  }

  function setOpen(v) {
    open = v;
    store.set(OPEN_KEY, v);
    render();
  }

  function render() {
    const list = steps();
    const n = list.filter((s) => isDone(s.key)).length;
    const w = getWorld();
    const canGuide = !!(w && typeof w.setGuide === 'function');
    const canWalk = !!(w && typeof w.autoWalkTo === 'function');
    clear(el);
    el.classList.toggle('is-open', open);
    if (!open) {
      el.append(h('button', { type: 'button', class: 'ma-tasks-pill', onclick: () => setOpen(true), 'aria-expanded': 'false' },
        icon('sparkle'), h('span', null, `Việc của ${title()}`), h('b', null, `${n}/3`)));
      return;
    }
    const url = listUrl(ctx.token);
    el.append(
      h('div', { class: 'ma-tasks-h' },
        h('div', null, h('b', null, `Việc của ${title()}`), h('small', null, `Đã xong ${n}/3`)),
        h('button', { type: 'button', class: 'ma-iconbtn ma-tasks-x', 'aria-label': 'Thu gọn', 'aria-expanded': 'true', onclick: () => setOpen(false) }, icon('back')),
      ),
      h('ol', { class: 'ma-tasks-list' },
        list.map((s, i) => {
          const ok = isDone(s.key);
          const btns = [];
          if (canGuide) btns.push(h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-sm', onclick: () => guide(s) }, icon('map'), 'Chỉ đường'));
          if (canWalk) {
            const b = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-sm' }, icon('hand'), 'Đi tới ngay');
            b.addEventListener('click', () => walk(s, b));
            btns.push(b);
          }
          if (!canGuide && !canWalk) btns.push(h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-sm', onclick: () => openZone(zoneFor(s.zone)) }, 'Mở'));
          const quiz = s.quiz
            ? h('button', { type: 'button', class: 'ma-tasks-link', onclick: () => openZone(zoneFor({ ...s.zone, focus: 'quiz' })) },
              (me().quiz && me().quiz.length) ? icon('check') : icon('quiz'), (me().quiz && me().quiz.length) ? `Đã soạn ${me().quiz.length} câu đố · sửa` : 'Soạn câu đố (tuỳ chọn)')
            : null;
          return h('li', { class: 'ma-task' + (ok ? ' is-done' : '') },
            h('span', { class: 'ma-task-n' }, ok ? icon('check') : String(i + 1)),
            h('div', { class: 'ma-task-main' },
              h('b', null, s.title),
              h('div', { class: 'ma-task-btns' }, btns),
              quiz,
            ),
          );
        }),
      ),
      url ? h('a', { class: 'ma-tasks-foot', href: url, target: '_blank', rel: 'noopener' }, 'Xem nhanh dạng danh sách') : null,
    );
  }

  render();
  return {
    el,
    render,
    markDone(key) {
      if (done[key]) return;
      done = { ...done, [key]: true };
      store.set(DONE_KEY, done);
      render();
    },
  };
}
