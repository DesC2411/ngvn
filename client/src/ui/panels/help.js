// Trợ giúp: điều khiển + bản đồ nhỏ + đổi người.
import { h, store, isTouch } from '../dom.js';
import { icon } from '../icons.js';
import { ZONE_GUIDE, miniMapSVG } from '../zones.js';
import { PROFILE_KEY } from '../screens.js';

export default function helpPanel(ctx, zone, sheet) {
  const touch = isTouch();
  const pc = h('div', { class: 'ma-ctrl' + (touch ? '' : ' is-cur') },
    h('h4', null, 'Máy tính'),
    h('ul', null,
      h('li', null, h('kbd', null, 'W A S D'), ' hoặc ', h('kbd', null, '↑ ← ↓ →'), ' để đi'),
      h('li', null, 'Giữ ', h('kbd', null, 'Shift'), ' để chạy'),
      h('li', null, 'Kéo chuột để xoay camera'),
      h('li', null, 'Nhấn ', h('kbd', null, 'E'), ' khi đứng gần điểm hoạt động'),
      h('li', null, h('kbd', null, 'Esc'), ' để đóng bảng'),
    ),
  );
  const phone = h('div', { class: 'ma-ctrl' + (touch ? ' is-cur' : '') },
    h('h4', null, 'Điện thoại'),
    h('ul', null,
      h('li', null, 'Kéo cần điều khiển ở góc trái để đi'),
      h('li', null, 'Vuốt màn hình để xoay camera'),
      h('li', null, 'Đến gần điểm sáng rồi bấm nút ', h('b', null, 'Tương tác')),
      h('li', null, 'Vuốt bảng xuống hoặc bấm ', h('b', null, 'X'), ' để đóng'),
    ),
  );
  let confirmSwap = false;
  const swap = h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-block' }, icon('user'), 'Đổi người (vào lại từ đầu)');
  swap.addEventListener('click', () => {
    if (!confirmSwap) {
      confirmSwap = true;
      swap.lastChild.textContent = 'Bấm lần nữa để đổi người';
      swap.classList.add('is-danger');
      return;
    }
    store.del(PROFILE_KEY);
    location.reload();
  });
  const p = ctx.profile;
  sheet.setContent(
    h('div', { class: 'ma-sec-h' }, h('h3', null, 'Cách điều khiển')),
    h('div', { class: 'ma-ctrls' }, touch ? [phone, pc] : [pc, phone]),
    h('div', { class: 'ma-sec-h' }, h('h3', null, 'Bản đồ nhỏ')),
    h('div', { class: 'ma-mapbox', html: miniMapSVG() }),
    h('ol', { class: 'ma-legend' }, ZONE_GUIDE.map((z) => h('li', null, h('b', null, z.name), h('small', null, ' · ' + z.where)))),
    ctx.isTeacher ? null : swap,
  );
  sheet.setFooter();
  return {};
}

helpPanel.meta = () => ({ title: 'Hướng dẫn', icon: 'help' });
