// Máy chủ May Academy – Mùa Tri Ân 20/11.
// Một tiến trình, một cổng: trang (Vite ở dev / dist ở production) + /api + WebSocket /ws.
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

const ROOT = path.resolve(import.meta.dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true }); // biến môi trường có sẵn được ưu tiên hơn .env

const PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 8820);

// ADMIN_KEY: production bắt buộc; dev thiếu thì sinh tạm
if (!process.env.ADMIN_KEY) {
  if (PROD) {
    console.error('[server] Thiếu ADMIN_KEY trong .env – không chạy production khi chưa đặt mật khẩu quản trị.');
    process.exit(1);
  }
  process.env.ADMIN_KEY = crypto.randomBytes(9).toString('base64url');
  console.log(`[server] Chưa có ADMIN_KEY, dùng mã tạm cho phiên dev này: ${process.env.ADMIN_KEY}`);
}

// TRUST_PROXY: false | true (= tin 1 lớp proxy, ví dụ nginx cùng máy) | số lớp | 'loopback' | danh sách IP
function parseTrustProxy(v) {
  if (v == null || v === '' || v === 'false' || v === '0') return false;
  if (v === 'true') return 1;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}

// Nạp sau khi đã có env (core.js đọc DATA_DIR khi import)
const { default: express } = await import('express');
const { default: compression } = await import('compression');
const { createApi, publicMedia } = await import('./api.js');
const { createGameWs } = await import('./ws.js');
const { store, DATA_DIR, getTeachers } = await import('./core.js');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
app.use(compression());

const httpServer = http.createServer(app);
const game = createGameWs();

app.use('/api', createApi({ notify: game.notify, getIp: (req) => req.ip || req.socket.remoteAddress || '?' }));
app.get('/media/:file', publicMedia);

// WebSocket: chỉ /ws vào game; các đường khác (HMR của Vite ở dev) để Vite tự xử lý
httpServer.on('upgrade', (req, socket, head) => {
  const pathname = (req.url || '').split('?')[0];
  if (pathname === '/ws') {
    game.wss.handleUpgrade(req, socket, head, (ws) => game.wss.emit('connection', ws, req));
  } else if (PROD) {
    socket.destroy();
  }
});

if (!PROD) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    configFile: path.join(ROOT, 'vite.config.js'),
    server: { middlewareMode: true, hmr: { server: httpServer } },
    appType: 'mpa',
  });
  app.use(vite.middlewares);
} else {
  const dist = path.join(ROOT, 'dist');
  if (!fs.existsSync(dist)) console.warn('[server] Chưa có dist/ – hãy chạy "npm run build" trước.');
  app.use(express.static(dist, {
    index: 'index.html',
    setHeaders(res, file) {
      const rel = path.relative(dist, file).replace(/\\/g, '/');
      if (rel.startsWith('assets/')) res.set('Cache-Control', 'public, max-age=31536000, immutable'); // file có hash
      else if (file.endsWith('.html')) res.set('Cache-Control', 'no-cache');
      else res.set('Cache-Control', 'public, max-age=3600');
    },
  }));
  app.use((req, res) => res.status(404).type('text').send('Không tìm thấy trang.'));
}

httpServer.listen(PORT, () => {
  const port = httpServer.address().port;
  console.log(`[server] May Academy chạy ở http://localhost:${port} (${PROD ? 'production' : 'dev'}), dữ liệu: ${DATA_DIR}, ${getTeachers().length} thầy cô`);
  if (process.send) process.send({ ready: true, port }); // cho selftest
});

// Tắt êm: ghi nốt dữ liệu đang chờ
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  try { store.flush(); } catch (e) { console.error(e); }
  game.close();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('message', (m) => { if (m === 'shutdown') shutdown(); });
