---
phase: 02-transform
plan: 03
subsystem: wiring
tags: [react, wiring, appshell, toolbar, integration, transform]
status: partial

requires:
  - phase: 02-transform
    plan: 01
    provides: useJqWorker hook, jqWorker Web Worker, sanitizeJqError, public/jq.wasm
  - phase: 02-transform
    plan: 02
    provides: TransformPanel, ExpressionInput, RunButton, OutputPane, ErrorBanner

provides:
  - Transform tab enabled in AppShell (no longer disabled, tooltip wrapper removed)
  - TransformPanel mounted in AppShell with rawJson from shared useJsonDocument instance
  - transformOutput state lifted to AppShell; wired to Toolbar via outputText prop
  - Toolbar handleCopy branches on activeTab === 'transform' to copy outputText ?? ''
  - 3 new Toolbar tests covering the transform Copy branch (Tests A, B, C)

affects:
  - End-user visible: Transform tab is now functional in dev + production builds

tech-stack:
  added: []
  patterns:
    - "Single useJsonDocument instance: rawJson passed as explicit prop to TransformPanel — no second isolated document state"
    - "Output lift-up via onOutputChange callback from TransformPanel to AppShell"
    - "activeTab-aware handleCopy: transform branch copies outputText ?? '', editor/tree branch copies editor doc"

key-files:
  created: []
  modified:
    - src/components/AppShell.tsx
    - src/components/Toolbar.tsx
    - src/components/Toolbar.test.tsx

key-decisions:
  - "rawJson is passed as an explicit prop to TransformPanel so there is a single useJsonDocument instance in the tree (TransformPanel's ?? fallback is never exercised in production)"
  - "Production build pipeline runs copy-wasm before every vite build (02-01); copy-wasm succeeded in this plan"
  - "Worker starts on first Transform tab visit (lazy, inside TabsContent value=transform) — accepted small startup cost"
  - "Pre-existing TS2352 mock cast errors in Toolbar.test.tsx fixed via unknown intermediate cast — tsc now exits 0"

requirements-completed: [XFRM-01, XFRM-02, XFRM-03]

duration: ~7m
completed: 2026-04-24
---

# Phase 02 Plan 03: AppShell + Toolbar Wiring Summary

**Transform tab enabled with TransformPanel mounted and Toolbar Copy routing jq output — wiring all Phase 02 pieces into a user-visible, ship-ready feature**

## Status: Task 1 Complete — Task 2 (Human Verify) Pending

Task 1 (all automated work) is complete and committed. Task 2 is a `checkpoint:human-verify` gate that the orchestrator will handle separately. The human verification requires a real browser to test actual WASM execution and production-build WASM serving (these cannot be automated in jsdom per VALIDATION.md).

## Performance

- **Duration:** ~7m
- **Completed (Task 1):** 2026-04-24
- **Tasks completed:** 1 of 2 (Task 2 is human-verify pending)
- **Files modified:** 3

## Accomplishments

**Task 1: Wire AppShell + Toolbar and add Toolbar Copy-on-Transform tests**

- Removed disabled Transform tab tooltip wrapper; replaced with enabled `<TabsTrigger>` matching Editor/Tree styling
- Added `const [transformOutput, setTransformOutput] = useState<string | null>(null)` to AppShell
- Mounted `<TransformPanel rawJson={rawJson} onOutputChange={setTransformOutput} />` in the transform `<TabsContent>`
- Added `outputText={transformOutput}` prop to `<Toolbar>` — single data flow from worker output to Copy button
- Extended `ToolbarProps` with `outputText?: string | null`; destructured in function signature
- Modified `handleCopy` to branch: `activeTab === 'transform' ? (outputText ?? '') : readDoc(editorRef, rawJson)`
- Added 3 new Toolbar tests:
  - Test A: activeTab="transform" + outputText="\"hello\"" → clipboard receives `"hello"`
  - Test B: activeTab="transform" + outputText=null → clipboard receives `""`, no error path triggered
  - Test C: activeTab="editor" + outputText="should_not_be_copied" → clipboard receives editor content, NOT outputText
- Fixed pre-existing TS2352 mock cast errors (via `unknown` intermediate cast) that were blocking `npm run build`

## Task Commits

1. **Task 1** - `8d137fd` — `feat(02-03): enable Transform tab and route Copy to jq output`

## Validation Results

- `npx tsc -b` — exits 0 (pre-existing TS2352 errors also fixed as Rule 1 auto-fix)
- `npx vitest run` — 92 tests pass (11 test files, 0 failures)
- `npm run build` — exits 0
- `dist/jq.wasm` — present (copy-wasm ran as part of build)
- Grep checks:
  - `src/components/AppShell.tsx` contains `from './TransformPanel'` ✓
  - `src/components/AppShell.tsx` contains `const [transformOutput, setTransformOutput] = useState<string | null>(null)` ✓
  - `src/components/AppShell.tsx` does NOT contain `Transform with jq — available in the next phase` ✓
  - `src/components/AppShell.tsx` does NOT contain `<TabsTrigger value="transform" disabled` ✓
  - `src/components/AppShell.tsx` contains `<TransformPanel rawJson={rawJson} onOutputChange={setTransformOutput} />` ✓
  - `src/components/AppShell.tsx` contains `outputText={transformOutput}` ✓
  - `src/components/Toolbar.tsx` contains `outputText?: string | null;` ✓
  - `src/components/Toolbar.tsx` destructures `outputText,` ✓
  - `src/components/Toolbar.tsx` contains `activeTab === 'transform'` ✓
  - `src/components/Toolbar.tsx` contains `outputText ?? ''` ✓
  - `src/components/Toolbar.test.tsx` contains 3 tests with `activeTab='transform'` or `activeTab="transform"` ✓

## Pending: Task 2 — Human Verification

Task 2 is a `checkpoint:human-verify` gate requiring manual browser verification. The orchestrator will handle this checkpoint separately.

**Verification checklist (17 steps) covers:**
- A. Development smoke test: XFRM-01/02/03 end-to-end in real browser
  - Tab enabled, engine loading → ready state transitions
  - `.users[].name` expression runs and produces correct output
  - Syntax error shows sanitized ErrorBanner (not stack trace)
  - Copy button copies jq output (not rawJson) on Transform tab
- B. Production-build WASM smoke test (RESEARCH.md Pitfall 1)
  - `npm run build && npm run preview` — GET /jq.wasm returns 200 OK
  - No 404 in Network tab; engine ready within 2s
- C. Regression: Editor tab still works; Tree tab still works; Copy on editor tab copies editor content

**Resume signal:** User responds "approved" after all 17 steps pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing TS2352 mock cast errors in Toolbar.test.tsx**
- **Found during:** Task 1 validation (`npm run build` → `tsc -b` failure)
- **Issue:** `makeMockEditorRef` returns a partial mock that TypeScript cannot safely cast to `RefObject<ReactCodeMirrorRef>` because `EditorView` has 60+ members the mock doesn't implement. The `as X` cast fails when TypeScript detects insufficient overlap.
- **Fix:** Changed `mockRef as Parameters<typeof Toolbar>[0]['editorRef']` to `mockRef as unknown as EditorRefType` (double cast via unknown) in both occurrences in `renderToolbar`. This is an intentional narrowing for test purposes only.
- **Files modified:** `src/components/Toolbar.test.tsx` (lines 49, 54)
- **Commit:** `8d137fd` (included in Task 1 commit)
- **Verification:** `npx tsc -b` exits 0; `npm run build` exits 0

## Known Stubs

None. All data flows are wired: rawJson → TransformPanel → jq Worker → output → onOutputChange → transformOutput → outputText → handleCopy.

## Threat Flags

No new security-relevant surface beyond the plan's threat model. All outputs rendered as React text content, never via `dangerouslySetInnerHTML`. Clipboard write uses plain text via `writeToClipboard` (navigator.clipboard.writeText). The handleCopy branch ensures transform output is NOT leaked to clipboard when on other tabs.

## Self-Check: PASSED

- `src/components/AppShell.tsx` — FOUND, modified
- `src/components/Toolbar.tsx` — FOUND, modified
- `src/components/Toolbar.test.tsx` — FOUND, modified (3 new tests + TS fix)
- Commit `8d137fd` — FOUND
- 92 tests passing — CONFIRMED
- `dist/jq.wasm` — PRESENT
- `npm run build` — exits 0 CONFIRMED
- `npx tsc -b` — exits 0 CONFIRMED
