// Tiện ích dùng chung cho trang Quản trị, trang Thầy cô và Sổ Tri Ân.
// Không phụ thuộc thư viện ngoài.

export const NAVY = '#0F2247';
export const ORANGE = '#E9973B';

/** Tạo phần tử DOM gọn: h('div', { class: 'x', onclick() {} }, 'chữ', con, [mảng con]) */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (v === true) el.setAttribute(k, '');
      else if (k in el && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, String(v));
    }
  }
  appendKids(el, children);
  return el;
}

function appendKids(el, kids) {
  for (const c of kids) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) appendKids(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

export const isMock = () => qs('mock') === '1';

/** Bật dữ liệu giả khi URL có ?mock=1 (chỉ tải mock.js khi cần). */
export async function setupMock() {
  if (!isMock()) return false;
  const m = await import('./mock.js');
  m.installMock();
  return true;
}

/** Thêm mock=1 vào link nội bộ khi đang chạy thử. */
export function withMock(url) {
  if (!isMock()) return url;
  return url + (url.includes('?') ? '&' : '?') + 'mock=1';
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** Tạo lớp gọi API có header riêng (x-admin-key hoặc x-teacher-token). */
export function createClient({ headers, onUnauthorized } = {}) {
  async function request(method, url, body, { raw = false } = {}) {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(headers ? headers() : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      console.warn('[api]', method, url, e);
      throw new ApiError('Mất kết nối tới máy chủ, kiểm tra mạng rồi thử lại nhé.', 0);
    }
    if (raw && res.ok) return res;
    let data = null;
    try { data = await res.json(); } catch { /* không phải JSON */ }
    if (!res.ok) {
      const err = new ApiError((data && data.error) || `Có lỗi xảy ra (${res.status}).`, res.status);
      if ((res.status === 401 || res.status === 403) && onUnauthorized) onUnauthorized(err);
      throw err;
    }
    return data;
  }
  return {
    get: (url) => request('GET', url),
    post: (url, body = {}) => request('POST', url, body),
    put: (url, body = {}) => request('PUT', url, body),
    raw: (url) => request('GET', url, undefined, { raw: true }),
  };
}

/** Cây đại thụ (CONTRACT mục 7): special='daithu'. Phòng khi server chưa trả `special`: id dạng d01, d02. */
export function isDaiThu(t) {
  return !!t && (t.special === 'daithu' || /^d\d+$/.test(t.id || ''));
}

export function teacherName(t) {
  if (!t) return '';
  return `${t.title || ''} ${t.name || ''}`.trim();
}

export function fmtTime(t) {
  if (!t) return '';
  const d = new Date(t);
  if (isNaN(d)) return String(t);
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function fmtNum(n) {
  return Number(n || 0).toLocaleString('vi-VN');
}

/** Lấy tên file từ một đường dẫn ảnh (/media/abc.webp → abc.webp). */
export function mediaFile(url) {
  if (!url) return '';
  return String(url).split('?')[0].split('#')[0].split('/').pop();
}

/** Bộ chuyển đường dẫn ảnh vẽ sang endpoint có quyền xem. */
export function mediaResolver(base, param, value) {
  return (url) => {
    if (!url) return null;
    if (/^(data:|blob:)/.test(url)) return url;
    const file = mediaFile(url);
    if (!file) return null;
    return `${base}/${encodeURIComponent(file)}?${param}=${encodeURIComponent(value)}`;
  };
}

let toastBox;
export function toast(msg, kind = 'ok', ms = 2600) {
  if (!toastBox) {
    toastBox = h('div', { class: 'toast-box', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastBox);
  }
  const t = h('div', { class: `toast toast-${kind}` }, msg);
  toastBox.append(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

/** Hộp xác nhận đẹp hơn confirm(). Trả về Promise<boolean>. */
export function confirmDialog({ title = 'Xác nhận', message = '', okText = 'Đồng ý', cancelText = 'Huỷ', danger = false } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      resolve(ok);
      if (dlg.open) dlg.close();
      dlg.remove();
    };
    const dlg = h('dialog', { class: 'dlg' },
      h('div', { class: 'dlg-body' },
        h('h3', null, title),
        message ? h('p', null, message) : null,
        h('div', { class: 'dlg-actions' },
          h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => finish(false) }, cancelText),
          h('button', { type: 'button', class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, 'data-ok': '1', autofocus: true, onclick: () => finish(true) }, okText),
        ),
      ),
    );
    dlg.addEventListener('cancel', () => finish(false));
    dlg.addEventListener('close', () => finish(false));
    document.body.append(dlg);
    dlg.showModal();
  });
}

export function isDialogOpen() {
  return !!document.querySelector('dialog[open], .viewer.open');
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* thử cách dưới */ }
  const ta = h('textarea', { style: { position: 'fixed', left: '-9999px', top: '0' } });
  ta.value = text;
  document.body.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}

/** Đợi mọi ảnh trong root tải xong (hoặc lỗi). onEach(done, total) để báo tiến độ. */
export function waitImages(root, onEach) {
  const imgs = [...root.querySelectorAll('img')];
  let done = 0;
  const total = imgs.length;
  if (onEach) onEach(0, total);
  return Promise.all(imgs.map((img) => new Promise((resolve) => {
    const fin = () => { done++; if (onEach) onEach(done, total); resolve(); };
    if (img.complete && img.naturalWidth !== 0) return fin();
    if (img.complete && img.getAttribute('src') === null) return fin();
    img.addEventListener('load', fin, { once: true });
    img.addEventListener('error', fin, { once: true });
  })));
}

export function logoUrl(size = 'round') {
  return size === 'full' ? '/brand/logo.png' : size === '256' ? '/brand/logo-256.png' : '/brand/logo-round.png';
}

/** Ảnh thầy cô: có ảnh thì dùng, không thì logo trường (không tự vẽ mặt người). */
export function teacherPhoto(t) {
  return t && t.photo ? t.photo : logoUrl('round');
}

/** Giờ Việt Nam ↔ ô datetime-local. */
export function isoToVnLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function vnLocalInputToIso(v) {
  if (!v) return '';
  return `${v.length === 16 ? v + ':00' : v}+07:00`;
}

export function plural(n, word) {
  return `${fmtNum(n)} ${word}`;
}
