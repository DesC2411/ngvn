// Chế độ thầy cô: cây của chính mình – thiệp đã nhận, hồi âm, soạn câu đố. (CONTRACT mục 6)
import { h, clear, len, counter, withCls } from '../dom.js';
import { icon } from '../icons.js';
import { createCardElement } from '../cardRender.js';
import { teacherPhoto } from './tree.js';
import { openPager } from './pager.js';

const MAX_REPLY = 300;
const MAX_Q = 3;

function dateVi(s) {
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
}

export default function teacherTreePanel(ctx, zone, sheet) {
  const token = ctx.token;
  let me = ctx.teacherMe;
  let view = 'main';
  let alive = true;
  let replyDraft = null;
  const media = (u) => ctx.api.teacher.mediaUrl(token, u);
  const t = () => (me && me.teacher) || ctx.teacher(ctx.profile.teacherId) || {};
  const self = () => `${t().title || ''}`.trim() || 'Thầy/Cô';

  ctx.markDone('cards');

  function showMain() {
    view = 'main';
    const tc = t();
    sheet.setBack(null);
    sheet.setTitle(`${tc.tree || 'Cây'} của ${self()}`, '', 'tree');
    const cards = (me && me.cards) || [];

    const grid = h('div', { class: 'ma-cardgrid' });
    if (!cards.length) {
      grid.append(h('div', { class: 'ma-empty' }, icon('mail'), h('p', null, 'Chưa có thiệp nào.')));
    }
    cards.forEach((c, i) => {
      grid.append(
        h('button', { type: 'button', class: 'ma-cardthumb has-cap', 'aria-label': `Mở thiệp của ${c.from}`, onclick: () => openCards(i) },
          createCardElement(c, { mode: 'thumb', mediaUrl: media }),
          h('span', { class: 'ma-cardcap' }, h('b', null, c.from || 'Một bạn học sinh'), h('small', null, [c.anonymous ? 'Ẩn danh' : c.cls, dateVi(c.createdAt)].filter(Boolean).join(' · '))),
        ),
      );
    });

    // Hồi âm
    const ta = h('textarea', { class: 'ma-input ma-textarea', rows: 4, maxlength: MAX_REPLY, placeholder: `Một lời nhắn chung ${self()} gửi lại các con…`, value: replyDraft != null ? replyDraft : (me && me.reply) || '' });
    ta.addEventListener('input', () => { replyDraft = ta.value; });
    const saveBtn = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block' }, icon('heart'), 'Lưu lời hồi âm');
    saveBtn.addEventListener('click', async () => {
      const text = ta.value.trim();
      if (len(text) > MAX_REPLY) { ctx.toast(`Lời hồi âm tối đa ${MAX_REPLY} ký tự.`, 'error'); return; }
      saveBtn.disabled = true;
      saveBtn.classList.add('is-busy');
      try {
        await ctx.api.teacher.reply(token, text);
        if (me) me.reply = text || null;
        replyDraft = null;
        ctx.setTeacherMe(me);
        if (text) ctx.markDone('reply');
        ctx.toast(text ? 'Đã lưu! Lời hồi âm sẽ hiện trên biển cây sau ít giây.' : 'Đã xoá lời hồi âm.', 'ok');
        ctx.refresh();
      } catch (e) {
        ctx.error(e);
      } finally {
        saveBtn.disabled = false;
        saveBtn.classList.remove('is-busy');
      }
    });

    const quiz = (me && me.quiz) || [];
    sheet.setContent(
      h('div', { class: 'ma-teacher' },
        teacherPhoto(tc, 84),
        h('div', { class: 'ma-teacher-info' },
          h('div', { class: 'ma-teacher-name' }, `${tc.title || ''} ${tc.name || ''}`.trim()),
          h('div', { class: 'ma-teacher-chips' },
            h('span', { class: 'ma-tag is-green' }, icon('tree'), tc.tree || ''),
            h('span', { class: 'ma-tag is-orange' }, icon('mail'), `${ctx.fmtNum(cards.length)} thiệp`),
          ),
        ),
      ),
      h('div', { class: 'ma-sec-h' }, h('h3', null, `Thiệp đã nhận (${cards.length})`)),
      grid,
      h('section', { class: 'ma-tsec', id: 'ma-reply' },
        h('div', { class: 'ma-sec-h' }, h('h3', null, 'Hồi âm các con'), counter(ta, MAX_REPLY)),
        ta,
        h('div', { style: { marginTop: '10px' } }, saveBtn),
      ),
      h('section', { class: 'ma-tsec' },
        h('div', { class: 'ma-sec-h' }, h('h3', null, 'Câu đố về ' + self()), h('span', { class: 'ma-tag' + (quiz.length ? ' is-green' : '') }, quiz.length ? `${quiz.length} câu` : 'Tuỳ chọn')),
        h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-block', onclick: showQuiz }, icon('pen'), quiz.length ? 'Sửa câu đố' : 'Soạn câu đố'),
      ),
    );
    sheet.setFooter();
    if (zone.focus === 'reply') requestAnimationFrame(() => document.getElementById('ma-reply')?.scrollIntoView({ block: 'start' }));
    if (zone.focus === 'quiz') { zone.focus = null; showQuiz(); }
  }

  function openCards(i) {
    const cards = (me && me.cards) || [];
    openPager(ctx, cards, i,
      (c) => h('div', { class: 'ma-lb-card' }, createCardElement(c, { mode: 'full', mediaUrl: media, to: `${t().title} ${t().name}` })),
      { caption: (c) => h('span', null, h('b', null, c.from || 'Một bạn học sinh'), ' ', h('small', null, [c.anonymous ? 'ẩn danh' : withCls('', c.cls).replace(/^, /, ''), dateVi(c.createdAt)].filter(Boolean).join(' · '))), label: 'Thiệp tri ân' });
  }

  // -------------------------------------------------- soạn câu đố
  function showQuiz() {
    view = 'quiz';
    sheet.setBack(showMain);
    sheet.setTitle('Soạn câu đố', '', null);
    let qs = ((me && me.quiz) || []).map((q) => ({ q: q.q, options: [...q.options], answer: q.answer }));
    if (!qs.length) qs = [{ q: '', options: ['', '', '', ''], answer: -1 }];
    const list = h('div', { class: 'ma-qedit-list' });
    const addBtn = h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-block' }, '+ Thêm câu');
    addBtn.addEventListener('click', () => { qs.push({ q: '', options: ['', '', '', ''], answer: -1 }); draw(); });

    function draw() {
      clear(list);
      qs.forEach((item, qi) => {
        const qIn = h('textarea', { class: 'ma-input ma-textarea', rows: 2, maxlength: 200, placeholder: 'VD: Câu cửa miệng của Cô khi lớp ồn là gì?', value: item.q });
        qIn.addEventListener('input', () => { item.q = qIn.value; });
        const opts = item.options.map((o, oi) => {
          const inp = h('input', { class: 'ma-input', maxlength: 100, placeholder: `Đáp án ${'ABCD'[oi]}`, value: o });
          inp.addEventListener('input', () => { item.options[oi] = inp.value; });
          const radio = h('button', { type: 'button', class: 'ma-qright' + (item.answer === oi ? ' is-on' : ''), 'aria-pressed': String(item.answer === oi), title: 'Chọn làm đáp án đúng' }, icon('check'), h('span', null, 'Đúng'));
          radio.addEventListener('click', () => { item.answer = oi; draw(); });
          return h('div', { class: 'ma-qopt' }, h('span', { class: 'ma-quiz-l' }, 'ABCD'[oi]), inp, radio);
        });
        list.append(
          h('div', { class: 'ma-qedit' },
            h('div', { class: 'ma-qedit-h' }, h('b', null, `Câu ${qi + 1}`),
              h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-sm is-danger', onclick: () => { qs.splice(qi, 1); draw(); } }, icon('trash'), 'Bỏ câu')),
            qIn,
            h('div', { class: 'ma-qopts' }, opts),
          ),
        );
      });
      addBtn.hidden = qs.length >= MAX_Q;
      if (!qs.length) list.append(h('div', { class: 'ma-empty' }, 'Chưa có câu nào.'));
    }

    const saveBtn = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg' }, icon('check'), 'Lưu câu đố');
    saveBtn.addEventListener('click', async () => {
      const out = [];
      for (let i = 0; i < qs.length; i++) {
        const x = qs[i];
        const q = x.q.trim();
        const options = x.options.map((o) => o.trim());
        if (!q) { ctx.toast(`Câu ${i + 1} chưa có nội dung.`, 'error'); return; }
        if (options.some((o) => !o)) { ctx.toast(`Câu ${i + 1} cần đủ 4 đáp án.`, 'error'); return; }
        if (x.answer < 0) { ctx.toast(`Câu ${i + 1} chưa chọn đáp án đúng.`, 'error'); return; }
        out.push({ q, options, answer: x.answer });
      }
      saveBtn.disabled = true;
      saveBtn.classList.add('is-busy');
      try {
        await ctx.api.teacher.saveQuiz(token, out);
        ctx.toast(out.length ? 'Đã lưu câu đố! Các con sẽ thấy ở bảng "Đố vui về thầy cô".' : 'Đã ẩn mục đố vui.', 'ok');
        ctx.markDone('quiz');
        await reload();
        ctx.refresh();
        if (alive && view === 'quiz') showMain();
      } catch (e) {
        ctx.error(e);
      } finally {
        saveBtn.disabled = false;
        saveBtn.classList.remove('is-busy');
      }
    });

    draw();
    sheet.setContent(
      list,
      addBtn,
    );
    sheet.setFooter(saveBtn);
  }

  async function reload() {
    try {
      const fresh = await ctx.api.teacher.me(token);
      if (!alive) return;
      me = fresh;
      ctx.setTeacherMe(fresh);
    } catch (e) {
      if (alive) ctx.error(e);
    }
  }

  showMain();
  // làm mới dữ liệu (thiệp mới duyệt) rồi vẽ lại nếu vẫn ở màn chính
  const before = JSON.stringify(((me && me.cards) || []).map((c) => c.id));
  reload().then(() => {
    if (!alive || view !== 'main') return;
    if (JSON.stringify(((me && me.cards) || []).map((c) => c.id)) !== before) showMain();
  });

  return { onClose() { alive = false; } };
}

teacherTreePanel.meta = (ctx) => {
  const t = ctx.teacher(ctx.profile && ctx.profile.teacherId) || {};
  return { title: `${t.tree || 'Cây'} của ${t.title || 'Thầy/Cô'}`, icon: 'tree' };
};
