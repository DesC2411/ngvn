// Hồ hạc giấy: chọn màu giấy, viết lời cảm ơn, gấp & thả hạc.
import { h, clear, len, counter, sleep, withCls } from '../dom.js';
import { icon } from '../icons.js';

const COLORS = [
  { c: '#E5484D', name: 'Đỏ' },
  { c: '#E9973B', name: 'Cam' },
  { c: '#F6C453', name: 'Vàng' },
  { c: '#4CAF7A', name: 'Xanh lá' },
  { c: '#4A90E2', name: 'Xanh dương' },
  { c: '#F28DB2', name: 'Hồng' },
];
const GOAL = 1000;
const MAX = 120;

export function craneSVG(color = '#E9973B') {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="30,62 55,52 78,62 55,74" fill="${color}"/><polygon points="30,62 55,52 78,62 55,74" fill="#000" opacity=".08"/>
  <polygon points="52,56 72,16 66,58" fill="${color}"/><polygon points="52,56 72,16 66,58" fill="#000" opacity=".22"/>
  <polygon points="42,58 50,10 60,56" fill="${color}"/><polygon points="42,58 50,10 60,56" fill="#fff" opacity=".28"/>
  <polygon points="32,62 16,30 40,60" fill="${color}"/><polygon points="16,30 6,35 19,36" fill="${color}"/><polygon points="16,30 6,35 19,36" fill="#000" opacity=".25"/>
  <polygon points="74,61 95,38 80,65" fill="${color}"/><polygon points="74,61 95,38 80,65" fill="#000" opacity=".15"/></svg>`;
}

export default function cranePanel(ctx, zone, sheet) {
  const profile = ctx.profile || {};
  let color = COLORS[1].c;
  let busy = false;

  const countNum = h('b', { class: 'ma-crane-num' });
  const countBar = h('div', { class: 'ma-progress-fill' });
  const counterBox = h('div', { class: 'ma-crane-count' },
    h('div', null, countNum, h('span', null, ` / ${ctx.fmtNum(GOAL)}`)),
    h('div', { class: 'ma-muted' }, 'con hạc của cả trường'),
    h('div', { class: 'ma-progress is-light' }, countBar),
  );
  const paintCount = () => {
    const n = (ctx.stats && ctx.stats.cranes) || 0;
    countNum.textContent = ctx.fmtNum(n);
    countBar.style.width = Math.min(100, (n / GOAL) * 100).toFixed(1) + '%';
  };

  const paper = h('div', { class: 'ma-paper' }, h('div', { class: 'ma-paper-face' }));
  const stage = h('div', { class: 'ma-crane-stage' }, paper, h('div', { class: 'ma-water' }));
  const setColor = (c) => {
    color = c;
    paper.style.setProperty('--paper', c);
    swatches.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.c === c)));
  };
  const swatches = h('div', { class: 'ma-swatches', role: 'radiogroup', 'aria-label': 'Màu giấy' },
    COLORS.map(({ c, name }) => h('button', { type: 'button', role: 'radio', class: 'ma-swatch', style: { '--c': c }, dataset: { c }, title: name, 'aria-label': 'Giấy ' + name, onclick: () => !busy && setColor(c) })),
  );

  const ta = h('textarea', { class: 'ma-input ma-textarea', rows: 3, maxlength: MAX, placeholder: 'Một lời cảm ơn ngắn gửi thầy cô…' });
  const nameIn = h('input', { class: 'ma-input', maxlength: 40, value: profile.name || '', placeholder: 'Tên của bạn' });
  const list = h('div', { class: 'ma-cranelist' });
  const btn = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg', disabled: !ctx.submissionsOpen() }, icon('crane'), 'Thả hạc');

  function renderList() {
    const cranes = ((ctx.state && ctx.state.cranes) || []).slice(0, 30);
    clear(list);
    if (!cranes.length) {
      list.append(h('div', { class: 'ma-empty' }, 'Mặt hồ còn yên ả. Thả con hạc đầu tiên nhé!'));
      return;
    }
    for (const c of cranes) {
      list.append(
        h('div', { class: 'ma-craneitem' },
          h('span', { class: 'ma-craneitem-ic', html: craneSVG(c.color || '#E9973B') }),
          h('div', null, h('p', null, c.message), h('small', null, `— ${withCls(c.from || 'Một bạn học sinh', c.cls)}`)),
        ),
      );
    }
  }

  btn.addEventListener('click', async () => {
    if (busy) return;
    const message = ta.value.trim();
    if (!message) { ctx.toast('Bạn viết một lời cảm ơn ngắn lên hạc nhé.', 'error'); ta.focus(); return; }
    if (len(message) > MAX) { ctx.toast(`Lời trên hạc tối đa ${MAX} ký tự.`, 'error'); return; }
    const from = nameIn.value.trim() || profile.name || '';
    if (!from) { ctx.toast('Bạn ghi tên mình nhé.', 'error'); nameIn.focus(); return; }
    busy = true;
    btn.disabled = true;
    btn.classList.add('is-busy');
    paper.classList.remove('is-fly');
    void paper.offsetWidth;
    paper.classList.add('is-fold');
    try {
      const [res] = await Promise.all([ctx.api.postCrane({ from, cls: profile.cls || '', message, color }), sleep(1800)]);
      paper.classList.add('is-fly');
      ctx.sent(res, 'crane', { color }, 'Đã gửi! Hạc của bạn đã xuống hồ.');
      ta.value = '';
      ta.dispatchEvent(new Event('input'));
      await sleep(1000);
    } catch (e) {
      ctx.error(e);
    } finally {
      paper.classList.remove('is-fold', 'is-fly');
      busy = false;
      btn.disabled = !ctx.submissionsOpen();
      btn.classList.remove('is-busy');
    }
  });

  sheet.setContent(
    counterBox,
    stage,
    ctx.submissionsOpen() ? null : ctx.closedNote(),
    h('div', { class: 'ma-field' }, h('label', null, 'Màu giấy'), swatches),
    h('div', { class: 'ma-field' }, h('div', { class: 'ma-field-row' }, h('label', null, 'Lời cảm ơn'), counter(ta, MAX)), ta),
    h('div', { class: 'ma-field' }, h('label', null, 'Tên trên hạc'), nameIn),
    h('div', { class: 'ma-sec-h' }, h('h3', null, 'Hạc vừa thả')),
    list,
  );
  sheet.setFooter(btn);
  setColor(color);
  paintCount();
  renderList();

  return {
    onState() {
      paintCount();
      renderList();
    },
  };
}

cranePanel.meta = () => ({ title: 'Hồ hạc giấy', icon: 'crane' });
