// Sổ Tri Ân – in / Lưu PDF bằng trình duyệt (Ctrl+P), khổ A4 dọc.
// /book.html?teacher=t01|all&key=<ADMIN_KEY>
// Trang dựng thành từng tờ A4 cố định; thiệp được đo chiều cao thật rồi xếp 2–4 tấm/trang.
import './base.css';
import './book.css';
import {
  h, qs, setupMock, createClient, teacherName, fmtNum, isDaiThu, mediaResolver, waitImages, logoUrl,
} from './common.js';
import { renderCardView, loadCardRenderer } from './card-view.js';

const KEY_STORE = 'ma_admin_key';
const MAX_CARDS_PER_PAGE = 4;
const EVENT_LABEL = '20/11/2026';

const bar = document.getElementById('toolbar');
const bookEl = document.getElementById('book');

const teacherParam = (qs('teacher') || '').trim();
let key = (qs('key') || '').trim();
if (key) {
  try { sessionStorage.setItem(KEY_STORE, key); } catch { /* bỏ qua */ }
  // Gỡ mã khỏi thanh địa chỉ để không lộ khi in/chia sẻ màn hình.
  const u = new URL(location.href);
  u.searchParams.delete('key');
  history.replaceState(null, '', u.pathname + u.search + u.hash);
} else {
  key = sessionStorage.getItem(KEY_STORE) || '';
}
const api = createClient({ headers: () => ({ 'x-admin-key': key }) });
const media = mediaResolver('/api/admin/media', 'key', key);

// ---------------- Thanh công cụ (chỉ hiện trên màn hình) ----------------
const statusEl = h('span', { class: 'tb-status' }, 'Đang chuẩn bị…');
const printBtn = h('button', { class: 'btn btn-accent', hidden: true, onclick: () => window.print() }, '🖨 In / Lưu PDF');
const titleEl = h('b', null, 'Sổ Tri Ân');
bar.append(
  h('div', { class: 'tb-left' }, h('img', { src: logoUrl('256'), alt: '' }), h('div', null, titleEl, statusEl)),
  h('div', { class: 'tb-right' },
    h('details', { class: 'tb-help' },
      h('summary', null, 'Cách lưu PDF'),
      h('ol', null,
        h('li', null, 'Bấm "In / Lưu PDF" (hoặc Ctrl+P).'),
        h('li', null, 'Máy in: chọn "Lưu dưới dạng PDF" (Save as PDF).'),
        h('li', null, 'Khổ giấy A4, hướng Dọc, Lề: Không (None), Tỉ lệ 100%.'),
        h('li', null, 'Bật "Đồ hoạ nền" (Background graphics) để giữ màu.'),
        h('li', null, 'Dùng Chrome hoặc Edge để in đẹp nhất.'))),
    printBtn),
);

function fail(msg) {
  statusEl.textContent = msg;
  bookEl.replaceChildren(h('div', { class: 'bk-error' }, h('p', null, msg)));
}

// ---------------- Khung trang ----------------
function page(cls, ...kids) {
  return h('section', { class: `page ${cls || ''}` }, ...kids);
}

function chrome(t, pageNo) {
  return [
    h('div', { class: 'pg-head' },
      h('img', { src: logoUrl('256'), alt: '' }),
      h('span', null, 'Sổ Tri Ân · May Academy'),
      h('span', { class: 'pg-to' }, teacherName(t))),
    h('div', { class: 'pg-foot' },
      h('span', null, `${t.tree || ''}`),
      h('span', { class: 'pg-no' }, String(pageNo))),
  ];
}

function coverPage(t) {
  return page('cover',
    h('div', { class: 'cv-frame' },
      h('div', { class: 'cv-school' }, 'MAY ACADEMY'),
      h('img', { class: 'cv-logo', src: logoUrl('round'), alt: 'Logo May Academy' }),
      h('h1', { class: 'cv-title' }, 'Sổ Tri Ân'),
      h('div', { class: 'cv-date' }, EVENT_LABEL),
      h('div', { class: 'cv-sub' }, 'Ngày Nhà giáo Việt Nam'),
      t.photo ? h('img', { class: 'cv-photo', src: t.photo, alt: teacherName(t) }) : null,
      h('div', { class: 'cv-gift' }, 'Kính tặng'),
      h('div', { class: 'cv-name' }, teacherName(t)),
      h('div', { class: 'cv-tree' }, `${t.tree || ''} · Vườn Tri Ân`),
    ),
  );
}

function introPage(t, cards, pageNo) {
  const T = t.title || 'Thầy/Cô';
  return page('intro', ...chrome(t, pageNo),
    h('div', { class: 'in-body' },
      h('h2', null, 'Lời mở đầu'),
      h('p', { class: 'in-greet' }, `Kính gửi ${teacherName(t)},`),
      h('p', null, `Nhân ngày Nhà giáo Việt Nam 20/11/2026, các bạn học sinh May Academy đã cùng nhau ghé Vườn Tri Ân, dừng chân bên ${t.tree || 'cây'} và viết những tấm thiệp này gửi tặng ${T}.`),
      h('p', null, 'Có tấm thiệp là lời cảm ơn, có tấm là một kỷ niệm nhỏ, có tấm chỉ là vài nét vẽ còn vụng, nhưng tấm nào cũng thật lòng. Chúng em gom tất cả lại thành cuốn sổ nhỏ này để ' + T + ' giữ làm kỷ niệm.'),
      h('p', null, `Chúc ${T} luôn mạnh khoẻ, vui vẻ và mãi giữ ngọn lửa yêu nghề. Cảm ơn ${T} vì tất cả!`),
      cards.length ? h('p', { class: 'in-count' }, `Trong sổ có ${fmtNum(cards.length)} tấm thiệp.`) : null,
      h('div', { class: 'in-sign' },
        h('span', null, 'Thay mặt học sinh'),
        h('b', null, 'May Academy'))),
  );
}

function cardBlock(card, cardNode) {
  // Thiệp viết sẵn của cây đại thụ (seed) không ghi người gửi.
  if (card.seed) return h('figure', { class: 'bk-card' }, cardNode);
  const who = card.anonymous ? 'Một bạn học sinh' : (card.from || 'Một bạn học sinh');
  return h('figure', { class: 'bk-card' },
    cardNode,
    h('figcaption', null,
      h('span', { class: 'by' }, '✍ ', who),
      !card.anonymous && card.cls ? h('span', null, ` · Lớp ${card.cls}`) : null,
      card.createdAt ? h('span', { class: 'when' }, ` · ${fmtDate(card.createdAt)}`) : null));
}

function fmtDate(t) {
  const d = new Date(t);
  return isNaN(d) ? '' : d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function secretBlock(s) {
  return h('article', { class: 'bk-secret' },
    h('p', null, s.message || ''),
    h('div', { class: 'bk-secret-from' },
      '— ', h('span', { class: 'hand' }, s.anonymous ? 'Một bạn học sinh' : (s.from || 'Một bạn học sinh')),
      !s.anonymous && s.cls ? ` · Lớp ${s.cls}` : ''));
}

function statsPage(t, cards, secrets, pageNo) {
  const T = t.title || 'Thầy/Cô';
  const classes = new Set(cards.filter((c) => !c.anonymous && c.cls).map((c) => c.cls));
  const drawings = cards.filter((c) => c.drawingUrl).length;
  return page('stats', ...chrome(t, pageNo),
    h('div', { class: 'st-body' },
      h('h2', null, 'Những con số nhỏ'),
      h('div', { class: 'st-grid' },
        h('div', { class: 'st-tile' }, h('b', null, fmtNum(cards.length)), h('span', null, 'tấm thiệp')),
        classes.size ? h('div', { class: 'st-tile' }, h('b', null, fmtNum(classes.size)), h('span', null, 'lớp gửi thiệp')) : null,
        drawings ? h('div', { class: 'st-tile' }, h('b', null, fmtNum(drawings)), h('span', null, 'bức vẽ tay')) : null,
        secrets.length ? h('div', { class: 'st-tile' }, h('b', null, fmtNum(secrets.length)), h('span', null, 'lời chưa nói')) : null),
      classes.size ? h('p', { class: 'st-classes' }, 'Các lớp: ', [...classes].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })).join(', ')) : null,
      h('p', { class: 'st-thanks' }, `Cảm ơn ${T}!`),
      h('img', { class: 'st-logo', src: logoUrl('round'), alt: '' }),
      h('p', { class: 'st-sign' }, `Học sinh May Academy · ${EVENT_LABEL}`)),
  );
}

// ---------------- Đo & xếp trang ----------------
let geom = null;
function measureGeometry(t) {
  const g = probeArea(t, []);
  g.areaHCards1 = probeArea(t, [h('h2', { class: 'sec-title' }, 'Thiệp gửi Cô')]).areaH;
  g.areaHSecrets1 = probeArea(t, [h('h2', { class: 'sec-title' }, 'Lời chưa nói'), h('p', { class: 'sec-note' }, 'Ghi chú')]).areaH;
  return g;
}

function probeArea(t, extra) {
  const probe = page('cards probe', ...chrome(t, 1), ...extra, h('div', { class: 'area' }));
  probe.style.position = 'absolute';
  probe.style.left = '-10000px';
  probe.style.top = '0';
  document.body.append(probe);
  const area = probe.querySelector('.area');
  const cs = getComputedStyle(area);
  const gap = parseFloat(cs.rowGap || cs.gap) || 16;
  const g = { areaW: area.clientWidth, areaH: area.clientHeight, gap };
  g.colW = Math.floor((g.areaW - gap) / 2);
  probe.remove();
  return g;
}

function measureBox(width) {
  const box = h('div', { class: 'measure' });
  box.style.width = `${width}px`;
  document.body.append(box);
  return box;
}

/** Xếp các khối theo hàng (cols cột) vào trang, mỗi trang tối đa maxPer khối.
 *  firstCap: chiều cao vùng nội dung trang đầu (trang đầu có tiêu đề mục). */
function packRows(blocks, heights, cols, maxPer, firstCap) {
  const pages = [];
  let cur = [];
  let used = 0;
  let count = 0;
  const cap = () => (pages.length === 0 ? firstCap : geom.areaH) - 2;
  for (let i = 0; i < blocks.length; i += cols) {
    const row = blocks.slice(i, i + cols);
    let rh = Math.max(...heights.slice(i, i + cols));
    if (rh > cap() && (cur.length === 0 || rh > geom.areaH - 2)) {
      const limit = cur.length === 0 ? cap() : geom.areaH - 2;
      const z = limit / rh;
      row.forEach((b) => { b.style.zoom = String(z); });
      rh = limit;
    }
    const need = (cur.length ? geom.gap : 0) + rh;
    if (cur.length && (used + need > cap() || count + row.length > maxPer)) {
      pages.push(cur);
      cur = [];
      used = 0;
      count = 0;
    }
    used += (cur.length ? geom.gap : 0) + rh;
    count += row.length;
    cur.push(row);
  }
  if (cur.length) pages.push(cur);
  return pages;
}

async function buildBook(entry, progress) {
  const t = entry.teacher || {};
  // Thiệp xếp theo thời gian gửi (cũ → mới) cho giống cuốn sổ.
  const cards = [...(entry.cards || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const secrets = [...(entry.secrets || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const book = h('div', { class: 'bk', dataset: { teacher: t.id || '' } });
  let pageNo = 1;
  book.append(coverPage(t));
  book.append(introPage(t, cards, ++pageNo));

  // --- Thiệp ---
  if (cards.length) {
    const box = measureBox(geom.colW);
    const blocks = [];
    for (const c of cards) {
      const node = await renderCardView(c, { mediaUrl: media, mode: 'print', teacherName: teacherName(t) });
      const b = cardBlock(c, node);
      box.append(b);
      blocks.push(b);
    }
    await waitImages(box, progress);
    const heights = blocks.map((b) => b.getBoundingClientRect().height);
    const pages = packRows(blocks, heights, 2, MAX_CARDS_PER_PAGE, geom.areaHCards1);
    pages.forEach((rows, pi) => {
      const area = h('div', { class: 'area' }, rows.map((row) => h('div', { class: `bk-row n${row.length}` }, row)));
      book.append(page('cards', ...chrome(t, ++pageNo),
        pi === 0 ? h('h2', { class: 'sec-title' }, 'Thiệp gửi ', t.title || '') : null, area));
    });
    box.remove();
  } else {
    book.append(page('cards empty-cards', ...chrome(t, ++pageNo),
      h('div', { class: 'area center' }, h('p', null, 'Chưa có thiệp nào được duyệt cho sổ này.'))));
  }

  // --- Lời chưa nói (chỉ khi thầy cô cho phép: server chỉ trả về khi được phép) ---
  if (secrets.length) {
    const box = measureBox(geom.areaW);
    const blocks = secrets.map((s) => { const b = secretBlock(s); box.append(b); return b; });
    const heights = blocks.map((b) => b.getBoundingClientRect().height);
    const pages = packRows(blocks, heights, 1, 99, geom.areaHSecrets1);
    pages.forEach((rows, pi) => {
      const area = h('div', { class: 'area secrets' }, rows.map((row) => row[0]));
      book.append(page('secrets', ...chrome(t, ++pageNo),
        pi === 0 ? h('h2', { class: 'sec-title' }, 'Lời chưa nói') : null,
        pi === 0 ? h('p', { class: 'sec-note' }, `Những điều các bạn chưa dám nói trực tiếp. ${t.title || 'Thầy/Cô'} đã đồng ý cho in vào sổ.`) : null,
        area));
    });
    box.remove();
  }

  book.append(statsPage(t, cards, secrets, ++pageNo));
  return book;
}

// ---------------- Chạy ----------------
(async () => {
  await setupMock();
  if (!teacherParam) return fail('Thiếu tham số ?teacher=t01 (hoặc teacher=all). Hãy mở sổ từ trang Quản trị.');
  if (!key) return fail('Chưa có mã quản trị. Hãy mở sổ từ trang Quản trị (tab Thầy cô → Sổ Tri Ân).');

  let data;
  try {
    statusEl.textContent = 'Đang tải dữ liệu…';
    data = await api.get(`/api/admin/book/${encodeURIComponent(teacherParam)}`);
  } catch (e) {
    return fail(e.status === 401 || e.status === 403 ? 'Mã quản trị không đúng hoặc đã đổi. Hãy mở lại từ trang Quản trị.' : e.message);
  }
  // Sổ của các cây đại thụ luôn xếp cuối (CONTRACT mục 7).
  const list = [...((data && data.teachers) || [])].sort((a, b) => Number(isDaiThu(a.teacher)) - Number(isDaiThu(b.teacher)));
  if (!list.length) return fail('Không có dữ liệu thầy cô nào.');

  const name = list.length === 1 ? teacherName(list[0].teacher) : `${list.length} thầy cô`;
  titleEl.textContent = `Sổ Tri Ân – ${name}`;
  document.title = list.length === 1 ? `Sổ Tri Ân 20-11-2026 - ${teacherName(list[0].teacher)}` : `Sổ Tri Ân 20-11-2026 - ${list.length} thầy cô`;

  try { await document.fonts.ready; } catch { /* bỏ qua */ }
  await loadCardRenderer();
  geom = measureGeometry(list[0].teacher || {});

  bookEl.replaceChildren();
  let totalCards = 0;
  for (let i = 0; i < list.length; i++) {
    const label = list.length > 1 ? `Đang dựng sổ ${i + 1}/${list.length} (${teacherName(list[i].teacher)})` : 'Đang dựng sổ';
    statusEl.textContent = `${label}…`;
    const book = await buildBook(list[i], (d, n) => { if (n) statusEl.textContent = `${label} · tải ảnh ${d}/${n}`; });
    bookEl.append(book);
    totalCards += (list[i].cards || []).length;
  }
  statusEl.textContent = 'Đang tải ảnh bìa…';
  await waitImages(bookEl, (d, n) => { statusEl.textContent = `Đang kiểm tra ảnh ${d}/${n}…`; });
  const pages = bookEl.querySelectorAll('.page').length;
  statusEl.textContent = `Sẵn sàng · ${fmtNum(pages)} trang · ${fmtNum(totalCards)} thiệp`;
  printBtn.hidden = false;
  document.body.classList.add('ready');
})();
