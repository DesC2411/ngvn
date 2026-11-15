// Chữ & hình phẳng vẽ bằng CanvasTexture (biển, băng rôn, bảng điện tử, bảng đen…)
import * as THREE from 'three';

export const NAVY = '#0F2247';
export const ORANGE = '#E9973B';
export const CREAM = '#FFF6E6';
export const FONT_STACK = '"Be Vietnam Pro", "Nunito", "Segoe UI", Roboto, "Noto Sans", "Helvetica Neue", Arial, sans-serif';
export const CHALK_STACK = '"Patrick Hand", "Comic Sans MS", "Segoe Print", "Segoe UI", "Noto Sans", sans-serif';

export const font = (weight, px, stack = FONT_STACK) => `${weight} ${Math.round(px)}px ${stack}`;

let maxAniso = 4;
export function setMaxAnisotropy(n) { maxAniso = Math.min(8, n || 1); }

/** Tạo canvas + texture có hàm vẽ lại. */
export function canvasTexture(w, h, draw, { mip = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAniso;
  if (!mip) { texture.generateMipmaps = false; texture.minFilter = THREE.LinearFilter; }
  const obj = {
    canvas, ctx, texture,
    redraw(...args) { ctx.clearRect(0, 0, w, h); draw(ctx, w, h, ...args); texture.needsUpdate = true; },
  };
  if (draw) obj.redraw();
  return obj;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Vẽ chữ tự thu nhỏ cho vừa bề rộng. */
export function fitText(ctx, text, x, y, maxW, weight, px, stack = FONT_STACK, minPx = 10) {
  let size = px;
  ctx.font = font(weight, size, stack);
  while (ctx.measureText(text).width > maxW && size > minPx) {
    size -= 1;
    ctx.font = font(weight, size, stack);
  }
  ctx.fillText(text, x, y);
  return size;
}

export function wrapLines(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

const imgCache = new Map();
export function loadImage(url) {
  if (!imgCache.has(url)) {
    imgCache.set(url, new Promise((res) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = url;
    }));
  }
  return imgCache.get(url);
}

export const LOGO_URL = '/brand/logo-round.png';
let logoImg = null;
export async function preloadLogo() { logoImg = await loadImage(LOGO_URL); return logoImg; }
export function drawLogo(ctx, cx, cy, size) {
  if (!logoImg) return;
  ctx.drawImage(logoImg, cx - size / 2, cy - size / 2, size, size);
}

function woodGrain(ctx, x, y, w, h, base = '#B97A45', dark = '#8A5530') {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, base); g.addColorStop(1, dark);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#5a3418';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const yy = y + (i + 0.5) * (h / 9);
    ctx.beginPath();
    ctx.moveTo(x, yy);
    for (let xx = x; xx <= x + w; xx += 24) ctx.lineTo(xx, yy + Math.sin(xx * 0.03 + i * 1.7) * 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ---------- Các biển cụ thể ---------- */

export function gateSignTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1A3466'); g.addColorStop(1, NAVY);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 12; ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.strokeRect(24, 24, w - 48, h - 48);
    drawLogo(ctx, 140, h / 2, 196);
    drawLogo(ctx, w - 140, h / 2, 196);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 8;
    fitText(ctx, 'MAY ACADEMY', w / 2, h * 0.43, w - 520, 900, 104);
    ctx.shadowBlur = 0;
    ctx.fillStyle = ORANGE;
    fitText(ctx, 'MN · TH · THCS · THPT', w / 2, h * 0.78, w - 520, 700, 34);
  });
}

export function bannerTexture(text = 'CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM 20/11') {
  return canvasTexture(2048, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#C62A2F'); g.addColorStop(1, '#9E1B22');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = ORANGE; ctx.fillRect(0, 0, w, 14); ctx.fillRect(0, h - 14, w, 14);
    drawLogo(ctx, 130, h / 2, 190);
    drawLogo(ctx, w - 130, h / 2, 190);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFE15A';
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 6;
    fitText(ctx, text, w / 2, h / 2 + 4, w - 360, 900, 112);
    ctx.shadowBlur = 0;
  });
}

export function countdownTexture() {
  return canvasTexture(1024, 512, (ctx, w, h, target) => {
    ctx.fillStyle = '#0B1220'; ctx.fillRect(0, 0, w, h);
    roundRect(ctx, 12, 12, w - 24, h - 24, 28); ctx.strokeStyle = ORANGE; ctx.lineWidth = 10; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    fitText(ctx, 'ĐẾM NGƯỢC ĐẾN NGÀY 20/11', w / 2, 76, w - 140, 800, 46);
    const now = Date.now();
    const t = target ? new Date(target).getTime() : NaN;
    if (!Number.isFinite(t)) {
      ctx.fillStyle = ORANGE; fitText(ctx, '20 · 11', w / 2, h / 2 + 20, w - 80, 900, 150);
      return;
    }
    let diff = Math.max(0, t - now);
    if (diff <= 0) {
      ctx.fillStyle = '#FFE15A';
      fitText(ctx, 'Chúc mừng ngày', w / 2, 210, w - 80, 900, 84);
      fitText(ctx, 'Nhà giáo Việt Nam!', w / 2, 320, w - 80, 900, 84);
      return;
    }
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const hh = Math.floor(diff / 3600000); diff -= hh * 3600000;
    const mm = Math.floor(diff / 60000); diff -= mm * 60000;
    const ss = Math.floor(diff / 1000);
    const cells = [[d, 'NGÀY'], [hh, 'GIỜ'], [mm, 'PHÚT'], [ss, 'GIÂY']];
    const cw = 210, gap = 26, x0 = (w - (cw * 4 + gap * 3)) / 2;
    cells.forEach(([v, lab], i) => {
      const x = x0 + i * (cw + gap);
      roundRect(ctx, x, 140, cw, 230, 22);
      ctx.fillStyle = '#16233F'; ctx.fill();
      ctx.fillStyle = i === 0 ? ORANGE : '#FFFFFF';
      ctx.font = font(900, 140, '"Consolas", "Courier New", monospace');
      ctx.fillText(String(v).padStart(2, '0'), x + cw / 2, 250);
      ctx.fillStyle = '#9FB2D9';
      ctx.font = font(700, 34);
      ctx.fillText(lab, x + cw / 2, 410);
    });
    ctx.fillStyle = ORANGE; ctx.font = font(700, 34);
    ctx.fillText('May Academy · Mùa Tri Ân', w / 2, 462);
  }, { mip: false });
}

export function leaderboardTexture() {
  return canvasTexture(1024, 768, (ctx, w, h, rows) => {
    ctx.fillStyle = '#05080F'; ctx.fillRect(0, 0, w, h);
    // lưới điểm LED
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    for (let y = 0; y < h; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < w; x += 8) ctx.fillRect(x, y, 2, 2);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = ORANGE;
    fitText(ctx, 'LỚP TRI ÂN NHIỀU NHẤT', w / 2, 62, w - 60, 900, 62);
    ctx.fillStyle = '#9FB2D9'; ctx.font = font(600, 26);
    ctx.fillText('Thiệp + hạc giấy + chữ ký đã duyệt', w / 2, 112);
    const list = (rows || []).slice(0, 10);
    if (!list.length) {
      ctx.fillStyle = '#FFFFFF'; ctx.font = font(700, 40);
      ctx.fillText('Chưa có lớp nào — bạn mở hàng nhé!', w / 2, h / 2 + 30);
      return;
    }
    const top = 150, rowH = (h - top - 20) / 10;
    list.forEach((r, i) => {
      const y = top + rowH * i + rowH / 2;
      if (i % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(30, y - rowH / 2 + 3, w - 60, rowH - 6); }
      const medal = ['#FFD54A', '#D9DEE8', '#E39A5B'][i];
      ctx.textAlign = 'center';
      ctx.fillStyle = medal || '#7F8FB3';
      ctx.font = font(900, 40);
      ctx.fillText(String(i + 1), 80, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      fitText(ctx, String(r.cls || '—'), 130, y, 330, 800, 40);
      ctx.fillStyle = '#9FB2D9'; ctx.font = font(600, 24);
      ctx.fillText(`${r.cards || 0} thiệp · ${r.cranes || 0} hạc · ${r.signatures || 0} chữ ký`, 470, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = ORANGE; ctx.font = font(900, 42);
      ctx.fillText(String(r.score || 0), w - 50, y);
    });
  });
}

export function woodSignTexture(lines, { w = 512, h = 256, title = null } = {}) {
  return canvasTexture(w, h, (ctx, W, H) => {
    woodGrain(ctx, 0, 0, W, H);
    ctx.strokeStyle = '#5E3A1E'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, W - 12, H - 12);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const n = lines.length + (title ? 1 : 0);
    let y = H / 2 - ((n - 1) * H * 0.2) / 2;
    if (title) {
      ctx.fillStyle = '#FFF3D6';
      ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 4;
      fitText(ctx, title, W / 2, y, W - 50, 900, H * 0.24);
      ctx.shadowBlur = 0;
      y += H * 0.24;
    }
    for (const l of lines) {
      ctx.fillStyle = '#FFE8C2';
      fitText(ctx, l, W / 2, y, W - 50, 700, H * 0.14);
      y += H * 0.18;
    }
  });
}

/** Biển tên cây: tên cây + Thầy/Cô + bộ phận + số thiệp + lời hồi âm ngắn */
export function treeSignTexture(teacher) {
  return canvasTexture(512, 288, (ctx, W, H, count = 0, reply = null) => {
    woodGrain(ctx, 0, 0, W, H, '#C98A50', '#9A6236');
    ctx.strokeStyle = '#6B4122'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, W - 12, H - 12);
    // dải navy tên cây
    roundRect(ctx, 24, 22, W - 48, 82, 14); ctx.fillStyle = NAVY; ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = ORANGE;
    fitText(ctx, teacher.tree || 'Cây Tri Ân', W / 2, 64, W - 80, 900, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 4;
    fitText(ctx, `${teacher.title || ''} ${teacher.name || ''}`.trim(), W / 2, 142, W - 50, 800, 42);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFE8C2';
    const sub = [teacher.dept, teacher.role].filter(Boolean).join(' · ');
    if (sub) fitText(ctx, sub, W / 2, 188, W - 60, 600, 26);
    // số thiệp
    roundRect(ctx, W / 2 - 120, 214, 240, 52, 26); ctx.fillStyle = 'rgba(15,34,71,.85)'; ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = font(800, 28);
    ctx.fillText(`✉ ${count} thiệp`, W / 2, 241);
    if (reply) {
      ctx.fillStyle = '#FFF3A8'; ctx.font = font(700, 20);
      ctx.textAlign = 'right';
      ctx.fillText('★ có hồi âm', W - 22, 252);
    }
  });
}

export function chalkboardTexture() {
  return canvasTexture(2048, 1024, (ctx, w, h, sigs = [], images = new Map()) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w * 0.7);
    g.addColorStop(0, '#2F4A3B'); g.addColorStop(1, '#1D3027');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // vệt phấn mờ
    ctx.globalAlpha = 0.06; ctx.fillStyle = '#fff';
    for (let i = 0; i < 40; i++) {
      const x = (i * 997) % w, y = (i * 613) % h;
      ctx.beginPath(); ctx.ellipse(x, y, 160, 26, (i % 7) * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F6F1DE';
    fitText(ctx, 'Tri ân thầy cô · 20/11', w / 2, 70, w - 200, 700, 84, CHALK_STACK);
    ctx.fillStyle = '#FFD27A'; ctx.font = font(400, 40, CHALK_STACK);
    ctx.fillText(sigs.length ? `${sigs.length} chữ ký của cả trường` : 'Hãy là người ký tên đầu tiên!', w / 2, 138);
    const list = sigs;
    if (!list.length) return;
    const top = 180, left = 40, areaW = w - 80, areaH = h - top - 30;
    const n = list.length;
    const aspect = 2.6;
    let cols = Math.max(4, Math.ceil(Math.sqrt((n * areaW) / (areaH * aspect))));
    let rows = Math.ceil(n / cols);
    while (rows * (areaW / cols / aspect) > areaH) { cols++; rows = Math.ceil(n / cols); }
    const cw = areaW / cols, ch = Math.min(areaH / rows, cw / 1.6);
    list.forEach((s, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const cx = left + cw * c + cw / 2, cy = top + ch * r + ch / 2;
      const jitter = ((i * 37) % 11 - 5) * 0.012;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(jitter);
      const im = s.drawingUrl ? images.get(s.drawingUrl) : null;
      if (im) {
        const iw = cw * 0.9, ih = ch * 0.62;
        const sc = Math.min(iw / im.width, ih / im.height);
        ctx.drawImage(im, -im.width * sc / 2, -ch * 0.12 - im.height * sc / 2, im.width * sc, im.height * sc);
        ctx.fillStyle = '#E7E1C8';
        fitText(ctx, `${s.name || ''}${s.cls ? ' · ' + s.cls : ''}`, 0, ch * 0.34, cw * 0.92, 400, ch * 0.2, CHALK_STACK, 8);
      } else {
        ctx.fillStyle = ['#F6F1DE', '#FFE3A3', '#CFE8FF', '#FFD0D8'][i % 4];
        fitText(ctx, s.name || 'Học sinh', 0, -ch * 0.06, cw * 0.92, 400, ch * 0.42, CHALK_STACK, 8);
        if (s.cls) { ctx.fillStyle = '#BFC9B8'; fitText(ctx, s.cls, 0, ch * 0.3, cw * 0.9, 400, ch * 0.2, CHALK_STACK, 7); }
      }
      ctx.restore();
    });
  });
}

/** Chuyển ảnh vẽ tay thành nét phấn trắng (dùng alpha nếu có, ngược lại dùng độ tối). */
export function chalkify(img, maxW = 240, maxH = 120) {
  const sc = Math.min(1, maxW / img.width, maxH / img.height);
  const w = Math.max(1, Math.round(img.width * sc)), h = Math.max(1, Math.round(img.height * sc));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  let data;
  try { data = x.getImageData(0, 0, w, h); } catch { return c; }
  const d = data.data;
  let transparent = false;
  for (let i = 3; i < d.length; i += 16) if (d[i] < 250) { transparent = true; break; }
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
    let a;
    if (transparent) a = d[i + 3] / 255;
    else a = Math.max(0, Math.min(1, (0.92 - lum) * 1.6));
    d[i] = 246; d[i + 1] = 242; d[i + 2] = 226; d[i + 3] = Math.round(a * 235);
  }
  x.putImageData(data, 0, 0);
  return c;
}

export function backdropTexture(cw = 1024, chh = 768) {
  return canvasTexture(cw, chh, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1B3A78'); g.addColorStop(0.65, NAVY); g.addColorStop(1, '#0A1733');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // tia nắng
    ctx.save(); ctx.translate(w / 2, h * 0.42);
    for (let i = 0; i < 24; i++) {
      ctx.rotate(Math.PI / 12);
      ctx.fillStyle = i % 2 ? 'rgba(233,151,59,.10)' : 'rgba(255,255,255,.04)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, -60); ctx.lineTo(w, 60); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // chấm vàng lấp lánh
    for (let i = 0; i < 70; i++) {
      const x = (i * 431) % w, y = (i * 277) % (h * 0.9);
      ctx.fillStyle = `rgba(255,${200 + (i % 50)},120,${0.25 + (i % 5) * 0.1})`;
      ctx.beginPath(); ctx.arc(x, y, 2 + (i % 4), 0, Math.PI * 2); ctx.fill();
    }
    const k = h / 768;
    drawLogo(ctx, w / 2, 150 * k, 200 * k);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 10;
    fitText(ctx, 'TRI ÂN THẦY CÔ', w / 2, 330 * k, w - 120, 900, 96 * k);
    ctx.fillStyle = ORANGE;
    fitText(ctx, '20 · 11 · 2026', w / 2, 430 * k, w - 120, 900, 120 * k);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#DCE6FF';
    fitText(ctx, 'Ngày Nhà giáo Việt Nam · May Academy', w / 2, 520 * k, w - 120, 600, 38 * k);
  });
}

export function plaqueTexture(title, sub, { w = 512, h = 256, bg = '#B3202A', fg = '#FFD86A' } = {}) {
  return canvasTexture(w, h, (ctx, W, H) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bg); g.addColorStop(1, '#7E141B');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = fg; ctx.lineWidth = 10; ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.lineWidth = 2; ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = fg;
    fitText(ctx, title, W / 2, sub ? H * 0.42 : H / 2, W - 70, 900, H * 0.3);
    if (sub) { ctx.fillStyle = '#FFF1D0'; fitText(ctx, sub, W / 2, H * 0.74, W - 70, 600, H * 0.13); }
  });
}

export function quizBoardTexture() {
  return canvasTexture(512, 512, (ctx, W, H) => {
    woodGrain(ctx, 0, 0, W, H, '#C58B52', '#93602F');
    ctx.strokeStyle = '#5E3A1E'; ctx.lineWidth = 16; ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = NAVY;
    roundRect(ctx, 40, 40, W - 80, 120, 20); ctx.fill();
    ctx.fillStyle = ORANGE; fitText(ctx, 'ĐỐ VUI', W / 2, 102, W - 120, 900, 78);
    ctx.fillStyle = '#FFF4DC';
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 4;
    fitText(ctx, 'Bạn hiểu', W / 2, 220, W - 80, 800, 56);
    fitText(ctx, 'thầy cô bao nhiêu?', W / 2, 286, W - 80, 800, 52);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFE15A'; ctx.font = font(900, 110);
    ctx.fillText('? ? ?', W / 2, 410);
  });
}

export function envelopeTexture() {
  return canvasTexture(128, 96, (ctx, W, H) => {
    ctx.fillStyle = '#FFF8EC'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#E2C9A6'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, W - 4, H - 4);
    ctx.strokeStyle = '#D9B98F'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(2, 4); ctx.lineTo(W / 2, H * 0.58); ctx.lineTo(W - 2, 4); ctx.stroke();
    ctx.fillStyle = '#D23B3B';
    ctx.beginPath();
    const cx = W / 2, cy = H * 0.58;
    ctx.moveTo(cx, cy + 12);
    ctx.bezierCurveTo(cx - 20, cy - 2, cx - 9, cy - 16, cx, cy - 6);
    ctx.bezierCurveTo(cx + 9, cy - 16, cx + 20, cy - 2, cx, cy + 12);
    ctx.fill();
  });
}

export function flagVNTexture() {
  return canvasTexture(300, 200, (ctx, W, H) => {
    ctx.fillStyle = '#DA251D'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFFF00';
    const cx = W / 2, cy = H / 2, R = H * 0.3, r = R * 0.382;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r : R;
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
  });
}

export function schoolFlagTexture() {
  return canvasTexture(384, 256, (ctx, W, H) => {
    ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ORANGE; ctx.fillRect(0, H - 26, W, 26);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, H - 34, W, 6);
    drawLogo(ctx, W / 2, H / 2 - 12, 170);
  });
}

export function nameTagTexture(name, cls) {
  return canvasTexture(512, 128, (ctx, W, H) => {
    ctx.font = font(800, 46);
    const t1 = String(name || '').slice(0, 24);
    const t2 = cls ? String(cls).slice(0, 12) : '';
    const w1 = ctx.measureText(t1).width;
    ctx.font = font(700, 34);
    const w2 = t2 ? ctx.measureText(t2).width + 34 : 0;
    const total = Math.min(W - 8, w1 + w2 + 56);
    const x0 = (W - total) / 2;
    roundRect(ctx, x0, 22, total, 84, 42);
    ctx.fillStyle = 'rgba(15,34,71,0.86)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF'; ctx.font = font(800, 46);
    let x = x0 + 28;
    ctx.fillText(t1, x, 66, total - 56 - w2);
    if (t2) {
      x = Math.min(x + w1 + 18, x0 + total - w2 - 10);
      roundRect(ctx, x, 40, w2 - 8, 52, 26); ctx.fillStyle = ORANGE; ctx.fill();
      ctx.fillStyle = NAVY; ctx.font = font(800, 32);
      ctx.fillText(t2, x + 13, 67);
    }
  }, { mip: false });
}

export function grassTexture() {
  const t = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = '#8DAA4C'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 2400; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const k = Math.random();
      ctx.fillStyle = k < 0.33 ? 'rgba(120,150,60,.55)' : k < 0.66 ? 'rgba(170,185,85,.45)' : 'rgba(196,160,70,.35)';
      ctx.fillRect(x, y, 2, 3 + Math.random() * 3);
    }
  });
  t.texture.wrapS = t.texture.wrapT = THREE.RepeatWrapping;
  return t.texture;
}

export function pavingTexture(base = '#D9CDB8', line = '#BFAF95', tile = 64) {
  const t = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += tile) for (let x = 0; x < W; x += tile) {
      const v = Math.random() * 18 - 9;
      ctx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 240 : 0},${v > 0 ? 220 : 0},${Math.abs(v) / 100})`;
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
    }
    ctx.strokeStyle = line; ctx.lineWidth = 3;
    for (let i = 0; i <= W; i += tile) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
  });
  t.texture.wrapS = t.texture.wrapT = THREE.RepeatWrapping;
  return t.texture;
}

export function leafTexture() {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.translate(W / 2, H / 2); ctx.rotate(-0.6);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.bezierCurveTo(20, -18, 20, 14, 0, 28);
    ctx.bezierCurveTo(-20, 14, -20, -18, 0, -28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,20,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, 30); ctx.stroke();
  }, { mip: false }).texture;
}

export function softDotTexture() {
  return canvasTexture(64, 64, (ctx, W, H) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }, { mip: false }).texture;
}

export function skyGradientTexture() {
  return canvasTexture(4, 256, (ctx, W, H) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5E8FD0');
    g.addColorStop(0.45, '#A9C3E3');
    g.addColorStop(0.62, '#F6D6A8');
    g.addColorStop(0.72, '#F4C38A');
    g.addColorStop(1, '#E8B98A');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }, { mip: false }).texture;
}

/** Bông hoa 5 cánh (cây ra hoa khi đủ 10 thiệp) */
export function blossomTexture() {
  return canvasTexture(128, 128, (ctx, W, H) => {
    ctx.translate(W / 2, H / 2);
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 5);
      const g = ctx.createRadialGradient(0, -30, 4, 0, -30, 30);
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#FFE3EC');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, -30, 20, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#F7C843';
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#E9973B';
    for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.beginPath(); ctx.arc(Math.cos(a) * 6, Math.sin(a) * 6, 2.5, 0, Math.PI * 2); ctx.fill(); }
  }).texture;
}

/** Phông dọc cho ảnh kỷ niệm (khớp khung 1080×1350): chữ ở 40% phía trên, nhân vật đứng phía dưới */
export function photoBackdropTexture() {
  return canvasTexture(864, 1080, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#22468C'); g.addColorStop(0.55, NAVY); g.addColorStop(1, '#0A1733');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(w / 2, h * 0.62);
    for (let i = 0; i < 28; i++) {
      ctx.rotate(Math.PI / 14);
      ctx.fillStyle = i % 2 ? 'rgba(233,151,59,.11)' : 'rgba(255,255,255,.035)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(h, -70); ctx.lineTo(h, 70); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < 90; i++) {
      const x = (i * 431) % w, y = (i * 277) % h;
      ctx.fillStyle = `rgba(255,${200 + (i % 50)},120,${0.25 + (i % 5) * 0.1})`;
      ctx.beginPath(); ctx.arc(x, y, 2 + (i % 4), 0, Math.PI * 2); ctx.fill();
    }
    drawLogo(ctx, w / 2, h * 0.1, 150);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#FFFFFF';
    fitText(ctx, 'TRI ÂN THẦY CÔ', w / 2, h * 0.215, w - 90, 900, 96);
    ctx.fillStyle = ORANGE;
    fitText(ctx, '20 · 11 · 2026', w / 2, h * 0.305, w - 90, 900, 104);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#DCE6FF';
    fitText(ctx, 'Ngày Nhà giáo Việt Nam · May Academy', w / 2, h * 0.375, w - 90, 600, 34);
  });
}

/** Biển tên thầy cô: huy hiệu vàng "Thầy/Cô" + họ tên */
export function teacherNameTagTexture(name) {
  const m = String(name || '').trim().match(/^(Thầy|Cô)\s+(.*)$/);
  const badge = m ? m[1] : 'GV';
  const rest = (m ? m[2] : String(name || '')).slice(0, 26);
  return canvasTexture(640, 140, (ctx, W) => {
    ctx.font = font(800, 44);
    const wn = Math.min(ctx.measureText(rest).width, 440);
    ctx.font = font(900, 36);
    const wb = ctx.measureText(badge).width + 44;
    const total = Math.min(W - 8, wn + wb + 64);
    const x0 = (W - total) / 2;
    roundRect(ctx, x0, 24, total, 92, 46);
    ctx.fillStyle = 'rgba(15,34,71,0.9)'; ctx.fill();
    ctx.strokeStyle = '#F7C843'; ctx.lineWidth = 5; ctx.stroke();
    const g = ctx.createLinearGradient(0, 36, 0, 104);
    g.addColorStop(0, '#FFE58A'); g.addColorStop(1, '#E3A62B');
    roundRect(ctx, x0 + 12, 36, wb, 68, 34); ctx.fillStyle = g; ctx.fill();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillStyle = NAVY; ctx.font = font(900, 36);
    ctx.fillText(badge, x0 + 12 + wb / 2, 71);
    ctx.textAlign = 'left'; ctx.fillStyle = '#FFFFFF'; ctx.font = font(800, 44);
    ctx.fillText(rest, x0 + wb + 34, 72, total - wb - 52);
  }, { mip: false });
}

/** Biển nổi vàng (đích chỉ đường / cây của thầy cô) */
export function goldBadgeTexture(title, sub = '') {
  return canvasTexture(640, 200, (ctx, W, H) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FFE58A'); g.addColorStop(1, '#E9A23B');
    roundRect(ctx, 10, 10, W - 20, sub ? 150 : 120, 34); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 6; ctx.stroke();
    // mũi nhọn chỉ xuống
    ctx.beginPath(); ctx.moveTo(W / 2 - 26, sub ? 158 : 128); ctx.lineTo(W / 2, H - 6); ctx.lineTo(W / 2 + 26, sub ? 158 : 128); ctx.closePath();
    ctx.fillStyle = '#E9A23B'; ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = NAVY;
    fitText(ctx, title, W / 2, sub ? 58 : 70, W - 70, 900, 54);
    if (sub) { ctx.fillStyle = '#5A3A08'; fitText(ctx, sub, W / 2, 118, W - 70, 700, 34); }
  }, { mip: false });
}

/** Mũi tên chevron cho vệt chỉ đường trên mặt đất (hướng +y của ảnh = hướng đi) */
export function chevronTexture() {
  return canvasTexture(128, 128, (ctx, W, H) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 26;
    ctx.beginPath(); ctx.moveTo(22, 92); ctx.lineTo(64, 40); ctx.lineTo(106, 92); ctx.stroke();
    ctx.strokeStyle = '#F7B23B'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(22, 92); ctx.lineTo(64, 40); ctx.lineTo(106, 92); ctx.stroke();
  }, { mip: false }).texture;
}

/** Dải sáng dọc (cột sáng ở đích) */
export function beamTexture() {
  return canvasTexture(8, 256, (ctx, W, H) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,220,120,0)');
    g.addColorStop(0.6, 'rgba(255,214,110,0.35)');
    g.addColorStop(1, 'rgba(255,236,170,0.9)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }, { mip: false }).texture;
}

/** Chiếu cói quỳ vái (viền đỏ, hoa văn đan) */
export function matTexture() {
  return canvasTexture(256, 352, (ctx, W, H) => {
    ctx.fillStyle = '#E8CF94'; ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 6) { ctx.fillStyle = y % 12 ? 'rgba(160,120,50,.18)' : 'rgba(255,255,255,.18)'; ctx.fillRect(0, y, W, 3); }
    ctx.strokeStyle = '#B3202A'; ctx.lineWidth = 22; ctx.strokeRect(11, 11, W - 22, H - 22);
    ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = 4; ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.fillStyle = '#B3202A';
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-34, -34, 68, 68);
    ctx.restore();
    ctx.fillStyle = '#F2C14E';
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.PI / 4); ctx.fillRect(-16, -16, 32, 32); ctx.restore();
  }).texture;
}

/** Biển tên lớn cho Đại Thụ: "Đại Thụ Tùng Bách – Ông Nguyễn Tiến Phú" */
export function giantSignTexture(t) {
  return canvasTexture(1024, 420, (ctx, W, H, count = 0) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8E1D24'); g.addColorStop(1, '#5E1016');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = 16; ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.lineWidth = 3; ctx.strokeRect(34, 34, W - 68, H - 68);
    // hoa văn góc
    ctx.fillStyle = '#F2C14E';
    for (const [x, y] of [[52, 52], [W - 52, 52], [52, H - 52], [W - 52, H - 52]]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-11, -11, 22, 22); ctx.restore();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFE08A';
    fitText(ctx, t.tree || 'Đại Thụ', W / 2, 120, W - 160, 900, 104);
    ctx.fillStyle = '#FFFFFF';
    fitText(ctx, `${t.title || ''} ${t.name || ''}`.trim(), W / 2, 232, W - 160, 800, 66);
    ctx.shadowBlur = 0;
    roundRect(ctx, W / 2 - 170, 296, 340, 70, 35); ctx.fillStyle = 'rgba(255,224,138,.95)'; ctx.fill();
    ctx.fillStyle = '#5E1016'; ctx.font = font(900, 40);
    ctx.fillText(`✉ ${count} thiệp`, W / 2, 333);
  });
}

/** Đốm sáng đèn nháy (tâm trắng, viền mềm) */
export function twinkleTexture() {
  return canvasTexture(64, 64, (ctx, W, H) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }, { mip: false }).texture;
}
