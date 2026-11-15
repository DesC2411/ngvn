import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Dev: server/index.js chạy Vite ở middleware mode trên cổng 8820 (một tiến trình duy nhất).
// Build: xuất ra dist/, server production phục vụ dist/.
export default defineConfig({
  root: resolve(import.meta.dirname, 'client'),
  publicDir: resolve(import.meta.dirname, 'client/public'),
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'client/index.html'),
        admin: resolve(import.meta.dirname, 'client/admin.html'),
        teacher: resolve(import.meta.dirname, 'client/teacher.html'),
        book: resolve(import.meta.dirname, 'client/book.html'),
      },
    },
  },
});
