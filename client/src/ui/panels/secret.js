// Hộp "Lời chưa nói": gửi riêng một thầy cô, không treo công khai.
import { h, clear, len, counter, norm } from '../dom.js';
import { icon } from '../icons.js';
import { teacherPhoto } from './tree.js';

const MAX = 1000;

export default function secretPanel(ctx, zone, sheet) {
  const profile = ctx.profile || {};
  let chosen = zone.teacherId ? ctx.teacher(zone.teacherId) : null;
  let draft = { message: '', from: profile.name || '', anonymous: false };

  const privacy = () => h('div', { class: 'ma-private-tag' }, icon('lock'), 'Riêng tư');

  function showPicker() {
    sheet.setBack(chosen ? showForm : null);
    sheet.setTitle('Hộp "Lời chưa nói"', '', 'mail');
    const search = h('input', { class: 'ma-input ma-search', type: 'search', placeholder: 'Tìm tên thầy cô…', 'aria-label': 'Tìm thầy cô' });
    const listBox = h('div', { class: 'ma-tlist' });
    const draw = () => {
      const q = norm(search.value.trim());
      const all = ctx.teachers().filter((t) => !t.special).filter((t) => !q || norm(`${t.title} ${t.name} ${t.dept || ''}`).includes(q));
      clear(listBox);
      for (const [title, label] of [['Cô', 'Các cô'], ['Thầy', 'Các thầy']]) {
        const group = all.filter((t) => t.title === title);
        if (!group.length) continue;
        listBox.append(h('h3', { class: 'ma-tlist-h' }, `${label} (${group.length})`));
        listBox.append(
          h('div', { class: 'ma-tlist-grid' },
            group.map((t) =>
              h('button', {
                type: 'button', class: 'ma-tpick' + (chosen && chosen.id === t.id ? ' is-on' : ''),
                onclick: () => { chosen = t; showForm(); },
              }, teacherPhoto(t, 40), h('span', null, h('b', null, `${t.title} ${t.name}`), h('small', null, [t.dept, t.role].filter(Boolean).join(' · ')))),
            ),
          ),
        );
      }
      const others = all.filter((t) => t.title !== 'Cô' && t.title !== 'Thầy');
      if (others.length) {
        listBox.append(h('div', { class: 'ma-tlist-grid' }, others.map((t) => h('button', { type: 'button', class: 'ma-tpick', onclick: () => { chosen = t; showForm(); } }, teacherPhoto(t, 40), h('span', null, h('b', null, `${t.title} ${t.name}`))))));
      }
      if (!listBox.childNodes.length) listBox.append(h('div', { class: 'ma-empty' }, 'Không tìm thấy thầy cô nào khớp.'));
    };
    search.addEventListener('input', draw);
    draw();
    sheet.setContent(privacy(), search, listBox);
    sheet.setFooter();
  }

  function showForm() {
    if (!chosen) return showPicker();
    const name = ctx.teacherName(chosen);
    sheet.setBack(showPicker);
    sheet.setTitle('Gửi ' + name, '', 'mail');
    const ta = h('textarea', { class: 'ma-input ma-textarea', rows: 7, maxlength: MAX, placeholder: 'Một lời cảm ơn muộn, một lời xin lỗi, hay điều bạn chưa dám nói…', value: draft.message });
    ta.addEventListener('input', () => { draft.message = ta.value; });
    const nameIn = h('input', { class: 'ma-input', maxlength: 40, value: draft.from, placeholder: 'Tên của bạn', disabled: draft.anonymous });
    nameIn.addEventListener('input', () => { draft.from = nameIn.value; });
    const anon = h('input', { type: 'checkbox', checked: draft.anonymous });
    anon.addEventListener('change', () => { draft.anonymous = anon.checked; nameIn.disabled = anon.checked; });
    const sendBtn = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg', disabled: !ctx.submissionsOpen() }, icon('lock'), 'Gửi riêng ' + name);
    sendBtn.addEventListener('click', async () => {
      const message = draft.message.trim();
      if (!message) { ctx.toast('Bạn viết lời nhắn trước nhé.', 'error'); ta.focus(); return; }
      if (len(message) > MAX) { ctx.toast(`Lời nhắn tối đa ${MAX} ký tự.`, 'error'); return; }
      const from = draft.from.trim() || profile.name || '';
      if (!draft.anonymous && !from) { ctx.toast('Bạn ghi tên hoặc chọn gửi ẩn danh nhé.', 'error'); return; }
      sendBtn.disabled = true;
      sendBtn.classList.add('is-busy');
      try {
        const res = await ctx.api.postSecret({ teacherId: chosen.id, from, cls: profile.cls || '', anonymous: draft.anonymous, message });
        ctx.sent(res, null, null);
        draft = { message: '', from: profile.name || '', anonymous: false };
        showDone(name);
      } catch (e) {
        ctx.error(e);
        sendBtn.disabled = !ctx.submissionsOpen();
        sendBtn.classList.remove('is-busy');
      }
    });
    sheet.setContent(
      privacy(),
      ctx.submissionsOpen() ? null : ctx.closedNote(),
      h('button', { type: 'button', class: 'ma-to', onclick: showPicker }, teacherPhoto(chosen, 44), h('span', null, h('small', null, 'Gửi tới'), h('b', null, name)), h('span', { class: 'ma-to-change' }, 'Đổi')),
      h('div', { class: 'ma-field' }, h('div', { class: 'ma-field-row' }, h('label', null, 'Lời nhắn'), counter(ta, MAX)), ta),
      h('div', { class: 'ma-field' }, h('label', null, 'Tên của bạn'), nameIn),
      h('label', { class: 'ma-check' }, anon, h('span', null, h('b', null, 'Gửi ẩn danh'))),
    );
    sheet.setFooter(sendBtn);
  }

  function showDone(name) {
    sheet.setBack(null);
    sheet.setTitle('Đã cất vào hộp', '', 'mail');
    sheet.setContent(
      h('div', { class: 'ma-done' },
        h('div', { class: 'ma-done-ic' }, icon('lock')),
        h('h3', null, 'Lời nhắn đã được cất vào hộp'),
      ),
    );
    sheet.setFooter(
      h('div', { class: 'ma-foot-2' },
        h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-lg', onclick: () => ctx.close() }, 'Đóng'),
        h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-lg', onclick: () => { chosen = null; showPicker(); } }, 'Gửi thêm'),
      ),
    );
  }

  if (chosen) showForm();
  else showPicker();
  return {};
}

secretPanel.meta = () => ({ title: 'Hộp "Lời chưa nói"', icon: 'mail' });
