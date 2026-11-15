// Điều khiển: bàn phím + chuột (máy tính); joystick ảo nửa trái, vuốt nửa phải, chụm 2 ngón để zoom (điện thoại)
export class Controls {
  constructor(container, { onInteract } = {}) {
    this.el = container;
    this.enabled = true;
    this.keys = new Set();
    this.move = { x: 0, y: 0, run: false }; // x: phải +, y: tiến +
    this.yaw = 0;          // góc camera quanh trục y
    this.pitch = 0.32;     // góc ngẩng
    this.dist = 7.5;       // khoảng cách camera
    this.minDist = 2.6; this.maxDist = 16;
    this.onInteract = onInteract || (() => {});
    this.joy = null;       // {id, ox, oy, x, y}
    this.look = new Map(); // pointerId -> {x,y}
    this.pinch = null;
    this.mouseDrag = null;
    this.isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

    container.style.touchAction = 'none';
    this._buildJoystick();

    this._kd = (e) => this._key(e, true);
    this._ku = (e) => this._key(e, false);
    this._blur = () => this.reset();
    this._pd = (e) => this._down(e);
    this._pm = (e) => this._moveP(e);
    this._pu = (e) => this._up(e);
    this._wheel = (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.dist = clamp(this.dist * (1 + Math.sign(e.deltaY) * 0.1), this.minDist, this.maxDist);
    };
    this._ctx = (e) => e.preventDefault();
    window.addEventListener('keydown', this._kd);
    window.addEventListener('keyup', this._ku);
    window.addEventListener('blur', this._blur);
    container.addEventListener('pointerdown', this._pd);
    window.addEventListener('pointermove', this._pm);
    window.addEventListener('pointerup', this._pu);
    window.addEventListener('pointercancel', this._pu);
    container.addEventListener('wheel', this._wheel, { passive: false });
    container.addEventListener('contextmenu', this._ctx);
  }

  _buildJoystick() {
    const base = document.createElement('div');
    const knob = document.createElement('div');
    Object.assign(base.style, {
      position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', left: '0', top: '0',
      background: 'radial-gradient(circle, rgba(15,34,71,.18) 0%, rgba(15,34,71,.38) 70%)',
      border: '2px solid rgba(255,255,255,.55)', boxShadow: '0 4px 14px rgba(0,0,0,.25)',
      transform: 'translate(-50%,-50%)', pointerEvents: 'none', display: 'none', zIndex: '5',
    });
    Object.assign(knob.style, {
      position: 'absolute', width: '52px', height: '52px', borderRadius: '50%', left: '50%', top: '50%',
      background: 'radial-gradient(circle at 35% 35%, #FFD49A, #E9973B)', border: '2px solid #fff',
      transform: 'translate(-50%,-50%)', boxShadow: '0 2px 8px rgba(0,0,0,.35)',
    });
    base.appendChild(knob);
    // gợi ý tĩnh (chỉ trên điện thoại)
    const hint = document.createElement('div');
    Object.assign(hint.style, {
      position: 'absolute', left: '28px', bottom: '28px', width: '96px', height: '96px', borderRadius: '50%',
      border: '2px dashed rgba(255,255,255,.55)', background: 'rgba(15,34,71,.12)', pointerEvents: 'none',
      display: this.isTouch ? 'block' : 'none', zIndex: '4',
    });
    const hk = document.createElement('div');
    Object.assign(hk.style, { position: 'absolute', left: '50%', top: '50%', width: '36px', height: '36px', borderRadius: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(233,151,59,.55)', border: '2px solid rgba(255,255,255,.7)' });
    hint.appendChild(hk);
    if (getComputedStyle(this.el).position === 'static') this.el.style.position = 'relative';
    this.el.appendChild(hint);
    this.el.appendChild(base);
    this.joyBase = base; this.joyKnob = knob; this.joyHint = hint;
  }

  _key(e, down) {
    const tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || (e.target && e.target.isContentEditable)) return;
    const k = e.code;
    if (down && k === 'KeyE' && this.enabled && !e.repeat) { this.onInteract(); return; }
    if (k === 'Space') {
      if (!this.enabled) return;
      e.preventDefault(); // không cuộn trang / không bấm nút đang focus
      if (down && !e.repeat) this.jumpQueued = true;
      return;
    }
    const tracked = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'];
    if (!tracked.includes(k)) return;
    if (down && !this.enabled) return;
    if (down) this.keys.add(k); else this.keys.delete(k);
    if (/Arrow/.test(k) && this.enabled) e.preventDefault();
  }

  _down(e) {
    if (!this.enabled) return;
    const r = this.el.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (e.pointerType === 'mouse') {
      if (e.button === 0 || e.button === 2) {
        this.mouseDrag = { x: e.clientX, y: e.clientY };
        this.el.setPointerCapture?.(e.pointerId);
      }
      return;
    }
    // chạm
    if (x < r.width / 2 && !this.joy) {
      this.joy = { id: e.pointerId, ox: x, oy: y, x: 0, y: 0 };
      this.joyBase.style.display = 'block';
      this.joyBase.style.left = x + 'px';
      this.joyBase.style.top = y + 'px';
      this.joyKnob.style.left = '50%'; this.joyKnob.style.top = '50%';
      this.joyHint.style.display = 'none';
    } else {
      this.look.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.look.size === 2) {
        const [a, b] = [...this.look.values()];
        this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: this.dist };
      }
    }
  }

  _moveP(e) {
    if (!this.enabled) return;
    if (e.pointerType === 'mouse') {
      if (!this.mouseDrag) return;
      const dx = e.clientX - this.mouseDrag.x, dy = e.clientY - this.mouseDrag.y;
      this.mouseDrag.x = e.clientX; this.mouseDrag.y = e.clientY;
      this.rotate(dx, dy, 0.005);
      return;
    }
    if (this.joy && e.pointerId === this.joy.id) {
      const r = this.el.getBoundingClientRect();
      let dx = e.clientX - r.left - this.joy.ox, dy = e.clientY - r.top - this.joy.oy;
      const max = 52, len = Math.hypot(dx, dy);
      if (len > max) { dx *= max / len; dy *= max / len; }
      this.joy.x = dx / max; this.joy.y = -dy / max;
      this.joyKnob.style.left = `calc(50% + ${dx}px)`;
      this.joyKnob.style.top = `calc(50% + ${dy}px)`;
      return;
    }
    const p = this.look.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (this.look.size >= 2 && this.pinch) {
      const [a, b] = [...this.look.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      this.dist = clamp(this.pinch.dist * (this.pinch.d / Math.max(20, d)), this.minDist, this.maxDist);
    } else {
      this.rotate(dx, dy, 0.0075);
    }
  }

  _up(e) {
    if (e.pointerType === 'mouse') { this.mouseDrag = null; return; }
    if (this.joy && e.pointerId === this.joy.id) {
      this.joy = null;
      this.joyBase.style.display = 'none';
      if (this.isTouch) this.joyHint.style.display = 'block';
    }
    this.look.delete(e.pointerId);
    if (this.look.size < 2) this.pinch = null;
  }

  /** Nút "Nhảy" trên điện thoại gọi hàm này */
  requestJump() { if (this.enabled) this.jumpQueued = true; }
  /** Lấy và xoá lệnh nhảy đang chờ */
  consumeJump() { const j = this.jumpQueued; this.jumpQueued = false; return !!j; }

  rotate(dx, dy, k) {
    this.yaw -= dx * k;
    this.pitch = clamp(this.pitch + dy * k, -0.05, 1.25);
  }

  reset() {
    this.keys.clear();
    this.jumpQueued = false;
    this.joy = null; this.look.clear(); this.pinch = null; this.mouseDrag = null;
    this.joyBase.style.display = 'none';
    this.move.x = this.move.y = 0; this.move.run = false;
  }

  setEnabled(v) {
    this.enabled = !!v;
    if (!this.enabled) this.reset();
    this.joyHint.style.display = this.enabled && this.isTouch ? 'block' : 'none';
  }

  /** Tính hướng di chuyển hiện tại. */
  poll() {
    let x = 0, y = 0, run = false;
    if (this.enabled) {
      const K = this.keys;
      if (K.has('KeyW') || K.has('ArrowUp')) y += 1;
      if (K.has('KeyS') || K.has('ArrowDown')) y -= 1;
      if (K.has('KeyD') || K.has('ArrowRight')) x += 1;
      if (K.has('KeyA') || K.has('ArrowLeft')) x -= 1;
      run = K.has('ShiftLeft') || K.has('ShiftRight');
      if (this.joy) {
        x += this.joy.x; y += this.joy.y;
        if (Math.hypot(this.joy.x, this.joy.y) > 0.92) run = true;
      }
    }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    this.move.x = x; this.move.y = y; this.move.run = run;
    return this.move;
  }

  dispose() {
    window.removeEventListener('keydown', this._kd);
    window.removeEventListener('keyup', this._ku);
    window.removeEventListener('blur', this._blur);
    this.el.removeEventListener('pointerdown', this._pd);
    window.removeEventListener('pointermove', this._pm);
    window.removeEventListener('pointerup', this._pu);
    window.removeEventListener('pointercancel', this._pu);
    this.el.removeEventListener('wheel', this._wheel);
    this.el.removeEventListener('contextmenu', this._ctx);
    this.joyBase.remove(); this.joyHint.remove();
  }
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
