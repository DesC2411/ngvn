// Xem to từng mục, lật trái/phải (nút, phím mũi tên, vuốt ngang). Dùng cho thiệp & thư của thầy cô.
import { h } from '../dom.js';
import { icon } from '../icons.js';

/**
 * openPager(ctx, items, index, render(item, i) -> Node, { caption(item, i) -> Node|string, onShow(item, i), label })
 */
export function openPager(ctx, items, index, render, { caption, onShow, label = 'Xem lớn' } = {}) {
  let i = Math.max(0, Math.min(items.length - 1, index));
  const stage = h('div', { class: 'ma-pager-stage' });
  const cap = h('div', { class: 'ma-pager-cap' });
  const count = h('span', { class: 'ma-pager-count' });
  const prev = h('button', { type: 'button', class: 'ma-iconbtn ma-pager-btn', 'aria-label': 'Trước' }, icon('back'));
  const next = h('button', { type: 'button', class: 'ma-iconbtn ma-pager-btn is-next', 'aria-label': 'Sau' }, icon('back'));
  const box = h('div', { class: 'ma-pager' }, stage, h('div', { class: 'ma-pager-bar' }, prev, h('div', { class: 'ma-pager-mid' }, cap, count), next));

  const show = (dir = 0) => {
    const item = items[i];
    const node = render(item, i);
    node.classList.add('ma-pager-item');
    if (dir) node.classList.add(dir > 0 ? 'is-from-r' : 'is-from-l');
    stage.replaceChildren(node);
    cap.replaceChildren();
    const c = caption ? caption(item, i) : null;
    if (c) cap.append(c);
    count.textContent = `${i + 1} / ${items.length}`;
    prev.disabled = i === 0;
    next.disabled = i === items.length - 1;
    onShow && onShow(item, i);
  };
  const go = (d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    i = j;
    show(d);
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  const key = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  };
  window.addEventListener('keydown', key);

  let sx = null;
  stage.addEventListener('pointerdown', (e) => { if (e.isPrimary) sx = { x: e.clientX, y: e.clientY }; });
  stage.addEventListener('pointerup', (e) => {
    if (!sx) return;
    const dx = e.clientX - sx.x;
    const dy = e.clientY - sx.y;
    sx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => { sx = null; });

  show();
  return ctx.lightbox(box, { label, cls: 'is-pager', onClose: () => window.removeEventListener('keydown', key) });
}
