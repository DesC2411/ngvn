// Trang Quản trị – May Academy Mùa Tri Ân 20/11
// Đăng nhập bằng ADMIN_KEY (lưu sessionStorage), mọi request gửi header x-admin-key.
import './base.css';
import './admin.css';
import {
  h, qs, setupMock, withMock, createClient, teacherName, fmtTime, fmtNum, toast, confirmDialog,
  isDialogOpen, copyText, mediaResolver, isDaiThu, isoToVnLocalInput, vnLocalInputToIso, logoUrl,
} from './common.js';
import { renderCardView } from './card-view.js';

const KEY_STORE = 'ma_admin_key';
const TYPES = [
  { id: 'cards', label: 'Thiệp' },
  { id: 'cranes', label: 'Hạc giấy' },
  { id: 'signatures', label: 'Chữ ký' },
  { id: 'secrets', label: 'Lời chưa nói' },
];
const STATUS = [
  { id: 'pending', label: 'Chờ duyệt' },
  { id: 'approved', label: 'Đã duyệt' },
  { id: 'hidden', label: 'Đã ẩn' },
  { id: 'all', label: 'Tất cả' },
];
const STATUS_LABEL = { pending: 'Chờ duyệt', approved: 'Đã duyệt', hidden: 'Đã ẩn' };
const ACTION_LABEL = { approve: 'Đã duyệt', hide: 'Đã ẩn', delete: 'Đã xoá' };
const PAGE = 40;
const REFRESH_MS = 20000;

const S = {
  key: sessionStorage.getItem(KEY_STORE) || '',
  tab: 'review',
  type: 'cards',
  status: 'pending',
  teacher: '',
  cls: '',
  q: '',
  items: [],
  sig: '',
  counts: {},
  selected: new Set(),
  focusId: null,
  limit: PAGE,
  teachers: [],
  config: null,
  lastRefresh: null,
  busy: false,
};

const api = createClient({
  headers: () => ({ 'x-admin-key': S.key }),
  onUnauthorized: () => logout('Mã quản trị không đúng hoặc đã bị đổi. Vui lòng đăng nhập lại.'),
});
let media = mediaResolver('/api/admin/media', 'key', S.key);
const app = document.getElementById('app');
const cardCache = new Map();
let refreshTimer = null;

// ================= Đăng nhập =================
function logout(msg) {
  S.key = '';
  sessionStorage.removeItem(KEY_STORE);
  clearInterval(refreshTimer);
  showLogin(msg);
}

function showLogin(msg) {
  const input = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', placeholder: 'Nhập mã quản trị', required: true });
  const err = h('p', { class: 'login-err', hidden: !msg }, msg || '');
  const btn = h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Đăng nhập');
  const form = h('form', {
    class: 'login-card',
    async onsubmit(e) {
      e.preventDefault();
      const key = input.value.trim();
      if (!key) return;
      btn.disabled = true;
      btn.textContent = 'Đang kiểm tra…';
      S.key = key;
      try {
        const probe = createClient({ headers: () => ({ 'x-admin-key': key }) });
        S.config = await probe.get('/api/admin/settings');
        sessionStorage.setItem(KEY_STORE, key);
        start();
      } catch (ex) {
        S.key = '';
        err.hidden = false;
        err.textContent = ex.status === 401 || ex.status === 403 ? 'Mã quản trị không đúng.' : ex.message;
        btn.disabled = false;
        btn.textContent = 'Đăng nhập';
      }
    },
  },
  h('img', { src: logoUrl('256'), alt: 'May Academy', class: 'login-logo' }),
  h('h1', null, 'Quản trị Mùa Tri Ân 20/11'),
  h('p', { class: 'muted' }, 'Duyệt thiệp, hạc giấy, chữ ký, lời chưa nói và cấp link cho thầy cô.'),
  input, err, btn);
  app.replaceChildren(h('div', { class: 'login-wrap' }, form));
  input.focus();
}

// ================= Khung trang =================
const TABS = [
  { id: 'review', label: 'Duyệt' },
  { id: 'teachers', label: 'Thầy cô' },
  { id: 'settings', label: 'Cài đặt' },
  { id: 'stats', label: 'Thống kê' },
];
let mainEl, tabBtns = {}, totalBadge;

async function start() {
  media = mediaResolver('/api/admin/media', 'key', S.key);
  totalBadge = h('span', { class: 'badge zero' }, '0');
  const nav = h('nav', { class: 'tabs', role: 'tablist' }, TABS.map((t) => {
    const b = h('button', { class: 'tab', role: 'tab', onclick: () => go(t.id) }, t.label, t.id === 'review' ? totalBadge : null);
    tabBtns[t.id] = b;
    return b;
  }));
  mainEl = h('main', { class: 'main' });
  app.replaceChildren(
    h('header', { class: 'topbar' },
      h('div', { class: 'brand' },
        h('img', { src: logoUrl('256'), alt: '' }),
        h('div', null, h('b', null, 'May Academy'), h('span', null, 'Quản trị Mùa Tri Ân 20/11')),
      ),
      nav,
      h('button', { class: 'btn btn-ghost btn-sm logout', onclick: () => logout() }, 'Đăng xuất'),
    ),
    mainEl,
  );
  try {
    S.teachers = await api.get('/api/admin/teachers');
  } catch (e) {
    if (e.status !== 401 && e.status !== 403) toast(e.message, 'err');
  }
  if (!S.key) return;
  const hash = location.hash.slice(1);
  go(TABS.some((t) => t.id === hash) ? hash : 'review');
  clearInterval(refreshTimer);
  refreshTimer = setInterval(autoRefresh, REFRESH_MS);
  loadCounts();
}

function go(tab) {
  S.tab = tab;
  history.replaceState(null, '', `${location.pathname}${location.search}#${tab}`);
  for (const [id, b] of Object.entries(tabBtns)) b.classList.toggle('active', id === tab);
  mainEl.replaceChildren();
  if (tab === 'review') renderReview();
  else if (tab === 'teachers') renderTeachers();
  else if (tab === 'settings') renderSettings();
  else if (tab === 'stats') renderStats();
}

function autoRefresh() {
  if (document.hidden || isDialogOpen() || !S.key) return;
  loadCounts();
  if (S.tab === 'review') loadQueue(false);
}

const teacherOf = (id) => S.teachers.find((t) => t.id === id);

// ================= Tab Duyệt =================
let R = {}; // tham chiếu phần tử của tab Duyệt

async function loadCounts() {
  const res = await Promise.allSettled(TYPES.map((t) => api.get(`/api/admin/queue?type=${t.id}&status=pending`)));
  let total = 0;
  res.forEach((r, i) => {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      S.counts[TYPES[i].id] = r.value.length;
      total += r.value.length;
    }
  });
  totalBadge.textContent = total > 99 ? '99+' : String(total);
  totalBadge.classList.toggle('zero', total === 0);
  if (R.typeBtns) {
    for (const t of TYPES) {
      const n = S.counts[t.id] || 0;
      R.typeBtns[t.id].badge.textContent = n > 99 ? '99+' : String(n);
      R.typeBtns[t.id].badge.classList.toggle('zero', n === 0);
    }
  }
  document.title = total ? `(${total}) Quản trị – May Academy` : 'Quản trị – May Academy Mùa Tri Ân 20/11';
}

function renderReview() {
  R = {};
  R.typeBtns = {};
  const typeBar = h('div', { class: 'type-bar' }, TYPES.map((t) => {
    const badge = h('span', { class: 'badge zero' }, String(S.counts[t.id] || 0));
    const b = h('button', {
      class: `type-btn${S.type === t.id ? ' active' : ''}`,
      onclick: () => {
        if (S.type === t.id) return;
        S.type = t.id; S.selected.clear(); S.focusId = null; S.limit = PAGE; S.items = []; S.sig = '';
        Object.values(R.typeBtns).forEach((x) => x.el.classList.remove('active'));
        b.classList.add('active');
        R.teacherSel.parentElement.hidden = !(t.id === 'cards' || t.id === 'secrets');
        R.privacy.hidden = t.id !== 'secrets';
        loadQueue(true);
      },
    }, t.label, badge);
    R.typeBtns[t.id] = { el: b, badge };
    return b;
  }));
  if (Object.keys(S.counts).length) {
    for (const t of TYPES) {
      const n = S.counts[t.id] || 0;
      R.typeBtns[t.id].badge.textContent = String(n);
      R.typeBtns[t.id].badge.classList.toggle('zero', n === 0);
    }
  }

  const statusSel = h('select', { class: 'input', onchange: (e) => { S.status = e.target.value; S.selected.clear(); S.limit = PAGE; loadQueue(true); } },
    STATUS.map((s) => h('option', { value: s.id, selected: S.status === s.id }, s.label)));
  R.teacherSel = h('select', { class: 'input', onchange: (e) => { S.teacher = e.target.value; S.limit = PAGE; renderList(); } },
    h('option', { value: '' }, 'Tất cả thầy cô'),
    h('optgroup', { label: 'Thầy cô' }, S.teachers.filter((t) => !isDaiThu(t)).map((t) => h('option', { value: t.id, selected: S.teacher === t.id }, `${teacherName(t)} – ${t.tree}`))),
    S.teachers.some(isDaiThu) ? h('optgroup', { label: 'Đại thụ' }, S.teachers.filter(isDaiThu).map((t) => h('option', { value: t.id, selected: S.teacher === t.id }, `${teacherName(t)} – ${t.tree}`))) : null);
  R.clsSel = h('select', { class: 'input', onchange: (e) => { S.cls = e.target.value; S.limit = PAGE; renderList(); } });
  const search = h('input', {
    class: 'input', type: 'search', placeholder: 'Tìm chữ, tên, lớp, IP…', value: S.q,
    oninput: debounce((e) => { S.q = e.target.value.trim(); S.limit = PAGE; renderList(); }, 200),
  });
  R.refreshInfo = h('span', { class: 'muted small' });
  const filters = h('div', { class: 'filters' },
    h('label', null, h('span', null, 'Trạng thái'), statusSel),
    h('label', { hidden: !(S.type === 'cards' || S.type === 'secrets') }, h('span', null, 'Thầy cô'), R.teacherSel),
    h('label', null, h('span', null, 'Lớp'), R.clsSel),
    h('label', { class: 'grow' }, h('span', null, 'Tìm'), search),
    h('div', { class: 'refresh' },
      h('button', { class: 'btn btn-ghost btn-sm', onclick: () => { loadCounts(); loadQueue(true); } }, '↻ Làm mới'),
      R.refreshInfo),
  );

  R.privacy = h('div', { class: 'privacy-note', hidden: S.type !== 'secrets' },
    h('b', null, '🔒 Riêng tư – chỉ thầy cô đọc. '),
    'Ban tổ chức chỉ xem để lọc nội dung xấu, không chia sẻ, không đăng ra ngoài. Duyệt hay ẩn không làm lời này hiện công khai.');

  R.selAll = h('input', { type: 'checkbox', onchange: (e) => toggleAll(e.target.checked) });
  R.selInfo = h('span', { class: 'sel-info' }, 'Chưa chọn mục nào');
  R.bulkBtns = [
    h('button', { class: 'btn btn-ok btn-sm', onclick: () => bulk('approve') }, 'Duyệt đã chọn'),
    h('button', { class: 'btn btn-warn btn-sm', onclick: () => bulk('hide') }, 'Ẩn đã chọn'),
    h('button', { class: 'btn btn-danger btn-sm', onclick: () => bulk('delete') }, 'Xoá đã chọn'),
  ];
  const bulkBar = h('div', { class: 'bulk-bar' },
    h('label', { class: 'sel-all' }, R.selAll, ' Chọn tất cả đang hiện'),
    R.selInfo,
    h('div', { class: 'bulk-actions' }, R.bulkBtns),
    h('span', { class: 'kbd-hint' }, h('kbd', null, 'J'), '/', h('kbd', null, 'K'), ' lên xuống · ', h('kbd', null, 'A'), ' duyệt · ', h('kbd', null, 'H'), ' ẩn · ', h('kbd', null, 'X'), ' chọn'),
  );

  R.list = h('div', { class: `queue type-${S.type}` });
  R.more = h('div', { class: 'more' });
  mainEl.append(typeBar, filters, R.privacy, bulkBar, R.list, R.more);
  loadQueue(true);
}

async function loadQueue(force) {
  const type = S.type;
  const status = S.status;
  if (force) R.list.replaceChildren(h('div', { class: 'spinner' }));
  try {
    const items = await api.get(`/api/admin/queue?type=${type}&status=${status}`);
    if (type !== S.type || status !== S.status || S.tab !== 'review') return;
    const list = Array.isArray(items) ? items : [];
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const sig = list.map((x) => `${x.id}:${x.status}`).join('|');
    S.lastRefresh = new Date();
    if (R.refreshInfo) R.refreshInfo.textContent = `Cập nhật ${S.lastRefresh.toLocaleTimeString('vi-VN')} · tự làm mới 20 giây`;
    if (!force && sig === S.sig) return;
    S.items = list;
    S.sig = sig;
    const ids = new Set(list.map((x) => x.id));
    for (const id of [...S.selected]) if (!ids.has(id)) S.selected.delete(id);
    fillClassOptions();
    renderList();
  } catch (e) {
    if (force && R.list) R.list.replaceChildren(h('div', { class: 'empty' }, e.message));
  }
}

function fillClassOptions() {
  const set = new Set((S.config && S.config.classes) || []);
  S.items.forEach((x) => x.cls && set.add(x.cls));
  const classes = [...set].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
  if (S.cls && !set.has(S.cls)) classes.unshift(S.cls);
  R.clsSel.replaceChildren(h('option', { value: '' }, 'Tất cả lớp'), classes.map((c) => h('option', { value: c, selected: S.cls === c }, c)));
}

function filtered() {
  const q = S.q.toLowerCase();
  return S.items.filter((x) => {
    if (S.teacher && (S.type === 'cards' || S.type === 'secrets') && x.teacherId !== S.teacher) return false;
    if (S.cls && x.cls !== S.cls) return false;
    if (q) {
      const t = teacherOf(x.teacherId);
      const hay = [x.message, x.from, x.name, x.cls, x.ip, x.template, t && teacherName(t), t && t.tree].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function renderList() {
  if (!R.list) return;
  const all = filtered();
  const shown = all.slice(0, S.limit);
  if (S.focusId && !shown.some((x) => x.id === S.focusId)) S.focusId = null;
  R.list.className = `queue type-${S.type}`;
  if (!shown.length) {
    const txt = S.status === 'pending' ? 'Không còn mục nào chờ duyệt. Tuyệt vời!' : 'Không có mục nào khớp bộ lọc.';
    R.list.replaceChildren(h('div', { class: 'empty' }, txt));
  } else {
    R.list.replaceChildren(...shown.map(itemNode));
  }
  R.more.replaceChildren(all.length > shown.length
    ? h('button', { class: 'btn btn-ghost', onclick: () => { S.limit += PAGE; renderList(); } }, `Xem thêm (${all.length - shown.length} mục nữa)`)
    : all.length ? h('span', { class: 'muted small' }, `Đang hiện ${all.length} mục`) : '');
  updateSelUI();
  markFocus(false);
}

function itemNode(x) {
  const t = teacherOf(x.teacherId);
  const check = h('input', {
    type: 'checkbox', checked: S.selected.has(x.id), 'aria-label': 'Chọn mục này',
    onchange: (e) => { e.target.checked ? S.selected.add(x.id) : S.selected.delete(x.id); updateSelUI(); },
  });
  const who = x.name || x.from || 'Không tên';
  const meta = h('div', { class: 'meta' },
    h('span', { class: `pill st-${x.status}` }, STATUS_LABEL[x.status] || x.status),
    t ? h('span', { class: 'to' }, '→ ', h('b', null, teacherName(t)), ` · ${t.tree}`) : null,
    x.seed ? h('span', { class: 'pill seed' }, 'Lời chúc viết sẵn')
      : h('span', null, 'Từ: ', h('b', null, who), x.cls ? ` · Lớp ${x.cls}` : '', x.anonymous ? h('span', { class: 'pill anon' }, 'gửi ẩn danh') : null),
    h('span', { class: 'muted' }, fmtTime(x.createdAt)),
    x.ip ? h('span', { class: 'muted mono' }, `IP ${x.ip}`) : null,
  );
  const actions = h('div', { class: 'actions' },
    x.status !== 'approved' ? h('button', { class: 'btn btn-ok btn-sm', onclick: () => act([x.id], 'approve') }, 'Duyệt') : null,
    x.status !== 'hidden' ? h('button', { class: 'btn btn-warn btn-sm', onclick: () => act([x.id], 'hide') }, 'Ẩn') : null,
    h('button', { class: 'btn btn-danger btn-sm', onclick: () => act([x.id], 'delete') }, 'Xoá'),
  );
  const body = h('div', { class: 'body' });
  fillBody(body, x, t);
  const el = h('article', {
    class: 'item', dataset: { id: x.id }, tabindex: '-1',
    onclick: (e) => { if (!e.target.closest('button, input, a')) setFocus(x.id, false); },
  }, h('div', { class: 'item-check' }, check), h('div', { class: 'item-main' }, body, meta, actions));
  return el;
}

function fillBody(body, x, t) {
  if (S.type === 'cards') {
    const slot = h('div', { class: 'card-slot' });
    body.append(slot);
    const cached = cardCache.get(x.id);
    if (cached) slot.append(cached);
    else {
      slot.append(h('div', { class: 'card-loading' }, 'Đang dựng thiệp…'));
      renderCardView(x, { mediaUrl: media, mode: 'thumb', teacherName: t ? teacherName(t) : '' })
        .then((node) => { cardCache.set(x.id, node); slot.replaceChildren(node); })
        .catch(() => slot.replaceChildren(h('p', { class: 'msg' }, x.message || '')));
    }
    if (x.drawingUrl) {
      body.append(h('a', { class: 'small', href: media(x.drawingUrl), target: '_blank', rel: 'noopener' }, 'Mở ảnh vẽ gốc ↗'));
    }
  } else if (S.type === 'cranes') {
    body.append(h('div', { class: 'crane' },
      h('span', { class: 'crane-dot', style: { background: x.color || '#fff' }, title: `Màu ${x.color || ''}` }),
      h('p', { class: 'msg' }, x.message || '')));
  } else if (S.type === 'signatures') {
    body.append(h('div', { class: 'chalk' },
      x.drawingUrl ? h('img', { src: media(x.drawingUrl), alt: `Chữ ký của ${x.name || ''}`, loading: 'lazy' }) : h('span', { class: 'chalk-name' }, x.name || ''),
    ));
  } else if (S.type === 'secrets') {
    body.append(h('div', { class: 'secret' },
      h('div', { class: 'secret-tag' }, '🔒 Riêng tư – chỉ thầy cô đọc'),
      h('p', { class: 'msg' }, x.message || '')));
  }
}

function setFocus(id, scroll = true) {
  S.focusId = id;
  markFocus(scroll);
}

function markFocus(scroll) {
  if (!R.list) return;
  R.list.querySelectorAll('.item.focused').forEach((el) => el.classList.remove('focused'));
  if (!S.focusId) return;
  const el = R.list.querySelector(`.item[data-id="${CSS.escape(S.focusId)}"]`);
  if (el) {
    el.classList.add('focused');
    if (scroll) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function visibleIds() {
  return [...R.list.querySelectorAll('.item')].map((el) => el.dataset.id);
}

function toggleAll(on) {
  for (const id of visibleIds()) on ? S.selected.add(id) : S.selected.delete(id);
  R.list.querySelectorAll('.item-check input').forEach((c) => { c.checked = on; });
  updateSelUI();
}

function updateSelUI() {
  if (!R.selInfo) return;
  const ids = visibleIds();
  const n = S.selected.size;
  R.selInfo.textContent = n ? `Đã chọn ${n} mục` : 'Chưa chọn mục nào';
  R.selAll.checked = ids.length > 0 && ids.every((id) => S.selected.has(id));
  R.selAll.indeterminate = !R.selAll.checked && ids.some((id) => S.selected.has(id));
  R.bulkBtns.forEach((b) => { b.disabled = n === 0 || S.busy; });
  R.list.querySelectorAll('.item').forEach((el) => el.classList.toggle('selected', S.selected.has(el.dataset.id)));
}

function bulk(action) {
  const ids = [...S.selected];
  if (ids.length) act(ids, action);
}

async function act(ids, action) {
  if (S.busy || !ids.length) return;
  if (action === 'delete') {
    const ok = await confirmDialog({
      title: ids.length > 1 ? `Xoá ${ids.length} mục?` : 'Xoá mục này?',
      message: 'Xoá là mất hẳn, không khôi phục được. Nếu chỉ muốn không cho hiện, hãy bấm "Ẩn".',
      okText: 'Xoá hẳn', danger: true,
    });
    if (!ok) return;
  }
  S.busy = true;
  updateSelUI();
  const order = visibleIds();
  try {
    if (ids.length === 1) await api.post('/api/admin/moderate', { type: S.type, id: ids[0], action });
    else await api.post('/api/admin/moderate-bulk', { type: S.type, ids, action });
    toast(`${ACTION_LABEL[action]} ${ids.length} mục.`);
    const newStatus = action === 'approve' ? 'approved' : action === 'hide' ? 'hidden' : null;
    const set = new Set(ids);
    // chuyển tiêu điểm sang mục kế tiếp chưa bị xử lý
    if (S.focusId && set.has(S.focusId)) {
      const i = order.indexOf(S.focusId);
      const next = order.slice(i + 1).find((id) => !set.has(id)) || order.slice(0, i).reverse().find((id) => !set.has(id));
      S.focusId = next || null;
    }
    S.items = S.items
      .filter((x) => !(set.has(x.id) && (newStatus === null || (S.status !== 'all' && S.status !== newStatus))))
      .map((x) => (set.has(x.id) ? { ...x, status: newStatus } : x));
    S.sig = S.items.map((x) => `${x.id}:${x.status}`).join('|');
    ids.forEach((id) => S.selected.delete(id));
    renderList();
    markFocus(true);
    loadCounts();
    if (S.type === 'cards') refreshTeachersQuiet();
  } catch (e) {
    toast(e.message, 'err');
  } finally {
    S.busy = false;
    updateSelUI();
  }
}

async function refreshTeachersQuiet() {
  try { S.teachers = await api.get('/api/admin/teachers'); } catch { /* bỏ qua */ }
}

document.addEventListener('keydown', (e) => {
  if (S.tab !== 'review' || !R.list || !S.key) return;
  if (e.ctrlKey || e.metaKey || e.altKey || isDialogOpen()) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
  const ids = visibleIds();
  if (!ids.length) return;
  const k = e.key.toLowerCase();
  const i = S.focusId ? ids.indexOf(S.focusId) : -1;
  if (k === 'j') { e.preventDefault(); setFocus(ids[Math.min(ids.length - 1, i + 1)]); }
  else if (k === 'k') { e.preventDefault(); setFocus(ids[Math.max(0, i < 0 ? 0 : i - 1)]); }
  else if (k === 'a' && S.focusId) { e.preventDefault(); act([S.focusId], 'approve'); }
  else if (k === 'h' && S.focusId) { e.preventDefault(); act([S.focusId], 'hide'); }
  else if (k === 'x' && S.focusId) {
    e.preventDefault();
    S.selected.has(S.focusId) ? S.selected.delete(S.focusId) : S.selected.add(S.focusId);
    const c = R.list.querySelector(`.item[data-id="${CSS.escape(S.focusId)}"] .item-check input`);
    if (c) c.checked = S.selected.has(S.focusId);
    updateSelUI();
  }
});

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ================= Tab Thầy cô =================
function absUrl(u, mock = true) {
  if (!u) return '';
  const full = /^https?:\/\//.test(u) ? u : location.origin + (u.startsWith('/') ? u : `/${u}`);
  return mock ? withMock(full) : full;
}

// Link vào thẳng thế giới 3D (CONTRACT mục 6): /?teacher=<token>. Server cũ chưa đổi thì tự ghép từ token.
function enterLink(t) {
  if (t.teacherUrl && /[?&]teacher=/.test(t.teacherUrl)) return absUrl(t.teacherUrl, false);
  return t.token ? absUrl(`/?teacher=${encodeURIComponent(t.token)}`, false) : '';
}

// Link bản xem nhanh dạng danh sách: /teacher.html?token=<token>.
function listLink(t) {
  if (t.listUrl) return absUrl(t.listUrl);
  if (t.teacherUrl && /teacher\.html/.test(t.teacherUrl)) return absUrl(t.teacherUrl);
  return t.token ? absUrl(`/teacher.html?token=${encodeURIComponent(t.token)}`) : '';
}

function inviteText(t) {
  const T = t.title || 'Thầy/Cô';
  const link = enterLink(t);
  return `Kính gửi ${teacherName(t)}, học sinh May Academy gửi thiệp 20/11 tới ${T} trong Vườn Tri Ân. `
    + `${T} bấm link để vào trường, đi theo vệt sáng tới ${t.tree || 'cây của mình'} đọc thiệp và tới Hòm thư đỏ đọc lời chưa nói: ${link}`;
}

async function copyAndTell(text, okMsg) {
  const ok = await copyText(text);
  toast(ok ? okMsg : 'Không sao chép được, hãy chép tay.', ok ? 'ok' : 'err');
}

function bookUrl(id) {
  return withMock(`/book.html?teacher=${encodeURIComponent(id)}&key=${encodeURIComponent(S.key)}`);
}

async function renderTeachers() {
  const wrap = h('section', { class: 'panel' });
  mainEl.append(wrap);
  wrap.append(h('div', { class: 'spinner' }));
  try {
    S.teachers = await api.get('/api/admin/teachers');
  } catch (e) {
    wrap.replaceChildren(h('div', { class: 'empty' }, e.message));
    return;
  }
  if (S.tab !== 'teachers') return;
  const regular = S.teachers.filter((t) => !isDaiThu(t));
  const daithu = S.teachers.filter(isDaiThu);
  const head = h('div', { class: 'panel-head' },
    h('div', null,
      h('h2', null, `Thầy cô (${regular.length})`, daithu.length ? h('span', { class: 'muted h2-sub' }, ` + ${daithu.length} đại thụ`) : null),
      h('p', { class: 'muted' }, 'Link vào trường đưa thầy cô thẳng vào thế giới 3D, có vệt sáng chỉ tới cây của mình và Hòm thư đỏ. "Link xem nhanh" là bản danh sách đơn giản. Ai có link là vào được, nên chỉ gửi riêng. Nếu lỡ lộ link, bấm "Tạo mã mới".')),
    h('div', { class: 'head-actions' },
      h('button', {
        class: 'btn btn-primary',
        onclick: () => {
          const list = regular.filter((t) => enterLink(t));
          if (!list.length) return toast('Chưa có link nào, hãy tạo mã cho thầy cô.', 'err');
          copyAndTell(list.map(inviteText).join('\n\n'), `Đã sao chép ${list.length} tin nhắn, dán vào Zalo rồi gửi riêng từng người.`);
        },
      }, `📋 Sao chép tất cả tin nhắn (${regular.length})`),
      h('a', { class: 'btn btn-accent', href: bookUrl('all'), target: '_blank', rel: 'noopener', title: 'Gồm cả sổ của các cây đại thụ ở cuối' }, `🖨 In cả ${S.teachers.length} sổ`)),
  );
  const makeRow = (t, i) => {
    const dt = isDaiThu(t);
    const na = () => h('span', { class: 'muted' }, '—');
    const secrets = Array.isArray(t.secrets) ? t.secrets.length : Number(t.secrets || 0);
    const row = h('tr', null,
      h('td', { class: 'num', 'data-label': '#' }, String(i + 1)),
      h('td', { class: 'who', 'data-label': 'Thầy cô' },
        h('b', null, teacherName(t)), h('div', { class: 'muted small' }, [t.tree, t.dept].filter(Boolean).join(' · '))),
      h('td', { class: 'num', 'data-label': 'Thiệp' }, fmtNum(t.cardCount)),
      h('td', { class: 'num', 'data-label': 'Chờ duyệt' }, t.pendingCards ? h('span', { class: 'badge' }, String(t.pendingCards)) : '0'),
      h('td', { class: 'num', 'data-label': 'Lời chưa nói' }, dt ? na() : fmtNum(secrets)),
      h('td', { 'data-label': 'Hồi âm' }, dt ? na() : t.reply ? h('span', { class: 'pill st-approved', title: t.reply }, 'Đã có') : h('span', { class: 'pill st-hidden' }, 'Chưa')),
      h('td', { 'data-label': 'Câu đố' }, dt ? na() : t.hasQuiz ? h('span', { class: 'pill st-approved' }, 'Đã có') : h('span', { class: 'pill st-hidden' }, 'Chưa')),
      h('td', { class: 'acts', 'data-label': '' }, h('div', { class: 'row-actions' }, dt ? null : [
        h('button', {
          class: 'btn btn-primary btn-sm',
          onclick() {
            const link = enterLink(t);
            if (!link) return toast('Chưa có link, hãy bấm "Tạo mã mới".', 'err');
            copyAndTell(link, `Đã sao chép link vào trường của ${teacherName(t)}.`);
          },
        }, 'Sao chép link vào trường'),
        h('button', {
          class: 'btn btn-accent btn-sm',
          onclick() {
            if (!enterLink(t)) return toast('Chưa có link, hãy bấm "Tạo mã mới".', 'err');
            copyAndTell(inviteText(t), `Đã sao chép tin nhắn gửi ${teacherName(t)}.`);
          },
        }, 'Sao chép tin nhắn'),
        h('button', {
          class: 'btn btn-ghost btn-sm',
          onclick() {
            const link = listLink(t);
            if (!link) return toast('Chưa có link, hãy bấm "Tạo mã mới".', 'err');
            copyAndTell(link, `Đã sao chép link xem nhanh của ${teacherName(t)}.`);
          },
        }, 'Link xem nhanh'),
        h('button', {
          class: 'btn btn-ghost btn-sm',
          async onclick() {
            const ok = await confirmDialog({
              title: `Tạo mã mới cho ${teacherName(t)}?`,
              message: 'Link cũ sẽ không vào được nữa. Nhớ gửi link mới cho thầy cô.',
              okText: 'Tạo mã mới',
            });
            if (!ok) return;
            try {
              const r = await api.post(`/api/admin/teachers/${encodeURIComponent(t.id)}/token`);
              t.token = r.token;
              t.teacherUrl = r.teacherUrl;
              t.listUrl = r.listUrl || null;
              const copied = await copyText(inviteText(t));
              toast(copied ? 'Đã tạo mã mới và sao chép tin nhắn kèm link mới.' : 'Đã tạo mã mới.');
            } catch (e) { toast(e.message, 'err'); }
          },
        }, 'Tạo mã mới'),
      ],
        h('a', { class: 'btn btn-ghost btn-sm', href: bookUrl(t.id), target: '_blank', rel: 'noopener' }, 'Sổ Tri Ân'),
      )),
    );
    return row;
  };
  const rows = regular.map((t, i) => makeRow(t, i));
  if (daithu.length) {
    rows.push(h('tr', { class: 'group-row' }, h('td', { colspan: 8 },
      h('b', null, '🌳 Đại thụ'),
      h('span', { class: 'muted small' }, ' · Cây tri ân đặc biệt ở cuối Vườn Tri Ân. Không có link riêng, hồi âm, câu đố; vẫn duyệt thiệp và in Sổ Tri Ân như thường.'))));
    daithu.forEach((t, i) => rows.push(makeRow(t, i)));
  }
  const table = h('div', { class: 'table-wrap' }, h('table', { class: 'tbl tt' },
    h('thead', null, h('tr', null, ['#', 'Thầy cô', 'Thiệp', 'Chờ duyệt', 'Lời chưa nói', 'Hồi âm', 'Câu đố', 'Thao tác'].map((x) => h('th', null, x)))),
    h('tbody', null, rows)));
  wrap.replaceChildren(head, table);
}

// ================= Tab Cài đặt =================
async function renderSettings() {
  const wrap = h('section', { class: 'panel narrow' });
  mainEl.append(wrap);
  wrap.append(h('div', { class: 'spinner' }));
  try {
    S.config = await api.get('/api/admin/settings');
  } catch (e) {
    wrap.replaceChildren(h('div', { class: 'empty' }, e.message));
    return;
  }
  if (S.tab !== 'settings') return;
  const c = S.config || {};
  const auto = h('input', { type: 'checkbox', checked: !!c.autoApprove });
  const close = h('input', { class: 'input', type: 'datetime-local', value: isoToVnLocalInput(c.submissionsCloseAt) });
  const status = h('p', { class: 'muted small' });
  const showStatus = () => {
    const d = new Date(S.config.submissionsCloseAt);
    status.textContent = isNaN(d) ? '' : d > new Date() ? `Đang nhận bài. Hạn: ${fmtTime(d)} (giờ Việt Nam).` : `Đã khoá nhận bài từ ${fmtTime(d)}.`;
  };
  showStatus();
  const saveBtn = h('button', {
    class: 'btn btn-primary',
    async onclick() {
      const body = { autoApprove: auto.checked };
      if (close.value) body.submissionsCloseAt = vnLocalInputToIso(close.value);
      if (body.autoApprove && !c.autoApprove) {
        const ok = await confirmDialog({
          title: 'Bật tự duyệt?',
          message: 'Thiệp, hạc, chữ ký mới sẽ hiện ngay trong game, không qua kiểm tra. Chỉ bộ lọc từ bậy còn chặn. Ảnh vẽ tay cũng hiện luôn.',
          okText: 'Vẫn bật', danger: true,
        });
        if (!ok) { auto.checked = false; return; }
      }
      saveBtn.disabled = true;
      try {
        S.config = await api.post('/api/admin/settings', body) || { ...c, ...body };
        Object.assign(c, S.config);
        showStatus();
        toast('Đã lưu cài đặt.');
      } catch (e) { toast(e.message, 'err'); }
      saveBtn.disabled = false;
    },
  }, 'Lưu cài đặt');

  const exportBtn = h('button', {
    class: 'btn btn-ghost',
    async onclick() {
      exportBtn.disabled = true;
      exportBtn.textContent = 'Đang tải…';
      try {
        const res = await api.raw('/api/admin/export');
        const blob = await res.blob();
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const name = `may-academy-tri-an-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
        const a = h('a', { href: URL.createObjectURL(blob), download: name });
        document.body.append(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        toast('Đã tải dữ liệu về máy.');
      } catch (e) { toast(e.message, 'err'); }
      exportBtn.disabled = false;
      exportBtn.textContent = '⬇ Tải toàn bộ dữ liệu (JSON)';
    },
  }, '⬇ Tải toàn bộ dữ liệu (JSON)');

  wrap.replaceChildren(
    h('h2', null, 'Cài đặt'),
    h('div', { class: 'setting' },
      h('label', { class: 'switch' }, auto, h('span', { class: 'slider' })),
      h('div', null,
        h('b', null, 'Tự duyệt'),
        h('p', { class: 'muted small' }, 'Bật: thiệp/hạc/chữ ký mới hiện ngay. Tắt (khuyên dùng): phải duyệt tay. Lời chưa nói luôn riêng tư.'))),
    h('div', { class: 'setting col' },
      h('b', null, 'Hạn nhận bài (giờ Việt Nam)'),
      close,
      status),
    c.eventDate ? h('p', { class: 'muted small' }, `Ngày lễ: ${fmtTime(c.eventDate)}`) : null,
    h('div', { class: 'row' }, saveBtn),
    h('hr'),
    h('h3', null, 'Sao lưu'),
    h('p', { class: 'muted small' }, 'Tải về file JSON chứa toàn bộ thiệp, hạc, chữ ký, lời chưa nói, hồi âm, câu đố. Đây là dữ liệu cá nhân của học sinh, cất giữ cẩn thận, không gửi ra ngoài.'),
    exportBtn,
  );
}

// ================= Tab Thống kê =================
async function renderStats() {
  const wrap = h('section', { class: 'panel' });
  mainEl.append(wrap);
  wrap.append(h('div', { class: 'spinner' }));
  let s;
  try {
    s = await api.get('/api/stats');
  } catch (e) {
    wrap.replaceChildren(h('div', { class: 'empty' }, e.message));
    return;
  }
  if (S.tab !== 'stats') return;
  const tile = (label, n, sub) => h('div', { class: 'tile' }, h('span', null, label), h('b', null, fmtNum(n)), sub ? h('small', null, sub) : null);
  const bars = (entries, max) => h('div', { class: 'bars' }, entries.map(([label, n]) =>
    h('div', { class: 'bar-row' },
      h('span', { class: 'bar-label' }, label),
      h('span', { class: 'bar-track' }, h('span', { class: 'bar-fill', style: { width: `${max ? Math.max(2, (n / max) * 100) : 0}%` } })),
      h('span', { class: 'bar-num' }, fmtNum(n)))));
  const via = Object.entries(s.viaBySubject || {}).sort((a, b) => b[1] - a[1]);
  const per = Object.entries(s.perTeacher || {}).map(([id, n]) => {
    const t = teacherOf(id);
    return [t ? teacherName(t) : id, n];
  }).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const lb = s.leaderboard || [];

  wrap.replaceChildren(
    h('div', { class: 'panel-head' }, h('h2', null, 'Thống kê (nội dung đã duyệt)'),
      h('span', { class: `pill ${s.submissionsOpen ? 'st-approved' : 'st-hidden'}` }, s.submissionsOpen ? 'Đang nhận bài' : 'Đã khoá nhận bài')),
    h('div', { class: 'tiles' },
      tile('Thiệp', s.cards),
      tile('Hạc giấy', s.cranes, `mục tiêu 1.000 · ${Math.min(100, Math.round(((s.cranes || 0) / 1000) * 100))}%`),
      tile('Chữ ký', s.signatures),
      tile('Lượt xin vía', s.via)),
    h('div', { class: 'grid2' },
      h('div', { class: 'box' }, h('h3', null, 'Top lớp tri ân'),
        lb.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'tbl compact' },
          h('thead', null, h('tr', null, ['#', 'Lớp', 'Điểm', 'Thiệp', 'Hạc', 'Chữ ký'].map((x) => h('th', null, x)))),
          h('tbody', null, lb.map((r, i) => h('tr', null,
            h('td', null, String(i + 1)), h('td', null, h('b', null, r.cls)), h('td', null, fmtNum(r.score)),
            h('td', null, fmtNum(r.cards)), h('td', null, fmtNum(r.cranes)), h('td', null, fmtNum(r.signatures)))))))
          : h('p', { class: 'muted' }, 'Chưa có dữ liệu.')),
      h('div', { class: 'box' }, h('h3', null, 'Vía theo môn'),
        via.length ? bars(via, via[0][1]) : h('p', { class: 'muted' }, 'Chưa có ai xin vía.')),
      h('div', { class: 'box' }, h('h3', null, 'Thầy cô nhận nhiều thiệp nhất'),
        per.length ? bars(per, per[0][1]) : h('p', { class: 'muted' }, 'Chưa có thiệp nào được duyệt.')),
    ),
  );
}

// ================= Khởi động =================
(async () => {
  await setupMock();
  if (qs('logout') === '1') sessionStorage.removeItem(KEY_STORE);
  if (!S.key) return showLogin();
  try {
    S.config = await api.get('/api/admin/settings');
    start();
  } catch (e) {
    if (e.status !== 401 && e.status !== 403) showLogin(e.message);
  }
})();
