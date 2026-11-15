// Kho dữ liệu JSON nhỏ: giữ toàn bộ trong bộ nhớ, ghi ra data/db/*.json.
// - Ghi nguyên tử: ghi file tạm rồi rename (không bao giờ để file hỏng giữa chừng).
// - Gom ghi: mỗi file chỉ ghi tối đa 1 lần / ~500ms dù có nhiều thay đổi.
// Không dùng native module (SQLite) để triển khai lên VPS không phải build gì.
import fs from 'node:fs';
import path from 'node:path';

// Tên file → giá trị mặc định khi chưa có
const FILES = {
  cards: () => [],
  cranes: () => [],
  signatures: () => [],
  secrets: () => [],
  via: () => ({ total: 0, bySubject: {} }),
  quiz: () => ({}),          // { [teacherId]: [{ id, q, options, answer }] }
  teacherMeta: () => ({}),   // { [teacherId]: { token, reply, includeSecretsInBook } }
  settings: () => ({}),      // ghi đè config.json (autoApprove, submissionsCloseAt)
};

const DEBOUNCE_MS = 500;

export function openStore(dbDir) {
  fs.mkdirSync(dbDir, { recursive: true });
  const data = {};
  const timers = {};

  for (const [name, def] of Object.entries(FILES)) {
    const file = path.join(dbDir, name + '.json');
    let value = def();
    try {
      if (fs.existsSync(file)) value = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      // File hỏng (hiếm vì ghi nguyên tử) → giữ bản lỗi để cứu, dùng mặc định
      console.error(`[store] Không đọc được ${file}: ${e.message}. Đổi tên thành .broken`);
      try { fs.renameSync(file, file + '.' + Date.now() + '.broken'); } catch {}
    }
    data[name] = value;
  }

  function writeNow(name) {
    const file = path.join(dbDir, name + '.json');
    const tmp = file + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data[name]));
    // Windows đôi khi khoá file (antivirus) → thử lại vài lần
    for (let i = 0; ; i++) {
      try { fs.renameSync(tmp, file); return; } catch (e) {
        if (i >= 5) throw e;
        const until = Date.now() + 20 * (i + 1);
        while (Date.now() < until) { /* chờ ngắn */ }
      }
    }
  }

  // Đánh dấu cần ghi; ghi sau DEBOUNCE_MS
  function save(name) {
    if (!(name in FILES)) throw new Error('store: không có ' + name);
    if (timers[name]) return;
    timers[name] = setTimeout(() => {
      delete timers[name];
      try { writeNow(name); } catch (e) { console.error(`[store] Lỗi ghi ${name}:`, e.message); }
    }, DEBOUNCE_MS);
  }

  // Ghi ngay mọi thứ đang chờ (khi tắt server)
  function flush() {
    for (const name of Object.keys(timers)) {
      clearTimeout(timers[name]);
      delete timers[name];
      try { writeNow(name); } catch (e) { console.error(`[store] Lỗi ghi ${name}:`, e.message); }
    }
  }

  return { data, save, flush };
}
