// Người chơi khác: tạo nhân vật dùng chung mô hình (SkeletonUtils.clone), nội suy mượt, ẩn bớt khi xa/đông

export class Remotes {
  constructor(scene, factory, { maxVisible = 30, farDist = 55 } = {}) {
    this.scene = scene;
    this.factory = factory;
    this.map = new Map();
    this.maxVisible = maxVisible;
    this.farDist = farDist;
    this.sortTimer = 0;
  }

  upsert(p) {
    if (!p || p.id === undefined || p.id === null) return;
    const id = String(p.id);
    let r = this.map.get(id);
    const lookKey = JSON.stringify(p.look || {}) + '|' + (p.name || '') + '|' + (p.cls || '');
    const now = performance.now();
    if (r && r.lookKey !== lookKey) { this.remove(id); r = null; }
    if (!r) {
      r = {
        id, lookKey, char: null, removed: false,
        x: num(p.x), z: num(p.z), ry: num(p.ry),
        tx: num(p.x), tz: num(p.z), tr: num(p.ry), anim: p.anim || 'idle', seen: now, visible: true,
      };
      this.map.set(id, r);
      this.factory.create(p.look, { nameTag: { name: p.name || 'Bạn', cls: p.cls || '' } }).then((c) => {
        if (r.removed) { c.dispose(); return; }
        r.char = c;
        c.root.position.set(r.x, 0, r.z);
        c.root.rotation.y = r.ry;
        c.play(r.anim, 0);
        this.scene.add(c.root);
      }).catch(() => {});
    } else {
      r.tx = num(p.x); r.tz = num(p.z); r.tr = num(p.ry);
      r.anim = p.anim || 'idle';
      r.seen = now;
    }
  }

  remove(id) {
    id = String(id);
    const r = this.map.get(id);
    if (!r) return;
    r.removed = true;
    if (r.char) r.char.dispose();
    this.map.delete(id);
  }

  clear() { for (const id of [...this.map.keys()]) this.remove(id); }

  /** Ẩn đi mọi người (khi chụp ảnh) */
  setAllVisible(v) { for (const r of this.map.values()) if (r.char) r.char.root.visible = v && r.visible; }

  update(dt, playerPos) {
    const k = 1 - Math.exp(-dt * 10);
    this.sortTimer -= dt;
    if (this.sortTimer <= 0) {
      this.sortTimer = 0.5;
      const list = [...this.map.values()].map((r) => ({ r, d: Math.hypot(r.x - playerPos.x, r.z - playerPos.z) }));
      list.sort((a, b) => a.d - b.d);
      const h = this.hideNear;
      list.forEach(({ r, d }, i) => {
        r.visible = i < this.maxVisible && d < this.farDist && !(h && Math.hypot(r.x - h.x, r.z - h.z) < h.r);
      });
    }
    for (const r of this.map.values()) {
      const dx = r.tx - r.x, dz = r.tz - r.z;
      if (dx * dx + dz * dz > 100) { r.x = r.tx; r.z = r.tz; } // dịch chuyển xa → nhảy thẳng
      else { r.x += dx * k; r.z += dz * k; }
      let da = r.tr - r.ry;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      r.ry += da * k;
      if (!r.char) continue;
      r.char.root.visible = r.visible;
      if (!r.visible) continue;
      r.char.root.position.set(r.x, this.groundAt ? this.groundAt(r.x, r.z) : 0, r.z);
      r.char.root.rotation.y = r.ry;
      // quỳ vái ở miếu: server chỉ chuyển 'kneel'/'bow' → đứng trên chiếu thì hiện tư thế quỳ
      const mat = this.kneelSpot;
      const onMat = mat && Math.hypot(r.x - mat.x, r.z - mat.z) < 0.9;
      r.char.play(r.anim === 'kneel' ? 'kneelidle' : onMat && r.anim === 'bow' ? 'kneelbowloop' : r.anim);
      r.char.update(dt);
    }
  }
}

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
