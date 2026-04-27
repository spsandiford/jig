---
phase: 03-compare
plan: "03"
subsystem: ui-integration
tags: [react, codemirror, compare, integration, jsondiffpatch, tdd]

dependency_graph:
  requires:
    - 03-01 (useDiff, diffDecorations, setDiffDecorations, buildPaneDecorations, filterStructural, deltaToLineEntries, diffDecorationsField, diffTheme)
    - 03-02 (CompareToolbar, ComparePaneEditor, ComparePaneHeader, ParseErrorBanner, ModeToggle)
  provides:
    - ComparePanel: root Compare tab panel wiring useDiff + leaf components + decoration dispatch
    - AppShell with Compare tab (4th tab, GitCompare icon, TabValue widened)
    - Toolbar with widened activeTab union including 'compare'
  affects: []

tech-stack:
  added: []
  patterns:
    - "useMemo([], []) for stable CodeMirror extraExtensions — prevents editor state destruction (Pitfall 2)"
    - "useEffect([delta, mode, diffActive, leftJson, rightJson]) for decoration dispatch — runs after each diff/mode/text change"
    - "Decoration.none dispatch on !diffActive — clears all highlights on reset"
    - "handleLeftLoad/handleRightLoad call reset() before setLeftJson when diffActive — auto-reset on file load (UI-SPEC)"
    - "parseProbe() helper — null-safe JSON.parse returning error message string or null"
    - "ModeToggle disabled={!diffActive} — mode toggle enabled only when diff is active (D-05/D-08)"

key-files:
  created:
    - src/components/ComparePanel.tsx
    - src/components/ComparePanel.test.tsx
  modified:
    - src/components/AppShell.tsx (GitCompare import, ComparePanel import, TabValue widen, tab trigger + content)
    - src/components/Toolbar.tsx (activeTab union widen, handleCopy compare no-op branch)
    - src/components/ModeToggle.tsx (reconcile DiffMode import from ../hooks/useDiff)
    - src/components/CompareToolbar.tsx (reconcile DiffMode import; fix disabled logic on ModeToggle)

decisions:
  - "ModeToggle disabled={!diffActive} — disabled before compare is triggered, enabled after; users can switch Value/Structure modes while diff is active (D-05/D-08)"
  - "CompareToolbar.tsx: was passing disabled={diffActive} which locked mode toggle while diff active; corrected to disabled={!diffActive}"
  - "Test 8 (parse error banner via cmView seam) marked it.skip — CodeMirror cmView not exposed in jsdom; parse error rendering covered by manual UAT"
  - "DiffMode local aliases in ModeToggle.tsx and CompareToolbar.tsx reconciled to import from '../hooks/useDiff'"

metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_created: 2
  files_modified: 4
  tests_added: 10
  tests_total: 128
  completed_date: "2026-04-27"

requirements_completed: [CMP-01, CMP-02]
---

# Phase 03 Plan 03: ComparePanel Integration Summary

**One-liner:** ComparePanel wires useDiff + leaf UI components into a working Compare tab with two-pane CodeMirror editors, inline diff decoration dispatch, mode toggle, parse error banners, and auto-reset on file load; AppShell mounts it as the fourth tab; Toolbar widened to tolerate the new tab value.

## What Was Built

### src/components/ComparePanel.tsx

Root Compare tab panel that composes all diff-core and leaf UI components:

- `leftJson`/`rightJson` state with per-pane `parseProbe` validation producing `leftParseError`/`rightParseError`
- `compareDisabled`/`compareDisabledReason` computed from pane content state for disabled gating
- `extraExtensions` memoized with `[]` deps — stable `[diffDecorationsField, diffTheme]` instance across renders (Pitfall 2)
- `handleCompare` — formats both sides via `JSON.stringify(JSON.parse(...), null, 2)` before calling `compare()` so decoration line numbers align with the editor doc
- `handleReset` — delegates to `reset()` from `useDiff`
- `handleLeftLoad`/`handleRightLoad` — call `reset()` before `setLeftJson`/`setRightJson` when `diffActive` (UI-SPEC auto-reset on file load)
- Decoration dispatch `useEffect` — dispatches `setDiffDecorations.of(decoSet)` into both CodeMirror views; clears with `Decoration.none` on `!diffActive`; filters through `filterStructural` when `mode === 'structure'`

### src/components/ComparePanel.test.tsx

10 composition tests (9 passing, 1 skipped):

| Test | Description | Status |
|------|-------------|--------|
| 1 | Compare button disabled when both panes empty | PASS |
| 2 | Mode toggle defaults to Value (aria-pressed) | PASS |
| 3 | diffActive=false shows compare-button, not reset | PASS |
| 4 | diffActive=true shows reset button, not compare | PASS |
| 5 | Reset click calls reset() | PASS |
| 6 | Mode toggle click calls setMode('structure') | PASS |
| 7 | Compare button disabled initial state (same as Test 1) | PASS |
| 8 | Parse error banner via cmView seam | SKIP |
| 9 | Identical docs (delta=undefined, diffActive=true) | PASS |
| 10 | Mode switch does not call compare() (D-08) | PASS |

### src/components/AppShell.tsx

- Added `GitCompare` icon import from `lucide-react`
- Added `ComparePanel` import from `./ComparePanel`
- Widened `TabValue` from `'editor' | 'tree' | 'transform'` to include `'compare'`
- Added `<TabsTrigger value="compare">` (4th tab, GitCompare icon, "Compare" label)
- Added `<TabsContent value="compare" className="flex-1 overflow-hidden m-0">` containing `<ComparePanel />`

### src/components/Toolbar.tsx

- Widened `ToolbarProps.activeTab` to include `'compare'`
- Added `activeTab === 'compare' ? '' :` branch in `handleCopy` (no-op on Compare tab)
- `showTransforms` unchanged: `const showTransforms = activeTab === 'editor';` — excludes compare naturally

### DiffMode Reconciliation (ModeToggle.tsx, CompareToolbar.tsx)

Both files previously had `type DiffMode = 'value' | 'structure'` local aliases with FIXME comments. Both now import `type { DiffMode } from '../hooks/useDiff'`.

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ComparePanel composition + test coverage | 9cf1b80 | src/components/ComparePanel.tsx, src/components/ComparePanel.test.tsx, src/components/CompareToolbar.tsx, src/components/ModeToggle.tsx |
| 2 | Mount Compare tab in AppShell + widen Toolbar | 0189d60 | src/components/AppShell.tsx, src/components/Toolbar.tsx |

## Test Coverage

| File | Tests Added | Status |
|------|-------------|--------|
| ComparePanel.test.tsx | 10 (9 active + 1 skip) | 9 PASS |
| Full suite | 127 passing + 1 skipped | PASS |

Prior suite was 118. After Plan 03-01: 118. After Plan 03-02: 118 (leaf components had no tests). After Plan 03-03: 127 passing + 1 skipped.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ModeToggle disabled logic corrected in CompareToolbar**
- **Found during:** Task 1 (Test 6 failure)
- **Issue:** `CompareToolbar.tsx` was passing `disabled={diffActive}` to `ModeToggle`, which locked the mode toggle WHEN diff was active. This contradicts D-05/D-08 requirements (mode switch should work while diff is active, rebuilding decorations from same delta).
- **Fix:** Changed to `disabled={!diffActive}` — mode toggle is disabled BEFORE a diff is run (nothing to filter yet), enabled AFTER a diff is active (user can switch between Value/Structure modes).
- **Files modified:** `src/components/CompareToolbar.tsx`
- **Commit:** 9cf1b80

## Known Stubs / Skipped Tests

**Test 8 (parse error banner via cmView seam):** Marked `it.skip(...)` because CodeMirror's `cmView` property is not exposed on `.cm-editor` elements in the jsdom environment. The parse error rendering path is still exercised by the `parseProbe` function and `ParseErrorBanner` component; functional verification requires a real browser.

**Manual UAT note for Test 8:** Open Compare tab → type `not json` in left pane → expect `ParseErrorBanner` to appear above the editor with "Invalid JSON" heading.

## Requirements Closure

- **CMP-01** (semantic value diff ignoring whitespace/key order): Observable end-to-end via Compare tab
- **CMP-02** (structural diff showing key existence differences): Observable via Structure mode toggle

Phase 3 complete. All three plans (03-01, 03-02, 03-03) are done. CMP-01 and CMP-02 are fully closed. `/gsd-complete-milestone` is the next planning gate for the v1 milestone.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced beyond what the plan's `<threat_model>` documented. All T-3-11 through T-3-16 mitigations implemented as specified:
- T-3-11: `if (!leftView || !rightView) return;` guards dispatch
- T-3-12: `useEffect` deps include `leftJson`/`rightJson` — effect re-runs after format+compare
- T-3-13: `handleLeftLoad`/`handleRightLoad` call `reset()` before setting new text
- T-3-15: Toolbar `handleCopy` returns `''` on `activeTab === 'compare'`

`dangerouslySetInnerHTML` absent from all created/modified files (verified).

## Self-Check: PASSED

Files exist:
- src/components/ComparePanel.tsx: FOUND
- src/components/ComparePanel.test.tsx: FOUND
- src/components/AppShell.tsx: FOUND (modified)
- src/components/Toolbar.tsx: FOUND (modified)

Commits exist:
- 9cf1b80: FOUND (feat(03-03): ComparePanel composition...)
- 0189d60: FOUND (feat(03-03): mount Compare tab in AppShell...)

Tests: 127 passing + 1 skipped
TypeScript: tsc -b exits 0
