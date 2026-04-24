import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import fs from 'node:fs';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // In Vite dev, jq-web workers resolve jq.wasm relative to self.location.href
      // (e.g. http://localhost:5173/src/workers/jq.wasm), which Vite would 404.
      // This middleware intercepts ANY /**.wasm request and serves the real binary
      // with the correct MIME type so both streaming and ArrayBuffer compile paths work.
      name: 'jq-web-wasm-dev-server',
      configureServer(server) {
        const wasmPath = path.resolve('./node_modules/jq-web/jq.wasm');
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? '';
          if (url.endsWith('/jq.wasm')) {
            res.setHeader('Content-Type', 'application/wasm');
            res.setHeader('Cache-Control', 'no-cache');
            fs.createReadStream(wasmPath).pipe(res);
          } else {
            next();
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
