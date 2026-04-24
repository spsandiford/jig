---
phase: 02-transform
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/components/AppShell.tsx
  - src/components/ErrorBanner.tsx
  - src/components/ExpressionInput.tsx
  - src/components/OutputPane.tsx
  - src/components/RunButton.tsx
  - src/components/Toolbar.test.tsx
  - src/components/Toolbar.tsx
  - src/components/TransformPanel.test.tsx
  - src/components/TransformPanel.tsx
  - src/hooks/useJqWorker.test.ts
  - src/hooks/useJqWorker.ts
  - src/lib/__tests__/jqErrors.test.ts
  - src/lib/jqErrors.ts
  - src/workers/jqWorker.ts
  - vite.config.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-24
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed the complete transform feature: the `TransformPanel` component and its sub-components (`ExpressionInput`, `RunButton`, `OutputPane`, `ErrorBanner`), the `useJqWorker` hook, the `jqWorker` Web Worker, the `jqErrors` sanitizer, `Toolbar` changes for transform-tab copy support, `AppShell` wiring, and `vite.config.ts` WASM path handling.

The code is well-structured and readable. Three issues warrant attention: the Worker has no `onerror` handler (leaving the UI permanently stuck in `running: true` on an uncaught worker exception), the WASM loading promise has no rejection path (leaving `engineReady` permanently false with no user feedback if WASM fails to load), and the production WASM copy in `vite.config.ts` silently no-ops when the `dist/assets` directory does not yet exist at hook time.

---

## Warnings

### WR-01: Worker `onerror` not handled — UI can get stuck in `running: true`

**File:** `src/hooks/useJqWorker.ts:28`

**Issue:** `worker.onmessage` handles `result` and `error` message types and resets `running` in both cases. However, `worker.onerror` is never set. If the worker throws an uncaught exception (e.g., a JS runtime error inside the `onmessage` handler that escapes the `try/catch` in `jqWorker.ts`, or a WASM trap), the browser fires `ErrorEvent` on the worker object rather than posting a message. Because `running` is set to `true` before `postMessage` and only reset on a message response, an uncaught worker error leaves `running: true` permanently — the RunButton stays disabled and the spinner spins indefinitely until the page is refreshed.

**Fix:**
```ts
// In useJqWorker.ts, inside the useEffect, after assigning worker.onmessage:
worker.onerror = () => {
  setError('jq engine encountered an unexpected error.');
  setRunning(false);
};
```

---

### WR-02: WASM load failure silently leaves `engineReady` false forever

**File:** `src/workers/jqWorker.ts:6`

**Issue:** `jq.then(...)` has no `.catch()`. If the Emscripten WASM module fails to initialise (network error, Content-Security-Policy blocking WASM, corrupted file, etc.), the promise rejects silently. The worker never posts `{ type: 'ready' }`, so `engineReady` stays `false` in the hook. The `OutputPane` renders the "jq engine loading" spinner indefinitely with no error message, and the RunButton remains permanently disabled. There is no way for the user to know something went wrong.

**Fix:**
```ts
// jqWorker.ts
jq.then((jqInst) => {
  self.postMessage({ type: 'ready' });
  self.onmessage = (e: MessageEvent<RunMessage>) => {
    if (e.data.type !== 'run') return;
    const { expr, json } = e.data;
    try {
      const result = jqInst.raw(json, expr);
      self.postMessage({ type: 'result', output: result.trim() });
    } catch (err) {
      self.postMessage({ type: 'error', message: sanitizeJqError(err) });
    }
  };
}).catch((err) => {
  self.postMessage({ type: 'error', message: 'jq engine failed to load.' });
});
```

The hook's `onmessage` handler already handles `type: 'error'` — wiring that path for load failures keeps it consistent. Alternatively, introduce a new message type (`type: 'fatal'`) and surface it distinctly in the UI, but reusing `error` is the lowest-effort fix.

---

### WR-03: `closeBundle` WASM copy silently no-ops when `dist/assets` does not exist

**File:** `vite.config.ts:49`

**Issue:** The `closeBundle` hook copies `jq.wasm` into `dist/assets/` only when that directory already exists (`fs.existsSync(assetsDir)`). In a clean build the JS bundle is emitted first and `dist/assets/` should exist by the time `closeBundle` fires. However, if the build is interrupted, or Vite changes its output structure, or `assetsDir` is wrong, the copy silently does nothing. A production deployment would serve a 404 for `jq.wasm` with no build-time warning — the transform tab would never become ready.

**Fix:** Throw (or at minimum warn) when the copy cannot be performed:
```ts
closeBundle() {
  const src = path.resolve('./node_modules/jq-web/jq.wasm');
  const assetsDir = path.resolve('./dist/assets');
  if (!fs.existsSync(src)) {
    console.warn('[jq-web-wasm-path] jq.wasm not found in node_modules — skipping copy');
    return;
  }
  if (!fs.existsSync(assetsDir)) {
    // Only warn during watch mode; throw during a real production build
    // by checking `this.meta.watchMode`.
    if (!this.meta.watchMode) {
      this.error('[jq-web-wasm-path] dist/assets does not exist after bundle — jq.wasm not copied');
    }
    return;
  }
  fs.copyFileSync(src, path.join(assetsDir, 'jq.wasm'));
},
```

---

## Info

### IN-01: `formatOutput` silently falls back to compact display for multi-value jq output

**File:** `src/components/OutputPane.tsx:10-17`

**Issue:** `jq` can produce multiple newline-separated JSON values from a single run (e.g., `.[]` on an array). `formatOutput` attempts `JSON.parse(trimmed)` on the entire string. This fails for multi-value output (it is not valid JSON), so the `catch` branch returns the raw trimmed string — which is compact, not pretty-printed. Single-value output gets pretty-printed; multi-value output does not. The inconsistency may surprise users.

**Fix:** Split on newlines and pretty-print each value individually:
```ts
function formatOutput(raw: string): string {
  const lines = raw.trim().split('\n').filter(Boolean);
  return lines
    .map((line) => {
      try {
        return JSON.stringify(JSON.parse(line), null, 2);
      } catch {
        return line;
      }
    })
    .join('\n');
}
```

---

### IN-02: `sanitizeJqError` strips only the first `jq:` prefix per error

**File:** `src/lib/jqErrors.ts:12-15`

**Issue:** The second `.replace(/^jq:\s*/i, '')` call uses a non-global regex, so it only strips one leading `jq:` prefix. A message such as `"jq: jq: nested prefix"` would become `"jq: nested prefix"` rather than `"nested prefix"`. This is unlikely in practice given jq-web's actual output, and the existing test suite deliberately covers only observed patterns. No change is required unless jq-web changes its error format, but it is worth noting for future robustness.

**Fix (optional):** Use the `g` flag or a loop if double-prefixing is observed:
```ts
.replace(/^(jq:\s*)+/i, '')
```

---

_Reviewed: 2026-04-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
