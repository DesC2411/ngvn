// Bảng "Lớp tri ân nhiều nhất".
import { h, clear, appendAll } from '../dom.js';
import { icon } from '../icons.js';

const sameCls = (a, b) => String(a || '').replace(/\s+/g, '').toUpperCase() === String(b || '').replace(/\s+/g, '').toUpperCase();

export default function leaderboardPanel(ctx, zone, sheet) {
  const profile = ctx.profile || {};
  const box = h('div');
  let stats = ctx.stats || {};
  let alive = true;

  function render() {
    const n = ctx.fmtNum;
    const rows = Array.isArray(stats.leaderboard) ? stats.leaderboard : [];
    const mine = ctx.isTeacher ? -1 : rows.findIndex((r) => sameCls(r.cls, profile.cls));
    appendAll(clear(box), [
      h('div', { class: 'ma-tiles' },
        [['mail', 'Thiệp', stats.cards], ['crane', 'Hạc giấy', stats.cranes], ['sign', 'Chữ ký', stats.signatures], ['shrine', 'Lượt vía', stats.via]].map(([ic, label, v]) =>
          h('div', { class: 'ma-tile' }, icon(ic), h('b', null, n(v)), h('span', null, label)),
        ),
      ),
      h('div', { class: 'ma-sec-h' }, h('h3', null, 'Top 10 lớp')),
      rows.length
        ? h('ol', { class: 'ma-board' },
          rows.map((r, i) =>
            h('li', { class: `ma-rank${i < 3 ? ' is-top is-top' + (i + 1) : ''}${i === mine ? ' is-mine' : ''}` },
              h('span', { class: 'ma-rank-n' }, String(i + 1)),
              h('div', { class: 'ma-rank-main' },
                h('b', null, 'Lớp ' + r.cls, i === mine ? h('span', { class: 'ma-tag is-orange' }, 'Lớp bạn') : null),
                h('small', null, `${n(r.cards)} thiệp · ${n(r.cranes)} hạc · ${n(r.signatures)} chữ ký`),
              ),
              h('span', { class: 'ma-rank-score' }, n(r.score)),
            ),
          ),
        )
        : h('div', { class: 'ma-empty' }, 'Chưa có lớp nào trên bảng. Lớp bạn có muốn dẫn đầu không?'),
    ]);
  }

  sheet.setContent(box);
  render();
  ctx.api.getStats().then((s) => {
    if (!alive || !s) return;
    stats = s;
    render();
  }).catch(() => { /* dùng số liệu sẵn có */ });

  return {
    onState(state) {
      if (state && state.stats) {
        stats = state.stats;
        render();
      }
    },
    onClose() { alive = false; },
  };
}

leaderboardPanel.meta = () => ({ title: 'Lớp tri ân nhiều nhất', icon: 'trophy' });
