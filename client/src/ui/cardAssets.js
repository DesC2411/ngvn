// Tài nguyên trang trí thêm cho thiệp (CONTRACT mục 7.2): mẫu mới, sticker mới, khung viền, nền chữ, kiểu chữ.
// cardRender.js truyền các hàm vẽ phụ (rng, starPath, daisy, maple, leaf) vào để không phụ thuộc vòng.

// ------------------------------------------------------------------ kiểu chữ (Google Fonts có tiếng Việt)
export const FONTS = [
  { id: 'tay', name: 'Viết tay', css: "'Patrick Hand', 'Be Vietnam Pro', cursive", scale: 1 },
  { id: 'nghieng', name: 'Nghiêng', css: "'Dancing Script', cursive", scale: 1.12 },
  { id: 'tron', name: 'Chữ tròn', css: "'Nunito', 'Be Vietnam Pro', sans-serif", scale: 0.9 },
  { id: 'phan', name: 'Bút dạ', css: "'Itim', 'Patrick Hand', cursive", scale: 0.95 },
  { id: 'hoctro', name: 'Học trò', css: "'Mali', 'Patrick Hand', cursive", scale: 0.88 },
  { id: 'co', name: 'Nét cọ', css: "'Pacifico', cursive", scale: 0.8 },
];
export const FONT_FAMILIES = 'family=Nunito:wght@600;800&family=Itim&family=Mali:wght@500;600&family=Pacifico';
export const fontById = (id) => FONTS.find((f) => f.id === id) || null;

export const SIZES = { S: 0.82, M: 1, L: 1.2 };

// ------------------------------------------------------------------ nền chữ (tấm giấy phía sau lời chúc)
export const BGS = [
  { id: '', name: 'Không', c: 'transparent' },
  { id: 'trang', name: 'Trắng', c: 'rgba(255,255,255,.86)' },
  { id: 'kem', name: 'Kem', c: 'rgba(255,246,226,.93)' },
  { id: 'hong', name: 'Hồng', c: 'rgba(255,228,236,.92)' },
  { id: 'xanh', name: 'Xanh trời', c: 'rgba(227,241,251,.92)' },
  { id: 'la', name: 'Xanh lá', c: 'rgba(230,244,225,.92)' },
  { id: 'toi', name: 'Navy', c: 'rgba(15,34,71,.84)', dark: true },
];
export const bgById = (id) => BGS.find((b) => b.id === id) || null;

// ------------------------------------------------------------------ khung viền (viewBox 400×500, phủ lên mẫu)
export function frameSVG(id, H, u) {
  const { starPath, daisy, leaf } = H;
  const heart = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s}) translate(-50 -50)" d="M50 86 C20 64 6 46 10 30 C14 14 34 8 50 26 C66 8 86 14 90 30 C94 46 80 64 50 86Z" fill="${c}"/>`;
  switch (id) {
    case 'doi':
      return `<rect x="9" y="9" width="382" height="482" rx="16" fill="none" stroke="#D4A43A" stroke-width="3.5"/>
        <rect x="18" y="18" width="364" height="464" rx="10" fill="none" stroke="#D4A43A" stroke-width="1.5"/>
        ${[[18, 18], [382, 18], [18, 482], [382, 482]].map(([x, y]) => `<path d="M${x} ${y - 8} L${x + 8} ${y} L${x} ${y + 8} L${x - 8} ${y}Z" fill="#D4A43A"/>`).join('')}`;
    case 'ren': {
      let c = '';
      for (let x = 14; x <= 386; x += 18) c += `<circle cx="${x}" cy="10" r="8"/><circle cx="${x}" cy="490" r="8"/>`;
      for (let y = 28; y <= 472; y += 18) c += `<circle cx="10" cy="${y}" r="8"/><circle cx="390" cy="${y}" r="8"/>`;
      return `<g fill="#FFFFFF" stroke="#E2CFA8" stroke-width="1.5">${c}</g><rect x="20" y="20" width="360" height="460" rx="6" fill="none" stroke="#E2CFA8" stroke-width="1.5" stroke-dasharray="2 5"/>`;
    }
    case 'hoa':
      return [[30, 30, 0], [370, 30, 90], [30, 470, -90], [370, 470, 180]].map(([x, y, r]) =>
        `<g transform="translate(${x} ${y}) rotate(${r})">${leaf(24, 6, 0.24, 70, '#8DBF6A')}${leaf(6, 24, 0.24, 160, '#9ACB78')}${daisy(0, 0, 22, '#FFFFFF', '#F2A93B', '#E7C98A')}${daisy(30, 16, 12, '#F7B6CC', '#E9973B', '#E98BAA')}${daisy(14, 32, 11, '#FFE07A', '#E9973B', '#EFC75A')}</g>`).join('');
    case 'sao': {
      const r = H.rng(777);
      let s = '';
      for (let i = 0; i < 34; i++) {
        const side = i % 4;
        const t = r();
        const x = side < 2 ? 14 + t * 372 : side === 2 ? 12 + r() * 14 : 374 + r() * 14;
        const y = side === 0 ? 12 + r() * 14 : side === 1 ? 474 + r() * 14 : 14 + t * 472;
        s += `<path d="${starPath(x, y, 5 + r() * 6, 2.4 + r() * 2)}" fill="${['#F6C453', '#E9973B', '#FFE08A'][i % 3]}"/>`;
      }
      return s;
    }
    case 'tim': {
      let s = '';
      for (let x = 22; x <= 380; x += 30) s += heart(x, 16, 0.16, x % 60 < 30 ? '#EF4D6B' : '#F7A1C4') + heart(x, 484, 0.16, x % 60 < 30 ? '#F7A1C4' : '#EF4D6B');
      for (let y = 50; y <= 450; y += 32) s += heart(14, y, 0.13, '#F7A1C4') + heart(386, y, 0.13, '#F7A1C4');
      return s;
    }
    case 'ruy':
      return `<g><path d="M0 70 L70 0 L104 0 L0 104Z" fill="#E5484D"/><path d="M0 74 L74 0 M0 100 L100 0" stroke="#F6C453" stroke-width="3"/></g>
        <g><path d="M400 430 L330 500 L296 500 L400 396Z" fill="#E5484D"/><path d="M400 426 L326 500 M400 400 L300 500" stroke="#F6C453" stroke-width="3"/></g>`;
    case 'goc': {
      const c = (x, y, sx, sy) => `<path transform="translate(${x} ${y}) scale(${sx} ${sy})" d="M0 60 L0 10 Q0 0 10 0 L60 0 M10 46 Q10 10 46 10 M20 24 a5 5 0 1 0 0.1 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`;
      return `<g style="color:var(--accent)">${c(16, 16, 1, 1)}${c(384, 16, -1, 1)}${c(16, 484, 1, -1)}${c(384, 484, -1, -1)}</g>`;
    }
    case 'cham': {
      let d = '';
      for (let x = 20; x <= 380; x += 14) d += `<circle cx="${x}" cy="14" r="3"/><circle cx="${x}" cy="486" r="3"/>`;
      for (let y = 28; y <= 472; y += 14) d += `<circle cx="14" cy="${y}" r="3"/><circle cx="386" cy="${y}" r="3"/>`;
      return `<g fill="#E9973B" opacity=".85">${d}</g>`;
    }
    default:
      return '';
  }
}
export const FRAMES = [
  { id: '', name: 'Không' },
  { id: 'doi', name: 'Viền vàng' },
  { id: 'ren', name: 'Ren trắng' },
  { id: 'hoa', name: 'Góc hoa' },
  { id: 'sao', name: 'Sao' },
  { id: 'tim', name: 'Trái tim' },
  { id: 'ruy', name: 'Ruy băng' },
  { id: 'goc', name: 'Góc hoa văn' },
  { id: 'cham', name: 'Chấm cam' },
];

// ------------------------------------------------------------------ mẫu thiệp mới (viewBox 400×500)
export function extraTemplates(H) {
  const { rng, starPath, leaf, maple } = H;
  const cloud = (x, y, s, o = 1) => `<path transform="translate(${x} ${y}) scale(${s})" opacity="${o}" d="M-40 20 C-58 20 -60 -4 -42 -6 C-44 -26 -18 -32 -8 -16 C0 -36 32 -30 30 -8 C50 -8 50 20 30 20Z" fill="#FFFFFF"/>`;
  const blossom = (x, y, s, c = '#F9B9CC', k = '#E07A9C') => {
    let p = '';
    for (let i = 0; i < 5; i++) p += `<ellipse cx="0" cy="-9" rx="6.5" ry="9" transform="rotate(${i * 72})"/>`;
    return `<g transform="translate(${x} ${y}) scale(${s})"><g fill="${c}" stroke="${k}" stroke-width="1">${p}</g><circle r="4" fill="#F6C453"/></g>`;
  };
  return [
    {
      id: 'kraft', name: 'Giấy kraft', ink: '#4A2E14', accent: '#8A3B22', sub: '#6B4A2A', swatch: ['#DCC09A', '#8A3B22'], box: [17, 10, 14, 10],
      svg: () => {
        const r = rng(42);
        let f = '';
        for (let i = 0; i < 60; i++) { const x = r() * 400; const y = r() * 500; f += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l${(6 + r() * 14).toFixed(0)} ${(r() * 4 - 2).toFixed(0)}"/>`; }
        return `<rect width="400" height="500" fill="#DCC09A"/><g stroke="#C4A272" stroke-width="1.2" opacity=".55">${f}</g>
          <rect x="14" y="14" width="372" height="472" rx="8" fill="none" stroke="#FFF6E2" stroke-opacity=".8" stroke-width="2" stroke-dasharray="7 5"/>
          <path d="M-4 84 Q120 44 260 -4" stroke="#F1E2C2" stroke-width="3.5" fill="none" stroke-dasharray="7 3"/>
          <g transform="translate(96 62) rotate(-14)"><path d="M0 0 L60 0 L74 17 L60 34 L0 34Z" fill="#FFF8EA" stroke="#B8915E" stroke-width="1.5"/><circle cx="64" cy="17" r="3.5" fill="#DCC09A" stroke="#B8915E"/><text x="30" y="24" text-anchor="middle" font-size="17" font-family="Patrick Hand, cursive" fill="#8A3B22">20/11</text></g>
          ${leaf(344, 446, 0.42, -30, '#6F8F4E')}${leaf(372, 410, 0.32, 20, '#86A862')}${maple(318, 474, 0.32, 15, '#C2551E')}${leaf(52, 470, 0.26, -120, '#86A862')}`;
      },
    },
    {
      id: 'mau-nuoc', name: 'Màu nước', ink: '#213A66', accent: '#D2557E', sub: '#5B6B8C', swatch: ['#FFFDF8', '#B9DCF5'], box: [15, 11, 14, 11],
      svg: (u) => {
        const blob = (cx, cy, r, c, o) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#w${u}${c.slice(1)})" opacity="${o}"/>`;
        const grads = ['#B9DCF5', '#F9C9D8', '#FFE3A3', '#CDEBC5'].map((c) => `<radialGradient id="w${u}${c.slice(1)}"><stop offset="0" stop-color="${c}"/><stop offset=".7" stop-color="${c}" stop-opacity=".6"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('');
        const r = rng(9);
        let dots = '';
        for (let i = 0; i < 26; i++) dots += `<circle cx="${(r() * 400).toFixed(0)}" cy="${(r() * 500).toFixed(0)}" r="${(1 + r() * 3).toFixed(1)}" fill="${['#9CC9EE', '#F4A6C0', '#F6C453'][i % 3]}" opacity=".55"/>`;
        return `<defs>${grads}</defs><rect width="400" height="500" fill="#FFFDF8"/>${blob(70, 80, 130, '#B9DCF5', 0.9)}${blob(350, 120, 110, '#F9C9D8', 0.85)}${blob(330, 440, 150, '#FFE3A3', 0.85)}${blob(50, 450, 120, '#CDEBC5', 0.85)}${dots}`;
      },
    },
    {
      id: 'tre', name: 'Tre xanh', ink: '#234A22', accent: '#3E7D2E', sub: '#4F7344', swatch: ['#EAF4E0', '#7DB65A'], box: [12, 10, 13, 22],
      svg: (u) => {
        const stalk = (x, w, c, k) => {
          let n = '';
          for (let y = 40; y < 500; y += 74) n += `<rect x="${x - 1}" y="${y}" width="${w + 2}" height="5" rx="2" fill="${k}"/>`;
          return `<rect x="${x}" y="-10" width="${w}" height="520" rx="${w / 2}" fill="${c}"/>${n}`;
        };
        return `<defs><linearGradient id="g${u}" x2="0" y2="1"><stop offset="0" stop-color="#F3F9EC"/><stop offset="1" stop-color="#E0EED2"/></linearGradient></defs>
          <rect width="400" height="500" fill="url(#g${u})"/>${stalk(18, 16, '#86BE62', '#5E9440')}${stalk(46, 11, '#9BCB78', '#6FA44E')}
          ${leaf(90, 60, 0.36, 110, '#4E8F3A')}${leaf(78, 92, 0.3, 140, '#6FA44E')}${leaf(104, 40, 0.28, 80, '#5E9440')}
          ${leaf(360, 460, 0.36, -60, '#4E8F3A')}${leaf(330, 476, 0.3, -100, '#6FA44E')}${leaf(380, 420, 0.24, -20, '#86BE62')}`;
      },
    },
    {
      id: 'buu-thiep', name: 'Bưu thiếp', ink: '#1F3B70', accent: '#C9353D', sub: '#3D5A8F', swatch: ['#FFFFFF', '#C9353D'], box: [21, 10, 12, 10],
      svg: (u) => `<defs><pattern id="p${u}" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="34" height="34" fill="#fff"/><rect width="11" height="34" fill="#C9353D"/><rect x="17" width="11" height="34" fill="#2F5FA8"/></pattern></defs>
        <rect width="400" height="500" fill="url(#p${u})"/><rect x="14" y="14" width="372" height="472" rx="4" fill="#FFFDF8"/>
        <g transform="translate(316 30)"><rect width="56" height="66" fill="#FFF3D6" stroke="#fff" stroke-width="6" stroke-dasharray="5 3"/><rect x="8" y="8" width="40" height="50" fill="#F6C453"/><path d="M28 46 C18 38 14 30 18 24 C22 18 28 22 28 26 C28 22 34 18 38 24 C42 30 38 38 28 46Z" fill="#C9353D"/></g>
        <g fill="none" stroke="#2F5FA8" stroke-opacity=".45" stroke-width="2"><circle cx="282" cy="64" r="26"/><path d="M230 52 q12 -6 24 0 t24 0 M230 64 q12 -6 24 0 t24 0 M230 76 q12 -6 24 0 t24 0"/></g>
        <text x="282" y="68" text-anchor="middle" font-size="11" font-family="Be Vietnam Pro, Arial" fill="#2F5FA8" opacity=".6">20 · 11</text>`,
    },
    {
      id: 'bau-troi', name: 'Bầu trời', ink: '#1E3A70', accent: '#E9973B', sub: '#3D5A8F', swatch: ['#CDE9FB', '#E9973B'], box: [19, 10, 14, 10],
      svg: (u) => `<defs><linearGradient id="g${u}" x2="0" y2="1"><stop offset="0" stop-color="#BFE2FA"/><stop offset="1" stop-color="#F4FAFF"/></linearGradient></defs>
        <rect width="400" height="500" fill="url(#g${u})"/>
        <g fill="none" stroke-width="9" opacity=".75" stroke-linecap="round"><path d="M180 90 A170 170 0 0 1 420 -40" stroke="#E5484D"/><path d="M196 96 A156 156 0 0 1 420 -24" stroke="#E9973B"/><path d="M212 102 A142 142 0 0 1 420 -8" stroke="#F6C453"/><path d="M228 108 A128 128 0 0 1 420 8" stroke="#4CAF7A"/><path d="M244 114 A114 114 0 0 1 420 24" stroke="#4A90E2"/></g>
        ${cloud(70, 60, 1.1)}${cloud(250, 104, 0.8)}${cloud(330, 440, 1.3)}${cloud(60, 470, 0.9, 0.9)}${cloud(380, 250, 0.6, 0.8)}
        <circle cx="40" cy="250" r="5" fill="#fff"/><path d="${starPath(360, 330, 7, 3)}" fill="#fff"/>`,
    },
    {
      id: 'hoa-dao', name: 'Hoa đào', ink: '#7A2649', accent: '#C2416E', sub: '#9A4A6B', swatch: ['#FFF4F6', '#F48FB1'], box: [19, 10, 13, 10],
      svg: () => {
        const r = rng(5);
        let petals = '';
        for (let i = 0; i < 14; i++) petals += `<ellipse cx="${(30 + r() * 340).toFixed(0)}" cy="${(140 + r() * 340).toFixed(0)}" rx="5" ry="3.2" transform="rotate(${(r() * 180).toFixed(0)} ${(30 + r() * 340).toFixed(0)} ${(140 + r() * 340).toFixed(0)})" fill="#F9B9CC" opacity=".8"/>`;
        return `<rect width="400" height="500" fill="#FFF5F7"/>
          <path d="M410 10 C340 30 300 60 240 50 M330 34 C320 70 300 84 270 96 M380 20 C390 60 380 90 360 110" stroke="#6B3E26" stroke-width="6" fill="none" stroke-linecap="round"/>
          ${blossom(240, 50, 1.3)}${blossom(270, 96, 1.1, '#FBC6D6')}${blossom(300, 58, 0.9)}${blossom(360, 110, 1.2, '#F7A8C2')}${blossom(336, 36, 1)}${blossom(386, 64, 0.9, '#FBC6D6')}${blossom(214, 40, 0.7)}
          ${petals}<path d="M-10 470 C40 440 80 450 110 420" stroke="#6B3E26" stroke-width="5" fill="none" stroke-linecap="round"/>${blossom(110, 420, 1)}${blossom(70, 444, 0.8, '#FBC6D6')}`;
      },
    },
    {
      id: 'may-academy', name: 'May Academy', ink: '#0F2247', accent: '#C9761E', sub: '#5D6B85', swatch: ['#0F2247', '#E9973B'], box: [13, 12, 16, 12],
      svg: () => `<rect width="400" height="500" fill="#0F2247"/><path d="M0 0 L120 0 L0 120Z M400 500 L280 500 L400 380Z" fill="#E9973B"/>
        <rect x="22" y="22" width="356" height="456" rx="12" fill="#FFF8EC"/><rect x="32" y="32" width="336" height="436" rx="8" fill="none" stroke="#E9973B" stroke-width="1.5"/>
        <text x="200" y="456" text-anchor="middle" font-size="12" letter-spacing="3" font-weight="700" font-family="Be Vietnam Pro, Arial, sans-serif" fill="#0F2247" opacity=".75">MAY ACADEMY · 20/11</text>
        <path d="${starPath(200, 54, 9, 4)}" fill="#E9973B"/>`,
    },
    {
      id: 'o-ly', name: 'Vở ô ly', ink: '#3B2A8C', accent: '#C9353D', sub: '#5B4BA8', swatch: ['#FFFFFF', '#8E7CD6'], box: [11, 8, 10, 17],
      svg: (u) => `<defs><pattern id="s${u}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0 L0 0 0 10" fill="none" stroke="#E6DDF5" stroke-width="1"/></pattern><pattern id="b${u}" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="url(#s${u})"/><path d="M40 0 L0 0 0 40" fill="none" stroke="#C7B6E6" stroke-width="1.4"/></pattern></defs>
        <rect width="400" height="500" fill="#FFFFFF"/><rect width="400" height="500" fill="url(#b${u})"/><line x1="60" x2="60" y1="0" y2="500" stroke="#F09A9A" stroke-width="2"/>
        <g transform="translate(350 40) rotate(-12)"><circle r="22" fill="none" stroke="#C9353D" stroke-width="2.5"/><text y="8" text-anchor="middle" font-size="22" font-family="Patrick Hand, cursive" fill="#C9353D">10</text></g>`,
    },
  ];
}

// ------------------------------------------------------------------ sticker mới (viewBox 100×100)
export function extraStickers(H) {
  const { starPath, daisy, leaf } = H;
  const HEART = 'M50 86 C20 64 6 46 10 30 C14 14 34 8 50 26 C66 8 86 14 90 30 C94 46 80 64 50 86Z';
  const petals = (n, r, rx, ry, fill, stroke) => {
    let p = '';
    for (let i = 0; i < n; i++) p += `<ellipse cx="50" cy="${50 - r}" rx="${rx}" ry="${ry}" transform="rotate(${(360 / n) * i} 50 50)"/>`;
    return `<g fill="${fill}" stroke="${stroke}" stroke-width="1.5">${p}</g>`;
  };
  const miniFlower = (x, y, c, k) => `<g transform="translate(${x - 50 * 0.3} ${y - 50 * 0.3}) scale(.3)">${petals(5, 22, 15, 18, c, k)}<circle cx="50" cy="50" r="12" fill="#F6C453"/></g>`;
  let sakura = '';
  for (let i = 0; i < 5; i++) sakura += `<path d="M50 50 C40 38 38 22 46 14 L50 21 L54 14 C62 22 60 38 50 50Z" transform="rotate(${i * 72} 50 50)"/>`;
  return [
    // Hoa & lá
    ['hoa-cuc', 'Hoa cúc', 'hoa', daisy(50, 50, 46, '#FFFFFF', '#F6C453', '#D9C9A0')],
    ['hoa-hong', 'Hoa hồng', 'hoa', `<path d="M30 72 Q12 76 8 62 Q24 56 34 64Z M70 72 Q88 76 92 62 Q76 56 66 64Z" fill="#5FAE5A"/><circle cx="50" cy="48" r="30" fill="#E5484D" stroke="#B8333A" stroke-width="2.5"/><path d="M50 30 C66 30 70 50 56 56 C44 60 38 48 46 42 C52 38 58 44 54 48 M26 44 C28 64 44 74 60 72 M72 40 C76 52 72 62 64 68" fill="none" stroke="#B8333A" stroke-width="3" stroke-linecap="round"/>`],
    ['tulip', 'Tulip', 'hoa', `<path d="M50 94 L50 52" stroke="#4E8F5A" stroke-width="5" stroke-linecap="round"/><path d="M50 82 C34 78 28 64 30 54 C42 60 48 70 50 82Z" fill="#5FAE5A"/><path d="M30 16 L40 30 L50 12 L60 30 L70 16 L70 40 C70 54 60 60 50 60 C40 60 30 54 30 40Z" fill="#F28DB2" stroke="#D85C86" stroke-width="2.5" stroke-linejoin="round"/>`],
    ['hoa-dao', 'Hoa đào', 'hoa', `<g fill="#FBC6D6" stroke="#E98BAA" stroke-width="2">${sakura}</g><circle cx="50" cy="50" r="8" fill="#F48FB1"/><g fill="#C2416E"><circle cx="50" cy="38" r="2"/><circle cx="61" cy="46" r="2"/><circle cx="57" cy="59" r="2"/><circle cx="43" cy="59" r="2"/><circle cx="39" cy="46" r="2"/></g>`],
    ['huong-duong', 'Hướng dương', 'hoa', `${petals(16, 30, 7, 15, '#F6C453', '#E0A030')}<circle cx="50" cy="50" r="19" fill="#7A4A22"/><g fill="#5B3416">${[[44, 44], [56, 44], [50, 52], [42, 56], [58, 56], [50, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g>`],
    ['bo-hoa', 'Bó hoa', 'hoa', `<path d="M36 58 L64 58 L54 94 L46 94Z" fill="#F6C453" stroke="#C9952A" stroke-width="2"/><path d="M42 66 L58 66" stroke="#E5484D" stroke-width="5"/>${leaf(30, 44, 0.24, -40, '#5FAE5A')}${leaf(70, 44, 0.24, 40, '#5FAE5A')}${miniFlower(38, 38, '#F7A1C4', '#E07AA5')}${miniFlower(62, 36, '#FFFFFF', '#D9C9A0')}${miniFlower(50, 22, '#EF5B61', '#B8333A')}`],
    ['la-xanh', 'Lá xanh', 'hoa', `<path d="M50 6 C80 26 84 64 50 94 C16 64 20 26 50 6Z" fill="#6FB45F" stroke="#4E8F4A" stroke-width="2.5"/><path d="M50 14 L50 90 M50 40 L36 30 M50 40 L64 30 M50 58 L32 46 M50 58 L68 46" stroke="#4E8F4A" stroke-width="2.2" fill="none" stroke-linecap="round"/>`],
    ['canh-la', 'Cành lá', 'hoa', `<path d="M12 88 C36 66 60 44 90 12" stroke="#7A4A22" stroke-width="4" fill="none" stroke-linecap="round"/>${leaf(30, 62, 0.22, -70, '#6FB45F')}${leaf(44, 64, 0.2, 40, '#86BE62')}${leaf(52, 40, 0.22, -60, '#5FAE5A')}${leaf(66, 42, 0.2, 50, '#86BE62')}${leaf(76, 18, 0.2, -40, '#6FB45F')}`],
    // Trường lớp
    ['thuoc', 'Thước kẻ', 'truong', `<g transform="rotate(-30 50 50)"><rect x="6" y="38" width="88" height="24" rx="3" fill="#F6C453" stroke="#C9952A" stroke-width="2"/><path d="M14 38v9M22 38v5M30 38v9M38 38v5M46 38v9M54 38v5M62 38v9M70 38v5M78 38v9M86 38v5" stroke="#8A5A12" stroke-width="2"/></g>`],
    ['dia-cau', 'Quả địa cầu', 'truong', `<path d="M50 80 L50 90 M34 94 L66 94" stroke="#7A4A22" stroke-width="4" stroke-linecap="round"/><path d="M20 40 A32 32 0 0 0 80 62" fill="none" stroke="#C9952A" stroke-width="3"/><circle cx="50" cy="46" r="30" fill="#4A90E2" stroke="#2F6FB8" stroke-width="2.5"/><path d="M32 34 C38 28 46 32 44 40 C42 48 34 46 32 40Z M54 28 C62 26 70 32 66 40 C62 46 56 40 54 34Z M48 54 C56 52 62 58 58 66 C52 70 46 62 48 54Z" fill="#6FB45F"/><ellipse cx="50" cy="46" rx="12" ry="30" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`],
    ['kinh', 'Kính', 'truong', `<circle cx="30" cy="54" r="17" fill="#CFE6FA" fill-opacity=".6" stroke="#0F2247" stroke-width="5"/><circle cx="70" cy="54" r="17" fill="#CFE6FA" fill-opacity=".6" stroke="#0F2247" stroke-width="5"/><path d="M47 52 Q50 46 53 52" stroke="#0F2247" stroke-width="4" fill="none"/><path d="M13 50 L4 40 M87 50 L96 40" stroke="#0F2247" stroke-width="4" stroke-linecap="round"/><path d="M22 46 L28 42 M62 46 L68 42" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`],
    ['coc-tra', 'Cốc trà', 'truong', `<path d="M40 20 C34 26 46 30 40 36 M54 16 C48 22 60 26 54 32" stroke="#B7C1D6" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="86" rx="36" ry="7" fill="#D9E2F0"/><path d="M22 44 L78 44 L72 76 C70 82 64 84 50 84 C36 84 30 82 28 76Z" fill="#FFFFFF" stroke="#0F2247" stroke-width="3" stroke-linejoin="round"/><path d="M78 50 C92 50 92 68 74 68" fill="none" stroke="#0F2247" stroke-width="3"/><path d="M26 58 L74 58" stroke="#E9973B" stroke-width="5"/><ellipse cx="50" cy="44" rx="28" ry="4" fill="#C7894A"/>`],
    ['bang', 'Bảng đen', 'truong', `<path d="M30 80 L22 96 M70 80 L78 96" stroke="#8A5A2E" stroke-width="4" stroke-linecap="round"/><rect x="8" y="16" width="84" height="64" rx="4" fill="#8A5A2E"/><rect x="14" y="22" width="72" height="52" rx="2" fill="#2E5143"/><text x="50" y="56" text-anchor="middle" font-size="19" font-family="Patrick Hand, cursive" fill="#F6F3EA">A+B</text>`],
    ['chuong', 'Chuông', 'truong', `<path d="M50 14 C30 14 26 34 26 50 L18 70 L82 70 L74 50 C74 34 70 14 50 14Z" fill="#F6C453" stroke="#C9952A" stroke-width="2.5" stroke-linejoin="round"/><circle cx="50" cy="78" r="7" fill="#C9952A"/><rect x="45" y="6" width="10" height="9" rx="3" fill="#C9952A"/><path d="M36 30 C34 38 34 46 34 52" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round" fill="none"/>`],
    ['but-may', 'Bút máy', 'truong', `<g transform="rotate(-45 50 50)"><rect x="40" y="4" width="20" height="58" rx="8" fill="#0F2247"/><rect x="40" y="30" width="20" height="5" fill="#E9B44C"/><rect x="55" y="8" width="3" height="22" rx="1.5" fill="#E9B44C"/><path d="M42 62 L58 62 L54 80 L50 95 L46 80Z" fill="#E9B44C" stroke="#B8862E" stroke-width="1.5"/><path d="M50 70 L50 92" stroke="#7A5A16" stroke-width="1.5"/></g>`],
    ['phong-bi', 'Phong bì', 'truong', `<rect x="10" y="24" width="80" height="54" rx="5" fill="#FFF6E6" stroke="#C9952A" stroke-width="2.5"/><path d="M12 28 L50 56 L88 28" fill="none" stroke="#C9952A" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 50 C46 44 38 46 40 52 C42 58 50 62 50 62 C50 62 58 58 60 52 C62 46 54 44 50 50Z" fill="#E5484D"/>`],
    // Biểu tượng
    ['tim-doi', 'Hai trái tim', 'bieu-tuong', `<path transform="translate(-4 14) scale(.7)" d="${HEART}" fill="#F7A1C4" stroke="#D85C86" stroke-width="3.5"/><path transform="translate(34 2) scale(.7)" d="${HEART}" fill="#EF4D6B" stroke="#C9334F" stroke-width="3.5"/>`],
    ['lap-lanh', 'Lấp lánh', 'bieu-tuong', `<path d="M44 8 C48 36 56 44 84 48 C56 52 48 60 44 88 C40 60 32 52 4 48 C32 44 40 36 44 8Z" fill="#F6C453" stroke="#E0A030" stroke-width="2"/><path d="M80 8 C82 18 84 20 94 22 C84 24 82 26 80 36 C78 26 76 24 66 22 C76 20 78 18 80 8Z" fill="#FFE08A"/>`],
    ['cup', 'Cúp', 'bieu-tuong', `<path d="M30 14 L70 14 L70 34 C70 50 60 58 50 58 C40 58 30 50 30 34Z" fill="#F6C453" stroke="#C9952A" stroke-width="2.5"/><path d="M30 20 C16 20 16 42 32 44 M70 20 C84 20 84 42 68 44" fill="none" stroke="#C9952A" stroke-width="4"/><rect x="45" y="58" width="10" height="14" fill="#C9952A"/><rect x="28" y="72" width="44" height="14" rx="3" fill="#0F2247"/><path d="${starPath(50, 34, 10, 4.2)}" fill="#fff" opacity=".85"/>`],
    ['ruy-bang', 'Ruy băng', 'bieu-tuong', `<path d="M4 42 L20 42 L20 66 L4 66 L11 54Z M96 42 L80 42 L80 66 L96 66 L89 54Z" fill="#C9353D"/><rect x="14" y="34" width="72" height="26" fill="#E5484D"/><path d="M14 60 L20 66 L20 60Z M86 60 L80 66 L80 60Z" fill="#8E2229"/><path d="M20 40 L80 40 M20 54 L80 54" stroke="#F6C453" stroke-width="1.6" stroke-dasharray="3 3"/>`],
    ['khung-anh', 'Khung ảnh', 'bieu-tuong', `<rect x="12" y="14" width="76" height="72" rx="4" fill="#C7894A" stroke="#8A5A2E" stroke-width="2.5"/><rect x="22" y="24" width="56" height="52" fill="#DDEFFA"/><path d="M22 76 L42 52 L54 64 L62 56 L78 76Z" fill="#6FB45F"/><circle cx="66" cy="38" r="6" fill="#F6C453"/>`],
    ['qua', 'Hộp quà', 'bieu-tuong', `<rect x="16" y="40" width="68" height="48" rx="3" fill="#4A90E2" stroke="#2F6FB8" stroke-width="2"/><rect x="12" y="30" width="76" height="14" rx="3" fill="#5BA0EE" stroke="#2F6FB8" stroke-width="2"/><rect x="45" y="30" width="10" height="58" fill="#E5484D"/><path d="M50 30 C40 14 22 18 30 28 C34 32 44 30 50 30Z M50 30 C60 14 78 18 70 28 C66 32 56 30 50 30Z" fill="#EF5B61" stroke="#B8333A" stroke-width="2"/>`],
    // Chữ
    ['thank-you', 'Thank you', 'chu', `<path d="M4 30 L96 30 L90 50 L96 70 L4 70 L10 50Z" fill="#F28DB2" stroke="#D85C86" stroke-width="2"/><text x="50" y="57" text-anchor="middle" font-size="19" font-weight="700" font-family="Dancing Script, cursive" fill="#fff">Thank you</text>`],
    ['cam-on', 'Cảm ơn', 'chu', `<rect x="6" y="28" width="88" height="44" rx="22" fill="#0F2247"/><text x="50" y="57" text-anchor="middle" font-size="20" font-weight="800" font-family="Be Vietnam Pro, Arial, sans-serif" fill="#F6C453">Cảm ơn</text>`],
    ['tri-an', 'Tri ân', 'chu', `<path d="M8 34 Q50 22 92 34 L92 66 Q50 54 8 66Z" fill="#E9973B" stroke="#C47A24" stroke-width="2"/><text x="50" y="56" text-anchor="middle" font-size="21" font-weight="700" font-family="Dancing Script, cursive" fill="#0F2247">Tri ân</text>`],
    ['nhan-20-11', 'Bóng chữ 20/11', 'chu', `<path d="M14 18 L86 18 Q94 18 94 26 L94 62 Q94 70 86 70 L42 70 L28 86 L30 70 L14 70 Q6 70 6 62 L6 26 Q6 18 14 18Z" fill="#fff" stroke="#E9973B" stroke-width="3"/><text x="50" y="52" text-anchor="middle" font-size="23" font-weight="800" font-family="Be Vietnam Pro, Arial, sans-serif" fill="#E9973B">20/11</text>`],
    ['best-teacher', 'Best Teacher', 'chu', `<path d="${starPath(50, 50, 47, 40, 14)}" fill="#F6C453" stroke="#C9952A" stroke-width="2"/><circle cx="50" cy="50" r="31" fill="#0F2247"/><text x="50" y="48" text-anchor="middle" font-size="13" font-weight="800" font-family="Be Vietnam Pro, Arial, sans-serif" fill="#fff">BEST</text><text x="50" y="62" text-anchor="middle" font-size="10" font-weight="700" font-family="Be Vietnam Pro, Arial, sans-serif" fill="#F6C453">TEACHER</text>`],
    ['love', 'Yêu thương', 'chu', `<path transform="translate(50 50) scale(.95) translate(-50 -50)" d="${HEART}" fill="#EF4D6B" stroke="#C9334F" stroke-width="2.5"/><text x="50" y="54" text-anchor="middle" font-size="13" font-weight="800" font-family="Be Vietnam Pro, Arial, sans-serif" fill="#fff">Yêu thương</text>`],
    // Trời & muông thú
    ['may', 'Mây', 'troi', `<path d="M24 74 C10 74 8 54 22 52 C20 36 40 30 48 42 C54 26 80 30 78 48 C94 48 94 74 78 74Z" fill="#fff" stroke="#9FC4E0" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="62" r="2.5" fill="#5D6B85"/><circle cx="60" cy="62" r="2.5" fill="#5D6B85"/><path d="M45 68 Q50 72 55 68" stroke="#5D6B85" stroke-width="2" fill="none" stroke-linecap="round"/>`],
    ['cau-vong', 'Cầu vồng', 'troi', `<g fill="none" stroke-width="7" stroke-linecap="round"><path d="M8 76 A42 42 0 0 1 92 76" stroke="#E5484D"/><path d="M16 76 A34 34 0 0 1 84 76" stroke="#E9973B"/><path d="M24 76 A26 26 0 0 1 76 76" stroke="#F6C453"/><path d="M32 76 A18 18 0 0 1 68 76" stroke="#4CAF7A"/><path d="M40 76 A10 10 0 0 1 60 76" stroke="#4A90E2"/></g><ellipse cx="14" cy="80" rx="13" ry="8" fill="#fff" stroke="#C9D8EA" stroke-width="2"/><ellipse cx="86" cy="80" rx="13" ry="8" fill="#fff" stroke="#C9D8EA" stroke-width="2"/>`],
    ['trang', 'Trăng', 'troi', `<path d="M62 10 C38 14 22 34 24 56 C26 80 50 94 74 88 C54 82 42 66 44 46 C46 28 54 16 62 10Z" fill="#FFE08A" stroke="#E0A030" stroke-width="2.5"/><path d="${starPath(78, 28, 8, 3.4)}" fill="#F6C453"/><path d="${starPath(84, 56, 5, 2.2)}" fill="#F6C453"/>`],
    ['buom', 'Bướm', 'troi', `<path d="M50 50 C36 24 10 22 12 40 C14 54 34 56 50 50Z M50 50 C64 24 90 22 88 40 C86 54 66 56 50 50Z" fill="#F28DB2" stroke="#D85C86" stroke-width="2"/><path d="M50 52 C38 60 24 76 34 82 C42 86 48 70 50 52Z M50 52 C62 60 76 76 66 82 C58 86 52 70 50 52Z" fill="#B48CE8" stroke="#8E5BD0" stroke-width="2"/><rect x="47" y="34" width="6" height="40" rx="3" fill="#0F2247"/><path d="M49 36 C46 26 42 22 38 20 M51 36 C54 26 58 22 62 20" stroke="#0F2247" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="26" cy="38" r="4" fill="#fff" opacity=".7"/><circle cx="74" cy="38" r="4" fill="#fff" opacity=".7"/>`],
    ['chim', 'Chim nhỏ', 'troi', `<path d="M44 76 L42 88 M54 76 L54 88" stroke="#E9973B" stroke-width="3" stroke-linecap="round"/><path d="M20 60 C20 40 40 30 58 36 C68 26 84 28 86 40 L96 44 L86 48 C84 66 66 78 46 76 C30 74 20 70 20 60Z" fill="#4A90E2" stroke="#2F6FB8" stroke-width="2"/><path d="M34 56 C44 46 60 48 64 58 C54 66 42 66 34 56Z" fill="#7FB3EE"/><circle cx="74" cy="40" r="3.5" fill="#0F2247"/><path d="M20 60 L6 52 L10 64Z" fill="#2F6FB8"/>`],
    ['ong', 'Ong', 'troi', `<ellipse cx="38" cy="34" rx="14" ry="10" fill="#E3F1FB" stroke="#9FC4E0" stroke-width="2" transform="rotate(-25 38 34)"/><ellipse cx="60" cy="32" rx="14" ry="10" fill="#E3F1FB" stroke="#9FC4E0" stroke-width="2" transform="rotate(25 60 32)"/><ellipse cx="50" cy="58" rx="28" ry="20" fill="#F6C453" stroke="#5B3416" stroke-width="2.5"/><path d="M40 40 C36 52 36 66 40 76 M56 40 C52 52 52 66 56 76" stroke="#5B3416" stroke-width="6"/><circle cx="72" cy="54" r="3" fill="#5B3416"/><path d="M22 58 L12 60" stroke="#5B3416" stroke-width="3" stroke-linecap="round"/>`],
  ];
}

export const STICKER_GROUPS = [
  { id: 'hoa', name: 'Hoa & lá' },
  { id: 'truong', name: 'Trường lớp' },
  { id: 'bieu-tuong', name: 'Biểu tượng' },
  { id: 'chu', name: 'Chữ' },
  { id: 'troi', name: 'Trời & muông thú' },
];
// nhóm cho 13 sticker cũ
export const OLD_STICKER_GROUP = {
  hoa: 'hoa', la: 'hoa', tim: 'bieu-tuong', sao: 'bieu-tuong', 'huy-hieu': 'chu', no: 'bieu-tuong', 'bong-bay': 'bieu-tuong',
  sach: 'truong', but: 'truong', mu: 'truong', tao: 'truong', 'mat-troi': 'troi', hac: 'troi',
};
