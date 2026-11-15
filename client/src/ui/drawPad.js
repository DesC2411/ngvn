// Bảng vẽ tay dùng chung (thiệp + chữ ký phấn). Pointer events → chạy cả chuột, bút, cảm ứng.
// Nền canvas luôn trong suốt; màu nền (giấy/bảng đen) do CSS phía sau quyết định.
// Toạ độ con trỏ đổi sang toạ độ canvas bằng getBoundingClientRect() ở MỖI sự kiện → đúng ở mọi cỡ màn hình,
// sau khi đổi kích thước cửa sổ hay đổi tab (canvas không bị dựng lại).

const patternCache = new Map();
function grainPattern(ctx, color, kind = 'phan') {
  const key = kind + color;
  if (patternCache.has(key)) return patternCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = color;
  let seed = kind === 'sap' ? 13 : 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const step = kind === 'sap' ? 3 : 2;
  for (let y = 0; y < 96; y += step) {
    for (let x = 0; x < 96; x += step) {
      const v = rnd();
      if (kind === 'sap') g.globalAlpha = v < 0.18 ? 0.05 : 0.75 + rnd() * 0.25;
      else g.globalAlpha = v < 0.12 ? 0.12 : 0.55 + rnd() * 0.45;
      g.fillRect(x, y, step, step);
    }
  }
  const p = ctx.createPattern(c, 'repeat');
  patternCache.set(key, p);
  return p;
}

/** Các loại bút. w = hệ số bề rộng, a = độ đậm. */
export const PEN_TOOLS = [
  { id: 'long', name: 'Bút lông', w: 1, a: 1 },
  { id: 'chi', name: 'Bút chì', w: 0.45, a: 0.85 },
  { id: 'sap', name: 'Bút sáp', w: 1.15, a: 1 },
  { id: 'phan', name: 'Phấn', w: 1, a: 1 },
  { id: 'daquang', name: 'Dạ quang', w: 2.2, a: 0.38 },
  { id: 'cauvong', name: 'Cầu vồng', w: 1, a: 1 },
];
const toolById = (id) => PEN_TOOLS.find((t) => t.id === id) || PEN_TOOLS[0];

export function createDrawPad({ width = 800, height = 1000, chalk = false, color = '#0F2247', size = 14, tool, onChange } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.className = 'ma-drawpad' + (chalk ? ' is-chalk' : '');
  canvas.style.touchAction = 'none';
  const ctx = canvas.getContext('2d');

  const base = document.createElement('canvas'); // các nét đã xong
  base.width = width;
  base.height = height;
  const bctx = base.getContext('2d');

  let strokes = [];
  let actions = []; // 'stroke' | { cleared: [...] }
  let redoStack = []; // { action, stroke? }
  let cur = null;
  const pen = { color, size, erase: false, tool: tool || (chalk ? 'phan' : 'long') };
  let enabled = true;
  let raf = 0;

  function path(g, p) {
    g.beginPath();
    g.moveTo(p[0].x, p[0].y);
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i].x + p[i + 1].x) / 2;
      const my = (p[i].y + p[i + 1].y) / 2;
      g.quadraticCurveTo(p[i].x, p[i].y, mx, my);
    }
    const last = p[p.length - 1];
    g.lineTo(last.x, last.y);
  }

  function paint(g, st) {
    const p = st.points;
    if (!p.length) return;
    const t = toolById(st.tool || (st.chalk ? 'phan' : 'long'));
    const w = st.erase ? st.size : Math.max(1.5, st.size * t.w);
    g.save();
    g.globalCompositeOperation = st.erase ? 'destination-out' : 'source-over';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = w;
    g.globalAlpha = st.erase ? 1 : t.a;
    if (!st.erase && t.id === 'cauvong') {
      // mỗi đoạn một màu theo vòng màu
      if (p.length === 1) {
        g.fillStyle = 'hsl(0 85% 58%)';
        g.beginPath();
        g.arc(p[0].x, p[0].y, w / 2, 0, Math.PI * 2);
        g.fill();
      }
      let dist = 0;
      for (let i = 1; i < p.length; i++) {
        dist += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
        g.strokeStyle = `hsl(${Math.round(dist / 3) % 360} 85% 58%)`;
        g.beginPath();
        g.moveTo(p[i - 1].x, p[i - 1].y);
        g.lineTo(p[i].x, p[i].y);
        g.stroke();
      }
      g.restore();
      return;
    }
    const style = st.erase ? '#000' : t.id === 'phan' || t.id === 'sap' ? grainPattern(g, st.color, t.id) : st.color;
    g.strokeStyle = style;
    g.fillStyle = style;
    if (p.length === 1) {
      g.beginPath();
      g.arc(p[0].x, p[0].y, w / 2, 0, Math.PI * 2);
      g.fill();
    } else {
      path(g, p);
      g.stroke();
      if (!st.erase && t.id === 'phan') {
        g.globalAlpha = 0.35; // viền mảnh nhạt cho cảm giác phấn
        g.lineWidth = w * 1.25;
        g.stroke();
      }
    }
    g.restore();
  }

  function rebuild() {
    bctx.clearRect(0, 0, width, height);
    for (const st of strokes) paint(bctx, st);
    show();
  }
  function show() {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(base, 0, 0);
    if (cur) paint(ctx, cur);
  }
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      show();
    });
  }
  const changed = () => onChange && onChange(api);

  function pt(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * width) / r.width, y: ((e.clientY - r.top) * height) / r.height };
  }
  canvas.addEventListener('pointerdown', (e) => {
    if (!enabled || !e.isPrimary || cur || e.button > 0) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
    cur = { color: pen.color, size: pen.size * (pen.erase ? 1.6 : 1), erase: pen.erase, tool: pen.tool, points: [pt(e)], id: e.pointerId };
    schedule();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!cur || e.pointerId !== cur.id) return;
    e.preventDefault();
    const evs = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [e];
    for (const ev of evs.length ? evs : [e]) {
      const p = pt(ev);
      const last = cur.points[cur.points.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) > 1.5) cur.points.push(p);
    }
    schedule();
  });
  const end = (e) => {
    if (!cur || e.pointerId !== cur.id) return;
    const st = cur;
    cur = null;
    delete st.id;
    strokes.push(st);
    actions.push('stroke');
    redoStack = [];
    paint(bctx, st);
    show();
    changed();
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('lostpointercapture', end);

  function bbox() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const st of strokes) {
      if (st.erase) continue;
      const w = st.size * toolById(st.tool || (st.chalk ? 'phan' : 'long')).w;
      for (const p of st.points) {
        x0 = Math.min(x0, p.x - w);
        y0 = Math.min(y0, p.y - w);
        x1 = Math.max(x1, p.x + w);
        y1 = Math.max(y1, p.y + w);
      }
    }
    if (!Number.isFinite(x0)) return null;
    const pad = 16;
    x0 = Math.max(0, Math.floor(x0 - pad));
    y0 = Math.max(0, Math.floor(y0 - pad));
    x1 = Math.min(width, Math.ceil(x1 + pad));
    y1 = Math.min(height, Math.ceil(y1 + pad));
    return { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  }

  const bytesOf = (url) => Math.ceil(((url.length - url.indexOf(',') - 1) * 3) / 4);

  const api = {
    canvas,
    setColor(c) { pen.color = c; pen.erase = false; },
    setSize(s) { pen.size = s; },
    setTool(t) { pen.tool = toolById(t).id; pen.erase = false; },
    setEraser(on) { pen.erase = !!on; },
    get pen() { return { ...pen }; },
    setEnabled(on) {
      enabled = !!on;
      canvas.style.pointerEvents = on ? 'auto' : 'none';
    },
    hasInk: () => strokes.some((s) => !s.erase),
    canUndo: () => actions.length > 0,
    canRedo: () => redoStack.length > 0,
    undo() {
      const a = actions.pop();
      if (!a) return;
      if (a === 'stroke') redoStack.push({ action: a, stroke: strokes.pop() });
      else {
        redoStack.push({ action: a, strokes });
        strokes = a.cleared;
      }
      rebuild();
      changed();
    },
    redo() {
      const r = redoStack.pop();
      if (!r) return;
      if (r.action === 'stroke') strokes.push(r.stroke);
      else strokes = [];
      actions.push(r.action);
      rebuild();
      changed();
    },
    clear() {
      if (!strokes.length) return;
      actions.push({ cleared: strokes });
      redoStack = [];
      strokes = [];
      rebuild();
      changed();
    },
    getStrokes: () => strokes.slice(),
    setStrokes(list) {
      strokes = (list || []).slice();
      actions = strokes.map(() => 'stroke');
      redoStack = [];
      rebuild();
    },
    /**
     * Xuất ảnh nền trong suốt. crop=true: cắt sát nét vẽ (chữ ký).
     * Thử WebP trước, trình duyệt không hỗ trợ thì PNG; tự thu nhỏ cho tới khi ≤ maxBytes.
     */
    toDataURL({ maxBytes = 600 * 1024, crop = false, maxW = width } = {}) {
      if (!api.hasInk()) return null;
      const box = crop ? bbox() : { x: 0, y: 0, w: width, h: height };
      if (!box) return null;
      let scale = Math.min(1, maxW / box.w);
      for (let i = 0; i < 8; i++) {
        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(box.w * scale));
        out.height = Math.max(1, Math.round(box.h * scale));
        out.getContext('2d').drawImage(base, box.x, box.y, box.w, box.h, 0, 0, out.width, out.height);
        for (const q of [0.86, 0.72]) {
          const url = out.toDataURL('image/webp', q);
          if (url.startsWith('data:image/webp') && bytesOf(url) <= maxBytes) return url;
        }
        const png = out.toDataURL('image/png');
        if (bytesOf(png) <= maxBytes) return png;
        scale *= 0.75;
      }
      return null;
    },
  };
  return api;
}

/** Bảng chọn bút gọn (dùng cho bảng đen ký tên): màu + 3 cỡ + tẩy + hoàn tác + xoá. */
export function createPenBar(pad, { colors, sizes, labels = ['Nhỏ', 'Vừa', 'To'], h, icon, chalk = false }) {
  const bar = h('div', { class: 'ma-penbar' + (chalk ? ' is-chalk' : '') });
  const colorRow = h('div', { class: 'ma-penbar-colors', role: 'radiogroup', 'aria-label': 'Màu bút' });
  const sizeRow = h('div', { class: 'ma-penbar-tools' });
  const sel = () => {
    const p = pad.pen;
    colorRow.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', !p.erase && b.dataset.c === p.color));
    sizeRow.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('is-on', +b.dataset.s === p.size));
    eraser.classList.toggle('is-on', p.erase);
    undo.disabled = !pad.canUndo();
  };
  for (const c of colors) {
    colorRow.append(
      h('button', {
        type: 'button', class: 'ma-color', style: { '--c': c }, dataset: { c }, 'aria-label': 'Màu ' + c,
        onclick: () => { pad.setColor(c); sel(); },
      }),
    );
  }
  sizes.forEach((s, i) => {
    sizeRow.append(
      h('button', {
        type: 'button', class: 'ma-size', dataset: { s }, title: 'Cỡ ' + labels[i], 'aria-label': 'Cỡ bút ' + labels[i],
        onclick: () => { pad.setSize(s); sel(); },
      }, h('i', { style: { width: 6 + i * 5 + 'px', height: 6 + i * 5 + 'px' } })),
    );
  });
  const eraser = h('button', { type: 'button', class: 'ma-tool', 'aria-label': 'Tẩy', title: 'Tẩy', onclick: () => { pad.setEraser(!pad.pen.erase); sel(); } }, icon('eraser'));
  const undo = h('button', { type: 'button', class: 'ma-tool', 'aria-label': 'Hoàn tác', title: 'Hoàn tác', onclick: () => { pad.undo(); sel(); } }, icon('undo'));
  const clr = h('button', { type: 'button', class: 'ma-tool', 'aria-label': 'Xoá hết', title: 'Xoá hết', onclick: () => { pad.clear(); sel(); } }, icon('trash'));
  sizeRow.append(h('span', { class: 'ma-penbar-sep' }), eraser, undo, clr);
  bar.append(colorRow, sizeRow);
  bar.refresh = sel;
  sel();
  return bar;
}
