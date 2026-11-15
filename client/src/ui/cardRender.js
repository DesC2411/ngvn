// Bộ dựng thiệp DÙNG CHUNG (giao diện học sinh, trang quản trị, trang thầy cô, Sổ Tri Ân).
// Tự chứa: không cần ui.css, tự chèn CSS + font khi dùng lần đầu.
//
//   import { renderCard, createCardElement, TEMPLATES, STICKERS } from '../ui/cardRender.js';
//   const el = await renderCard(card, { width: 360, mediaUrl: (u) => u, mode: 'full', to: 'Cô Nguyễn Hồng Ngọc' });
//   container.append(el);
//
// card = Card theo CONTRACT: { message, template, from, cls, anonymous, drawingUrl, stickers:[{id,x,y,s,r}] }
//   - x, y: tâm sticker theo tỉ lệ 0..1 của tấm thiệp; s: hệ số phóng (1 = 22% bề rộng thiệp); r: độ xoay (độ).
//   - drawingUrl: ảnh vẽ tay nền trong suốt, phủ kín cả mặt thiệp (tỉ lệ 4:5).
// Thiệp luôn có tỉ lệ 4:5, mọi cỡ chữ tính theo bề rộng thiệp (cqw) nên phóng to/thu nhỏ/in đều giữ nguyên bố cục.

import { FONTS, FONT_FAMILIES, fontById, SIZES, BGS, bgById, FRAMES, frameSVG, extraTemplates, extraStickers, STICKER_GROUPS, OLD_STICKER_GROUP } from './cardAssets.js';

export { FONTS, SIZES, BGS, FRAMES, STICKER_GROUPS };

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&family=Patrick+Hand&' + FONT_FAMILIES + '&display=swap';

// ---------------------------------------------------------------- tiện ích vẽ
let UID = 0;
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function starPath(cx, cy, R, r, n = 5) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = (Math.PI / n) * i - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`;
  }
  return d + 'Z';
}
function daisy(cx, cy, R, petal = '#fff', center = '#F2A93B', stroke = '#EAD7A4', rot = 0) {
  let p = '';
  for (let i = 0; i < 12; i++) {
    p += `<ellipse cx="0" cy="${(-R * 0.52).toFixed(1)}" rx="${(R * 0.2).toFixed(1)}" ry="${(R * 0.46).toFixed(1)}" transform="rotate(${i * 30 + rot})"/>`;
  }
  return `<g transform="translate(${cx} ${cy})"><g fill="${petal}" stroke="${stroke}" stroke-width="1">${p}</g><circle r="${(R * 0.26).toFixed(1)}" fill="${center}"/><circle r="${(R * 0.12).toFixed(1)}" cx="${(-R * 0.06).toFixed(1)}" cy="${(-R * 0.06).toFixed(1)}" fill="#fff" opacity=".35"/></g>`;
}
const MAPLE =
  'M50 4 L58 26 L78 16 L72 40 L95 42 L76 56 L84 70 L60 64 L54 88 L50 84 L46 88 L40 64 L16 70 L24 56 L5 42 L28 40 L22 16 L42 26 Z';
function maple(x, y, s, r, fill) {
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-50 -50)"><path d="${MAPLE}" fill="${fill}"/><path d="M50 98 L50 30 M50 62 L30 46 M50 62 L70 46" stroke="#000" stroke-opacity=".18" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
}
function leaf(x, y, s, r, fill) {
  return `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-50 -50)"><path d="M50 4 C78 22 84 60 50 96 C16 60 22 22 50 4Z" fill="${fill}"/><path d="M50 12 L50 92" stroke="#000" stroke-opacity=".18" stroke-width="3"/></g>`;
}
function lotus(x, y, s) {
  const petal = 'M0 0 C -13 -18 -11 -42 0 -58 C 11 -42 13 -18 0 0 Z';
  const back = [-62, -34, 34, 62].map((a) => `<path d="${petal}" transform="rotate(${a}) scale(.92)" fill="#F7B6CC" stroke="#E98BAA" stroke-width="1.5"/>`).join('');
  const front = [-18, 18, 0].map((a) => `<path d="${petal}" transform="rotate(${a})" fill="${a ? '#F28DB0' : '#EC6F98'}" stroke="#D85C86" stroke-width="1.5"/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${s})">${back}${front}<ellipse cx="0" cy="-6" rx="10" ry="4" fill="#F6C453"/></g>`;
}

// ---------------------------------------------------------------- 6 mẫu thiệp (viewBox 400×500)
const TPL = [
  {
    id: 'cuc',
    name: 'Hoa cúc',
    ink: '#5A3A12',
    accent: '#D9822F',
    sub: '#8A6431',
    swatch: ['#FFF8E4', '#F2A93B'],
    box: [17, 11, 11, 14], // top, right, bottom, left (%)
    svg: (u) => `
      <defs><pattern id="d${u}" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="13" cy="13" r="1.8" fill="#F1D48A" opacity=".55"/></pattern></defs>
      <rect width="400" height="500" fill="#FFF8E4"/><rect width="400" height="500" fill="url(#d${u})"/>
      <rect x="14" y="14" width="372" height="472" rx="18" fill="none" stroke="#E7B84A" stroke-width="3.5" stroke-dasharray="1 10" stroke-linecap="round"/>
      <g fill="#8DBF6A">${leaf(70, 84, 0.32, 140, '#8DBF6A')}${leaf(112, 54, 0.26, 70, '#9ACB78')}${leaf(326, 420, 0.34, -40, '#8DBF6A')}${leaf(292, 446, 0.26, -100, '#9ACB78')}</g>
      ${daisy(42, 46, 36)}${daisy(98, 28, 22, '#FFE07A', '#E9973B', '#EFC75A', 12)}${daisy(28, 108, 20, '#fff', '#F2A93B', '#EAD7A4', 8)}
      ${daisy(358, 452, 38)}${daisy(300, 476, 22, '#FFE07A', '#E9973B', '#EFC75A', 10)}${daisy(374, 388, 20)}
      ${daisy(372, 40, 13, '#FFE07A', '#E9973B', '#EFC75A')}${daisy(30, 468, 14)}`,
  },
  {
    id: 'phan',
    name: 'Phấn & bảng',
    ink: '#F6F3EA',
    accent: '#F7D774',
    sub: '#CFE8DB',
    swatch: ['#2E5143', '#8A5A2E'],
    box: [12, 9, 15, 9],
    svg: (u) => `
      <defs><radialGradient id="s${u}"><stop offset="0" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <rect width="400" height="500" fill="#8A5A2E"/>
      <path d="M0 6 Q200 12 400 4 M0 492 Q200 486 400 494 M6 0 Q10 250 4 500 M394 0 Q390 250 396 500" stroke="#6F4420" stroke-width="2" opacity=".6" fill="none"/>
      <rect x="16" y="16" width="368" height="438" rx="4" fill="#2E5143"/>
      <ellipse cx="120" cy="160" rx="140" ry="70" fill="url(#s${u})"/><ellipse cx="300" cy="330" rx="150" ry="80" fill="url(#s${u})"/>
      <g fill="#fff" opacity=".32" font-family="Patrick Hand, cursive"><text x="34" y="54" font-size="22">A  B  C</text><text x="292" y="54" font-size="20">1 + 1 = 2</text></g>
      <path d="${starPath(352, 404, 15, 6.5)}" fill="none" stroke="#F7D774" stroke-opacity=".55" stroke-width="2" stroke-linejoin="round"/>
      <path d="M40 412 c0-8 10-10 12-3 c2-7 12-5 12 3 c0 8-12 14-12 14 s-12-6-12-14z" fill="none" stroke="#F4A6C0" stroke-opacity=".6" stroke-width="2"/>
      <rect x="16" y="454" width="368" height="14" fill="#6E4520"/>
      <rect x="64" y="445" width="42" height="10" rx="5" fill="#F6F3EA"/><rect x="116" y="447" width="30" height="8" rx="4" fill="#F7D774"/><rect x="300" y="446" width="36" height="9" rx="4.5" fill="#F4A6C0"/>
      <rect x="230" y="442" width="40" height="13" rx="2" fill="#4D6E8F"/><rect x="230" y="442" width="40" height="5" rx="2" fill="#C9CED6"/>`,
  },
  {
    id: 'sach',
    name: 'Sách vở',
    ink: '#1F3B70',
    accent: '#D9534F',
    sub: '#3D5A8F',
    swatch: ['#FDFCF6', '#7FA3D9'],
    box: [16, 8, 19, 19],
    svg: () => {
      let lines = '';
      for (let y = 96; y < 486; y += 24) lines += `<line x1="0" x2="400" y1="${y}" y2="${y}"/>`;
      let holes = '';
      for (let y = 34; y < 490; y += 36) holes += `<circle cx="26" cy="${y}" r="7"/>`;
      return `
      <rect width="400" height="500" fill="#FDFCF6"/>
      <g stroke="#C9DBF3" stroke-width="1.4">${lines}</g>
      <line x1="64" x2="64" y1="0" y2="500" stroke="#F2A3A3" stroke-width="2"/>
      <g fill="#ECE7DA" stroke="#CFC7B3" stroke-width="1.5">${holes}</g>
      <g transform="translate(282 22) rotate(16)">
        <rect x="0" y="0" width="78" height="15" fill="#F6C453" stroke="#C9952A" stroke-width="1.5"/>
        <rect x="-12" y="0" width="12" height="15" rx="3" fill="#F29BB0" stroke="#D97A93" stroke-width="1.5"/>
        <rect x="-3" y="0" width="5" height="15" fill="#C9CED6"/>
        <path d="M78 0 L96 7.5 L78 15 Z" fill="#F4D9B0" stroke="#C9952A" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M90 5 L96 7.5 L90 10 Z" fill="#333"/>
      </g>
      <g transform="translate(346 446) rotate(-10)"><circle r="26" fill="none" stroke="#D9534F" stroke-width="3"/><text y="10" text-anchor="middle" font-size="28" font-family="Patrick Hand, cursive" fill="#D9534F">10</text></g>
      <path d="M300 462 q14 10 26 -2" stroke="#D9534F" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>`;
    },
  },
  {
    id: 'la-thu',
    name: 'Lá thu',
    ink: '#5B2A0C',
    accent: '#C2551E',
    sub: '#8A4A20',
    swatch: ['#FFE6C2', '#D9622B'],
    box: [17, 10, 17, 10],
    svg: (u) => `
      <defs><linearGradient id="g${u}" x2="0" y2="1"><stop offset="0" stop-color="#FFF4E2"/><stop offset="1" stop-color="#FFD9A8"/></linearGradient></defs>
      <rect width="400" height="500" fill="url(#g${u})"/>
      <rect x="12" y="12" width="376" height="476" rx="16" fill="none" stroke="#E9A55A" stroke-opacity=".7" stroke-width="2"/>
      <path d="M-10 40 C 60 30, 110 54, 176 22 M110 44 C 126 60, 132 70, 128 84" stroke="#7A4A22" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${maple(42, 44, 0.42, -20, '#E9973B')}${maple(100, 62, 0.34, 25, '#D9622B')}${maple(150, 30, 0.3, -35, '#F2C14E')}${leaf(128, 92, 0.22, 10, '#C2551E')}
      ${maple(362, 120, 0.26, 30, '#E9973B')}${leaf(340, 290, 0.2, -25, '#C2551E')}${maple(38, 330, 0.22, 40, '#F2C14E')}
      ${maple(58, 452, 0.38, -30, '#D9622B')}${maple(352, 452, 0.44, 15, '#E9973B')}${leaf(296, 474, 0.26, 60, '#F2C14E')}${maple(384, 378, 0.2, 0, '#B5651D')}${leaf(110, 478, 0.2, -70, '#E9973B')}`,
  },
  {
    id: 'sen',
    name: 'Hoa sen',
    ink: '#7A2649',
    accent: '#3E7D52',
    sub: '#9A4A6B',
    swatch: ['#FDE4EC', '#EC6F98'],
    box: [13, 10, 25, 10],
    svg: (u) => `
      <defs><linearGradient id="g${u}" x2="0" y2="1"><stop offset="0" stop-color="#FFF7F9"/><stop offset="1" stop-color="#FDE2EB"/></linearGradient></defs>
      <rect width="400" height="500" fill="url(#g${u})"/>
      <rect x="12" y="12" width="376" height="476" rx="20" fill="none" stroke="#F2B8C9" stroke-width="2"/>
      <path d="M0 404 C 60 390, 120 420, 200 404 S 340 388, 400 406 L400 500 L0 500Z" fill="#D6EEE8"/>
      <path d="M0 440 C 70 428, 140 452, 220 438 S 350 428, 400 442 L400 500 L0 500Z" fill="#C3E5DC"/>
      <g fill="#6FA86B"><path d="M262 456 a44 15 0 1 0 88 0 a44 15 0 1 0 -88 0 M306 456 l26 -12 l4 10 z" fill-rule="evenodd"/><ellipse cx="368" cy="428" rx="26" ry="9" fill="#7DB877"/><ellipse cx="200" cy="472" rx="30" ry="9" fill="#7DB877"/></g>
      <path d="M96 470 C 96 450, 98 440, 96 428" stroke="#4E8F5A" stroke-width="4" fill="none"/>
      ${lotus(96, 440, 0.95)}
      <path d="M180 460 C 182 446, 182 432, 184 420" stroke="#4E8F5A" stroke-width="3" fill="none"/>
      <path d="M184 420 C 172 406, 176 388, 186 380 C 196 390, 198 406, 184 420 Z" fill="#F48FB1" stroke="#D85C86" stroke-width="1.5"/>
      <g fill="#F7B6CC" opacity=".85"><path d="M340 54 c-6-10 0-20 8-22 c4 8 2 18-8 22z"/><path d="M368 96 c-8-6-8-18-2-22 c8 4 10 16 2 22z"/><path d="M48 70 c-2-10 6-18 14-16 c0 8-6 16-14 16z"/></g>`,
  },
  {
    id: 'sao',
    name: 'Ngôi sao',
    ink: '#FFF6E0',
    accent: '#F6C453',
    sub: '#F3D9A4',
    swatch: ['#0F2247', '#F6C453'],
    box: [18, 10, 16, 10],
    svg: (u) => {
      const r = rng(2011);
      let dots = '';
      for (let i = 0; i < 70; i++) {
        dots += `<circle cx="${(r() * 400).toFixed(1)}" cy="${(r() * 500).toFixed(1)}" r="${(0.6 + r() * 1.3).toFixed(2)}" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
      }
      return `
      <defs><radialGradient id="g${u}" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#24447F"/><stop offset="1" stop-color="#0F2247"/></radialGradient>
      <linearGradient id="t${u}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".9"/></linearGradient></defs>
      <rect width="400" height="500" fill="url(#g${u})"/>
      <g fill="#fff">${dots}</g>
      <rect x="12" y="12" width="376" height="476" rx="18" fill="none" stroke="#E9973B" stroke-opacity=".7" stroke-width="2" stroke-dasharray="10 6"/>
      <mask id="m${u}"><rect width="400" height="500" fill="#fff"/><circle cx="353" cy="51" r="21" fill="#000"/></mask><circle cx="342" cy="60" r="24" fill="#FFE9A8" mask="url(#m${u})"/>
      <path d="M96 80 L176 40" stroke="url(#t${u})" stroke-width="2.5" stroke-linecap="round"/>
      <g fill="#F6C453"><path d="${starPath(52, 62, 17, 7)}"/><path d="${starPath(204, 34, 8, 3.4)}"/><path d="${starPath(72, 440, 12, 5)}"/></g>
      <g fill="#E9973B"><path d="${starPath(334, 438, 22, 9)}"/><path d="${starPath(370, 160, 9, 3.8)}"/></g>`;
    },
  },
];
const HELPERS = { rng, starPath, daisy, maple, leaf };
TPL.push(...extraTemplates(HELPERS));

export const TEMPLATES = TPL.map(({ id, name, ink, accent, swatch }) => ({ id, name, ink, accent, swatch }));
export const templateById = (id) => TPL.find((t) => t.id === id) || TPL[0];
export const templateSVG = (id) => {
  const t = templateById(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">${t.svg(++UID)}</svg>`;
};

// ---------------------------------------------------------------- sticker (viewBox 100×100)
const ST = [
  ['hoa', 'Bông hoa', `<g fill="#F7A1C4" stroke="#E07AA5" stroke-width="2"><circle cx="50" cy="27" r="17"/><circle cx="71.9" cy="42.9" r="17"/><circle cx="63.5" cy="68.6" r="17"/><circle cx="36.5" cy="68.6" r="17"/><circle cx="28.1" cy="42.9" r="17"/></g><circle cx="50" cy="50" r="12" fill="#FFD45C" stroke="#F2A93B" stroke-width="2"/><circle cx="46" cy="46" r="3" fill="#fff" opacity=".7"/>`],
  ['tim', 'Trái tim', `<path d="M50 86 C20 64 6 46 10 30 C14 14 34 8 50 26 C66 8 86 14 90 30 C94 46 80 64 50 86Z" fill="#EF4D6B" stroke="#C9334F" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="30" cy="31" rx="8" ry="5" transform="rotate(-35 30 31)" fill="#fff" opacity=".45"/>`],
  ['sao', 'Ngôi sao', `<path d="${starPath(50, 53, 44, 19)}" fill="#F6C453" stroke="#E0A030" stroke-width="3" stroke-linejoin="round"/><path d="${starPath(50, 53, 26, 11)}" fill="#FFE08A" opacity=".7"/>`],
  ['sach', 'Quyển sách', `<path d="M8 30 L8 82 Q30 76 50 86 Q70 76 92 82 L92 30Z" fill="#0F2247"/><path d="M50 28 Q32 18 12 24 L12 76 Q32 70 50 80Z" fill="#fff" stroke="#0F2247" stroke-width="2"/><path d="M50 28 Q68 18 88 24 L88 76 Q68 70 50 80Z" fill="#FFF8E4" stroke="#0F2247" stroke-width="2"/><g stroke="#9DB2D6" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M20 38Q32 35 42 39M20 48Q32 45 42 49M20 58Q32 55 42 59M58 39Q68 35 80 38M58 49Q68 45 80 48M58 59Q68 55 80 58"/></g><path d="M70 21 L70 42 L75 37 L80 42 L80 21Z" fill="#E9973B"/>`],
  ['but', 'Bút chì', `<g transform="rotate(-40 50 50)"><rect x="18" y="41" width="56" height="18" fill="#F6C453" stroke="#C9952A" stroke-width="2"/><path d="M18 47h56M18 53h56" stroke="#E8B23C" stroke-width="1.5"/><rect x="6" y="41" width="12" height="18" rx="3" fill="#F29BB0" stroke="#D97A93" stroke-width="2"/><rect x="16" y="41" width="5" height="18" fill="#C9CED6"/><path d="M74 41 L92 50 L74 59Z" fill="#F4D9B0" stroke="#C9952A" stroke-width="2" stroke-linejoin="round"/><path d="M86 47 L92 50 L86 53Z" fill="#333"/></g>`],
  ['hac', 'Hạc giấy', `<polygon points="30,62 55,52 78,62 55,74" fill="#E9973B"/><polygon points="52,56 72,16 66,58" fill="#D9822F"/><polygon points="42,58 50,10 60,56" fill="#F5C27D"/><polygon points="32,62 16,30 40,60" fill="#E9973B"/><polygon points="16,30 6,35 19,36" fill="#C9762A"/><polygon points="74,61 95,38 80,65" fill="#D9822F"/><path d="M30 62 L55 52 L78 62 L55 74Z" fill="none" stroke="#B8651F" stroke-width="1.5" stroke-linejoin="round"/>`],
  ['la', 'Lá thu', `<path d="${MAPLE}" fill="#E9973B" stroke="#C2551E" stroke-width="2" stroke-linejoin="round"/><path d="M50 98 L50 30 M50 62 L30 46 M50 62 L70 46" stroke="#C2551E" stroke-width="2.5" fill="none" stroke-linecap="round"/>`],
  ['tao', 'Quả táo', `<path d="M50 30 C35 18 12 26 14 52 C16 78 34 92 50 86 C66 92 84 78 86 52 C88 26 65 18 50 30Z" fill="#E5484D" stroke="#B8333A" stroke-width="2.5"/><path d="M50 30 C50 22 52 16 56 10" stroke="#6B4423" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M54 20 C62 8 78 10 82 14 C74 22 62 24 54 20Z" fill="#5FAE5A"/><ellipse cx="30" cy="46" rx="6" ry="10" transform="rotate(20 30 46)" fill="#fff" opacity=".35"/>`],
  ['no', 'Nơ', `<path d="M46 54 L34 88 L42 84 L48 92 L52 56Z M54 54 L66 88 L58 84 L52 92 L48 56Z" fill="#E5484D" stroke="#B8333A" stroke-width="2" stroke-linejoin="round"/><path d="M50 50 C30 30 8 34 10 50 C12 66 30 68 50 50Z M50 50 C70 30 92 34 90 50 C88 66 70 68 50 50Z" fill="#EF5B61" stroke="#B8333A" stroke-width="2.5" stroke-linejoin="round"/><rect x="42" y="42" width="16" height="16" rx="5" fill="#C9353D"/>`],
  ['huy-hieu', 'Huy hiệu 20/11', `<polygon points="34,60 26,94 38,88 46,96 50,64" fill="#E9973B"/><polygon points="66,60 74,94 62,88 54,96 50,64" fill="#C97A22"/><circle cx="50" cy="42" r="34" fill="#F6C453" stroke="#C9952A" stroke-width="3"/><circle cx="50" cy="42" r="27" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2" stroke-dasharray="3 4"/><text x="50" y="49" text-anchor="middle" font-size="19" font-weight="800" font-family="Be Vietnam Pro, Arial, sans-serif" fill="#0F2247">20/11</text>`],
  ['mat-troi', 'Mặt trời', `<g stroke="#F6C453" stroke-width="6" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6;
    return `<line x1="${(50 + 32 * Math.cos(a)).toFixed(1)}" y1="${(50 + 32 * Math.sin(a)).toFixed(1)}" x2="${(50 + 45 * Math.cos(a)).toFixed(1)}" y2="${(50 + 45 * Math.sin(a)).toFixed(1)}"/>`;
  }).join('')}</g><circle cx="50" cy="50" r="25" fill="#FFD45C" stroke="#F2A93B" stroke-width="3"/><circle cx="42" cy="46" r="2.6" fill="#8A5A12"/><circle cx="58" cy="46" r="2.6" fill="#8A5A12"/><path d="M41 56 Q50 64 59 56" stroke="#8A5A12" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="36" cy="54" r="3.5" fill="#F29BB0" opacity=".7"/><circle cx="64" cy="54" r="3.5" fill="#F29BB0" opacity=".7"/>`],
  ['bong-bay', 'Bóng bay', `<path d="M50 74 C44 82 56 88 50 98" stroke="#5D6B85" stroke-width="2" fill="none"/><polygon points="45,70 55,70 50,76" fill="#2F6FB8"/><ellipse cx="50" cy="38" rx="27" ry="32" fill="#4A90E2" stroke="#2F6FB8" stroke-width="2.5"/><ellipse cx="39" cy="26" rx="6" ry="10" transform="rotate(25 39 26)" fill="#fff" opacity=".45"/>`],
  ['mu', 'Mũ tốt nghiệp', `<path d="M24 48 L24 66 C24 76 76 76 76 66 L76 48 L50 58Z" fill="#1C3366"/><polygon points="50,20 95,39 50,58 5,39" fill="#0F2247" stroke="#2B4A85" stroke-width="2" stroke-linejoin="round"/><path d="M50 39 L84 46 L84 68" stroke="#E9973B" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="79" y="66" width="10" height="14" rx="3" fill="#E9973B"/><circle cx="50" cy="39" r="3.5" fill="#E9973B"/>`],
];
for (const [id, name, , body] of extraStickers(HELPERS)) ST.push([id, name, body]);
const ST_GROUP = Object.fromEntries(extraStickers(HELPERS).map(([id, , g]) => [id, g]));

const STICKER_SVG = Object.fromEntries(
  ST.map(([id, , body]) => [id, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`]),
);
export const STICKER_LIST = ST.map(([id, name]) => ({ id, name, group: ST_GROUP[id] || OLD_STICKER_GROUP[id] || 'bieu-tuong' }));
export const stickerSVG = (id) => STICKER_SVG[id] || '';
/** id → data URL ảnh SVG (dùng được làm src của <img> hoặc vẽ lên canvas). */
export const STICKERS = Object.fromEntries(
  Object.entries(STICKER_SVG).map(([id, svg]) => [id, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)]),
);

// ---------------------------------------------------------------- CSS tự chèn
const CSS = `
.mac-card{position:relative;width:100%;aspect-ratio:4/5;container-type:inline-size;overflow:hidden;border-radius:2.6cqw;
  background:#fff;color:var(--ink);font-family:'Patrick Hand','Be Vietnam Pro',system-ui,sans-serif;-webkit-user-select:none;user-select:none;
  box-shadow:0 1px 2px rgba(15,34,71,.12),0 6px 18px rgba(15,34,71,.14);isolation:isolate;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.mac-card *{box-sizing:border-box}
.mac-bg,.mac-bg>svg,.mac-frame,.mac-frame>svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.mac-frame{z-index:1;pointer-events:none}
.mac-panel{position:absolute;z-index:1;border-radius:3cqw;pointer-events:none;box-shadow:0 .4cqw 1.6cqw rgba(15,34,71,.12)}
.mac-body{position:absolute;display:flex;flex-direction:column;overflow:hidden;font-size:calc(var(--fs,5) * 1cqw);line-height:1.3;z-index:2}
.mac-to{font-family:'Dancing Script','Patrick Hand',cursive;font-weight:700;color:var(--accent);font-size:1.3em;line-height:1.15;margin-bottom:.3em}
.mac-msg{white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;flex:0 0 auto;color:var(--msg,var(--ink));text-align:var(--align,left);font-family:var(--font,inherit)}
.mac-msg.is-empty{opacity:.45}
.mac-sign{text-align:right;margin-top:auto;padding-top:.45em;color:var(--sub);font-size:.92em;line-height:1.2;overflow-wrap:anywhere}
.mac-drawlayer{position:absolute;inset:0;z-index:3}
.mac-draw{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;object-fit:fill}
.mac-stickers{position:absolute;inset:0;pointer-events:none;z-index:4}
.mac-texts{position:absolute;inset:0;pointer-events:none;z-index:5}
.mac-st{position:absolute;width:22%;aspect-ratio:1;transform:translate(-50%,-50%) rotate(var(--r,0deg)) scale(var(--s,1));transform-origin:50% 50%}
.mac-st>svg{width:100%;height:100%;display:block;filter:drop-shadow(0 .4cqw .5cqw rgba(0,0,0,.18))}
.mac-tx{position:absolute;transform:translate(-50%,-50%) rotate(var(--r,0deg));transform-origin:50% 50%;font-size:calc(6cqw * var(--s,1));line-height:1.15;
  white-space:pre;text-align:center;font-family:var(--font,'Patrick Hand',cursive);color:var(--c,var(--ink));text-shadow:0 0 .6cqw rgba(255,255,255,.55)}
.mac-thumb{border-radius:3.2cqw}
`;
let stylesDone = false;
export function ensureCardStyles(doc = document) {
  if (stylesDone && doc === document) return;
  if (!doc.getElementById('mac-font2')) {
    const link = doc.createElement('link');
    link.id = 'mac-font2';
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    doc.head.append(link);
  }
  let st = doc.getElementById('mac-style');
  if (!st) {
    st = doc.createElement('style');
    st.id = 'mac-style';
    doc.head.append(st);
  }
  st.textContent = CSS;
  if (doc === document) stylesDone = true;
}

// ---------------------------------------------------------------- dựng thiệp
function div(cls) {
  const d = document.createElement('div');
  d.className = cls;
  return d;
}

// Cỡ chữ tối đa (theo % bề rộng thiệp). Không chia bậc theo độ dài nữa: fitCard tự tìm cỡ lớn nhất còn vừa khung,
// nên gõ thêm chữ cỡ chỉ nhỏ dần đều, không nhảy bậc.
export function baseFontSize() {
  return 6.4;
}

const clean = (v, max = 40) => (typeof v === 'string' ? v.slice(0, max) : '');
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$|^rgba?\([\d\s.,%]+\)$/;
const safeColor = (c) => (typeof c === 'string' && COLOR_RE.test(c.trim()) ? c.trim() : '');

/**
 * Thu nhỏ chữ cho vừa khung. Thiệp là CSS container (container-type) → trong Chrome, đổi cỡ chữ rồi đo NGAY bên trong
 * thiệp cho kết quả trễ một nhịp (đo ra cỡ cũ) → chữ nhảy lung tung khi gõ. Vì vậy đo trên một bản sao ẩn nằm NGOÀI
 * thiệp (cùng bề rộng/cao, cùng nội dung), tìm nhị phân cỡ lớn nhất còn vừa, rồi mới áp vào thiệp thật.
 * Trả về false nếu thiệp chưa có kích thước.
 */
let probe = null;
function getProbe() {
  if (probe && probe.isConnected) return probe;
  probe = document.createElement('div');
  probe.className = 'mac-body';
  probe.setAttribute('aria-hidden', 'true');
  Object.assign(probe.style, { position: 'fixed', left: '-10000px', top: '0', right: 'auto', bottom: 'auto', visibility: 'hidden', pointerEvents: 'none', zIndex: '-1' });
  document.body.append(probe);
  return probe;
}

export function fitCard(el) {
  const body = el && el.querySelector('.mac-body');
  if (!body || !el.isConnected) return false;
  const w = el.clientWidth;
  const W = body.clientWidth, H = body.clientHeight;
  if (w < 20 || W < 10 || H < 10) return false;
  const max = ((Number(el.dataset.fs) || 5) * (Number(el.dataset.fsm) || 1) * w) / 100;
  const p = getProbe();
  p.replaceChildren(...[...body.childNodes].map((n) => n.cloneNode(true)));
  p.style.width = W + 'px';
  p.style.height = H + 'px';
  p.style.fontFamily = getComputedStyle(el).fontFamily; // bản sao nằm ngoài thiệp → chép font gốc của thiệp
  p.style.boxSizing = 'border-box';
  const fits = (v) => { p.style.fontSize = v.toFixed(2) + 'px'; return p.scrollHeight <= H + 2; };
  let best = max;
  if (!fits(max)) {
    let lo = max * 0.35, hi = max;
    for (let i = 0; i < 10; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) lo = mid; else hi = mid;
    }
    best = lo;
  }
  p.replaceChildren();
  body.style.fontSize = best.toFixed(2) + 'px';
  return true;
}

let fontHooked = false;

/** Gọi fitCard; nếu chưa đo được thì thử lại vài lần (khung hình sau + hẹn giờ). */
function fitSoon(el, tries = 12) {
  if (fitCard(el) || tries <= 0) return;
  requestAnimationFrame(() => {
    if (fitCard(el)) return;
    setTimeout(() => fitSoon(el, tries - 1), 120);
  });
}

function watchSize(el, run) {
  if (typeof ResizeObserver !== 'function') return;
  let lastW = 0;
  const ro = new ResizeObserver(() => {
    if (!el.isConnected) {
      if (lastW) ro.disconnect();
      return;
    }
    const w = el.clientWidth;
    if (w && w !== lastW) {
      lastW = w;
      run();
    }
  });
  ro.observe(el);
}

/**
 * Khung thiệp để trình làm thiệp cập nhật trực tiếp.
 * Trả về { el, setTemplate, setStyle, setMessage, setSign, setTo, drawLayer, stickerLayer, textLayer, refit() }
 */
export function buildCardShell(templateId = 'cuc') {
  ensureCardStyles();
  const el = div('mac-card');
  const bg = div('mac-bg');
  const frame = div('mac-frame');
  const panel = div('mac-panel');
  const body = div('mac-body');
  const to = div('mac-to');
  const msg = div('mac-msg');
  const sign = div('mac-sign');
  body.append(to, msg, sign);
  const drawLayer = div('mac-drawlayer');
  const stickerLayer = div('mac-stickers');
  const textLayer = div('mac-texts');
  el.append(bg, frame, panel, body, drawLayer, stickerLayer, textLayer);
  let raf = 0;
  let tpl = templateById(templateId);
  let style = {};

  const applyBox = () => {
    const [top, right, bottom, left] = tpl.box;
    Object.assign(body.style, { top: top + '%', right: right + '%', bottom: bottom + '%', left: left + '%' });
    Object.assign(panel.style, { top: top - 2.5 + '%', right: right - 3 + '%', bottom: bottom - 2.5 + '%', left: left - 3 + '%' });
  };
  const applyStyle = () => {
    const f = fontById(style.font);
    const b = bgById(style.bg);
    const color = safeColor(style.color);
    el.style.setProperty('--ink', b && b.dark && !color ? '#FFF6E0' : tpl.ink);
    el.style.setProperty('--sub', b && b.dark ? '#F3D9A4' : tpl.sub);
    el.style.setProperty('--accent', b && b.dark ? '#F6C453' : tpl.accent);
    if (color) el.style.setProperty('--msg', color);
    else el.style.removeProperty('--msg');
    if (f) msg.style.setProperty('--font', f.css);
    else msg.style.removeProperty('--font');
    const align = ['left', 'center', 'right'].includes(style.align) ? style.align : '';
    if (align) msg.style.setProperty('--align', align);
    else msg.style.removeProperty('--align');
    panel.style.background = b ? b.c : 'transparent';
    panel.style.display = b && b.id ? '' : 'none';
    const fr = FRAMES.find((x) => x.id && x.id === style.frame);
    frame.innerHTML = fr ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="none">${frameSVG(fr.id, HELPERS, ++UID)}</svg>` : '';
    el.dataset.fsm = String((SIZES[style.size] || 1) * (f ? f.scale : 1));
  };

  const shell = {
    el,
    drawLayer,
    stickerLayer,
    textLayer,
    setTemplate(id) {
      tpl = templateById(id);
      el.dataset.template = tpl.id;
      applyBox();
      bg.innerHTML = templateSVG(tpl.id);
      applyStyle();
      shell.refit();
    },
    setStyle(s) {
      style = s && typeof s === 'object' ? { ...s } : {};
      applyStyle();
      shell.refit();
    },
    setTo(text) {
      to.textContent = text ? `Kính gửi ${text},` : '';
      to.style.display = text ? '' : 'none';
      shell.refit();
    },
    setMessage(text, placeholder = '') {
      msg.textContent = text || placeholder;
      msg.classList.toggle('is-empty', !text);
      el.dataset.fs = baseFontSize(text || placeholder);
      shell.refit();
    },
    setSign(text) {
      sign.textContent = text || '';
      sign.style.display = text ? '' : 'none';
      shell.refit();
    },
    /** Tính lại cỡ chữ ngay nếu thiệp đã có kích thước; nếu chưa thì chờ khung hình sau / ResizeObserver. */
    refit() {
      if (fitCard(el)) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => fitSoon(el));
    },
  };
  shell.setTemplate(templateId);
  watchSize(el, () => fitSoon(el));
  if (document.fonts) {
    if (document.fonts.ready) document.fonts.ready.then(() => fitSoon(el));
    if (!fontHooked && document.fonts.addEventListener) {
      fontHooked = true;
      document.fonts.addEventListener('loadingdone', () => document.querySelectorAll('.mac-card').forEach((c) => fitSoon(c, 3)));
    }
  }
  return shell;
}

/** Dòng ký tên. Thiệp seed (đại thụ) hoặc không có người gửi → không ký. */
export function signText(card) {
  if (card.seed) return '';
  if (card.anonymous) return '— Một bạn học sinh';
  const from = String(card.from || '').trim();
  if (!from) return '';
  const gv = !card.cls || String(card.cls).toUpperCase() === 'GV';
  return `— ${from}${gv ? '' : ', lớp ' + card.cls}`;
}

export function stickerElement({ id, x = 0.5, y = 0.5, s = 1, r = 0 }) {
  const st = div('mac-st');
  st.innerHTML = stickerSVG(id);
  st.style.left = (Math.min(1, Math.max(0, +x || 0)) * 100).toFixed(2) + '%';
  st.style.top = (Math.min(1, Math.max(0, +y || 0)) * 100).toFixed(2) + '%';
  st.style.setProperty('--s', Math.min(3, Math.max(0.3, +s || 1)));
  st.style.setProperty('--r', (+r || 0) + 'deg');
  return st;
}

/** Ô chữ tự do trên thiệp: { t, x, y, s, r, color, font } — x,y là tâm (0..1), s=1 cao ~6% bề rộng thiệp. */
export function textElement({ t = '', x = 0.5, y = 0.5, s = 1, r = 0, color = '', font = '' }) {
  const el = div('mac-tx');
  el.textContent = String(t).slice(0, 80);
  el.style.left = (Math.min(1, Math.max(0, +x || 0)) * 100).toFixed(2) + '%';
  el.style.top = (Math.min(1, Math.max(0, +y || 0)) * 100).toFixed(2) + '%';
  el.style.setProperty('--s', Math.min(4, Math.max(0.3, +s || 1)));
  el.style.setProperty('--r', (+r || 0) + 'deg');
  const c = safeColor(color);
  if (c) el.style.setProperty('--c', c);
  const f = fontById(font);
  if (f) el.style.setProperty('--font', f.css);
  return el;
}

/**
 * Dựng thiệp (đồng bộ). opts: { width, mediaUrl(url)->url, mode:'thumb'|'full'|'print', to:'Cô Nguyễn Hồng Ngọc' }
 * Hỗ trợ card.style {font,color,size,align,frame,bg}, card.texts [{t,x,y,s,r,color,font}], card.seed.
 */
export function createCardElement(card = {}, opts = {}) {
  const { width, mediaUrl = (u) => u, mode = 'full', to = '' } = opts;
  const shell = buildCardShell(card.template);
  const el = shell.el;
  el.classList.add('mac-' + mode);
  if (width) el.style.width = typeof width === 'number' ? width + 'px' : width;
  const st = card.style && typeof card.style === 'object' ? card.style : {};
  shell.setStyle({ font: clean(st.font), color: clean(st.color), size: clean(st.size), align: clean(st.align), frame: clean(st.frame), bg: clean(st.bg) });
  shell.setTo(to);
  shell.setMessage(card.message || '');
  shell.setSign(signText(card));
  if (card.drawingUrl) {
    const img = document.createElement('img');
    img.className = 'mac-draw';
    img.alt = '';
    img.loading = mode === 'thumb' ? 'lazy' : 'eager';
    img.src = mediaUrl(card.drawingUrl);
    img.onerror = () => img.remove();
    shell.drawLayer.append(img);
  }
  for (const s of (Array.isArray(card.stickers) ? card.stickers : []).slice(0, 60)) {
    if (s && STICKER_SVG[s.id]) shell.stickerLayer.append(stickerElement(s));
  }
  for (const t of (Array.isArray(card.texts) ? card.texts : []).slice(0, 8)) {
    if (t && t.t) shell.textLayer.append(textElement(t));
  }
  const who = signText(card).replace('— ', '');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', `Thiệp${who ? ' của ' + who : ''}: ${card.message || ''}`);
  return el;
}

/** Như createCardElement nhưng chờ ảnh vẽ + font tải xong (cho Sổ Tri Ân / in). */
export async function renderCard(card = {}, opts = {}) {
  const el = createCardElement(card, { ...opts, mode: opts.mode || 'full' });
  const imgs = [...el.querySelectorAll('img')];
  await Promise.all([
    ...imgs.map((img) => (img.complete ? null : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); }))),
    document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : null,
  ]);
  fitSoon(el);
  return el;
}

export default renderCard;
