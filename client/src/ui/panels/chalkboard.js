// Bảng đen ký tên tập thể: ký bằng phấn (vẽ tay) hoặc chỉ dùng tên.
import { h, clear, len, isGV } from '../dom.js';
import { icon } from '../icons.js';
import { createDrawPad, createPenBar } from '../drawPad.js';

const CHALK = ['#F6F3EA', '#F7D774', '#F4A6C0', '#9FD8F0', '#F2B66B', '#B8E6B0'];
const SIZES = [6, 11, 18];

export function boardView(signatures = []) {
  const grid = h('div', { class: 'ma-board-grid' });
  for (const s of signatures) {
    const cap = `${s.name || ''}${s.cls ? ' · ' + s.cls : ''}`;
    if (s.drawingUrl) {
      const img = h('img', { src: s.drawingUrl, alt: 'Chữ ký của ' + cap, loading: 'lazy' });
      const item = h('figure', { class: 'ma-sig is-img' }, img, h('figcaption', null, cap));
      img.onerror = () => item.replaceWith(h('figure', { class: 'ma-sig is-text' }, h('span', null, s.name), h('figcaption', null, s.cls || '')));
      grid.append(item);
    } else {
      grid.append(h('figure', { class: 'ma-sig is-text' }, h('span', null, s.name), h('figcaption', null, s.cls || '')));
    }
  }
  return h('div', { class: 'ma-board-big' },
    h('div', { class: 'ma-board-big-h' }, `Bảng đen May Academy · ${signatures.length.toLocaleString('vi-VN')} chữ ký`),
    signatures.length ? grid : h('div', { class: 'ma-board-empty' }, 'Bảng còn trống, bạn ký đầu tiên nhé!'),
  );
}

export default function chalkPanel(ctx, zone, sheet) {
  const profile = ctx.profile || {};
  let mode = 'hand';
  const pad = createDrawPad({ width: 900, height: 360, chalk: true, color: CHALK[0], size: SIZES[1], onChange: () => penBar.refresh() });
  const penBar = createPenBar(pad, { colors: CHALK, sizes: SIZES, h, icon, chalk: true });
  const nameIn = h('input', { class: 'ma-input', maxlength: 40, value: profile.name || '', placeholder: 'Tên của bạn' });
  const namePreview = h('div', { class: 'ma-chalk-name' });
  const board = h('div', { class: 'ma-chalkboard' });
  const tools = h('div');
  const seg = h('div', { class: 'ma-seg', role: 'radiogroup', 'aria-label': 'Cách ký' });
  const viewBtn = h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-block', onclick: openBoard }, icon('eye'));
  const sendBtn = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg', disabled: !ctx.submissionsOpen() }, icon('sign'), 'Ký lên bảng');

  const paintName = () => {
    namePreview.textContent = nameIn.value.trim() || profile.name || 'Tên của bạn';
  };
  nameIn.addEventListener('input', paintName);

  function render() {
    seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.m === mode)));
    clear(board);
    clear(tools);
    if (mode === 'hand') {
      board.append(pad.canvas);
      tools.append(penBar);
      penBar.refresh();
    } else {
      paintName();
      board.append(namePreview);
    }
  }
  for (const [m, label] of [['hand', 'Ký bằng tay'], ['name', 'Chỉ dùng tên']]) {
    seg.append(h('button', { type: 'button', role: 'radio', dataset: { m }, onclick: () => { mode = m; render(); } }, label));
  }

  function paintCount() {
    const shown = (ctx.state && ctx.state.signatures && ctx.state.signatures.length) || 0;
    const n = Math.max(shown, (ctx.stats && ctx.stats.signatures) || 0);
    clear(viewBtn).append(icon('eye'), `Xem cả tấm bảng (${ctx.fmtNum(n)} chữ ký)`);
  }

  function openBoard() {
    ctx.lightbox(boardView((ctx.state && ctx.state.signatures) || []), { cls: 'is-board', label: 'Tấm bảng chữ ký' });
  }

  sendBtn.addEventListener('click', async () => {
    const name = nameIn.value.trim() || profile.name || '';
    if (!name) { ctx.toast('Bạn ghi tên mình nhé.', 'error'); nameIn.focus(); return; }
    if (len(name) > 40) { ctx.toast('Tên tối đa 40 ký tự.', 'error'); return; }
    const body = { name, cls: profile.cls || '' };
    if (mode === 'hand') {
      if (!pad.hasInk()) { ctx.toast('Bạn ký vài nét phấn lên bảng trước nhé (hoặc chọn "Chỉ dùng tên").', 'error'); return; }
      const drawing = pad.toDataURL({ crop: true, maxW: 600, maxBytes: 590 * 1024 });
      if (!drawing) { ctx.toast('Chữ ký nặng quá, bạn ký gọn lại nhé.', 'error'); return; }
      body.drawing = drawing;
    }
    sendBtn.disabled = true;
    sendBtn.classList.add('is-busy');
    try {
      const res = await ctx.api.postSignature(body);
      ctx.sent(res, 'signature', { name, cls: body.cls }, 'Đã gửi! Chữ ký của bạn đã lên bảng.');
      pad.clear();
      pad.setStrokes([]);
    } catch (e) {
      ctx.error(e);
    } finally {
      sendBtn.disabled = !ctx.submissionsOpen();
      sendBtn.classList.remove('is-busy');
    }
  });

  sheet.setContent(
    ctx.submissionsOpen() ? null : ctx.closedNote(),
    seg,
    h('div', { class: 'ma-chalkframe' }, board, h('div', { class: 'ma-chalktray' })),
    tools,
    h('div', { class: 'ma-field' }, h('label', null, 'Tên'), nameIn),
    viewBtn,
  );
  sheet.setFooter(sendBtn);
  render();
  paintCount();
  return { onState: paintCount };
}

chalkPanel.meta = () => ({ title: 'Bảng đen ký tên', icon: 'board' });
