// Góc chụp ảnh kỷ niệm: chọn tư thế + khung → world.capturePhoto → ghép khung → tải/chia sẻ.
import { h, clear, loadImage, slug } from '../dom.js';
import { icon } from '../icons.js';
import { FRAMES, composePhoto, ensureFrameFonts } from '../photoFrame.js';

const POSES = [
  { id: 'wave', name: 'Vẫy tay', ic: 'hand' },
  { id: 'heart', name: 'Bắn tim', ic: 'heart' },
  { id: 'peace', name: 'Chữ V', ic: 'sparkle' },
  { id: 'bow', name: 'Cúi chào', ic: 'bow' },
];

export default function photoPanel(ctx, zone, sheet) {
  const profile = ctx.profile || {};
  let pose = 'wave';
  let frame = 'navy';
  let shot = null; // HTMLImageElement ảnh đã chụp
  let canvas = null;
  let objUrl = null;
  let alive = true;

  const fontsReady = ensureFrameFonts();

  function poseGrid() {
    return h('div', { class: 'ma-choicegrid is-4', role: 'radiogroup', 'aria-label': 'Tư thế' },
      POSES.map((p) => h('button', { type: 'button', role: 'radio', class: 'ma-choice', 'aria-checked': String(p.id === pose), onclick: (e) => { pose = p.id; mark(e.currentTarget); } }, icon(p.ic), h('span', null, p.name))),
    );
  }
  function frameGrid(onPick) {
    const grid = h('div', { class: 'ma-choicegrid is-3', role: 'radiogroup', 'aria-label': 'Khung ảnh' });
    for (const f of FRAMES) {
      const pic = h('span', { class: 'ma-frame-pic' });
      grid.append(h('button', { type: 'button', role: 'radio', class: 'ma-choice ma-frame', 'aria-checked': String(f.id === frame), onclick: (e) => { frame = f.id; mark(e.currentTarget); onPick && onPick(); } }, pic, h('span', null, f.name)));
      fontsReady.then(() => composePhoto(shot, f.id, profile, 216)).then((c) => { c.className = 'ma-frame-canvas'; pic.replaceChildren(c); }).catch(() => {});
    }
    return grid;
  }
  function mark(btn) {
    btn.parentElement.querySelectorAll('[role=radio]').forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
  }

  function showSetup() {
    sheet.setBack(null);
    sheet.setTitle('Góc chụp ảnh', '', 'camera');
    const shootBtn = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-block ma-btn-lg' }, icon('camera'), 'Chụp ảnh');
    shootBtn.addEventListener('click', async () => {
      const w = ctx.world;
      if (!w || typeof w.capturePhoto !== 'function') {
        ctx.toast('Máy ảnh chưa sẵn sàng, bạn thử lại sau nhé.', 'error');
        return;
      }
      shootBtn.disabled = true;
      shootBtn.classList.add('is-busy');
      sheet.wrap.classList.add('is-capturing');
      try {
        const url = await w.capturePhoto({ pose });
        if (!url) throw new Error('Chưa chụp được, bạn thử lại nhé.');
        shot = await loadImage(url);
        if (!alive) return;
        await showResult();
      } catch (e) {
        ctx.error(e && e.message ? e : new Error('Chưa chụp được, bạn thử lại nhé.'));
        shootBtn.disabled = false;
        shootBtn.classList.remove('is-busy');
      } finally {
        sheet.wrap.classList.remove('is-capturing');
      }
    });
    sheet.setContent(
      h('div', { class: 'ma-field' }, h('label', null, 'Chọn tư thế'), poseGrid()),
      h('div', { class: 'ma-field' }, h('label', null, 'Chọn khung ảnh'), frameGrid()),
    );
    sheet.setFooter(shootBtn);
  }

  async function render(target) {
    await fontsReady;
    canvas = await composePhoto(shot, frame, profile, 1080);
    if (objUrl) URL.revokeObjectURL(objUrl);
    objUrl = null;
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    if (blob) objUrl = URL.createObjectURL(blob);
    const img = h('img', { class: 'ma-photo-out', alt: 'Ảnh kỷ niệm 20/11 của bạn', src: objUrl || canvas.toDataURL('image/png') });
    clear(target).append(img);
    return blob;
  }

  async function showResult() {
    sheet.setBack(showSetup);
    sheet.setTitle('Ảnh kỷ niệm của bạn', '', 'camera');
    const out = h('div', { class: 'ma-photo-wrap' }, h('div', { class: 'ma-skel ma-skel-photo' }));
    let blob = null;
    const rerender = async () => { blob = await render(out); };
    const fileName = `may-academy-20-11-${slug(profile.name)}.png`;
    const dl = h('button', { type: 'button', class: 'ma-btn ma-btn-primary ma-btn-lg' }, icon('download'), 'Tải ảnh');
    dl.addEventListener('click', () => {
      if (!objUrl) return;
      const a = h('a', { href: objUrl, download: fileName });
      document.body.append(a);
      a.click();
      a.remove();
      ctx.toast('Đã tải ảnh về máy. Nếu không thấy, bạn nhấn giữ ảnh để lưu nhé.', 'ok');
    });
    const share = h('button', { type: 'button', class: 'ma-btn ma-btn-secondary ma-btn-lg' }, icon('share'), 'Chia sẻ');
    share.addEventListener('click', async () => {
      try {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'May Academy · Mùa Tri Ân 20/11', text: 'Tri ân thầy cô 20/11 · May Academy' });
        } else {
          ctx.toast('Máy bạn chưa hỗ trợ chia sẻ trực tiếp, hãy tải ảnh về rồi gửi nhé.');
        }
      } catch (e) {
        if (e && e.name !== 'AbortError') ctx.toast('Chưa chia sẻ được, bạn tải ảnh về nhé.', 'error');
      }
    });
    share.hidden = !(navigator.share && navigator.canShare);
    sheet.setContent(
      out,
      h('div', { class: 'ma-field' }, h('label', null, 'Đổi khung'), frameGrid(rerender)),
    );
    sheet.setFooter(
      h('div', { class: 'ma-foot-3' },
        h('button', { type: 'button', class: 'ma-btn ma-btn-ghost ma-btn-lg', onclick: showSetup, 'aria-label': 'Chụp lại' }, icon('refresh'), h('span', { class: 'ma-hide-xs' }, 'Chụp lại')),
        share,
        dl,
      ),
    );
    await rerender();
  }

  showSetup();
  return {
    onClose() {
      alive = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    },
  };
}

photoPanel.meta = () => ({ title: 'Góc chụp ảnh', icon: 'camera' });
