// Màn hình chờ + màn hình vào trường (nhập tên, lớp, chọn nhân vật).
import { h, store, len } from './dom.js';
import { icon } from './icons.js';

export const LOGO = '/brand/logo-256.png';
export const PROFILE_KEY = 'ma_profile';

// 4 kiểu đồng phục (outfit 0..3) – world dựng nhân vật theo chỉ số này.
export const OUTFITS = [
  { id: 0, name: 'Sơ mi trắng', note: 'Đồng phục hằng ngày', top: '#FFFFFF', bottom: '#0F2247' },
  { id: 1, name: 'Thể thao', note: 'Áo cam, quần navy', top: '#E9973B', bottom: '#0F2247' },
  { id: 2, name: 'Áo khoác', note: 'Khoác navy viền cam', top: '#0F2247', bottom: '#2B3F6B', trim: '#E9973B' },
  { id: 3, name: 'Lễ phục', note: 'Vest (nam) · Áo trắng viền xanh (nữ)', top: '#0F2247', bottom: '#0F2247', topNu: '#FFFFFF' },
];

function outfitSVG(o, gender) {
  const nu = gender === 'nu';
  const shirt = 'M18 9 L26 5 Q30 10 34 5 L42 9 L52 19 L46 26 L42 22 L42 41 L18 41 L18 22 L14 26 L8 19 Z';
  const longTop = 'M18 9 L26 5 Q30 10 34 5 L42 9 L52 19 L46 26 L42 22 L45 63 L15 63 L18 22 L14 26 L8 19 Z';
  const pants = 'M18 41 L42 41 L43 67 L33 67 L30 50 L27 67 L17 67 Z';
  const skirt = 'M18 41 L42 41 L47 58 L13 58 Z';
  const legs = '<rect x="22" y="58" width="5" height="9" rx="2" fill="#F2C9A0"/><rect x="33" y="58" width="5" height="9" rx="2" fill="#F2C9A0"/>';
  let parts = '';
  if (o.id === 3 && nu) {
    parts = `<path d="M19 60 L41 60 L41 68 L19 68Z" fill="#FFFFFF" stroke="#C9D2E3"/><path d="${longTop}" fill="#FFFFFF" stroke="#C9D2E3" stroke-width="1.5"/><path d="M26 5 Q30 10 34 5" stroke="#E9973B" stroke-width="2" fill="none"/>`;
  } else {
    const bottom = nu ? `${legs}<path d="${skirt}" fill="${o.bottom}"/>` : `<path d="${pants}" fill="${o.bottom}"/>`;
    parts = `${bottom}<path d="${shirt}" fill="${o.top}" stroke="${o.top === '#FFFFFF' ? '#C9D2E3' : 'rgba(0,0,0,.15)'}" stroke-width="1.5"/>`;
    if (o.id === 0) parts += '<path d="M30 10 L28 14 L30 26 L32 14 Z" fill="#0F2247"/>';
    if (o.id === 1) parts += '<path d="M26 5 Q30 10 34 5" stroke="#0F2247" stroke-width="3" fill="none"/><path d="M14 26 L8 19 M46 26 L52 19" stroke="#0F2247" stroke-width="3"/>';
    if (o.id === 2) parts += '<path d="M30 9 L30 41" stroke="#E9973B" stroke-width="1.5"/><path d="M10 21 L15 25 M50 21 L45 25" stroke="#E9973B" stroke-width="3"/>';
    if (o.id === 3) parts += '<path d="M26 5 Q30 10 34 5 L30 24 Z" fill="#FFFFFF"/><path d="M30 10 L28.5 15 L30 22 L31.5 15 Z" fill="#E9973B"/>';
  }
  return `<svg viewBox="0 0 60 72" aria-hidden="true">${parts}</svg>`;
}

// ------------------------------------------------------------------ màn hình chờ
const TIPS = [
  'Đến gần cây của thầy cô để treo thiệp tri ân.',
  'Hồ hạc giấy đang chờ 1.000 con hạc của cả trường.',
  'Ký tên bằng phấn lên tấm bảng đen trước dãy lớp học.',
  'Góc Xin Vía: vía để vui, ôn bài mới là chính!',
  'Lên sân khấu để chụp một tấm ảnh kỷ niệm 20/11.',
  'Hộp "Lời chưa nói": chỉ thầy cô được chọn mới đọc được.',
];

export function createLoading(layer) {
  let el = null;
  let bar, text, tip, tipTimer;
  function ensure() {
    if (el) return;
    bar = h('div', { class: 'ma-progress-fill' });
    text = h('div', { class: 'ma-loading-text' });
    tip = h('div', { class: 'ma-loading-tip' });
    el = h('div', { class: 'ma-loading', role: 'status', 'aria-live': 'polite' },
      h('div', { class: 'ma-loading-leaves', 'aria-hidden': 'true' }, ...Array.from({ length: 8 }, (_, i) => h('i', { style: { '--i': i } }))),
      h('div', { class: 'ma-loading-card' },
        h('div', { class: 'ma-loading-logo' }, h('img', { src: LOGO, alt: 'May Academy', width: 128, height: 128 })),
        h('div', { class: 'ma-loading-title' }, 'May Academy'),
        h('div', { class: 'ma-loading-sub' }, 'Mùa Tri Ân · 20/11'),
        h('div', { class: 'ma-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100 }, bar),
        text,
        tip,
      ),
    );
    layer.append(el);
    let i = Math.floor(Math.random() * TIPS.length);
    tip.hidden = true;
  }
  return {
    show(p = 0, msg) {
      ensure();
      el.classList.remove('is-out');
      const v = Math.max(0, Math.min(1, +p || 0));
      bar.style.width = (v * 100).toFixed(1) + '%';
      bar.parentElement.setAttribute('aria-valuenow', Math.round(v * 100));
      if (msg != null) text.textContent = msg;
    },
    hide() {
      if (!el) return;
      const old = el;
      el = null;
      clearInterval(tipTimer);
      old.classList.add('is-out');
      setTimeout(() => old.remove(), 450);
    },
  };
}

// ------------------------------------------------------------------ màn hình vào trường
export function showLogin(layer, config = {}) {
  return new Promise((resolve) => {
    const saved = store.get(PROFILE_KEY, null);
    const valid = saved && saved.name && saved.cls && saved.look;
    const wrap = h('div', { class: 'ma-login' });
    const done = (profile) => {
      store.set(PROFILE_KEY, profile);
      wrap.classList.add('is-out');
      setTimeout(() => wrap.remove(), 420);
      resolve(profile);
    };
    const hero = h('div', { class: 'ma-login-hero' },
      h('img', { src: LOGO, alt: 'May Academy', class: 'ma-login-logo', width: 96, height: 96 }),
      h('h1', null, 'Mùa Tri Ân 20/11'),
    );
    const card = h('div', { class: 'ma-login-card' });
    wrap.append(h('div', { class: 'ma-login-scroll' }, hero, card));
    layer.append(wrap);

    function renderWelcome() {
      card.replaceChildren(
        h('div', { class: 'ma-welcome' },
          h('div', { class: 'ma-welcome-av', html: outfitSVG(OUTFITS[saved.look.outfit] || OUTFITS[0], saved.look.gender) }),
          h('div', null,
            h('div', { class: 'ma-welcome-hi' }, 'Chào mừng bạn trở lại'),
            h('div', { class: 'ma-welcome-name' }, saved.name),
            h('div', { class: 'ma-welcome-cls' }, 'Lớp ' + saved.cls),
          ),
        ),
        h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg', onclick: () => done(saved) }, 'Vào trường'),
        h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-block', onclick: () => renderForm(true) }, icon('user'), 'Đổi người'),
      );
    }

    function renderForm(fresh) {
      const init = !fresh && valid ? saved : { name: '', cls: '', look: { gender: 'nam', outfit: 0 } };
      const look = { ...init.look };
      const nameIn = h('input', { class: 'ma-input', id: 'ma-name', maxlength: 40, autocomplete: 'off', placeholder: 'VD: Nguyễn Minh Anh', value: init.name });
      const classes = Array.isArray(config.classes) ? config.classes.filter(Boolean) : [];
      const clsIn = classes.length
        ? h('select', { class: 'ma-input', id: 'ma-cls' }, h('option', { value: '' }, '— Chọn lớp —'), classes.map((c) => h('option', { value: c, selected: c === init.cls }, c)))
        : h('input', { class: 'ma-input ma-upper', id: 'ma-cls', maxlength: 12, autocomplete: 'off', placeholder: 'VD: 8A1', value: init.cls });
      const err = h('div', { class: 'ma-form-err', role: 'alert' });

      const genderSeg = h('div', { class: 'ma-seg', role: 'radiogroup', 'aria-label': 'Nhân vật' });
      const outfitGrid = h('div', { class: 'ma-outfits', role: 'radiogroup', 'aria-label': 'Đồng phục' });
      const drawLook = () => {
        genderSeg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.g === look.gender)));
        outfitGrid.replaceChildren(
          ...OUTFITS.map((o) =>
            h('button', {
              type: 'button', class: 'ma-outfit', role: 'radio', 'aria-checked': String(o.id === look.outfit),
              onclick: () => { look.outfit = o.id; drawLook(); },
            }, h('span', { class: 'ma-outfit-pic', html: outfitSVG(o, look.gender) }), h('b', null, o.name)),
          ),
        );
      };
      for (const [g, label] of [['nam', 'Nam'], ['nu', 'Nữ']]) {
        genderSeg.append(h('button', { type: 'button', role: 'radio', dataset: { g }, onclick: () => { look.gender = g; drawLook(); } }, label));
      }
      drawLook();

      const submit = (e) => {
        e.preventDefault();
        const name = nameIn.value.replace(/\s+/g, ' ').trim();
        const cls = clsIn.value.replace(/\s+/g, '').trim().toUpperCase();
        if (len(name) < 2) { err.textContent = 'Bạn nhập tên (ít nhất 2 chữ) nhé.'; nameIn.focus(); return; }
        if (len(name) > 40) { err.textContent = 'Tên dài quá, tối đa 40 ký tự thôi.'; nameIn.focus(); return; }
        if (!cls) { err.textContent = 'Bạn cho biết mình học lớp nào nhé.'; clsIn.focus(); return; }
        if (len(cls) > 12) { err.textContent = 'Tên lớp tối đa 12 ký tự.'; clsIn.focus(); return; }
        done({ name, cls, look: { gender: look.gender, outfit: look.outfit } });
      };

      card.replaceChildren(
        h('form', { class: 'ma-login-form', onsubmit: submit, novalidate: true },
          h('div', { class: 'ma-field' }, h('label', { for: 'ma-name' }, 'Tên của bạn'), nameIn),
          h('div', { class: 'ma-field' }, h('label', { for: 'ma-cls' }, 'Lớp'), clsIn),
          h('div', { class: 'ma-field' }, h('label', null, 'Nhân vật'), genderSeg),
          h('div', { class: 'ma-field' }, h('label', null, 'Đồng phục'), outfitGrid),
          err,
          h('button', { type: 'submit', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg' }, 'Vào trường'),
          fresh && valid ? h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-block', onclick: renderWelcome }, 'Quay lại') : null,
        ),
      );
    }

    if (valid) renderWelcome();
    else renderForm(false);
  });
}

export { outfitSVG };
