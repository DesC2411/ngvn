// Trình làm thiệp gần toàn màn hình: mẫu & khung · lời chúc (kiểu chữ) · vẽ · sticker · chữ thêm · ký tên → xem trước → gửi.
import '../../styles/maker.css';
import { h, clear, len, counter, withCls } from '../dom.js';
import { icon } from '../icons.js';
import { createDrawPad, PEN_TOOLS } from '../drawPad.js';
import {
  TEMPLATES, STICKER_LIST, STICKER_GROUPS, FONTS, FRAMES, BGS,
  buildCardShell, createCardElement, stickerSVG, templateSVG, textElement,
} from '../cardRender.js';
import { frameSVG } from '../cardAssets.js';

const MAX_MSG = 600;
const MAX_STICKERS = 60;
const MAX_TEXTS = 8;
const MAX_TEXT_LEN = 80;
const COLORS = ['#0F2247', '#1F3B70', '#3B2A8C', '#E5484D', '#C2416E', '#F28DB2', '#E9973B', '#F6C453', '#3E9E5A', '#2F8F83', '#4A90E2', '#8E5BD0', '#6B4423', '#5D6B85', '#000000', '#FFFFFF'];
const PEN_SIZES = [5, 10, 18, 30];
const drafts = new Map(); // nháp theo thầy cô, giữ trong phiên

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round = (v, n) => +(+v).toFixed(n);

// hàm vẽ phụ chỉ dùng cho ô xem trước khung
const MINI_H = {
  rng: (seed) => { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); },
  starPath: (cx, cy, R, r, n = 5) => { let d = ''; for (let i = 0; i < n * 2; i++) { const rad = i % 2 ? r : R; const a = (Math.PI / n) * i - Math.PI / 2; d += `${i ? 'L' : 'M'}${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`; } return d + 'Z'; },
  daisy: (cx, cy, R, petal = '#fff', center = '#F2A93B', stroke = '#EAD7A4') => { let p = ''; for (let i = 0; i < 12; i++) p += `<ellipse cx="0" cy="${(-R * 0.52).toFixed(1)}" rx="${(R * 0.2).toFixed(1)}" ry="${(R * 0.46).toFixed(1)}" transform="rotate(${i * 30})"/>`; return `<g transform="translate(${cx} ${cy})"><g fill="${petal}" stroke="${stroke}">${p}</g><circle r="${(R * 0.26).toFixed(1)}" fill="${center}"/></g>`; },
  leaf: (x, y, s, r, fill) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-50 -50)"><path d="M50 4 C78 22 84 60 50 96 C16 60 22 22 50 4Z" fill="${fill}"/></g>`,
};

export function openCardMaker(ctx, sheet, teacher, { onBack, onSent }) {
  const profile = ctx.profile || { name: '', cls: '' };
  const toName = ctx.teacherName(teacher);
  const d = drafts.get(teacher.id) || {
    template: 'cuc', message: '', stickers: [], texts: [],
    style: { font: '', color: '', size: 'M', align: 'left', frame: '', bg: '' },
    from: profile.name || '', anonymous: false, strokes: [],
  };
  d.texts = d.texts || [];
  d.style = d.style || {};
  drafts.set(teacher.id, d);

  let tab = 'tpl';
  let sel = null; // { kind: 'st' | 'tx', obj }
  let stGroup = STICKER_GROUPS[0].id;
  let alive = true;

  // ------------------------------------------------ thiệp sống
  const shell = buildCardShell(d.template);
  shell.el.classList.add('mk-card');
  const pad = createDrawPad({ width: 800, height: 1000, color: '#0F2247', size: 10, onChange: () => { d.strokes = pad.getStrokes(); paintPenState(); } });
  pad.canvas.classList.add('mk-canvas');
  shell.drawLayer.append(pad.canvas);
  if (d.strokes.length) pad.setStrokes(d.strokes);

  const signPreview = () => (d.anonymous ? '— Một bạn học sinh' : `— ${withCls(d.from.trim() || profile.name || 'Bạn', profile.cls)}`);
  const paintText = () => {
    shell.setStyle(d.style);
    shell.setTo(toName);
    shell.setMessage(d.message, 'Lời chúc của bạn sẽ hiện ở đây…');
    shell.setSign(signPreview());
  };
  paintText();

  // ------------------------------------------------ sticker + chữ thêm: kéo / xoay / phóng
  function place(kind, obj, el) {
    el.style.left = obj.x * 100 + '%';
    el.style.top = obj.y * 100 + '%';
    if (kind === 'st') {
      el.style.width = 22 * obj.s + '%';
      el.style.transform = `translate(-50%,-50%) rotate(${obj.r}deg)`;
    } else {
      el.style.setProperty('--s', obj.s);
      el.style.setProperty('--r', obj.r + 'deg');
    }
  }
  function itemEl(kind, obj) {
    const el = kind === 'st' ? h('div', { class: 'ma-st-edit', html: stickerSVG(obj.id) }) : textElement(obj);
    if (kind === 'tx') el.classList.add('mk-tx');
    if (sel && sel.obj === obj) el.classList.add('is-sel');
    place(kind, obj, el);
    const del = h('button', { type: 'button', class: 'ma-st-del', 'aria-label': 'Xoá' }, icon('x'));
    const handle = h('span', { class: 'ma-st-handle', title: 'Kéo để xoay / phóng to', 'aria-hidden': 'true' }, icon('rotate'));
    el.append(del, handle);
    del.addEventListener('pointerdown', (e) => e.stopPropagation());
    del.addEventListener('click', (e) => { e.stopPropagation(); removeItem(kind, obj); });
    el.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || e.button > 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (!sel || sel.obj !== obj) select(kind, obj);
      const rect = shell.el.getBoundingClientRect();
      const start = { px: e.clientX, py: e.clientY, x: obj.x, y: obj.y };
      const rotating = !!e.target.closest('.ma-st-handle');
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const a0 = Math.atan2(e.clientY - cy, e.clientX - cx);
      const d0 = Math.max(8, Math.hypot(e.clientX - cx, e.clientY - cy));
      const r0 = obj.r;
      const s0 = obj.s;
      try { el.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
      const move = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        if (rotating) {
          const a = Math.atan2(ev.clientY - cy, ev.clientX - cx);
          obj.r = Math.round(r0 + ((a - a0) * 180) / Math.PI);
          obj.s = clamp(s0 * (Math.hypot(ev.clientX - cx, ev.clientY - cy) / d0), 0.4, kind === 'st' ? 3 : 4);
        } else {
          obj.x = clamp(start.x + (ev.clientX - start.px) / rect.width, 0, 1);
          obj.y = clamp(start.y + (ev.clientY - start.py) / rect.height, 0, 1);
        }
        place(kind, obj, el);
      };
      const up = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
    return el;
  }
  function renderItems() {
    shell.stickerLayer.replaceChildren(...d.stickers.map((o) => itemEl('st', o)));
    shell.textLayer.replaceChildren(...d.texts.map((o) => itemEl('tx', o)));
  }
  function select(kind, obj) {
    sel = obj ? { kind, obj } : null;
    renderItems();
    const want = kind === 'tx' ? 'text' : kind === 'st' ? 'sticker' : tab;
    if (obj && tab !== want) { tab = want; renderTab(); } else refreshSelTools();
  }
  function removeItem(kind, obj) {
    if (kind === 'st') d.stickers = d.stickers.filter((x) => x !== obj);
    else d.texts = d.texts.filter((x) => x !== obj);
    if (sel && sel.obj === obj) sel = null;
    renderItems();
    refreshSelTools();
  }
  shell.el.addEventListener('pointerdown', (e) => {
    if (tab === 'draw' || e.target.closest('.ma-st-edit, .mk-tx')) return;
    if (sel) select(null, null);
  });
  function addSticker(id) {
    if (d.stickers.length >= MAX_STICKERS) { ctx.toast(`Tối đa ${MAX_STICKERS} sticker.`); return; }
    const s = { id, x: clamp(0.5 + (Math.random() - 0.5) * 0.36, 0.1, 0.9), y: clamp(0.5 + (Math.random() - 0.5) * 0.36, 0.1, 0.9), s: 1, r: Math.round((Math.random() - 0.5) * 24) };
    d.stickers.push(s);
    select('st', s);
  }
  function addText(t) {
    t = String(t || '').trim().slice(0, MAX_TEXT_LEN);
    if (!t) return false;
    if (d.texts.length >= MAX_TEXTS) { ctx.toast(`Tối đa ${MAX_TEXTS} ô chữ.`); return false; }
    const o = { t, x: 0.5, y: clamp(0.6 + d.texts.length * 0.07, 0.1, 0.92), s: 1, r: 0, color: d.style.color || '', font: 'nghieng' };
    d.texts.push(o);
    select('tx', o);
    if (tab === 'text') renderTab(true);
    return true;
  }

  // ------------------------------------------------ công cụ dùng chung
  const swatchRow = (current, onPick, { withDefault = false, defaultColor = '' } = {}) => {
    const row = h('div', { class: 'mk-swatches', role: 'radiogroup' });
    if (withDefault) {
      row.append(h('button', { type: 'button', class: 'mk-sw is-def' + (!current ? ' is-on' : ''), title: 'Màu của mẫu', style: { '--c': defaultColor }, onclick: () => onPick('') }, h('span', null, 'A')));
    }
    for (const c of COLORS) {
      row.append(h('button', { type: 'button', class: 'mk-sw' + (current === c ? ' is-on' : ''), style: { '--c': c }, 'aria-label': 'Màu ' + c, onclick: () => onPick(c) }));
    }
    const custom = h('input', { type: 'color', value: current && /^#[0-9a-f]{6}$/i.test(current) ? current : '#E9973B', 'aria-label': 'Chọn màu khác' });
    custom.addEventListener('input', () => onPick(custom.value));
    const isCustom = current && !COLORS.includes(current);
    row.append(h('label', { class: 'mk-sw is-custom' + (isCustom ? ' is-on' : ''), title: 'Màu khác', style: isCustom ? { '--c': current } : null }, icon('plus'), custom));
    return row;
  };
  const fontRow = (current, onPick) =>
    h('div', { class: 'mk-chips' },
      FONTS.map((f) => h('button', { type: 'button', class: 'mk-chip' + (current === f.id ? ' is-on' : ''), style: { fontFamily: f.css }, onclick: () => onPick(f.id) }, f.name)));
  const section = (title, ...kids) => h('section', { class: 'mk-sec' }, h('h4', null, title), ...kids);

  // ------------------------------------------------ các thẻ
  const TABS = [
    ['tpl', 'Mẫu', 'palette'],
    ['msg', 'Lời chúc', 'text'],
    ['draw', 'Vẽ', 'pen'],
    ['sticker', 'Sticker', 'sticker'],
    ['text', 'Chữ thêm', 'type'],
    ['sign', 'Ký tên', 'sign'],
  ];
  const tabBar = h('div', { class: 'mk-tabs', role: 'tablist' });
  for (const [id, label, ic] of TABS) {
    tabBar.append(h('button', { type: 'button', role: 'tab', dataset: { t: id }, onclick: () => { tab = id; if (id === 'draw' && sel) { sel = null; renderItems(); } renderTab(); } }, icon(ic), h('span', null, label)));
  }
  const panel = h('div', { class: 'mk-panel', role: 'tabpanel' });
  let selTools = null;
  let penState = null;

  function setStyle(patch) {
    Object.assign(d.style, patch);
    shell.setStyle(d.style);
    renderTab(true);
  }

  function renderTab(keepScroll) {
    const st = panel.scrollTop;
    tabBar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.t === tab)));
    tabBar.querySelector(`[data-t="${tab}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    pad.setEnabled(tab === 'draw');
    const editItems = tab !== 'draw';
    shell.stickerLayer.classList.toggle('is-edit', editItems);
    shell.textLayer.classList.toggle('is-edit', editItems);
    shell.el.classList.toggle('is-drawing', tab === 'draw');
    selTools = null;
    penState = null;
    clear(panel);

    if (tab === 'tpl') {
      panel.append(
        section('Mẫu thiệp',
          h('div', { class: 'mk-tplgrid' },
            TEMPLATES.map((t) => h('button', {
              type: 'button', class: 'mk-tpl' + (t.id === d.template ? ' is-on' : ''),
              onclick: () => { d.template = t.id; shell.setTemplate(t.id); renderTab(true); },
            }, h('span', { class: 'mk-tpl-pic', html: templateSVG(t.id) }), h('b', null, t.name))))),
        section('Khung viền',
          h('div', { class: 'mk-framegrid' },
            FRAMES.map((f) => h('button', {
              type: 'button', class: 'mk-frame' + ((d.style.frame || '') === f.id ? ' is-on' : ''), title: f.name,
              onclick: () => setStyle({ frame: f.id }),
            }, h('span', { class: 'mk-frame-pic', html: f.id ? `<svg viewBox="0 0 400 500" preserveAspectRatio="none">${frameSVG(f.id, MINI_H, 'm' + f.id)}</svg>` : '' }), h('small', null, f.name))))),
        section('Nền chữ',
          h('div', { class: 'mk-bgrow' },
            BGS.map((b) => h('button', {
              type: 'button', class: 'mk-bg' + ((d.style.bg || '') === b.id ? ' is-on' : ''), style: { '--c': b.c }, title: b.name,
              onclick: () => setStyle({ bg: b.id }),
            }, b.id ? null : icon('x'), h('small', null, b.name))))),
      );
    } else if (tab === 'msg') {
      const ta = h('textarea', { class: 'ma-input ma-textarea mk-ta', rows: 5, maxlength: MAX_MSG, placeholder: `Viết lời chúc gửi ${toName}…`, value: d.message });
      ta.addEventListener('input', () => { d.message = ta.value; shell.setMessage(d.message, 'Lời chúc của bạn sẽ hiện ở đây…'); });
      panel.append(
        h('div', { class: 'ma-field mk-field' }, h('div', { class: 'ma-field-row' }, h('label', null, 'Lời chúc'), counter(ta, MAX_MSG)), ta),
        section('Kiểu chữ', fontRow(d.style.font || 'tay', (id) => setStyle({ font: id === 'tay' ? '' : id }))),
        section('Màu chữ', swatchRow(d.style.color || '', (c) => setStyle({ color: c }), { withDefault: true, defaultColor: 'var(--ink, #0F2247)' })),
        h('div', { class: 'mk-two' },
          section('Cỡ chữ', h('div', { class: 'ma-seg' }, [['S', 'Nhỏ'], ['M', 'Vừa'], ['L', 'To']].map(([v, l]) =>
            h('button', { type: 'button', role: 'radio', 'aria-checked': String((d.style.size || 'M') === v), onclick: () => setStyle({ size: v }) }, l)))),
          section('Căn lề', h('div', { class: 'ma-seg' }, [['left', 'alignL', 'Trái'], ['center', 'alignC', 'Giữa'], ['right', 'alignR', 'Phải']].map(([v, ic, l]) =>
            h('button', { type: 'button', role: 'radio', 'aria-label': 'Căn ' + l, 'aria-checked': String((d.style.align || 'left') === v), onclick: () => setStyle({ align: v }) }, icon(ic))))),
        ),
      );
    } else if (tab === 'draw') {
      penState = h('div');
      panel.append(penState);
      paintPenState();
    } else if (tab === 'sticker') {
      const grid = h('div', { class: 'mk-stgrid' },
        STICKER_LIST.filter((s) => s.group === stGroup).map((s) =>
          h('button', { type: 'button', class: 'mk-stpick', title: s.name, 'aria-label': 'Thêm sticker ' + s.name, html: stickerSVG(s.id), onclick: () => addSticker(s.id) })));
      selTools = h('div', { class: 'mk-seltools' });
      panel.append(
        h('div', { class: 'mk-chips is-scroll' }, STICKER_GROUPS.map((g) =>
          h('button', { type: 'button', class: 'mk-chip' + (g.id === stGroup ? ' is-on' : ''), onclick: () => { stGroup = g.id; renderTab(); } }, g.name))),
        grid,
        selTools,
      );
      refreshSelTools();
    } else if (tab === 'text') {
      const inp = h('input', { class: 'ma-input', maxlength: MAX_TEXT_LEN, placeholder: 'VD: Cảm ơn cô!' });
      const addBtn = h('button', { type: 'button', class: 'ma-btn ma-btn-primary', disabled: d.texts.length >= MAX_TEXTS }, icon('plus'), 'Thêm');
      const doAdd = () => { if (addText(inp.value)) inp.value = ''; };
      addBtn.addEventListener('click', doAdd);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doAdd(); } });
      selTools = h('div', { class: 'mk-seltools' });
      panel.append(
        h('div', { class: 'mk-addtext' }, inp, addBtn),
        h('div', { class: 'mk-count' }, `${d.texts.length}/${MAX_TEXTS}`),
        selTools,
      );
      refreshSelTools();
    } else if (tab === 'sign') {
      const inp = h('input', { class: 'ma-input', maxlength: 40, value: d.from, placeholder: 'Tên của bạn', disabled: d.anonymous });
      inp.addEventListener('input', () => { d.from = inp.value; shell.setSign(signPreview()); });
      const anon = h('input', { type: 'checkbox', checked: d.anonymous });
      anon.addEventListener('change', () => { d.anonymous = anon.checked; inp.disabled = d.anonymous; shell.setSign(signPreview()); });
      panel.append(
        h('div', { class: 'ma-field mk-field' }, h('label', null, 'Ký tên'), inp),
        h('label', { class: 'ma-check' }, anon, h('span', null, h('b', null, 'Gửi ẩn danh'))),
      );
    }
    if (keepScroll) panel.scrollTop = st;
    else panel.scrollTop = 0;
  }

  function paintPenState() {
    if (!penState || !alive) return;
    const p = pad.pen;
    clear(penState).append(
      section('Loại bút', h('div', { class: 'mk-chips' }, PEN_TOOLS.map((t) =>
        h('button', { type: 'button', class: 'mk-chip mk-pen-' + t.id + (!p.erase && p.tool === t.id ? ' is-on' : ''), onclick: () => { pad.setTool(t.id); paintPenState(); } }, t.name)))),
      section('Màu bút', swatchRow(p.tool === 'cauvong' ? '' : p.color, (c) => { pad.setColor(c); if (pad.pen.tool === 'cauvong') pad.setTool('long'); paintPenState(); })),
      h('div', { class: 'mk-pentools' },
        h('div', { class: 'mk-sizes' }, PEN_SIZES.map((s, i) =>
          h('button', { type: 'button', class: 'ma-size' + (p.size === s ? ' is-on' : ''), 'aria-label': 'Cỡ ' + (i + 1), onclick: () => { pad.setSize(s); paintPenState(); } },
            h('i', { style: { width: 4 + i * 5 + 'px', height: 4 + i * 5 + 'px', background: p.tool === 'cauvong' ? 'linear-gradient(90deg,#E5484D,#F6C453,#4CAF7A,#4A90E2)' : p.color } })))),
        h('span', { class: 'ma-penbar-sep' }),
        h('button', { type: 'button', class: 'ma-tool' + (p.erase ? ' is-on' : ''), title: 'Tẩy', 'aria-label': 'Tẩy', onclick: () => { pad.setEraser(!pad.pen.erase); paintPenState(); } }, icon('eraser')),
        h('button', { type: 'button', class: 'ma-tool', title: 'Hoàn tác', 'aria-label': 'Hoàn tác', disabled: !pad.canUndo(), onclick: () => pad.undo() }, icon('undo')),
        h('button', { type: 'button', class: 'ma-tool', title: 'Làm lại', 'aria-label': 'Làm lại', disabled: !pad.canRedo(), onclick: () => pad.redo() }, icon('redo')),
        h('button', { type: 'button', class: 'ma-tool', title: 'Xoá hết', 'aria-label': 'Xoá hết nét vẽ', disabled: !pad.hasInk(), onclick: () => pad.clear() }, icon('trash')),
      ),
    );
  }

  function refreshSelTools() {
    if (!selTools) return;
    clear(selTools);
    if (!sel) return;
    const { kind, obj } = sel;
    const upd = () => { renderItems(); refreshSelTools(); };
    const btn = (ic, label, fn, cls = '') => h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-sm ' + cls, onclick: fn }, icon(ic), label);
    if (kind === 'tx') {
      const edit = h('input', { class: 'ma-input', maxlength: MAX_TEXT_LEN, value: obj.t });
      edit.addEventListener('input', () => {
        obj.t = edit.value.slice(0, MAX_TEXT_LEN);
        const el = shell.textLayer.querySelector('.mk-tx.is-sel');
        if (el && el.firstChild && el.firstChild.nodeType === 3) el.firstChild.nodeValue = obj.t;
      });
      edit.addEventListener('change', () => { if (!obj.t.trim()) removeItem('tx', obj); });
      selTools.append(
        h('div', { class: 'mk-seltitle' }, 'Ô chữ đang chọn'),
        edit,
        fontRow(obj.font || 'tay', (id) => { obj.font = id; upd(); }),
        swatchRow(obj.color || '', (c) => { obj.color = c; upd(); }, { withDefault: true, defaultColor: 'var(--ink, #0F2247)' }),
      );
    } else {
      selTools.append(h('div', { class: 'mk-seltitle' }, 'Sticker đang chọn'));
    }
    const list = kind === 'st' ? d.stickers : d.texts;
    const i = list.indexOf(obj);
    selTools.append(
      h('div', { class: 'mk-btnrow' },
        btn('minus', 'Nhỏ', () => { obj.s = clamp(obj.s / 1.15, 0.4, kind === 'st' ? 3 : 4); upd(); }),
        btn('plus', 'To', () => { obj.s = clamp(obj.s * 1.15, 0.4, kind === 'st' ? 3 : 4); upd(); }),
        btn('rotate', 'Xoay', () => { obj.r = (obj.r + 15) % 360; upd(); }),
        btn('up', 'Lên trên', () => { if (i < list.length - 1) { list.splice(i, 1); list.splice(i + 1, 0, obj); upd(); } }),
        btn('down', 'Xuống dưới', () => { if (i > 0) { list.splice(i, 1); list.splice(i - 1, 0, obj); upd(); } }),
        btn('trash', 'Xoá', () => removeItem(kind, obj), 'is-danger'),
      ),
    );
  }

  // ------------------------------------------------ màn chỉnh sửa
  function showEditor() {
    sheet.setFull(true);
    sheet.setTitle('Viết thiệp', 'Gửi ' + toName, null);
    sheet.setBack(() => { leave(); onBack(); });
    sheet.setContent(h('div', { class: 'mk' }, h('div', { class: 'mk-stage' }, shell.el), h('div', { class: 'mk-tools' }, tabBar, panel)));
    sheet.setFooter(h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg', onclick: goPreview }, icon('eye'), 'Xem trước'));
    renderTab();
    renderItems();
    shell.refit();
  }
  function leave() {
    d.strokes = pad.getStrokes();
    sheet.setFull(false);
  }

  function cardData(drawingUrl) {
    const style = {};
    for (const k of ['font', 'color', 'size', 'align', 'frame', 'bg']) if (d.style[k]) style[k] = String(d.style[k]).slice(0, 40);
    return {
      template: d.template,
      message: d.message.trim(),
      from: d.anonymous ? 'Một bạn học sinh' : d.from.trim() || profile.name,
      cls: d.anonymous ? '' : profile.cls,
      anonymous: d.anonymous,
      drawingUrl,
      style,
      stickers: d.stickers.slice(0, MAX_STICKERS).map(({ id, x, y, s, r }) => ({ id, x: round(x, 4), y: round(y, 4), s: round(s, 3), r: Math.round(r) })),
      texts: d.texts.filter((t) => t.t && t.t.trim()).slice(0, MAX_TEXTS).map(({ t, x, y, s, r, color, font }) => ({ t: t.trim().slice(0, MAX_TEXT_LEN), x: round(x, 4), y: round(y, 4), s: round(s, 3), r: Math.round(r), color: color || '', font: font || '' })),
    };
  }

  function goPreview() {
    const msg = d.message.trim();
    if (!msg) {
      ctx.toast('Bạn viết vài dòng lời chúc trước nhé.', 'error');
      tab = 'msg';
      renderTab();
      return;
    }
    if (len(msg) > MAX_MSG) { ctx.toast(`Lời chúc tối đa ${MAX_MSG} ký tự.`, 'error'); return; }
    if (!d.anonymous && !(d.from.trim() || profile.name)) {
      ctx.toast('Bạn ký tên hoặc chọn gửi ẩn danh nhé.', 'error');
      tab = 'sign';
      renderTab();
      return;
    }
    d.strokes = pad.getStrokes();
    let drawing = null;
    if (pad.hasInk()) {
      drawing = pad.toDataURL({ maxBytes: 590 * 1024, maxW: 800 });
      if (!drawing) { ctx.toast('Hình vẽ nặng quá, bạn bớt vài nét nhé.', 'error'); return; }
    }
    const data = cardData(drawing);
    const preview = createCardElement(data, { mode: 'full', to: toName });
    sheet.setTitle('Xem trước thiệp', 'Gửi ' + toName, null);
    sheet.setBack(showEditor);
    sheet.setContent(h('div', { class: 'mk-preview' }, preview));
    const sendBtn = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-lg' }, icon('mail'), 'Gửi thiệp');
    sheet.setFooter(h('div', { class: 'ma-foot-2' }, h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-lg', onclick: showEditor }, 'Sửa tiếp'), sendBtn));
    sendBtn.addEventListener('click', async () => {
      sendBtn.disabled = true;
      sendBtn.classList.add('is-busy');
      const body = {
        teacherId: teacher.id,
        from: d.from.trim() || profile.name,
        cls: profile.cls,
        anonymous: d.anonymous,
        message: msg,
        template: d.template,
        stickers: data.stickers,
        texts: data.texts,
        style: data.style,
      };
      if (drawing) body.drawing = drawing;
      try {
        const res = await ctx.api.postCard(body);
        drafts.delete(teacher.id);
        alive = false;
        sheet.setFull(false);
        ctx.sent(res, 'card', { teacherId: teacher.id }, 'Đã gửi! Thiệp đã được treo lên cây.');
        onSent();
      } catch (e) {
        ctx.error(e);
        sendBtn.disabled = false;
        sendBtn.classList.remove('is-busy');
      }
    });
  }

  showEditor();
}

