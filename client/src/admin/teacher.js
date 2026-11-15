// Trang riêng của thầy cô: /teacher.html?token=...
// Đọc thiệp đã duyệt, đọc "Lời chưa nói", viết hồi âm, soạn câu đố, bật/tắt đưa lời chưa nói vào Sổ Tri Ân.
import './base.css';
import './teacher.css';
import {
  h, qs, setupMock, createClient, teacherName, fmtTime, fmtNum, toast, mediaResolver, teacherPhoto, logoUrl,
} from './common.js';
import { renderCardView } from './card-view.js';

const REPLY_MAX = 300;
const Q_MAX = 200;
const OPT_MAX = 80;
const QUIZ_MAX = 3;
const LETTERS = ['A', 'B', 'C', 'D'];

const app = document.getElementById('app');
const token = (qs('token') || '').trim();
const api = createClient({ headers: () => ({ 'x-teacher-token': token }) });
const media = mediaResolver('/api/teacher/media', 'token', token);

let me = null;   // dữ liệu /api/teacher/me
let T = 'Thầy/Cô';
let tab = 'cards';
let content;
const tabBtns = {};

function friendlyError(title, text, retry) {
  app.replaceChildren(h('div', { class: 'gate' },
    h('div', { class: 'gate-card' },
      h('img', { src: logoUrl('256'), alt: 'May Academy', class: 'gate-logo' }),
      h('h1', null, title),
      h('p', null, text),
      retry ? h('button', { class: 'btn btn-primary', onclick: retry }, 'Thử lại') : null,
      h('p', { class: 'muted small' }, 'May Academy · Mùa Tri Ân 20/11/2026'))));
}

async function load() {
  if (!token) {
    friendlyError('Kính chào Thầy/Cô!', 'Đường dẫn này chưa có mã truy cập. Thầy/Cô vui lòng mở đúng đường link riêng mà ban tổ chức đã gửi nhé.');
    return;
  }
  try {
    me = await api.get('/api/teacher/me');
  } catch (e) {
    if (e.status === 401 || e.status === 403 || e.status === 404) {
      friendlyError('Rất tiếc, chưa mở được trang', 'Mã truy cập trong đường link chưa đúng hoặc đã được đổi mới. Thầy/Cô vui lòng liên hệ ban tổ chức để nhận lại link nhé. Cảm ơn Thầy/Cô!');
    } else {
      friendlyError('Chưa kết nối được', e.message || 'Có lỗi xảy ra, Thầy/Cô thử lại sau ít phút nhé.', () => { app.replaceChildren(h('div', { class: 'spinner' })); load(); });
    }
    return;
  }
  T = (me.teacher && me.teacher.title) || 'Thầy/Cô';
  render();
}

function render() {
  const t = me.teacher || {};
  const cards = me.cards || [];
  const secrets = me.secrets || [];
  document.title = `${teacherName(t)} – Sổ thiệp Mùa Tri Ân 20/11`;

  const hero = h('header', { class: 'hero' },
    h('div', { class: 'hero-top' },
      h('img', { src: logoUrl('256'), alt: '', class: 'hero-logo' }),
      h('span', null, 'May Academy · Mùa Tri Ân 20/11')),
    h('div', { class: 'hero-main' },
      h('img', { class: `hero-photo${t.photo ? '' : ' is-logo'}`, src: teacherPhoto(t), alt: teacherName(t) }),
      h('div', null,
        h('p', { class: 'hello' }, 'Kính chào'),
        h('h1', null, teacherName(t)),
        h('p', { class: 'tree' }, '🌳 ', h('b', null, t.tree || ''), ' trong Vườn Tri Ân'))),
    h('div', { class: 'enter' },
      h('a', { class: 'enter-btn', href: `/?teacher=${encodeURIComponent(token)}` }, '🏫 Vào thế giới May Academy'),
      h('p', null, `${T} vào chính khuôn viên trường 3D: có vệt sáng chỉ đường tới ${t.tree || 'cây của mình'} để đọc thiệp và tới Hòm thư đỏ đọc lời chưa nói. Trang này là bản xem nhanh dạng danh sách.`)),
    h('p', { class: 'hero-note' },
      cards.length
        ? `Các bạn học sinh đã treo ${fmtNum(cards.length)} tấm thiệp lên ${t.tree || 'cây'} để tri ân ${T}. Mời ${T} mở đọc ạ!`
        : `Các bạn học sinh đang viết thiệp gửi ${T}. Thiệp được ban tổ chức duyệt xong sẽ hiện ở đây.`),
  );

  const TABS = [
    { id: 'cards', label: 'Thiệp', n: cards.length },
    { id: 'secrets', label: 'Lời chưa nói', n: secrets.length },
    { id: 'reply', label: 'Hồi âm', dot: !me.reply },
    { id: 'quiz', label: 'Câu đố', dot: !(me.quiz && me.quiz.length) },
  ];
  const nav = h('nav', { class: 'ttabs' }, TABS.map((x) => {
    const b = h('button', { class: 'ttab', onclick: () => show(x.id) }, x.label,
      x.n ? h('span', { class: 'tcount' }, String(x.n)) : null,
      x.dot ? h('span', { class: 'tdot', title: 'Chưa làm' }) : null);
    tabBtns[x.id] = b;
    return b;
  }));
  content = h('main', { class: 'tcontent' });
  app.replaceChildren(hero, nav, content,
    h('footer', { class: 'tfoot' }, 'Trang này là của riêng ', T, '. Xin đừng chia sẻ đường link cho người khác.'));
  show(tab);
}

function show(id) {
  tab = id;
  for (const [k, b] of Object.entries(tabBtns)) b.classList.toggle('active', k === id);
  content.replaceChildren();
  if (id === 'cards') renderCards();
  else if (id === 'secrets') renderSecrets();
  else if (id === 'reply') renderReply();
  else if (id === 'quiz') renderQuiz();
}

// ---------------- Thiệp ----------------
function renderCards() {
  const cards = me.cards || [];
  if (!cards.length) {
    content.append(h('div', { class: 'empty warm' },
      h('div', { class: 'big' }, '💌'),
      h('p', null, `Chưa có thiệp nào được duyệt. ${T} quay lại sau nhé, các bạn đang viết đấy ạ!`)));
    return;
  }
  const t = me.teacher;
  const grid = h('div', { class: 'cgrid' });
  content.append(h('p', { class: 'muted small center' }, `Bấm vào thiệp để xem to và lật từng tấm.`), grid);
  cards.forEach((c, i) => {
    const slot = h('button', { class: 'cslot', 'aria-label': `Mở thiệp ${i + 1}`, onclick: () => openViewer(i) },
      h('div', { class: 'card-loading' }, 'Đang mở thiệp…'));
    grid.append(slot);
    renderCardView(c, { mediaUrl: media, mode: 'thumb', teacherName: teacherName(t) })
      .then((node) => slot.replaceChildren(node))
      .catch(() => slot.replaceChildren(h('p', null, c.message || '')));
  });
}

let viewer = null;
function openViewer(start) {
  const cards = me.cards || [];
  let i = start;
  const stage = h('div', { class: 'v-stage' });
  const counter = h('span', { class: 'v-count' });
  const meta = h('div', { class: 'v-meta' });
  const prev = h('button', { class: 'v-nav v-prev', 'aria-label': 'Thiệp trước', onclick: () => step(-1) }, '‹');
  const next = h('button', { class: 'v-nav v-next', 'aria-label': 'Thiệp sau', onclick: () => step(1) }, '›');
  const close = () => {
    viewer.remove();
    viewer = null;
    document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKey);
  };
  viewer = h('div', { class: 'viewer open', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Xem thiệp' },
    h('div', { class: 'v-bar' }, counter, h('button', { class: 'v-close', 'aria-label': 'Đóng', onclick: close }, '✕')),
    h('div', { class: 'v-body' }, prev, stage, next),
    meta);
  viewer.addEventListener('click', (e) => { if (e.target === viewer || e.target.classList.contains('v-body')) close(); });
  let x0 = null;
  viewer.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  viewer.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    x0 = null;
  });
  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  }
  document.addEventListener('keydown', onKey);
  document.body.classList.add('no-scroll');
  document.body.append(viewer);

  let seq = 0;
  async function draw(dir = 0) {
    const c = cards[i];
    const my = ++seq;
    counter.textContent = `Thiệp ${i + 1} / ${cards.length}`;
    prev.disabled = i === 0;
    next.disabled = i === cards.length - 1;
    meta.textContent = [c.anonymous ? 'Một bạn học sinh (ẩn danh)' : c.from, !c.anonymous && c.cls ? `Lớp ${c.cls}` : '', fmtTime(c.createdAt)].filter(Boolean).join(' · ');
    // Thiệp tỉ lệ 4:5 → giới hạn bề rộng theo cả chiều cao màn hình để thấy trọn tấm thiệp.
    const width = Math.max(240, Math.min(620, window.innerWidth - 32, (window.innerHeight - 150) * 0.8));
    stage.style.width = `${Math.round(width)}px`;
    const node = await renderCardView(c, { mediaUrl: media, mode: 'full', teacherName: teacherName(me.teacher) });
    if (my !== seq) return;
    node.classList.add('v-card');
    if (dir) node.classList.add(dir > 0 ? 'in-right' : 'in-left');
    stage.replaceChildren(node);
  }
  function step(d) {
    const j = i + d;
    if (j < 0 || j >= cards.length) return;
    i = j;
    draw(d);
  }
  draw();
}

// ---------------- Lời chưa nói ----------------
function renderSecrets() {
  const list = [...(me.secrets || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sw = h('input', { type: 'checkbox', checked: !!me.includeSecretsInBook });
  const swState = h('span', { class: 'muted small' });
  const syncState = () => { swState.textContent = sw.checked ? 'Đang bật: các lời này sẽ được in trong Sổ Tri Ân.' : 'Đang tắt: Sổ Tri Ân sẽ không có các lời này.'; };
  syncState();
  sw.addEventListener('change', async () => {
    const want = sw.checked;
    sw.disabled = true;
    try {
      await api.post('/api/teacher/settings', { includeSecretsInBook: want });
      me.includeSecretsInBook = want;
      toast(want ? 'Đã cho phép đưa vào Sổ Tri Ân.' : 'Đã tắt, Sổ Tri Ân sẽ không in các lời này.');
    } catch (e) {
      sw.checked = !want;
      toast(e.message, 'err');
    }
    sw.disabled = false;
    syncState();
  });

  content.append(
    h('div', { class: 'private-box' },
      h('b', null, `🔒 Chỉ riêng ${T} đọc được`),
      h('p', null, `Đây là những điều các bạn học sinh chưa dám nói trực tiếp với ${T}. Các lời này không treo trên cây, không hiện trong game.`)),
    h('label', { class: 'switch-row' },
      h('span', { class: 'switch' }, sw, h('span', { class: 'slider' })),
      h('span', null, h('b', null, 'Cho phép đưa "Lời chưa nói" vào Sổ Tri Ân'), h('br'), swState)),
  );
  if (!list.length) {
    content.append(h('div', { class: 'empty warm' }, h('div', { class: 'big' }, '✉️'), h('p', null, `Chưa có lời chưa nói nào gửi ${T}.`)));
    return;
  }
  content.append(h('div', { class: 'letters' }, list.map((s) => h('article', { class: 'letter' },
    h('p', { class: 'letter-msg' }, s.message || ''),
    h('div', { class: 'letter-from' },
      h('span', { class: 'sig' }, s.anonymous ? 'Một bạn học sinh' : (s.from || 'Một bạn học sinh')),
      !s.anonymous && s.cls ? ` · Lớp ${s.cls}` : '',
      s.anonymous ? ' (ẩn danh)' : '',
      h('div', { class: 'muted small' }, fmtTime(s.createdAt)))))));
}

// ---------------- Hồi âm ----------------
function renderReply() {
  const t = me.teacher || {};
  const ta = h('textarea', { class: 'input reply-ta', rows: 5, maxlength: REPLY_MAX, placeholder: `Ví dụ: Cảm ơn các con đã gửi thật nhiều thiệp. ${T} đọc từng tấm và rất vui!` });
  ta.value = me.reply || '';
  const count = h('span', { class: 'count' });
  const preview = h('div', { class: 'sign-text' });
  const sync = () => {
    count.textContent = `${ta.value.length}/${REPLY_MAX}`;
    count.classList.toggle('near', ta.value.length > REPLY_MAX - 30);
    preview.textContent = ta.value.trim() || '(chưa có lời hồi âm)';
  };
  ta.addEventListener('input', sync);
  sync();
  const save = h('button', {
    class: 'btn btn-accent',
    async onclick() {
      const text = ta.value.trim();
      if (text.length > REPLY_MAX) return toast(`Lời hồi âm tối đa ${REPLY_MAX} ký tự.`, 'err');
      save.disabled = true;
      try {
        await api.post('/api/teacher/reply', { text });
        me.reply = text || null;
        toast(text ? 'Đã lưu! Lời hồi âm sẽ hiện trên biển cây trong game.' : 'Đã xoá lời hồi âm.');
        tabBtns.reply.querySelector('.tdot')?.remove();
      } catch (e) { toast(e.message, 'err'); }
      save.disabled = false;
    },
  }, 'Lưu lời hồi âm');
  content.append(
    h('section', { class: 'tpanel' },
      h('h2', null, 'Lời hồi âm gửi cả trường'),
      h('p', { class: 'muted' }, `Một lời nhắn chung ${T} gửi lại các bạn học sinh. Lời này sẽ hiện trên biển ${t.tree || 'cây'} trong game, ai đi qua cũng đọc được.`),
      ta,
      h('div', { class: 'row-between' }, count, save)),
    h('section', { class: 'tpanel' },
      h('h3', null, 'Xem trước trên biển cây'),
      h('div', { class: 'sign' },
        h('div', { class: 'sign-head' }, t.tree || '', h('small', null, teacherName(t))),
        preview)),
  );
}

// ---------------- Câu đố ----------------
function renderQuiz() {
  let qsList = (me.quiz || []).slice(0, QUIZ_MAX).map((q) => ({
    q: q.q || '', options: [0, 1, 2, 3].map((k) => (q.options && q.options[k]) || ''), answer: Number.isInteger(q.answer) ? q.answer : -1,
  }));
  const listEl = h('div', { class: 'qlist' });
  const addBtn = h('button', { class: 'btn btn-ghost', onclick: () => { qsList.push({ q: '', options: ['', '', '', ''], answer: -1 }); draw(); } }, '+ Thêm câu hỏi');
  const saveBtn = h('button', { class: 'btn btn-accent', onclick: save }, 'Lưu câu đố');

  function draw() {
    listEl.replaceChildren(...qsList.map((q, qi) => {
      const name = `ans-${qi}`;
      return h('fieldset', { class: 'qcard' },
        h('legend', null, `Câu ${qi + 1}`),
        h('label', { class: 'qlabel' }, 'Câu hỏi',
          h('input', { class: 'input', maxlength: Q_MAX, value: q.q, placeholder: `Ví dụ: Món ăn sáng ${T} hay ăn nhất là gì?`, oninput: (e) => { q.q = e.target.value; } })),
        h('div', { class: 'qopts' }, q.options.map((o, oi) => h('label', { class: `qopt${q.answer === oi ? ' right' : ''}` },
          h('input', {
            type: 'radio', name, checked: q.answer === oi, title: 'Chọn làm đáp án đúng',
            onchange: () => { q.answer = oi; draw(); },
          }),
          h('span', { class: 'qletter' }, LETTERS[oi]),
          h('input', { class: 'input', maxlength: OPT_MAX, value: o, placeholder: `Đáp án ${LETTERS[oi]}`, oninput: (e) => { q.options[oi] = e.target.value; } })))),
        h('div', { class: 'row-between' },
          h('span', { class: 'muted small' }, q.answer >= 0 ? `Đáp án đúng: ${LETTERS[q.answer]}` : 'Bấm vào nút tròn để chọn đáp án đúng'),
          h('button', { class: 'btn btn-danger btn-sm', type: 'button', onclick: () => { qsList.splice(qi, 1); draw(); } }, 'Xoá câu này')));
    }));
    if (!qsList.length) listEl.append(h('p', { class: 'muted center' }, `${T} chưa có câu đố nào. Khi chưa có câu đố, ${T} sẽ không xuất hiện trong trò Đố vui.`));
    addBtn.hidden = qsList.length >= QUIZ_MAX;
  }

  async function save() {
    for (let i = 0; i < qsList.length; i++) {
      const q = qsList[i];
      if (!q.q.trim()) return toast(`Câu ${i + 1}: ${T} chưa nhập câu hỏi.`, 'err');
      if (q.options.some((o) => !o.trim())) return toast(`Câu ${i + 1}: cần đủ 4 đáp án.`, 'err');
      if (q.answer < 0 || q.answer > 3) return toast(`Câu ${i + 1}: ${T} chưa chọn đáp án đúng.`, 'err');
    }
    saveBtn.disabled = true;
    try {
      const questions = qsList.map((q) => ({ q: q.q.trim(), options: q.options.map((o) => o.trim()), answer: q.answer }));
      await api.put('/api/teacher/quiz', { questions });
      me.quiz = questions;
      toast(questions.length ? 'Đã lưu câu đố! Học sinh sẽ thấy trong trò Đố vui.' : 'Đã xoá hết câu đố.');
      if (questions.length) tabBtns.quiz.querySelector('.tdot')?.remove();
    } catch (e) { toast(e.message, 'err'); }
    saveBtn.disabled = false;
  }

  content.append(
    h('section', { class: 'tpanel' },
      h('h2', null, 'Đố vui "Bạn hiểu thầy cô bao nhiêu"'),
      h('p', { class: 'muted' }, `${T} soạn tối đa ${QUIZ_MAX} câu hỏi vui về bản thân (sở thích, câu cửa miệng, kỷ niệm nghề…). Mỗi câu có 4 đáp án, ${T} chọn 1 đáp án đúng. Học sinh đến bảng Đố vui trong game sẽ trả lời.`),
      h('details', { class: 'example' },
        h('summary', null, 'Xem gợi ý cách viết'),
        h('ul', null,
          h('li', null, 'Câu hỏi ngắn, vui, ai cũng hiểu. Ví dụ dạng: "Câu cửa miệng của ', T, ' khi lớp ồn là gì?"'),
          h('li', null, 'Ví dụ dạng: "', T, ' thích loại đồ uống nào nhất?" — đáp án: Trà đá / Cà phê / Nước cam / Trà sữa.'),
          h('li', null, 'Ví dụ dạng: "Ngoài giờ dạy, ', T, ' thích làm gì?" — đáp án: Đọc sách / Nấu ăn / Chạy bộ / Trồng cây.'),
          h('li', null, 'Đáp án sai nên nghe cũng "có vẻ đúng" để các bạn phải suy nghĩ. Tránh câu hỏi về thông tin riêng tư.'),
          h('li', { class: 'muted' }, 'Các ví dụ trên chỉ minh hoạ cách viết, ', T, ' thay bằng điều thật về mình nhé.'))),
      listEl,
      h('div', { class: 'row-between' }, addBtn, saveBtn)),
  );
  draw();
}

(async () => {
  await setupMock();
  load();
})();
