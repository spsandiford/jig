# Phase 2: Transform - Research

**Researched:** 2026-04-23
**Domain:** jq-web (WASM/Emscripten) + Web Worker + React 19 + Vite 8
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use **jq-web** (fiatjaf) — more battle-tested in browser environments, no WASM path validation spike required. Skipping jq-wasm (owenthereal) due to low adoption concern.
- **D-02:** Expression + Output only — Transform tab shows a jq expression input at the top and an output pane below. Input JSON is sourced from `useJsonDocument`'s `rawJson`. No third input pane.
- **D-03:** Run button only — output updates only when the user explicitly clicks Run (or keyboard equivalent). No auto-run / debounce.
- **D-04:** Error banner replaces output — when jq errors, the output pane shows a styled error state (red/amber banner). Last successful output is not retained.
- **D-05 (Claude's Discretion):** Worker Facade pattern — jq-web runs inside a dedicated Web Worker. Claude decides communication protocol (raw postMessage vs Comlink).

### Claude's Discretion

- Worker communication protocol (raw postMessage vs Comlink)
- Expression input component: CodeMirror or plain `<textarea>`
- Run button placement and keyboard shortcut (Ctrl+Enter)
- Output pane syntax highlighting for valid JSON output
- Debounce/throttle for Run button (prevent double-click spam)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| XFRM-01 | User can enter a jq expression and see live output preview (on Run) | `jq-web` v0.6.2 — `jq.then(j => j.raw(jsonStr, expr))` in Web Worker; React state for output |
| XFRM-02 | jq engine loads asynchronously with loading indicator; Run button disabled until ready | jq-web exports a Promise — engine-ready state tracked in `useJqWorker` hook; `Loader2` spinner per UI-SPEC |
| XFRM-03 | Transform errors display a clear message (not a raw jq error dump) | jq-web throws `Error` with `exitCode` and `stderr` fields; strip Emscripten prefixes, expose human-readable message |

</phase_requirements>

---

## Summary

Phase 2 wires the Transform tab by integrating `jq-web` v0.6.2 (an Emscripten WASM build of jq) inside a Web Worker, exposing it through a Worker Facade hook (`useJqWorker`), and rendering a `TransformPanel` component that reads `rawJson` from `useJsonDocument`, accepts a jq expression, and displays the result (or error) on explicit Run.

The biggest implementation subtlety is WASM file serving in Vite. `jq-web` is a CJS module that self-initializes and attempts to `fetch('jq.wasm')` relative to its script location. In production builds, Vite bundles worker scripts as blob URLs — `scriptDirectory` collapses to `''`, making the WASM fetch resolve against the origin root as `/jq.wasm`. The fix is simple: copy `node_modules/jq-web/jq.wasm` to `public/jq.wasm` so Vite serves it as a static asset at `/jq.wasm` in both dev and production. In development, Vite's `/@fs/` path serves the WASM file correctly from `node_modules` without this workaround — but the `public/` copy is still required for production consistency.

Communication protocol recommendation: **raw postMessage** over Comlink. The Worker Facade only needs two message types (run / result/error) and an "engine-ready" signal — Comlink's abstraction adds a dependency and complexity that is not justified at this scale. The facade hook manages state (engineReady, running, output, error) and posts a run message; the worker posts back result or error.

**Primary recommendation:** Install `jq-web` → copy `jq.wasm` to `public/` → implement `src/workers/jqWorker.ts` (raw postMessage) → implement `src/hooks/useJqWorker.ts` → build `TransformPanel` following the UI-SPEC exactly.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| jq execution (XFRM-01) | Browser — Web Worker | — | CPU-bound WASM; off main thread to avoid UI jank |
| Engine-ready signaling (XFRM-02) | Browser — Web Worker posts message | Browser — React state in hook | Worker signals ready; hook exposes `engineReady` boolean |
| Error message sanitization (XFRM-03) | Browser — hook/utility | — | Strip Emscripten prefixes before storing in React state |
| Expression input UI | Browser — React component | — | Controlled `<textarea>` per UI-SPEC; no server needed |
| Output display | Browser — React component | — | Read-only `<pre>` or error banner from React state |
| Toolbar Copy (Transform tab) | Browser — React component | — | `Toolbar` already handles `activeTab`; needs output ref/prop |
| WASM binary serving | CDN / Static | — | `public/jq.wasm` → served as static asset by Vite |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jq-web | 0.6.2 | Emscripten WASM build of jq; runs in browser/worker | D-01 locked; confirmed production-ready for browser use |
| React 19 | 19.2.5 | Component rendering | Already installed; no change |
| Vite | 8.0.9 | Build tool + dev server + worker bundling | Already installed; native ?worker import support |

[VERIFIED: npm registry — `npm view jq-web version` returns 0.6.2, modified 2025-03-19]
[VERIFIED: npm registry — `npm view react version` returns 19.2.5]
[VERIFIED: package.json — Vite 8.0.9 installed]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.8.0 | `Loader2` spinner icon for engine-loading indicator | UI-SPEC mandates `Loader2` at 16px (w-4 h-4) |
| shadcn Button | — | Run button component | UI-SPEC specifies shadcn `Button` for primary CTA |
| shadcn Separator | — | 1px border between expression input and output pane | Already used in Toolbar; matches `border-[#3e3e42]` |

[VERIFIED: package.json — lucide-react 1.8.0 installed]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| raw postMessage | Comlink 4.4.2 | Comlink adds RPC abstraction but costs a dependency for 2 message types; not justified |
| `<textarea>` | CodeMirror (jq syntax) | UI-SPEC explicitly specifies plain `<textarea>` for expression input; CodeMirror adds weight for minimal benefit (no jq language support in CodeMirror ecosystem anyway) |
| public/ copy of jq.wasm | vite-plugin-static-copy | Plugin is correct for large projects; for one file, manual copy is simpler and more transparent |

**Installation:**

```bash
npm install jq-web
# Then copy the WASM binary to the public directory:
cp node_modules/jq-web/jq.wasm public/jq.wasm
```

**Version verification:** [VERIFIED: npm registry]

```
jq-web: 0.6.2 (published 2025-03-19)
```

---

## Architecture Patterns

### System Architecture Diagram

```
User types jq expression
         │
         ▼
┌─────────────────────────────┐
│       TransformPanel         │
│  ExpressionInput (textarea)  │
│  RunButton (shadcn Button)   │
│  EngineLoadingIndicator      │
│  OutputPane / ErrorBanner    │
└────────┬────────────────────┘
         │ useJqWorker() hook
         │ engineReady, run(), output, error
         ▼
┌─────────────────────────────┐
│      useJqWorker hook        │
│  manages: engineReady,       │
│  running, output, error      │
│  postMessage({ type:'run' }) │
└────────┬────────────────────┘
         │ Vite ?worker import
         │ (new Worker via Vite bundling)
         ▼
┌─────────────────────────────┐
│   src/workers/jqWorker.ts    │
│  (runs in Worker thread)     │
│                              │
│  1. import jq-web → Promise  │
│  2. jq.then(resolve→ready)   │
│  3. postMessage({type:'ready'│
│  4. onmessage({ type:'run'}) │
│  5. jqInst.raw(json, expr)   │
│  6. postMessage({type:'result│
│     OR type:'error'})        │
└────────┬────────────────────┘
         │ fetch (on init)
         ▼
┌─────────────────────────────┐
│   public/jq.wasm             │
│   (static asset, /jq.wasm)  │
└─────────────────────────────┘
         │ rawJson source
         ▼
┌─────────────────────────────┐
│   useJsonDocument().rawJson  │
│   (shared document state,    │
│    set from Editor tab)      │
└─────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── workers/
│   └── jqWorker.ts          # Web Worker: jq-web init + run message handler
├── hooks/
│   ├── useJsonDocument.ts   # Existing — rawJson source
│   └── useJqWorker.ts       # New — Worker Facade hook (engineReady, run, output, error)
├── components/
│   ├── AppShell.tsx         # Modify: enable Transform tab, pass outputRef to Toolbar
│   ├── Toolbar.tsx          # Modify: Copy on transform tab copies output (not editor)
│   ├── TransformPanel.tsx   # New — root layout (expression input + output pane)
│   ├── ExpressionInput.tsx  # New — controlled textarea + Ctrl+Enter handler
│   ├── RunButton.tsx        # New — shadcn Button with loading/disabled states
│   ├── OutputPane.tsx       # New — <pre> output or ErrorBanner or EmptyState
│   └── ErrorBanner.tsx      # New — left-border error display (D-04)
└── lib/
    └── jqErrors.ts          # New — sanitizeJqError(err: Error): string
public/
└── jq.wasm                  # Copied from node_modules/jq-web/jq.wasm
```

### Pattern 1: Worker Facade (raw postMessage)

**What:** Web Worker wraps jq-web; main thread communicates via typed postMessage messages. The hook exposes a clean async API.

**When to use:** Any time WASM or CPU-bound work must stay off the main thread. Raw postMessage is sufficient for ≤5 message types.

```typescript
// Source: Vite docs — https://vite.dev/guide/features#web-workers
// src/workers/jqWorker.ts

import jq from 'jq-web';

type RunMessage = { type: 'run'; expr: string; json: string };

// jq-web exports a Promise; await it, then signal ready
jq.then((jqInst) => {
  self.postMessage({ type: 'ready' });

  self.onmessage = (e: MessageEvent<RunMessage>) => {
    if (e.data.type !== 'run') return;
    const { expr, json } = e.data;
    try {
      const result = jqInst.raw(json, expr);
      self.postMessage({ type: 'result', output: result.trim() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      self.postMessage({ type: 'error', message: sanitizeJqError(msg) });
    }
  };
});

function sanitizeJqError(raw: string): string {
  // Strip emscripten noise: "Non-zero exit code: 5\n" prefix, stderr field prefix
  return raw
    .replace(/^Non-zero exit code:\s*\d+\s*/i, '')
    .replace(/^jq:\s*/i, '')
    .split('\n')[0]
    .trim() || 'Unknown jq error';
}
```

```typescript
// Source: React docs + Vite worker import pattern
// src/hooks/useJqWorker.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import JqWorker from '../workers/jqWorker.ts?worker';

type WorkerMessage =
  | { type: 'ready' }
  | { type: 'result'; output: string }
  | { type: 'error'; message: string };

export function useJqWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new JqWorker();
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === 'ready') {
        setEngineReady(true);
      } else if (msg.type === 'result') {
        setOutput(msg.output);
        setError(null);
        setRunning(false);
      } else if (msg.type === 'error') {
        setError(msg.message);
        setOutput(null);
        setRunning(false);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = useCallback((expr: string, json: string) => {
    if (!workerRef.current || !engineReady || running) return;
    setRunning(true);
    setOutput(null);
    setError(null);
    workerRef.current.postMessage({ type: 'run', expr, json });
  }, [engineReady, running]);

  return { engineReady, running, output, error, run };
}
```

### Pattern 2: Vite Worker Import

**What:** Vite transforms `?worker` imports into Worker constructors. No manual `new URL(...)` needed.

**When to use:** Any Web Worker in a Vite project.

```typescript
// Source: https://vite.dev/guide/features#web-workers
import JqWorker from '../workers/jqWorker.ts?worker';

const worker = new JqWorker(); // Vite handles bundling + URL
```

### Pattern 3: jq-web API

**What:** jq-web exports a Promise that resolves to `{ json, raw }`. Use `raw(jsonString, filter)` for string input/output.

**When to use:** Any jq evaluation inside the worker.

```typescript
// Source: npm package inspection + README
import jq from 'jq-web';

// jq is a Promise<{ json(obj, filter): any, raw(jsonStr, filter, flags?): string }>
jq.then(jqInst => {
  // json: takes JS object, returns JS object
  const result1 = jqInst.json({ a: 1 }, '.a');  // → 1

  // raw: takes JSON string, returns raw stdout string
  const result2 = jqInst.raw('{"a":1}', '.a');   // → '1\n'

  // Errors throw: Error with .exitCode (number) and .stderr (string)
  try {
    jqInst.raw('{}', '.bad(');
  } catch (err) {
    // err.message: "Non-zero exit code: 3\n<stderr>"
    // err.exitCode: 3
    // err.stderr: "jq: 1 compile error"
  }
});
```

### Anti-Patterns to Avoid

- **Importing jq-web on the main thread:** jq-web loads a WASM binary — initialization takes 100-500ms and runs synchronously in a blocking way during eval. Always run in a Worker.
- **Calling jq-web before the Promise resolves:** The module self-initializes as `jq = jq().then(...)` but the WASM isn't ready until `.then` fires. The worker must wait for `jq.then(...)` before handling run messages.
- **Catching errors at the wrong level:** jq-web throws synchronously from `raw()` / `json()` (not as a rejected Promise) — use try/catch, not `.catch()`.
- **Displaying raw jq error messages:** Error strings include Emscripten prefixes ("Non-zero exit code: 5") and internal stack traces. Always sanitize before showing to users (XFRM-03).
- **Forgetting jq.wasm in public/:** Dev works fine via `/@fs/` but production fails silently. The `cp node_modules/jq-web/jq.wasm public/jq.wasm` step is mandatory.
- **Running jq on invalid JSON:** jq-web will throw if the input JSON is malformed. Gate the `run()` call with a JSON validity check, or catch the error and display it as a jq error.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| jq expression evaluation | Custom JSON transformer | jq-web 0.6.2 | jq language has 50+ built-ins, piping, recursion — implementing even 10% takes months |
| WASM loading & initialization | Manual WebAssembly.instantiate | jq-web's Emscripten runtime | Emscripten handles memory, filesystem shims, stdout/stderr capture |
| Worker RPC | Custom message protocol with sequence IDs | Raw postMessage (2 message types only) | At this scale (1 operation), sequence IDs add complexity with no benefit |
| JSON output pretty-printing | Custom formatter | `JSON.stringify(JSON.parse(output), null, 2)` | Standard library; jq-web already outputs valid JSON strings |

**Key insight:** The jq language is a Turing-complete data transformation language — there is no meaningful partial implementation. Use the full WASM build.

---

## Common Pitfalls

### Pitfall 1: WASM 404 in Production Build

**What goes wrong:** Production build works in dev but fails in prod with a network error fetching `jq.wasm`. The Transform tab appears to load but the engine never becomes ready.

**Why it happens:** In production, Vite bundles the worker as a blob URL (`scriptDirectory = ''`). jq-web resolves `jq.wasm` relative to `scriptDirectory`, producing a root-relative fetch to `/jq.wasm`. If `jq.wasm` isn't in `public/`, Vite doesn't include it in the build output.

**How to avoid:** Add `cp node_modules/jq-web/jq.wasm public/jq.wasm` to the setup, and include `public/jq.wasm` in the repository (or as a build step). Verify the file exists at `/jq.wasm` in the deployed build output.

**Warning signs:** Engine loading indicator never disappears; `engineReady` stays false; browser console shows `net::ERR_FILE_NOT_FOUND` for `jq.wasm`.

### Pitfall 2: Synchronous throw from jq-web raw()

**What goes wrong:** Code uses `.catch()` on the jq call and never catches errors; the worker crashes silently.

**Why it happens:** `jqInst.raw()` throws synchronously (not a Promise rejection) when the expression fails or input is invalid JSON.

**How to avoid:** Wrap `jqInst.raw()` in try/catch inside the worker's `onmessage` handler. Post `{ type: 'error', message }` on catch.

**Warning signs:** Worker stops responding after first error; no error message appears in the UI.

### Pitfall 3: Engine Not Ready Race Condition

**What goes wrong:** Run button becomes enabled before WASM is fully initialized; first run call is silently dropped.

**Why it happens:** The worker's `onmessage` handler is only registered inside the `jq.then(...)` callback. Messages posted before `ready` is received by the main thread can be handled before `jq.then` resolves.

**How to avoid:** Keep `engineReady = false` until the `{ type: 'ready' }` message is received. Disable Run button until `engineReady === true`. Queue the onmessage registration inside `jq.then()` — this is already shown in Pattern 1.

**Warning signs:** Clicking Run immediately after tab switch produces no output and no error.

### Pitfall 4: Copy Button Copies Wrong Text on Transform Tab

**What goes wrong:** The Toolbar's Copy button copies the editor JSON instead of the transform output.

**Why it happens:** The existing `handleCopy` in `Toolbar.tsx` reads from `editorRef` (the CodeMirror view). On the transform tab, `editorRef.current?.view` may be null (CodeMirror unmounted) or contain stale content.

**How to avoid:** Pass an `outputText` prop (or ref) to Toolbar representing the current transform output. When `activeTab === 'transform'`, copy from `outputText` instead of `editorRef`. See Toolbar modification in the component plan.

**Warning signs:** Pasting after Copy on Transform tab gives JSON input, not jq output.

### Pitfall 5: jq Output Trailing Newline

**What goes wrong:** Output pane shows an extra blank line at the bottom; valid-JSON detection fails because `JSON.parse('\n1\n')` works but `'\n1\n'` doesn't round-trip cleanly.

**Why it happens:** jq always appends a newline to stdout. `jqInst.raw()` returns the raw stdout including the trailing `\n`.

**How to avoid:** Call `.trim()` on the result before storing in state. `const output = jqInst.raw(json, expr).trim()`.

---

## Code Examples

Verified patterns from official sources:

### jq-web Promise API (confirmed from package source inspection)

```typescript
// Source: npm package jq-web 0.6.2 — jq.js post.js section + README
import jq from 'jq-web';

// jq is already a Promise (self-initialized), resolves to { json, raw }
jq.then((jqInst) => {
  // raw: (jsonString: string, filter: string, flags?: string[]) => string
  const out = jqInst.raw('{"name":"world"}', '.name');
  // out === '"world"\n'

  // json: (object: unknown, filter: string) => unknown
  const out2 = jqInst.json({ name: 'world' }, '.name');
  // out2 === 'world'
});
```

### Vite Worker Import (verified pattern)

```typescript
// Source: https://vite.dev/guide/features#web-workers
// In a React component or hook:
import JqWorker from '../workers/jqWorker.ts?worker';

// Creates a properly-bundled Web Worker
const worker = new JqWorker();
```

### Error Object Shape (confirmed from jq.js source)

```typescript
// Source: npm package jq-web 0.6.2 — jq.js raw() function
try {
  jqInst.raw('{}', '.bad(');
} catch (err) {
  // err is an Error instance with extra properties:
  // err.message: "Non-zero exit code: 3\njq: 1 compile error\n..."
  // err.exitCode: number (non-zero)
  // err.stderr: string (jq's stderr output)
}
```

### Error Sanitization

```typescript
// src/lib/jqErrors.ts
export function sanitizeJqError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg
    .replace(/^Non-zero exit code:\s*\d+\s*/i, '')
    .replace(/^jq:\s*/i, '')
    .split('\n')[0]
    .trim() || 'jq expression failed';
}
```

### Output JSON Detection and Formatting

```typescript
// When displaying output: try to pretty-print if valid JSON
function formatOutput(raw: string): string {
  const trimmed = raw.trim();
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return trimmed; // jq output that isn't JSON (e.g., bare numbers, strings)
  }
}
```

### Toolbar: Copy Output on Transform Tab

```typescript
// Toolbar receives outputText prop (string | null) from AppShell
// In handleCopy:
async function handleCopy() {
  const text = activeTab === 'transform'
    ? (outputText ?? '')
    : readDoc(editorRef, rawJson);
  const ok = await writeToClipboard(text);
  // ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jq-wasm (owenthereal, 18 stars) | jq-web (fiatjaf, battle-tested) | Phase 2 D-01 decision | No spike required; known to work in browsers |
| Transform tab disabled (stub) | Transform tab enabled with full panel | This phase | XFRM-01/02/03 fulfilled |
| Comlink for Worker RPC | Raw postMessage (2 message types) | Research recommendation | One less dependency; simpler mental model |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | In production, Vite blob worker URLs cause `scriptDirectory = ''` so jq-web fetches `/jq.wasm` from origin root | Pitfall 1, WASM serving | If scriptDirectory is populated differently, `public/jq.wasm` may not be needed — but the copy is harmless |
| A2 | In Vite dev, `/@fs/` path serving makes the WASM fetch work automatically from `node_modules/` | Common Pitfalls | If dev also fails, developers discover it immediately during local development |
| A3 | `jqInst.raw()` throws synchronously (not a rejected Promise) | Pitfall 2 | Confirmed by reading jq.js source: `raw()` is a synchronous function wrapping Emscripten FS calls |
| A4 | jq-web v0.6.2 works correctly in a Vite-bundled Web Worker without special Vite plugins | Standard Stack | Not tested in this codebase yet; if WASM loading fails, fallback is running jq-web on main thread (no Worker) as a degraded mode |

**Note:** A3 is treated as VERIFIED (read from source). A1, A2, A4 are ASSUMED based on Emscripten/Vite internals analysis — Wave 0 should include a smoke test that confirms WASM loads in the worker.

---

## Open Questions

1. **Does jq-web need `optimizeDeps.exclude` in Vite?**
   - What we know: jq-web is CJS; Vite pre-bundles CJS deps via esbuild by default.
   - What's unclear: Whether pre-bundling the CJS module causes the `?worker` import to break (Vite has known issues with pre-bundled CJS deps used in workers — see GitHub issue #20859).
   - Recommendation: Try without `optimizeDeps.exclude` first. If the worker fails to load, add `optimizeDeps: { exclude: ['jq-web'] }` to `vite.config.ts`. Include this as a Wave 0 spike.

2. **Should Transform panel mount lazily or eagerly?**
   - What we know: The Worker is created in `useJqWorker`'s `useEffect`. If `TransformPanel` only mounts when `activeTab === 'transform'`, the Worker starts only when the tab is first visited — adding noticeable latency on first switch.
   - What's unclear: Whether the worker should start eagerly (on app load) regardless of active tab.
   - Recommendation: Mount `TransformPanel` eagerly (always in DOM, `hidden` when not active) OR start the Worker in a top-level hook and pass `{ engineReady, run, output, error }` as props. This avoids user-visible latency on tab switch. Let the planner decide based on complexity budget.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install, build | ✓ | (running in container) | — |
| jq-web | WASM jq engine | Not yet installed | — (will be 0.6.2) | No fallback — required |
| public/ directory | Static WASM serving | ✓ | exists (favicon.svg, icons.svg present) | — |

**jq.wasm copy:** Not yet done. Requires `cp node_modules/jq-web/jq.wasm public/jq.wasm` after `npm install jq-web`. This is a Wave 0 step.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | vite.config.ts (unified config) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

**Existing baseline:** 63 tests passing across 8 files (8 test files).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| XFRM-01 | `run()` posts message to worker; output state updates on result | unit (hook) | `npx vitest run src/hooks/useJqWorker.test.ts` | ❌ Wave 0 |
| XFRM-01 | Error state updates on error message | unit (hook) | `npx vitest run src/hooks/useJqWorker.test.ts` | ❌ Wave 0 |
| XFRM-01 | `sanitizeJqError` strips emscripten prefixes | unit (lib) | `npx vitest run src/lib/jqErrors.test.ts` | ❌ Wave 0 |
| XFRM-02 | `engineReady` is false until ready message received | unit (hook) | `npx vitest run src/hooks/useJqWorker.test.ts` | ❌ Wave 0 |
| XFRM-02 | Run button disabled when `engineReady === false` | unit (component) | `npx vitest run src/components/TransformPanel.test.tsx` | ❌ Wave 0 |
| XFRM-02 | Loading indicator visible while `engineReady === false` | unit (component) | `npx vitest run src/components/TransformPanel.test.tsx` | ❌ Wave 0 |
| XFRM-03 | Error banner renders with sanitized message on error | unit (component) | `npx vitest run src/components/TransformPanel.test.tsx` | ❌ Wave 0 |
| XFRM-03 | Output pane hidden when error state active | unit (component) | `npx vitest run src/components/TransformPanel.test.tsx` | ❌ Wave 0 |

**Manual-only tests:**
- Actual WASM jq execution end-to-end (requires real browser environment; jsdom cannot instantiate WebAssembly in this setup)
- Production build WASM 404 smoke test — run `npm run build && npm run preview`, switch to Transform tab, check engine loads

### Testing Strategy for Worker Facade

The Worker cannot be instantiated in jsdom/Vitest directly. Test `useJqWorker` by mocking the `?worker` import:

```typescript
// src/hooks/useJqWorker.test.ts pattern
vi.mock('../workers/jqWorker.ts?worker', () => {
  return {
    default: class MockWorker extends EventTarget {
      onmessage: ((e: MessageEvent) => void) | null = null;
      postMessage(data: unknown) {
        if ((data as any).type === 'run') {
          // simulate worker response
          setTimeout(() => {
            this.onmessage?.({ data: { type: 'result', output: '"mocked"' } } as MessageEvent);
          }, 0);
        }
      }
      terminate() {}
    }
  };
});
```

Test `jqErrors.ts` and `TransformPanel` as standard unit tests with no special Worker setup.

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green (must be ≥63 existing + all Phase 2 tests) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/useJqWorker.test.ts` — covers XFRM-01, XFRM-02 (engine ready state, run, result, error)
- [ ] `src/lib/jqErrors.test.ts` — covers XFRM-03 (sanitization of various error message formats)
- [ ] `src/components/TransformPanel.test.tsx` — covers XFRM-02 (loading indicator), XFRM-03 (error banner)
- [ ] `npm install jq-web` + `cp node_modules/jq-web/jq.wasm public/jq.wasm`

---

## Security Domain

Security enforcement is enabled (not explicitly disabled). This phase has a limited threat surface: all operations are client-side, no network requests beyond the static WASM fetch, and no user data leaves the browser.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Browser-only tool; no auth |
| V3 Session Management | No | No session; no cookies |
| V4 Access Control | No | No multi-user, no permissions |
| V5 Input Validation | Yes (low risk) | jq-web accepts arbitrary user input; errors are caught and sanitized — no server-side exposure |
| V6 Cryptography | No | No secrets, no encryption needed |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| jq expression with very large output (amplification) | Denial of Service | Worker runs off main thread; UI remains responsive. jq-web has no configurable output limit — large outputs will be slow but won't crash the tab. Acceptable risk for a dev tool. |
| XSS via output display | Spoofing | Output displayed in `<pre>` element as text content (not `innerHTML`) — no injection risk |
| WASM from untrusted source | Tampering | `public/jq.wasm` is copied from the npm package at build time; no runtime download from CDN |

---

## Sources

### Primary (HIGH confidence)

- `npm view jq-web` — version 0.6.2 confirmed, last modified 2025-03-19
- `/tmp/jq-web-inspect/package/jq.js` — full source inspection: CJS export, WASM loading, `locateFile`, error shape, `raw()`/`json()` API, Worker detection
- `/tmp/jq-web-inspect/package/README.md` — official API reference
- `/home/node/jig/package.json` — installed stack confirmed (React 19.2.5, Vite 8.0.9, lucide-react 1.8.0)
- `/home/node/jig/vite.config.ts` — no worker config yet; `jsdom` test environment confirmed
- `https://vite.dev/guide/features#webassembly` — Vite WASM `?init` and `?url` patterns

### Secondary (MEDIUM confidence)

- WebSearch: Vite + Emscripten WASM + blob worker scriptDirectory behavior — consistent with source code analysis

### Tertiary (LOW confidence)

- A1-A4 in Assumptions Log — inferred from source + Vite internals; not E2E tested in this codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm registry verified, source inspected
- Architecture: HIGH — based on actual jq-web source analysis + Vite 8 docs
- jq-web API: HIGH — read from package source (jq.js, README)
- WASM path resolution: MEDIUM — logical deduction from source; not E2E verified in this exact setup (flagged in Open Questions)
- Pitfalls: HIGH — derived from source analysis; most are provable from code

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 (jq-web is stable; Vite 8 minor releases unlikely to break worker support)
