---
phase: 02-transform
plan: 01
subsystem: worker
tags: [jq-web, wasm, web-worker, react-hook, vitest, error-handling]

requires:
  - phase: 01-foundation
    provides: Vite+React project scaffold with TypeScript, Vitest test setup, useJsonDocument hook

provides:
  - useJqWorker hook (engineReady, running, output, error, run)
  - jqWorker Web Worker (jq-web ready/result/error postMessage protocol)
  - sanitizeJqError utility (strips Emscripten prefixes, first-line only)
  - public/jq.wasm (static WASM binary served at /jq.wasm by Vite)

affects:
  - 02-02
  - 02-03

tech-stack:
  added:
    - jq-web@0.6.2 (Emscripten WASM build of jq for browser/worker)
  patterns:
    - Worker Facade pattern: jq-web runs in dedicated Web Worker, hook exposes clean async API
    - Vite ?worker import for typed Web Worker instantiation
    - vi.mock with globalThis instance capture for testing Worker-backed hooks in jsdom
    - sanitizeJqError: strip-and-first-line error normalization pattern

key-files:
  created:
    - src/workers/jqWorker.ts
    - src/hooks/useJqWorker.ts
    - src/hooks/useJqWorker.test.ts
    - src/lib/jqErrors.ts
    - src/lib/__tests__/jqErrors.test.ts
    - public/jq.wasm
  modified:
    - package.json (added jq-web dep, copy-wasm script, updated build script)
    - package-lock.json

key-decisions:
  - "Used globalThis instance capture in vi.mock factory to avoid vi.mock hoisting issues with class references"
  - "Verbatim implementation from research excerpts — no deviations from specified Worker Facade pattern"
  - "Toolbar.test.tsx pre-existing TS2352 errors are out of scope (not introduced by this plan)"

patterns-established:
  - "Worker Facade: CPU-bound WASM in dedicated Web Worker, hook owns state (engineReady/running/output/error)"
  - "Test Worker hooks by mocking ?worker import with a class that captures itself on globalThis"
  - "sanitizeJqError: replace exit-code prefix, replace jq: prefix, take first non-empty line"

requirements-completed: [XFRM-01, XFRM-02, XFRM-03]

duration: 4m 16s
completed: 2026-04-24
---

# Phase 02 Plan 01: Worker Facade Summary

**jq-web@0.6.2 WASM engine in a typed Web Worker, exposed via useJqWorker hook with ready/running/output/error state and sanitized error messages**

## Performance

- **Duration:** 4m 16s
- **Started:** 2026-04-24T12:16:35Z
- **Completed:** 2026-04-24T12:20:51Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Installed jq-web@0.6.2 with exact pin, staged WASM binary in public/ (tracked by git), wired copy-wasm into build
- Implemented `sanitizeJqError` stripping Emscripten runtime noise + 7-test RED→GREEN coverage
- Implemented jqWorker.ts Web Worker (ready/result/error protocol, try/catch for synchronous jq throws)
- Implemented useJqWorker hook (engineReady, running, output, error, run) + 9-test RED→GREEN coverage
- Total: 79 tests passing (63 baseline + 7 jqErrors + 9 useJqWorker)

## Task Commits

Each task was committed atomically:

1. **Task 1a — jq-web dep + WASM + scripts** - `d06976c` (feat)
2. **Task 1b — sanitizeJqError + 7 unit tests** - `96bd52d` (feat)
3. **Task 2 — Worker + hook + 9 unit tests** - `9e5880c` (feat)

**Plan metadata:** (see final commit below)

_Note: TDD tasks have two commits each (infrastructure → implementation)_

## Files Created/Modified

- `src/workers/jqWorker.ts` — Web Worker wrapping jq-web with ready/result/error postMessage protocol
- `src/hooks/useJqWorker.ts` — React hook: engineReady, running, output, error, run()
- `src/hooks/useJqWorker.test.ts` — 9-test suite with mocked Worker (all state transitions + unmount cleanup)
- `src/lib/jqErrors.ts` — sanitizeJqError: strip Non-zero exit code + jq: prefixes, first non-empty line
- `src/lib/__tests__/jqErrors.test.ts` — 7-test suite for error sanitization edge cases
- `public/jq.wasm` — WASM binary copied from jq-web, served at /jq.wasm by Vite
- `package.json` — jq-web@0.6.2 dependency, copy-wasm script, updated build script
- `package-lock.json` — lockfile updated

## Decisions Made

- `vi.mock` factory stores instance via `globalThis.__lastMockWorkerInstance` to avoid hoisting issues — class defined inside factory, captured through a globalThis reference accessible from test body
- Verbatim implementation from research excerpts used for both jqWorker.ts and useJqWorker.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.mock hoisting issue in useJqWorker.test.ts**
- **Found during:** Task 2 (Worker + hook tests, RED phase)
- **Issue:** Test file defined `MockWorker` class at module scope, referenced it inside `vi.mock()` factory — Vitest hoists `vi.mock` calls to the top of the file, so `MockWorker` was accessed before initialization (ReferenceError)
- **Fix:** Moved `MockWorker` class definition entirely inside the `vi.mock` factory; stored instance on `globalThis.__lastMockWorkerInstance` so tests can access it without referencing outer variables
- **Files modified:** `src/hooks/useJqWorker.test.ts`
- **Verification:** All 9 tests pass; `npx vitest run src/hooks/useJqWorker.test.ts` exits 0
- **Committed in:** `9e5880c` (Task 2 commit, amended)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test mock setup)
**Impact on plan:** Fix was necessary to make tests work in Vitest. No behavior change to production code. No scope creep.

## Issues Encountered

- Pre-existing TypeScript errors in `src/components/Toolbar.test.tsx` (TS2352: mock type mismatch with `RefObject<ReactCodeMirrorRef>`) — these pre-date this plan and are out of scope. Verified via git stash that they existed before any changes.

## Next Phase Readiness

- Worker Facade is complete and tested — Plan 02-02 (TransformPanel UI) can import `useJqWorker` immediately
- `engineReady`, `running`, `output`, `error` state exposed with stable interface shape
- `sanitizeJqError` is available for any error display in UI components
- No blockers for 02-02 or 02-03

---
*Phase: 02-transform*
*Completed: 2026-04-24*
