// Đố vui "Bạn hiểu thầy cô bao nhiêu" – câu hỏi do thầy cô tự nhập (api.getQuiz), không tự bịa.
import { h, store, pick } from '../dom.js';
import { icon } from '../icons.js';
import { teacherPhoto } from './tree.js';

const KEY = 'ma_quiz';
const RIGHT = ['Chuẩn không cần chỉnh!', 'Hiểu thầy cô quá trời!', 'Đúng rồi, giỏi ghê!', 'Chính xác! Cộng một điểm tinh ý.', 'Quá đỉnh, bạn để ý kỹ thật!'];
const WRONG = ['Suýt nữa thôi!', 'Hụt mất rồi, câu sau gỡ lại nhé!', 'Chưa đúng, nhưng giờ thì bạn biết rồi đó!', 'Ồ, hoá ra là vậy!'];

const letters = ['A', 'B', 'C', 'D'];

export default function quizPanel(ctx, zone, sheet) {
  let quiz = [];
  let alive = true;
  const rec = () => store.get(KEY, {}) || {};
  const score = () => {
    const r = rec();
    const vals = Object.values(r);
    return { right: vals.filter((v) => v && v.correct).length, total: vals.length };
  };

  async function load() {
    sheet.setBack(null);
    sheet.setTitle('Đố vui về thầy cô', '', 'quiz');
    sheet.setContent(h('div', { class: 'ma-loadbox' }, h('span', { class: 'ma-spinner' }), 'Đang lấy câu hỏi…'));
    sheet.setFooter();
    try {
      const data = await ctx.api.getQuiz();
      if (!alive) return;
      quiz = (Array.isArray(data) ? data : []).filter((x) => x && Array.isArray(x.questions) && x.questions.length && !(ctx.teacher(x.teacherId) || {}).special);
      showList();
    } catch (e) {
      if (!alive) return;
      sheet.setContent(h('div', { class: 'ma-empty' }, h('p', null, e.message), h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-sm', onclick: load }, icon('refresh'), 'Thử lại')));
    }
  }

  function scoreBox() {
    const s = score();
    return h('div', { class: 'ma-scorebox' },
      h('div', null, h('small', null, 'Điểm của bạn'), h('b', null, `${s.right}`), h('span', null, ` / ${s.total} câu đã trả lời`)),
      icon('sparkle'),
    );
  }

  function showList() {
    sheet.setBack(null);
    sheet.setTitle('Đố vui về thầy cô', '', 'quiz');
    sheet.setFooter();
    if (!quiz.length) {
      sheet.setContent(h('div', { class: 'ma-empty is-big' }, icon('quiz'), h('p', null, 'Thầy cô đang chuẩn bị câu hỏi, quay lại sau nhé!')));
      return;
    }
    const r = rec();
    sheet.setContent(
      scoreBox(),
      h('div', { class: 'ma-tlist-grid' },
        quiz.map((q) => {
          const t = ctx.teacher(q.teacherId) || { id: q.teacherId, title: '', name: q.teacherId, photo: '' };
          const done = q.questions.filter((x) => r[x.id]).length;
          return h('button', { type: 'button', class: 'ma-tpick', onclick: () => play(q, t) },
            teacherPhoto(t, 40),
            h('span', null, h('b', null, ctx.teacherName(t)), h('small', null, `${q.questions.length} câu · đã làm ${done}`)),
            done >= q.questions.length ? h('span', { class: 'ma-tag is-green' }, icon('check')) : null,
          );
        }),
      ),
    );
  }

  function play(entry, t) {
    let i = 0;
    let right = 0;
    const name = ctx.teacherName(t);
    const step = () => {
      const q = entry.questions[i];
      sheet.setBack(showList);
      sheet.setTitle(name, `Câu ${i + 1}/${entry.questions.length}`, null);
      const fb = h('div', { class: 'ma-quiz-fb', 'aria-live': 'polite' });
      const nextBtn = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg', hidden: true }, i + 1 < entry.questions.length ? 'Câu tiếp theo' : 'Xem kết quả');
      nextBtn.addEventListener('click', () => {
        i += 1;
        if (i < entry.questions.length) step();
        else finish();
      });
      const opts = h('div', { class: 'ma-quiz-opts' });
      (q.options || []).slice(0, 4).forEach((text, k) => {
        const b = h('button', { type: 'button', class: 'ma-quiz-opt' }, h('span', { class: 'ma-quiz-l' }, letters[k]), h('span', null, text));
        b.addEventListener('click', async () => {
          opts.querySelectorAll('button').forEach((x) => (x.disabled = true));
          b.classList.add('is-picked');
          let res;
          try {
            res = await ctx.api.answerQuiz({ questionId: q.id, choice: k });
          } catch (e) {
            ctx.error(e);
            opts.querySelectorAll('button').forEach((x) => (x.disabled = false));
            b.classList.remove('is-picked');
            return;
          }
          const ok = !!res.correct;
          if (ok) right += 1;
          const ans = Number.isInteger(res.answer) ? res.answer : ok ? k : -1;
          opts.querySelectorAll('button').forEach((x, idx) => {
            if (idx === ans) x.classList.add('is-right');
            else if (idx === k && !ok) x.classList.add('is-wrong');
          });
          const r = rec();
          if (!r[q.id]) {
            r[q.id] = { choice: k, correct: ok };
            store.set(KEY, r);
          }
          fb.className = 'ma-quiz-fb ' + (ok ? 'is-right' : 'is-wrong');
          fb.replaceChildren(icon(ok ? 'check' : 'x'), h('span', null, ok ? pick(RIGHT) : pick(WRONG)));
          if (ok) ctx.effect('confetti');
          nextBtn.hidden = false;
        });
        opts.append(b);
      });
      sheet.setContent(
        h('div', { class: 'ma-quiz-head' }, teacherPhoto(t, 48), h('div', { class: 'ma-quiz-dots' }, entry.questions.map((_, k) => h('i', { class: k < i ? 'is-done' : k === i ? 'is-cur' : '' })))),
        h('h3', { class: 'ma-quiz-q' }, q.q),
        opts,
        fb,
      );
      sheet.setFooter(nextBtn);
    };
    const finish = () => {
      sheet.setBack(showList);
      sheet.setTitle(name, 'Kết quả', null);
      const n = entry.questions.length;
      const msg = right === n ? `Tuyệt vời! Bạn hiểu ${name} quá rõ!` : right >= n / 2 ? 'Khá lắm! Bạn để ý thầy cô kỹ đấy.' : 'Lần này chưa may, giờ thì bạn đã hiểu thầy cô thêm một chút rồi!';
      sheet.setContent(
        h('div', { class: 'ma-done' }, h('div', { class: 'ma-done-ic' }, icon(right === n ? 'sparkle' : 'heart')), h('h3', null, `Đúng ${right}/${n} câu`), h('p', null, msg)),
        scoreBox(),
      );
      sheet.setFooter(h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg', onclick: showList }, 'Chọn thầy cô khác'));
    };
    step();
  }

  load();
  return { onClose() { alive = false; } };
}

quizPanel.meta = () => ({ title: 'Đố vui về thầy cô', icon: 'quiz' });
