// Chế độ thầy cô: Hòm thư đỏ – đọc "Lời chưa nói" gửi riêng mình. Không có ô gửi. (CONTRACT mục 6)
import { h, clear, store, withCls } from '../dom.js';
import { icon } from '../icons.js';
import { openPager } from './pager.js';

function dateVi(s) {
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
}
const sender = (m) => (m.anonymous || !m.from ? 'Một bạn học sinh' : withCls(m.from, m.cls));

export function letterView(m, toName) {
  return h('article', { class: 'ma-letter' },
    h('div', { class: 'ma-letter-stamp', 'aria-hidden': 'true' }, icon('heart')),
    h('div', { class: 'ma-letter-to' }, `Gửi ${toName},`),
    h('p', { class: 'ma-letter-msg' }, m.message),
    h('div', { class: 'ma-letter-from' }, '— ' + sender(m)),
    h('div', { class: 'ma-letter-date' }, dateVi(m.createdAt)),
  );
}

export default function teacherMailPanel(ctx, zone, sheet) {
  const token = ctx.token;
  const tid = ctx.profile.teacherId;
  const READ_KEY = 'ma_tread_' + tid;
  let me = ctx.teacherMe;
  let alive = true;
  const title = () => (me && me.teacher && me.teacher.title) || 'Thầy/Cô';
  const toName = () => (me && me.teacher ? `${me.teacher.title} ${me.teacher.name}` : ctx.profile.name);
  const listBox = h('div', { class: 'ma-mail-list' });

  ctx.markDone('secrets');

  // công tắc Sổ Tri Ân
  const sw = h('input', { type: 'checkbox', role: 'switch', checked: !!(me && me.includeSecretsInBook) });
  sw.addEventListener('change', async () => {
    const want = sw.checked;
    sw.disabled = true;
    try {
      await ctx.api.teacher.settings(token, { includeSecretsInBook: want });
      if (me) me.includeSecretsInBook = want;
      ctx.toast(want ? 'Đã bật: các lá thư sẽ được in kèm trong Sổ Tri Ân.' : 'Đã tắt: lá thư chỉ đọc ở đây, không in vào Sổ.', 'ok');
    } catch (e) {
      sw.checked = !want;
      ctx.error(e);
    } finally {
      sw.disabled = false;
    }
  });

  function drawList() {
    const list = (me && me.secrets) || [];
    const read = new Set(store.get(READ_KEY, []) || []);
    clear(listBox);
    if (!list.length) {
      listBox.append(h('div', { class: 'ma-empty is-big' }, icon('mail'), h('p', null, 'Hộp thư còn trống.')));
      return;
    }
    list.forEach((m, i) => {
      const unread = !read.has(m.id);
      listBox.append(
        h('button', { type: 'button', class: 'ma-env' + (unread ? ' is-new' : ''), onclick: () => openLetter(i) },
          h('span', { class: 'ma-env-flap', 'aria-hidden': 'true' }),
          h('span', { class: 'ma-env-seal', 'aria-hidden': 'true' }, icon('heart')),
          h('span', { class: 'ma-env-body' },
            h('b', null, 'Từ: ' + sender(m)),
            h('small', null, dateVi(m.createdAt)),
            h('span', { class: 'ma-env-peek' }, m.message),
          ),
          unread ? h('span', { class: 'ma-tag is-orange ma-env-new' }, 'Mới') : null,
        ),
      );
    });
  }

  function openLetter(i) {
    const list = (me && me.secrets) || [];
    openPager(ctx, list, i, (m) => letterView(m, toName()), {
      label: 'Lá thư',
      onShow: (m) => {
        const read = new Set(store.get(READ_KEY, []) || []);
        if (!read.has(m.id)) {
          read.add(m.id);
          store.set(READ_KEY, [...read]);
          drawList();
        }
      },
    });
  }

  sheet.setContent(
    h('div', { class: 'ma-private-tag' }, icon('lock'), 'Riêng tư'),
    h('label', { class: 'ma-switch' },
      h('span', null, h('b', null, 'Cho vào Sổ Tri Ân')),
      sw, h('i', { 'aria-hidden': 'true' }),
    ),
    h('div', { class: 'ma-sec-h' }, h('h3', null, 'Lời chưa nói gửi ' + title())),
    listBox,
  );
  sheet.setFooter();
  drawList();

  ctx.api.teacher.me(token).then((fresh) => {
    if (!alive) return;
    me = fresh;
    ctx.setTeacherMe(fresh);
    sw.checked = !!fresh.includeSecretsInBook;
    drawList();
  }).catch((e) => alive && ctx.error(e));

  return { onClose() { alive = false; } };
}

teacherMailPanel.meta = (ctx) => {
  const t = ctx.teacher(ctx.profile && ctx.profile.teacherId) || {};
  return { title: `Hộp thư của ${t.title || 'Thầy/Cô'}`, icon: 'mail' };
};
