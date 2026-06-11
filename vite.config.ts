import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import fs from 'node:fs';

export default defineConfig({
  base: '/jig/',
  plugins: [
    react(),
    tailwindcss(),
    {
      // jq-web (Emscripten) resolves jq.wasm relative to scriptDirectory, which is
      // set from self.location.href inside the Web Worker. This differs by environment:
      //
      // Dev:  worker URL = http://host/src/workers/jqWorker.ts
      //       → scriptDirectory = http://host/src/workers/
      //       → fetches http://host/src/workers/jq.wasm  (404 without fix)
      //
      // Prod: worker URL = http://host/assets/jqWorker-HASH.js
      //       → scriptDirectory = http://host/assets/
      //       → fetches http://host/assets/jq.wasm  (404 without fix)
      //
      // Fix (dev): configureServer middleware intercepts any **.wasm request and
      //   streams the real binary. Rollup transform does not run during dev pre-bundling.
      //
      // Fix (prod): Rollup transform patches jq-web's moduleArg default to include
      //   locateFile, forcing the fetch to /jq.wasm (served from public/ → dist/).
      name: 'jq-web-wasm-path',
      // Dev: intercept any jq.wasm request and serve the real binary
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
      // Prod: workers get their own isolated Rollup build — transform hooks don't
      // propagate into it. Instead, copy jq.wasm into dist/assets/ after the build
      // so the worker can fetch it at /assets/jq.wasm (its scriptDirectory-relative path).
      closeBundle() {
        const src = path.resolve('./node_modules/jq-web/jq.wasm');
        const assetsDir = path.resolve('./dist/assets');
        if (fs.existsSync(src) && fs.existsSync(assetsDir)) {
          fs.copyFileSync(src, path.join(assetsDir, 'jq.wasm'));
        }
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
