// Cổng trường: lời chào + đếm ngược lớn + hướng dẫn nhanh.
import { h, pad2 } from '../dom.js';
import { icon } from '../icons.js';
import { LOGO } from '../screens.js';
import { ZONE_GUIDE } from '../zones.js';

export function guideList() {
  return h('ul', { class: 'ma-guide' },
    ZONE_GUIDE.filter((z) => z.kind !== 'gate').map((z) =>
      h('li', null, h('span', { class: 'ma-guide-ic' }, icon(z.icon)), h('div', null, h('b', null, z.name), h('small', null, z.where))),
    ),
  );
}

export default function gatePanel(ctx, zone, sheet) {
  const cells = ['ngày', 'giờ', 'phút', 'giây'].map((label) => {
    const v = h('b', null, '00');
    return { v, el: h('div', { class: 'ma-cd-cell' }, v, h('span', null, label)) };
  });
  const big = h('div', { class: 'ma-cd-big', role: 'timer' }, cells.map((c) => c.el));
  const doneMsg = h('div', { class: 'ma-cd-done', hidden: true }, 'Chúc mừng ngày Nhà giáo Việt Nam 20/11!');
  const date = new Date(ctx.config.eventDate || '2026-11-20T07:00:00+07:00');
  const dateTxt = Number.isFinite(date.getTime()) ? date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }) : '20/11/2026';
  const stop = ctx.onTick((c) => {
    big.hidden = c.done;
    doneMsg.hidden = !c.done;
    [c.d, c.h, c.m, c.s].forEach((x, i) => (cells[i].v.textContent = i === 0 ? String(x) : pad2(x)));
  });
  sheet.setContent(
    h('div', { class: 'ma-gate-hero' },
      h('img', { src: LOGO, alt: '', width: 72, height: 72 }),
      h('h3', null, 'Chào mừng bạn đến May Academy!'),
    ),
    h('div', { class: 'ma-cd-box' }, h('small', null, `Ngày Nhà giáo Việt Nam · ${dateTxt}`), big, doneMsg),
    h('div', { class: 'ma-sec-h' }, h('h3', null, 'Các điểm hoạt động')),
    guideList(),
  );
  sheet.setFooter(h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg', onclick: () => ctx.close() }, 'Bắt đầu khám phá'));
  return { onClose: stop };
}

gatePanel.meta = () => ({ title: 'Cổng May Academy', icon: 'gate' });
