import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // jq-web uses scriptDirectory (worker's self.location.href) to resolve jq.wasm.
      // In Vite dev, workers run at /@fs/.../src/workers/ — not the origin root.
      // Patching the default moduleArg to include locateFile forces /jq.wasm (served
      // from public/) in all environments: dev, production blob-URL workers, and
      // production file-URL workers alike.
      name: 'jq-web-wasm-path',
      transform(code: string, id: string) {
        if (id.includes('node_modules/jq-web/jq.js')) {
          return code.replace(
            'async function(moduleArg = {})',
            `async function(moduleArg = { locateFile: (p: string) => p === 'jq.wasm' ? '/jq.wasm' : p })`
          );
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
