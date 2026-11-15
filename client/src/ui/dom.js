// Tiện ích DOM dùng chung cho giao diện học sinh (vanilla JS).
// Quy ước an toàn: nội dung do người dùng gửi LUÔN đi qua h()/textContent, không qua innerHTML.

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') {
        for (const [sk, sv] of Object.entries(v)) {
          if (sk.startsWith('--')) el.style.setProperty(sk, sv);
          else el.style[sk] = sv;
        }
      }
      else if (k === 'html') el.innerHTML = v; // chỉ dùng cho SVG/icon tĩnh do mình viết
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }
  appendAll(el, children);
  return el;
}

export function appendAll(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

/** Biến chuỗi SVG tĩnh (do mình viết) thành phần tử. */
export function fromHTML(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export const store = {
  get(key, def) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  },
  set(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* chế độ riêng tư */ }
  },
  del(key) {
    try { localStorage.removeItem(key); } catch { /* bỏ qua */ }
  },
};

export const fmtNum = (n) => Number(n || 0).toLocaleString('vi-VN');

export const teacherName = (t) => (t ? `${t.title} ${t.name}` : '');

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const isTouch = () =>
  typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);

export function countdown(target) {
  const ms = new Date(target).getTime() - Date.now();
  if (!Number.isFinite(ms)) return { done: true, d: 0, h: 0, m: 0, s: 0 };
  if (ms <= 0) return { done: true, d: 0, h: 0, m: 0, s: 0 };
  const s = Math.floor(ms / 1000);
  return { done: false, d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export const pad2 = (n) => String(n).padStart(2, '0');

/** Ô đếm ký tự cho textarea/input. */
export function counter(input, max) {
  const el = h('span', { class: 'ma-counter' });
  const upd = () => {
    const n = [...input.value].length;
    el.textContent = `${n}/${max}`;
    el.classList.toggle('is-over', n > max);
    el.classList.toggle('is-near', n > max * 0.9 && n <= max);
  };
  input.addEventListener('input', upd);
  upd();
  return el;
}

export const len = (s) => [...String(s || '')].length;

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không tải được ảnh.'));
    img.src = src;
  });
}

export function slug(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'ban';
}

/** Chuỗi không dấu, chữ thường, cách nhau một dấu cách (để tìm kiếm). */
export function norm(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** "Tên, lớp 8A1" – thầy cô (cls "GV" hoặc rỗng) thì chỉ ghi tên. */
export const isGV = (cls) => !cls || String(cls).toUpperCase() === 'GV';
export const withCls = (name, cls) => `${name}${isGV(cls) ? '' : ', lớp ' + cls}`;
