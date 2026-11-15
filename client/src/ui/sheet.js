// Bảng hoạt động: sheet trượt từ dưới lên (điện thoại) / hộp giữa màn hình (máy tính),
// lightbox xem to, toast. Đóng bằng nút X, phím Esc, chạm nền mờ hoặc vuốt xuống ở thanh tiêu đề.
import { h, clear, appendAll } from './dom.js';
import { icon } from './icons.js';

export function createOverlayHost(layer) {
  const stack = [];

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !stack.length) return;
    e.preventDefault();
    e.stopPropagation();
    stack[stack.length - 1].close();
  }, true);

  function push(entry) {
    stack.push(entry);
  }
  function remove(entry) {
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
  }

  function openSheet({ title = '', subtitle = '', iconName = '', wide = false, cls = '', onClose } = {}) {
    const titleEl = h('h2', { class: 'ma-sheet-title', id: 'ma-sheet-t' + Date.now() });
    const subEl = h('p', { class: 'ma-sheet-sub' });
    const icEl = h('div', { class: 'ma-sheet-ic' });
    const backBtn = h('button', { type: 'button', class: 'ma-iconbtn ma-sheet-back', 'aria-label': 'Quay lại', hidden: true }, icon('back'));
    const closeBtn = h('button', { type: 'button', class: 'ma-iconbtn ma-sheet-x', 'aria-label': 'Đóng' }, icon('close'));
    const head = h('header', { class: 'ma-sheet-head' }, h('div', { class: 'ma-grab', 'aria-hidden': 'true' }), backBtn, icEl, h('div', { class: 'ma-sheet-titles' }, titleEl, subEl), closeBtn);
    const body = h('div', { class: 'ma-sheet-body' });
    const foot = h('footer', { class: 'ma-sheet-foot', hidden: true });
    const panel = h('section', { class: 'ma-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleEl.id, tabindex: '-1' }, head, body, foot);
    const backdrop = h('div', { class: 'ma-backdrop' });
    const wrap = h('div', { class: `ma-sheet-wrap ${wide ? 'is-wide' : ''} ${cls}`.trim() }, backdrop, panel);
    layer.append(wrap);
    requestAnimationFrame(() => {
      wrap.classList.add('is-open');
      panel.focus({ preventScroll: true });
    });

    let closed = false;
    let backFn = null;
    const sheet = {
      el: panel,
      wrap,
      body,
      foot,
      onClose,
      setTitle(t, sub = '', ic = null) {
        titleEl.textContent = t;
        subEl.textContent = sub || '';
        subEl.hidden = !sub;
        if (ic !== null) {
          clear(icEl);
          if (ic) icEl.append(icon(ic));
          icEl.hidden = !ic;
        }
      },
      setBack(fn) {
        backFn = fn;
        backBtn.hidden = !fn;
        icEl.classList.toggle('is-hidden', !!fn);
      },
      setContent(...nodes) {
        clear(body);
        appendAll(body, nodes);
        body.scrollTop = 0;
      },
      setFooter(...nodes) {
        clear(foot);
        appendAll(foot, nodes);
        foot.hidden = !foot.childNodes.length;
      },
      scrollTop() { body.scrollTop = 0; },
      /** Bảng gần toàn màn hình (trình làm thiệp). */
      setFull(on) { wrap.classList.toggle('is-full', !!on); },
      close() {
        if (closed) return;
        closed = true;
        remove(entry);
        wrap.classList.remove('is-open');
        wrap.classList.add('is-closing');
        setTimeout(() => wrap.remove(), 280);
        try { sheet.onClose && sheet.onClose(); } catch (e) { console.error(e); }
      },
      get closed() { return closed; },
    };
    const entry = { close: () => (backFn ? backFn() : sheet.close()) };
    push(entry);
    sheet.setTitle(title, subtitle, iconName);
    backBtn.addEventListener('click', () => backFn && backFn());
    closeBtn.addEventListener('click', () => sheet.close());
    backdrop.addEventListener('click', () => sheet.close());

    // Vuốt xuống để đóng (kéo ở thanh tiêu đề)
    let drag = null;
    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || !e.isPrimary || wrap.classList.contains('is-full')) return;
      drag = { y: e.clientY, t: performance.now(), id: e.pointerId, dy: 0 };
      try { head.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
      panel.style.transition = 'none';
    });
    head.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag.dy = Math.max(0, e.clientY - drag.y);
      panel.style.transform = `translateY(${drag.dy}px)`;
    });
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { dy, t } = drag;
      drag = null;
      panel.style.transition = '';
      panel.style.transform = '';
      const v = dy / Math.max(1, performance.now() - t);
      if (dy > 110 || (dy > 40 && v > 0.6)) sheet.close();
    };
    head.addEventListener('pointerup', endDrag);
    head.addEventListener('pointercancel', endDrag);
    return sheet;
  }

  /** Lớp xem to phủ lên trên sheet. */
  function lightbox(node, { cls = '', label = 'Xem lớn', onClose } = {}) {
    const closeBtn = h('button', { type: 'button', class: 'ma-iconbtn ma-lb-x', 'aria-label': 'Đóng' }, icon('close'));
    const inner = h('div', { class: 'ma-lb-inner' }, node);
    const wrap = h('div', { class: `ma-lightbox ${cls}`.trim(), role: 'dialog', 'aria-modal': 'true', 'aria-label': label }, inner, closeBtn);
    layer.append(wrap);
    requestAnimationFrame(() => wrap.classList.add('is-open'));
    let closed = false;
    const entry = {
      close() {
        if (closed) return;
        closed = true;
        remove(entry);
        wrap.classList.remove('is-open');
        setTimeout(() => wrap.remove(), 220);
        onClose && onClose();
      },
    };
    push(entry);
    closeBtn.addEventListener('click', entry.close);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap || e.target === inner) entry.close();
    });
    return entry;
  }

  const toastBox = h('div', { class: 'ma-toasts', 'aria-live': 'polite' });
  layer.append(toastBox);
  function toast(msg, type = 'info', ms) {
    const ic = type === 'error' ? 'x' : type === 'ok' ? 'check' : 'sparkle';
    const el = h('div', { class: `ma-toast is-${type}`, role: type === 'error' ? 'alert' : 'status' }, icon(ic), h('span', null, msg));
    toastBox.append(el);
    while (toastBox.children.length > 3) toastBox.firstChild.remove();
    requestAnimationFrame(() => el.classList.add('is-in'));
    const t = setTimeout(() => dismiss(), ms || (type === 'error' ? 5200 : 3600));
    function dismiss() {
      clearTimeout(t);
      el.classList.remove('is-in');
      setTimeout(() => el.remove(), 250);
    }
    el.addEventListener('click', dismiss);
    return dismiss;
  }

  return { openSheet, lightbox, toast, get depth() { return stack.length; } };
}
