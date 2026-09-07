import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { ccoApiPlugin } from './src/server/apiPlugin.js';

export default defineConfig({
  base: './',
  plugins: [react(), ccoApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist-react',
    emptyOutDir: true,
  },
});
