import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    proxy: {
      '/ws': { target: 'ws://localhost:7337', ws: true },
      '/api': { target: 'http://localhost:7337' },
      '/mcp': { target: 'http://localhost:7337' },
    },
  },
  build: {
    outDir: 'dist',
  },
});
