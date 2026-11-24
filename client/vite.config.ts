import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const backend = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@shared': path.resolve(__dirname, '../backend/src/shared') } },
  publicDir: false,
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: { '/api': backend, '/uploads': backend, '/fonts': backend }
  },
  build: { outDir: 'dist', emptyOutDir: true }
});
