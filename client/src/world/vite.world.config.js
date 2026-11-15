// Cấu hình build riêng để kiểm tra trang thử world-test.html (không đụng vite.config.js chính)
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(import.meta.dirname, '../..');
export default defineConfig({
  root,
  publicDir: resolve(root, 'public'),
  server: { port: 5199, strictPort: true, fs: { allow: [resolve(root, '..')] } },
  build: {
    outDir: process.env.WORLD_TEST_OUT || resolve(tmpdir(), 'may-academy-world-test'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: { input: { worldtest: resolve(root, 'world-test.html') } },
  },
});
