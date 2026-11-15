// Chụp ảnh kỷ niệm: dựng "phòng chụp" riêng (sân khấu + phông 20/11), render offscreen 1080×1350
import * as THREE from 'three';
import { place, instanced, texturedPlane } from './assets.js';
import { schoolFlagTexture, softDotTexture, drawLogo, font, fitText, NAVY, ORANGE, roundRect, photoBackdropTexture } from './textures.js';

const W = 1080, H = 1350;
const POSE_T = { wave: 0.25, heart: 0.3, peace: 0.3, bow: 1.1 };

export class PhotoBooth {
  constructor({ renderer, M, backdropTex, factory, profile }) {
    this.renderer = renderer;
    this.M = M;
    this.factory = factory;
    this.profile = profile;
    this.backdropTex = backdropTex;
    this.scene = null;
    this.char = null;
    this.busy = null;
  }

  _build() {
    const M = this.M;
    const s = new THREE.Scene();
    s.add(new THREE.HemisphereLight('#FFE9C9', '#4B3A2A', 1.6));
    const key = new THREE.DirectionalLight('#FFD7A0', 2.4);
    key.position.set(2.5, 4, 5);
    s.add(key);
    const rim = new THREE.DirectionalLight('#9FC4FF', 0.9);
    rim.position.set(-3, 3, -4);
    s.add(rim);
    // camera trước, phông khớp đúng khung hình ở độ sâu z = -1.6
    this.cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 50);
    this.cam.position.set(0, 1.6, 7.6);
    this.cam.lookAt(0, 1.36, 0.15);
    // phông 20/11 làm nền toàn khung (đúng tỉ lệ 1080×1350)
    s.background = photoBackdropTexture().texture;
    // sàn gỗ
    const tiles = [];
    for (let i = -4; i <= 4; i++) for (let j = -2; j <= 3; j++) tiles.push({ x: i * 1.0, z: j * 1.0 - 0.6, s: 1, sy: 2 });
    s.add(instanced(M['holiday/floor-wood.glb'], tiles, { shadow: false }));
    // dây đèn, đèn lồng, hoa, cờ trường
    const lights = [];
    for (let x = -2.5; x <= 2.5; x += 1.0) lights.push({ x, y: 3.3, z: -1.4, s: 1 });
    s.add(instanced(M['holiday/lights-colored.glb'], lights, { shadow: false }));
    for (const sx of [-1, 1]) {
      s.add(place(M['holiday/lantern-hanging.glb'], { x: sx * 1.45, y: 3.45, z: -1.0, s: 1.0 }));
      s.add(place(M['nature/flower_redA.glb'], { x: sx * 0.95, y: 0.16, z: 0.75, s: 3 }));
      s.add(place(M['nature/flower_yellowA.glb'], { x: sx * 1.35, y: 0.16, z: 0.45, s: 3 }));
      s.add(place(M['nature/plant_bushDetailed.glb'], { x: sx * 1.75, y: 0.16, z: -0.5, s: 2 }));
      const f = texturedPlane(schoolFlagTexture().texture, 0.75, 0.5, { side: THREE.DoubleSide });
      f.position.set(sx * 1.7, 1.35, -1.0); f.rotation.y = -sx * 0.35;
      s.add(f);
    }
    // bóng mềm dưới chân
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ map: softDotTexture(), color: '#000', transparent: true, opacity: 0.45, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(0, 0.175, 0.15);
    s.add(blob);
    this.scene = s;
    this.rt = new THREE.WebGLRenderTarget(W, H, { samples: 4, colorSpace: THREE.SRGBColorSpace });
  }

  async capture({ pose = 'wave', look, name, cls } = {}) {
    if (this.busy) await this.busy.catch(() => {});
    const run = this._capture({ pose, look, name, cls });
    this.busy = run;
    try { return await run; } finally { if (this.busy === run) this.busy = null; }
  }

  async _capture({ pose, look, name, cls }) {
    if (!this.scene) this._build();
    const lookKey = JSON.stringify(look || {});
    if (!this.char || this.charKey !== lookKey) {
      if (this.char) this.char.dispose();
      this.char = await this.factory.create(look || { gender: 'nam', outfit: 0 });
      this.charKey = lookKey;
      this.char.root.position.set(0, 0.16, 0.15);
      this.scene.add(this.char.root);
    }
    const p = ['wave', 'heart', 'peace', 'bow'].includes(pose) ? pose : 'wave';
    this.char.pose(p, POSE_T[p]);
    this.char.root.rotation.y = p === 'bow' ? 0.25 : 0;
    // chờ khung hình kế để không làm giật khung chính
    await new Promise((r) => requestAnimationFrame(r));
    const r = this.renderer;
    const prevTarget = r.getRenderTarget();
    const prevShadow = r.shadowMap.autoUpdate;
    r.shadowMap.autoUpdate = false;
    r.setRenderTarget(this.rt);
    r.clear();
    r.render(this.scene, this.cam);
    r.setRenderTarget(prevTarget);
    r.shadowMap.autoUpdate = prevShadow;
    const buf = new Uint8Array(W * H * 4);
    if (r.readRenderTargetPixelsAsync) await r.readRenderTargetPixelsAsync(this.rt, 0, 0, W, H, buf);
    else r.readRenderTargetPixels(this.rt, 0, 0, W, H, buf);

    // ghép khung ảnh
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, H);
    const row = W * 4;
    for (let y = 0; y < H; y++) img.data.set(buf.subarray((H - 1 - y) * row, (H - y) * row), y * row);
    ctx.putImageData(img, 0, 0);
    // viền trắng + dải navy dưới
    ctx.lineWidth = 36; ctx.strokeStyle = '#FFFFFF';
    ctx.strokeRect(18, 18, W - 36, H - 36);
    const bandH = 210;
    ctx.fillStyle = NAVY; ctx.fillRect(36, H - 36 - bandH, W - 72, bandH);
    ctx.fillStyle = ORANGE; ctx.fillRect(36, H - 36 - bandH, W - 72, 8);
    drawLogo(ctx, 150, H - 36 - bandH / 2, 160);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    fitText(ctx, 'Tri ân thầy cô 20/11/2026', 250, H - 36 - bandH + 70, W - 330, 900, 56);
    ctx.fillStyle = ORANGE;
    const who = [name, cls].filter(Boolean).join(' · ');
    fitText(ctx, who ? `${who} · May Academy` : 'May Academy · Mùa Tri Ân', 250, H - 36 - bandH + 140, W - 330, 700, 38);
    // nhãn góc
    roundRect(ctx, W - 300, 70, 240, 64, 32);
    ctx.fillStyle = 'rgba(15,34,71,.78)'; ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = font(800, 30); ctx.textAlign = 'center';
    ctx.fillText('#TriAn2011', W - 180, 103);
    return c.toDataURL('image/jpeg', 0.92);
  }

  dispose() {
    if (this.char) this.char.dispose();
    if (this.rt) this.rt.dispose();
  }
}
