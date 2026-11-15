// Vườn Tri Ân: thông tin thầy cô + thiệp đã treo + nút "Viết thiệp".
import { h, clear } from '../dom.js';
import { icon } from '../icons.js';
import { LOGO } from '../screens.js';
import { createCardElement } from '../cardRender.js';
import { openCardMaker } from './cardMaker.js';

const MILESTONES = [
  { n: 10, text: 'cây ra hoa' },
  { n: 30, text: 'cây phát sáng' },
  { n: 50, text: 'bắn pháo hoa' },
];

export function teacherPhoto(t, size = 72) {
  const img = h('img', { class: 'ma-tphoto' + (t.photo ? '' : ' is-logo'), src: t.photo || LOGO, alt: t.photo ? `Ảnh ${t.title} ${t.name}` : 'Logo May Academy', width: size, height: size, loading: 'lazy' });
  img.onerror = () => {
    img.onerror = null;
    img.src = LOGO;
    img.classList.add('is-logo');
  };
  return img;
}

function milestone(n) {
  const next = MILESTONES.find((m) => n < m.n);
  const prev = [...MILESTONES].reverse().find((m) => n >= m.n);
  const base = prev ? prev.n : 0;
  const pct = next ? ((n - base) / (next.n - base)) * 100 : 100;
  const txt = next ? `Còn ${next.n - n} thiệp nữa ${next.text}` : 'Cây đã bắn pháo hoa! Cảm ơn cả trường';
  return h('div', { class: 'ma-mile' },
    h('div', { class: 'ma-mile-steps' }, MILESTONES.map((m) => h('span', { class: n >= m.n ? 'is-done' : '' }, `${m.n} · ${m.text}`))),
    h('div', { class: 'ma-progress is-light' }, h('div', { class: 'ma-progress-fill', style: { width: pct.toFixed(1) + '%' } })),
    h('div', { class: 'ma-mile-txt' }, txt),
  );
}

export default function treePanel(ctx, zone, sheet) {
  const id = zone.teacherId || String(zone.id || '').split(':')[1];
  const t = ctx.teacher(id);
  if (!t) {
    sheet.setContent(h('div', { class: 'ma-empty' }, 'Chưa tìm thấy thông tin thầy cô này, bạn thử lại sau nhé.'));
    return {};
  }
  let view = 'info';
  let countEl = null;
  let mileBox = null;
  const name = ctx.teacherName(t);

  function showInfo() {
    view = 'info';
    const cur = ctx.teacher(t.id) || t;
    sheet.setBack(null);
    sheet.setTitle(cur.tree, name, 'tree');
    countEl = h('b', null, ctx.fmtNum(cur.cardCount));
    mileBox = h('div', null, milestone(cur.cardCount || 0));
    const sub = [cur.dept, cur.role].filter(Boolean).join(' · ');
    const grid = h('div', { class: 'ma-cardgrid' });
    const head = h('div', { class: 'ma-teacher' },
      teacherPhoto(cur, 84),
      h('div', { class: 'ma-teacher-info' },
        h('div', { class: 'ma-teacher-name' }, name),
        sub ? h('div', { class: 'ma-teacher-sub' }, sub) : null,
        h('div', { class: 'ma-teacher-chips' },
          cur.special === 'daithu' ? h('span', { class: 'ma-tag is-orange' }, icon('sparkle'), 'Đại thụ') : null,
          h('span', { class: 'ma-tag is-green' }, icon('tree'), cur.tree),
          h('span', { class: 'ma-tag' }, icon('mail'), countEl, ' thiệp'),
        ),
      ),
    );
    const reply = cur.reply
      ? h('blockquote', { class: 'ma-reply' }, h('div', { class: 'ma-reply-h' }, icon('heart'), `Lời hồi âm của ${name}`), h('p', null, cur.reply))
      : null;
    sheet.setContent(
      head,
      mileBox,
      reply,
      ctx.submissionsOpen() ? null : ctx.closedNote(),
      h('div', { class: 'ma-sec-h' }, h('h3', null, 'Thiệp đã treo trên cây')),
      grid,
    );
    sheet.setFooter(
      h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg', disabled: !ctx.submissionsOpen(), onclick: showMaker }, icon('pen'), ctx.isTeacher ? 'Viết thiệp tặng đồng nghiệp' : 'Viết thiệp tặng ' + cur.title),
    );
    loadCards(grid);
  }

  async function loadCards(grid) {
    grid.replaceChildren(...Array.from({ length: 4 }, () => h('div', { class: 'ma-skel ma-skel-card' })));
    let cards;
    try {
      cards = await ctx.api.getCards(t.id);
    } catch (e) {
      if (view !== 'info') return;
      grid.replaceChildren(h('div', { class: 'ma-empty' }, e.message, h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-sm', onclick: () => loadCards(grid) }, icon('refresh'), 'Thử lại')));
      return;
    }
    if (view !== 'info') return;
    if (!Array.isArray(cards) || !cards.length) {
      grid.replaceChildren(h('div', { class: 'ma-empty' }, icon('mail'), h('p', null, 'Chưa có thiệp nào.')));
      return;
    }
    let shown = 0;
    const more = h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-block' }, 'Xem thêm thiệp');
    const addPage = () => {
      const slice = cards.slice(shown, shown + 24);
      shown += slice.length;
      for (const c of slice) {
        grid.insertBefore(
          h('button', { type: 'button', class: 'ma-cardthumb', 'aria-label': `Mở thiệp của ${c.anonymous || !c.from ? 'một bạn học sinh' : c.from}`, onclick: () => openCard(c) }, createCardElement(c, { mode: 'thumb', to: name })),
          more.isConnected ? more : null,
        );
      }
      if (shown >= cards.length) more.remove();
      else if (!more.isConnected) grid.append(more);
    };
    clear(grid);
    more.onclick = addPage;
    addPage();
  }

  function openCard(c) {
    const el = createCardElement(c, { mode: 'full', to: name });
    ctx.lightbox(h('div', { class: 'ma-lb-card' }, el), { label: 'Thiệp tri ân' });
  }

  function showMaker() {
    if (!ctx.submissionsOpen()) return;
    view = 'maker';
    openCardMaker(ctx, sheet, t, {
      onBack: showInfo,
      onSent: showInfo,
    });
  }

  showInfo();
  return {
    onState() {
      if (view !== 'info' || !countEl) return;
      const cur = ctx.teacher(t.id);
      if (!cur) return;
      countEl.textContent = ctx.fmtNum(cur.cardCount);
      mileBox.replaceChildren(milestone(cur.cardCount || 0));
    },
  };
}

treePanel.meta = (ctx, zone) => {
  const t = ctx.teacher(zone.teacherId || String(zone.id || '').split(':')[1]);
  return { title: t ? t.tree : 'Vườn Tri Ân', subtitle: t ? ctx.teacherName(t) : '', icon: 'tree' };
};
