// Góc Xin Vía: thanh nhỏ ở đáy màn hình, cảnh 3D (nhân vật quỳ vái) vẫn thấy rõ phía trên.
// Chọn môn → world.startPrayer() → thắp hương → vái 3 lần (mỗi lần playEffect('bow') ~1,6 s) → nhận vía.
// KHÔNG donate, không quẻ, không mõ. Đóng bảng → world.endPrayer().
import '../../styles/shrine.css';
import { h, store, pick, sleep } from '../dom.js';
import { icon } from '../icons.js';
import { viaLinesFor } from '../viaLines.js';

const KEY = 'ma_via';
const BOW_MS = 1650;
const DEFAULT_SUBJECTS = ['Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lí', 'Hoá học', 'Sinh học', 'Lịch sử', 'Địa lí', 'Tin học', 'KHTN', 'GDCD'];

export default function shrinePanel(ctx, zone, sheet) {
  const subjects = (Array.isArray(ctx.config.subjects) && ctx.config.subjects.length ? ctx.config.subjects : DEFAULT_SUBJECTS).filter(Boolean);
  let subject = null;
  let lit = false;
  let bows = 0;
  let busy = false;
  let alive = true;
  let praying = false;

  const footnote = () => h('p', { class: 'ma-via-note' }, 'Vía để vui, ôn bài mới là chính.');
  const mine = () => store.get(KEY, { total: 0, by: {} }) || { total: 0, by: {} };
  const world = () => ctx.world || null;

  async function startPrayer() {
    const w = world();
    if (!w || typeof w.startPrayer !== 'function') return;
    praying = true; // đặt trước khi chờ: đóng bảng giữa chừng vẫn gọi endPrayer
    try { await w.startPrayer(); } catch (e) { console.warn('[ui] startPrayer', e); }
  }
  function endPrayer() {
    const w = world();
    if (!praying || !w || typeof w.endPrayer !== 'function') return;
    praying = false;
    try { w.endPrayer(); } catch (e) { console.warn('[ui] endPrayer', e); }
  }

  function showPick() {
    lit = false;
    bows = 0;
    sheet.setTitle('Góc Xin Vía', '', 'shrine');
    const m = mine();
    const chips = h('div', { class: 'ma-via-chips', role: 'list' });
    chips.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      chips.scrollLeft += e.deltaY;
      e.preventDefault();
    }, { passive: false });
    for (const s of subjects) {
      const b = h('button', { type: 'button', class: 'ma-subject', role: 'listitem' }, s, m.by[s] ? h('small', null, String(m.by[s])) : null);
      b.addEventListener('click', async () => {
        if (busy) return;
        busy = true;
        chips.querySelectorAll('button').forEach((x) => (x.disabled = true));
        b.classList.add('is-on');
        subject = s;
        await startPrayer();
        busy = false;
        if (alive) showRitual();
      });
      chips.append(b);
    }
    sheet.setContent(h('div', { class: 'ma-via' }, chips, footnote()));
    sheet.setFooter();
  }

  function showRitual() {
    sheet.setTitle('Góc Xin Vía', '', 'shrine');
    const dots = h('div', { class: 'ma-bowdots', 'aria-label': `Đã vái ${bows}/3` }, [0, 1, 2].map((i) => h('i', { class: i < bows ? 'is-on' : '' })));
    const btn = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg' },
      icon(lit ? 'bow' : 'incense'), !lit ? 'Thắp hương' : bows < 3 ? `Vái (${bows + 1}/3)` : 'Nhận vía');

    btn.addEventListener('click', async () => {
      if (busy) return;
      if (!lit) {
        lit = true;
        ctx.effect('incense');
        showRitual();
        return;
      }
      busy = true;
      btn.disabled = true;
      if (bows < 3) {
        bows += 1;
        ctx.effect('bow');
        dots.querySelectorAll('i').forEach((d, i) => d.classList.toggle('is-on', i < bows));
        await sleep(BOW_MS);
        if (!alive) return;
        if (bows < 3) { busy = false; showRitual(); return; }
      }
      btn.classList.add('is-busy');
      try {
        const res = await ctx.api.postVia({ subject });
        if (!alive) return;
        const m = mine();
        m.total = (m.total || 0) + 1;
        m.by = m.by || {};
        m.by[subject] = (m.by[subject] || 0) + 1;
        store.set(KEY, m);
        ctx.refresh();
        busy = false;
        showResult(res || {});
      } catch (e) {
        busy = false;
        ctx.error(e);
        if (alive) showRitual();
      }
    });

    sheet.setContent(
      h('div', { class: 'ma-via' },
        h('div', { class: 'ma-via-row' }, h('div', { class: 'ma-via-sub' }, 'Môn ', h('b', null, subject)), lit ? dots : null),
        btn,
        footnote(),
      ),
    );
    sheet.setFooter();
  }

  function showResult(res) {
    const m = mine();
    const n = ctx.fmtNum;
    sheet.setTitle('Góc Xin Vía', '', 'shrine');
    sheet.setContent(
      h('div', { class: 'ma-via is-result' },
        h('div', { class: 'ma-via-got' }, icon('sparkle'), h('b', null, 'Đã nhận vía ', h('span', null, subject))),
        h('p', { class: 'ma-via-line' }, '“' + pick(viaLinesFor(subject)) + '”'),
        h('div', { class: 'ma-via-count' },
          h('span', null, 'Của bạn ', h('b', null, n(m.by[subject] || 0))),
          h('span', null, 'Cả trường ', h('b', null, n(res.subjectTotal))),
          h('span', null, 'Tổng ', h('b', null, n(res.total))),
        ),
        h('div', { class: 'ma-foot-2' },
          h('button', { type: 'button', class: 'ma-btn ma-btn-ghost', onclick: showPick }, 'Xin môn khác'),
          h('button', { type: 'button', class: 'ma-btn ma-btn-primary', onclick: () => ctx.close() }, 'Xong'),
        ),
        footnote(),
      ),
    );
    sheet.setFooter();
  }

  showPick();
  return {
    onClose() {
      alive = false;
      endPrayer();
    },
  };
}

shrinePanel.meta = () => ({ title: 'Góc Xin Vía', icon: 'shrine' });
