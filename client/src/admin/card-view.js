// Lớp bọc dựng thiệp cho trang Quản trị / Thầy cô / Sổ Tri Ân.
//
// Ưu tiên dùng bộ dựng thiệp thật của giao diện học sinh: client/src/ui/cardRender.js
// Hàm mong cardRender.js xuất (một trong các tên dưới, ưu tiên `renderCard`):
//
//   export async function renderCard(card, { width, mediaUrl, mode, to }) -> HTMLElement | HTMLCanvasElement
//     card     : Card theo CONTRACT (drawingUrl đã được đổi sẵn sang URL tải được: admin/teacher/data:)
//     width    : bề rộng (số px hoặc chuỗi CSS); lớp bọc truyền '100%' để thiệp theo khung chứa
//     mediaUrl : hàm đổi URL ảnh (ở đây là hàm giữ nguyên vì drawingUrl đã đổi sẵn)
//     mode     : 'thumb' | 'full' | 'print'
//     to       : tên người nhận, vd 'Cô Nguyễn Hồng Ngọc' (thiệp ghi "Kính gửi …")
//   (13/11: ui/cardRender.js đã xuất đúng renderCard như trên, thiệp tỉ lệ 4:5.)
//   Promise chỉ nên resolve khi ảnh vẽ/sticker đã tải xong (để Sổ Tri Ân đo trang đúng).
//
//   (tuỳ chọn) export const TEMPLATES = [{ id, name }]  → để bản dự phòng ghi đúng tên mẫu
//   (tuỳ chọn) export const STICKERS  = { [id]: '🌸' | '/ui/stickers/x.png' } → để bản dự phòng vẽ sticker
//
// Nếu file chưa có / không có hàm phù hợp / hàm ném lỗi → dùng bản dựng dự phòng bên dưới.
import './card-view.css';

const loaders = import.meta.glob('../ui/cardRender.js');
const FN_NAMES = ['renderCard', 'renderCardElement', 'createCardElement', 'buildCard', 'cardElement', 'default'];

let modPromise = null;
export function loadCardRenderer() {
  if (!modPromise) {
    modPromise = (async () => {
      const load = loaders['../ui/cardRender.js'];
      if (!load) return null;
      try {
        return await load();
      } catch (e) {
        console.warn('[card-view] Không tải được ui/cardRender.js, dùng bản dự phòng.', e);
        return null;
      }
    })();
  }
  return modPromise;
}

function pickFn(mod) {
  if (!mod) return null;
  for (const n of FN_NAMES) if (typeof mod[n] === 'function') return mod[n];
  return null;
}

function toNode(out) {
  if (!out) return null;
  if (out instanceof Node) return out;
  if (typeof out === 'string') {
    const d = document.createElement('div');
    d.innerHTML = out;
    return d;
  }
  if (out.el instanceof Node) return out.el;
  if (out.element instanceof Node) return out.element;
  if (out.canvas instanceof Node) return out.canvas;
  return null;
}

/**
 * Dựng một tấm thiệp.
 * @param {object} card Card theo CONTRACT
 * @param {object} opts { mediaUrl(url)->url, width (px), mode: 'thumb'|'full'|'print', teacherName }
 * @returns {Promise<HTMLElement>} phần tử bọc .cv (bề rộng 100% khung chứa)
 */
export async function renderCardView(card, opts = {}) {
  const { mediaUrl = (u) => u, width = '100%', mode = 'thumb', teacherName = '' } = opts;
  const c = {
    ...card,
    drawingUrl: card.drawingUrl ? mediaUrl(card.drawingUrl) : null,
    stickers: Array.isArray(card.stickers) ? card.stickers : [],
  };
  const wrap = document.createElement('div');
  wrap.className = `cv cv-${mode}`;

  const mod = await loadCardRenderer();
  const fn = pickFn(mod);
  if (fn) {
    try {
      const node = toNode(await fn(c, { width, mediaUrl: (u) => u, mode, to: teacherName }));
      if (node) {
        if (c.seed) {
          // Thiệp viết sẵn (đại thụ, CONTRACT 7.1) không ghi người gửi. Phòng khi cardRender chưa tự ẩn chữ ký.
          const signs = node.querySelectorAll('.mac-sign');
          signs.forEach((el) => { el.style.display = 'none'; });
          if (signs.length && typeof mod.fitCard === 'function') { try { mod.fitCard(node); } catch { /* bỏ qua */ } }
        }
        wrap.dataset.renderer = 'ui';
        wrap.append(node);
        return wrap;
      }
    } catch (e) {
      console.warn('[card-view] cardRender lỗi, dùng bản dự phòng.', e);
    }
  }
  wrap.dataset.renderer = 'fallback';
  wrap.append(fallbackCard(c, mod, { mode, teacherName }));
  return wrap;
}

// ---------------- Bản dựng dự phòng ----------------

const THEMES = 6;
const STICKER_EMOJI = {
  heart: '❤️', tim: '❤️', star: '⭐', sao: '⭐', flower: '🌸', hoa: '🌸', leaf: '🍁', la: '🍁',
  book: '📚', sach: '📚', pen: '✏️', but: '✏️', apple: '🍎', tao: '🍎', crane: '🕊️', hac: '🕊️',
  smile: '😊', cuoi: '😊', sun: '☀️', medal: '🏅', trophy: '🏆', gift: '🎁', qua: '🎁',
  rose: '🌹', tulip: '🌷', sparkle: '✨', ten: '💯', '10': '💯', bell: '🔔', rainbow: '🌈',
  balloon: '🎈', music: '🎵', clap: '👏', hug: '🤗', thanks: '🙏', camon: '🙏',
};

function hash(s) {
  let x = 0;
  for (const ch of String(s || '')) x = (x * 31 + ch.codePointAt(0)) >>> 0;
  return x;
}

function templateName(tpl, mod) {
  const list = mod && (mod.TEMPLATES || mod.templates || mod.CARD_TEMPLATES);
  if (Array.isArray(list)) {
    const f = list.find((t) => t && (t.id === tpl || t.key === tpl));
    if (f && (f.name || f.label || f.title)) return f.name || f.label || f.title;
  } else if (list && typeof list === 'object' && list[tpl]) {
    const v = list[tpl];
    if (typeof v === 'string') return v;
    if (v.name || v.label) return v.name || v.label;
  }
  if (!tpl) return 'Thiệp tri ân';
  return String(tpl).replace(/[-_]+/g, ' ').replace(/^\w/, (m) => m.toUpperCase());
}

function stickerContent(id, mod) {
  const map = mod && (mod.STICKERS || mod.stickers);
  let v = null;
  if (Array.isArray(map)) {
    const f = map.find((s) => s && s.id === id);
    v = f ? (f.emoji || f.src || f.url || f.char || null) : null;
  } else if (map && typeof map === 'object') {
    const f = map[id];
    v = typeof f === 'string' ? f : f ? (f.emoji || f.src || f.url || null) : null;
  }
  if (!v) v = STICKER_EMOJI[String(id).toLowerCase()] || null;
  if (!v && /[^\x00-\x7F]/.test(String(id)) && String(id).length <= 8) v = String(id);
  return v;
}

function fallbackCard(c, mod, { mode, teacherName }) {
  const theme = hash(c.template) % THEMES;
  const el = document.createElement('article');
  el.className = `cvf cvf-t${theme} cvf-${mode}`;

  const head = document.createElement('div');
  head.className = 'cvf-head';
  const tpl = document.createElement('span');
  tpl.className = 'cvf-tpl';
  tpl.textContent = templateName(c.template, mod);
  const date = document.createElement('span');
  date.className = 'cvf-date';
  date.textContent = '20/11';
  head.append(tpl, date);
  el.append(head);

  if (teacherName) {
    const to = document.createElement('div');
    to.className = 'cvf-to';
    to.textContent = `Gửi ${teacherName}`;
    el.append(to);
  }

  if (c.message) {
    const msg = document.createElement('p');
    msg.className = 'cvf-msg';
    msg.textContent = c.message;
    el.append(msg);
  }

  if (c.drawingUrl) {
    const art = document.createElement('div');
    art.className = 'cvf-art';
    const img = document.createElement('img');
    img.alt = 'Hình vẽ tay của học sinh';
    img.decoding = 'async';
    img.src = c.drawingUrl;
    art.append(img);
    el.append(art);
  }

  const from = document.createElement('div');
  from.className = 'cvf-from';
  const name = c.anonymous ? 'Một bạn học sinh' : (c.from || 'Một bạn học sinh');
  if (c.seed) from.hidden = true; // thiệp viết sẵn (đại thụ): không ghi người gửi
  const sig = document.createElement('span');
  sig.className = 'cvf-sig';
  sig.textContent = name;
  from.append('— ', sig);
  if (!c.anonymous && c.cls) {
    const cls = document.createElement('span');
    cls.className = 'cvf-cls';
    cls.textContent = ` · Lớp ${c.cls}`;
    from.append(cls);
  }
  el.append(from);

  // Sticker: toạ độ x,y coi là tỉ lệ 0..1 của cả tấm thiệp (nếu >1 coi là %).
  const layer = document.createElement('div');
  layer.className = 'cvf-stickers';
  for (const s of c.stickers.slice(0, 20)) {
    const content = stickerContent(s.id, mod);
    if (!content) continue;
    const x = Number(s.x) || 0;
    const y = Number(s.y) || 0;
    const st = document.createElement('span');
    st.className = 'cvf-st';
    st.style.left = `${x <= 1 ? x * 100 : x}%`;
    st.style.top = `${y <= 1 ? y * 100 : y}%`;
    const scale = Math.min(3, Math.max(0.4, Number(s.s) || 1));
    const rot = Number(s.r) || 0;
    st.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`; // r tính bằng độ (theo ui/cardRender.js)
    if (/^(\/|https?:|data:)/.test(content)) {
      const img = document.createElement('img');
      img.src = content;
      img.alt = '';
      st.append(img);
    } else st.textContent = content;
    layer.append(st);
  }
  if (layer.childElementCount) el.append(layer);
  return el;
}
