// Build riêng trang thử giao diện để bắt lỗi biên dịch (không đụng dist/ chính).
//   npx vite build --config client/src/ui/vite.ui-test.config.js
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(import.meta.dirname, '../..');
export default defineConfig({
  root,
  publicDir: resolve(root, 'public'),
  logLevel: 'info',
  build: {
    outDir: resolve(process.env.UI_TEST_OUT || resolve(tmpdir(), 'may-academy-ui-test')),
    emptyOutDir: true,
    rollupOptions: { input: { 'ui-test': resolve(root, 'ui-test.html') } },
  },
});
