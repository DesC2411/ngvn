// Ghép khung ảnh kỷ niệm 1080×1350 bằng canvas.
import { loadImage } from './dom.js';

export const FRAMES = [
  { id: 'navy', name: 'Navy cổ điển' },
  { id: 'thu', name: 'Thu vàng' },
  { id: 'polaroid', name: 'Polaroid' },
];
export const TAGLINE = '20/11 · Tri ân thầy cô · May Academy';
const MAPLE = new Path2D(
  'M50 4 L58 26 L78 16 L72 40 L95 42 L76 56 L84 70 L60 64 L54 88 L50 84 L46 88 L40 64 L16 70 L24 56 L5 42 L28 40 L22 16 L42 26 Z',
);
const FONT = '"Be Vietnam Pro", system-ui, sans-serif';

let logoP = null;
const logo = () => (logoP ||= loadImage('/brand/logo-round.png').catch(() => loadImage('/brand/logo-256.png')).catch(() => null));

export async function ensureFrameFonts() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`700 48px "Be Vietnam Pro"`),
        document.fonts.load(`600 48px "Be Vietnam Pro"`),
        document.fonts.load(`700 48px "Dancing Script"`),
        document.fonts.load(`48px "Patrick Hand"`),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* dùng font dự phòng */ }
}

function rr(g, x, y, w, hgt, r) {
  g.beginPath();
  if (g.roundRect) g.roundRect(x, y, w, hgt, r);
  else {
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + hgt, r);
    g.arcTo(x + w, y + hgt, x, y + hgt, r);
    g.arcTo(x, y + hgt, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
}

function cover(g, img, x, y, w, hgt) {
  if (!img) {
    const gr = g.createLinearGradient(x, y, x + w, y + hgt);
    gr.addColorStop(0, '#2B4A85');
    gr.addColorStop(1, '#E9973B');
    g.fillStyle = gr;
    g.fillRect(x, y, w, hgt);
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.font = `600 ${Math.round(w / 14)}px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('Ảnh của bạn', x + w / 2, y + hgt / 2);
    return;
  }
  const s = Math.max(w / img.width, hgt / img.height);
  const sw = w / s;
  const sh = hgt / s;
  g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, hgt);
}

function fitText(g, text, x, y, maxW, size, weight, family, color, align = 'left') {
  let fs = size;
  do {
    g.font = `${weight} ${fs}px ${family}`;
    if (g.measureText(text).width <= maxW) break;
    fs -= 2;
  } while (fs > 14);
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(text, x, y);
}

function leafAt(g, x, y, s, r, color) {
  g.save();
  g.translate(x, y);
  g.rotate((r * Math.PI) / 180);
  g.scale(s, s);
  g.translate(-50, -50);
  g.fillStyle = color;
  g.fill(MAPLE);
  g.restore();
}

function star(g, cx, cy, R, r, color) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r : R;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    g.lineTo(cx + rad * Math.cos(a), cy + rad * Math.sin(a));
  }
  g.closePath();
  g.fillStyle = color;
  g.fill();
}

/**
 * Vẽ ảnh vào khung. photo: HTMLImageElement | null (null = ảnh giả để xem trước khung).
 * Trả về canvas W×(W*1.25).
 */
export async function composePhoto(photo, frameId, profile = {}, W = 1080) {
  const H = Math.round(W * 1.25);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.scale(W / 1080, W / 1080);
  const lg = await logo();
  const name = String(profile.name || 'Học sinh May Academy');
  const cls = profile.cls && String(profile.cls).toUpperCase() !== 'GV' ? `Lớp ${profile.cls}` : profile.role === 'teacher' ? 'Thầy cô May Academy' : '';

  if (frameId === 'thu') {
    const bg = g.createLinearGradient(0, 0, 0, 1350);
    bg.addColorStop(0, '#FFF4E0');
    bg.addColorStop(1, '#FFDDB0');
    g.fillStyle = bg;
    g.fillRect(0, 0, 1080, 1350);
    g.save();
    g.shadowColor = 'rgba(91,42,12,.25)';
    g.shadowBlur = 30;
    g.shadowOffsetY = 10;
    rr(g, 66, 66, 948, 968, 44);
    g.fillStyle = '#fff';
    g.fill();
    g.restore();
    g.save();
    rr(g, 82, 82, 916, 936, 32);
    g.clip();
    cover(g, photo, 82, 82, 916, 936);
    g.restore();
    leafAt(g, 70, 70, 1.5, -20, '#E9973B');
    leafAt(g, 170, 40, 1.0, 25, '#D9622B');
    leafAt(g, 40, 180, 0.9, 50, '#F2C14E');
    leafAt(g, 1010, 990, 1.4, 15, '#D9622B');
    leafAt(g, 920, 1030, 0.9, -40, '#F2C14E');
    leafAt(g, 1040, 880, 0.8, 70, '#E9973B');
    if (lg) g.drawImage(lg, 72, 1082, 180, 180);
    fitText(g, name, 282, 1146, 740, 60, 700, FONT, '#0F2247');
    if (cls) fitText(g, cls, 282, 1204, 740, 42, 600, FONT, '#C2551E');
    fitText(g, TAGLINE, 282, 1262, 740, 34, 600, FONT, '#5B2A0C');
  } else if (frameId === 'polaroid') {
    g.fillStyle = '#EADBC8';
    g.fillRect(0, 0, 1080, 1350);
    g.strokeStyle = 'rgba(122,74,34,.08)';
    g.lineWidth = 3;
    for (let x = -1350; x < 1080; x += 34) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 1350, 1350);
      g.stroke();
    }
    g.save();
    g.translate(540, 675);
    g.rotate((-2 * Math.PI) / 180);
    g.translate(-540, -675);
    g.shadowColor = 'rgba(15,34,71,.28)';
    g.shadowBlur = 40;
    g.shadowOffsetY = 16;
    g.fillStyle = '#FFFFFF';
    g.fillRect(100, 80, 880, 1180);
    g.shadowColor = 'transparent';
    cover(g, photo, 140, 120, 800, 820);
    g.fillStyle = 'rgba(233,151,59,.72)';
    g.save();
    g.translate(540, 84);
    g.rotate((3 * Math.PI) / 180);
    g.fillRect(-120, -28, 240, 56);
    g.restore();
    fitText(g, 'Cảm ơn thầy cô!', 540, 1030, 760, 84, 700, '"Dancing Script", cursive', '#0F2247', 'center');
    fitText(g, cls ? `${name} · ${cls}` : name, 540, 1100, 640, 52, 400, '"Patrick Hand", cursive', '#1C3366', 'center');
    fitText(g, TAGLINE, 520, 1170, 560, 30, 600, FONT, '#5D6B85', 'center');
    if (lg) g.drawImage(lg, 836, 1100, 124, 124);
    g.restore();
  } else {
    // navy
    g.fillStyle = '#0F2247';
    g.fillRect(0, 0, 1080, 1350);
    star(g, 1030, 1110, 16, 6.5, '#E9973B');
    star(g, 990, 1300, 10, 4, '#F6C453');
    star(g, 30, 1310, 9, 3.6, '#F6C453');
    g.save();
    rr(g, 54, 54, 972, 1000, 30);
    g.clip();
    cover(g, photo, 54, 54, 972, 1000);
    g.restore();
    rr(g, 54, 54, 972, 1000, 30);
    g.lineWidth = 8;
    g.strokeStyle = '#E9973B';
    g.stroke();
    g.fillStyle = '#E9973B';
    rr(g, 760, 26, 240, 64, 32);
    g.fill();
    fitText(g, '20/11', 880, 72, 220, 40, 800, FONT, '#0F2247', 'center');
    if (lg) g.drawImage(lg, 60, 1092, 196, 196);
    fitText(g, name, 286, 1150, 740, 60, 700, FONT, '#FFFFFF');
    if (cls) fitText(g, cls, 286, 1206, 740, 42, 600, FONT, '#E9973B');
    fitText(g, TAGLINE, 286, 1264, 740, 34, 500, FONT, 'rgba(255,255,255,.85)');
  }
  return c;
}
