---
phase: 03-compare
plan: "01"
subsystem: diff-core
tags: [diff, codemirror, jsondiffpatch, hook, utility, tdd]
dependency_graph:
  requires: []
  provides:
    - setDiffDecorations (StateEffectType<DecorationSet>)
    - diffDecorationsField (StateField<DecorationSet>)
    - diffTheme (Extension — dark theme for diff CSS classes)
    - buildPaneDecorations (doc, entries → DecorationSet)
    - filterStructural (delta → structural-only delta)
    - deltaToLineEntries (delta, formattedJson, side → DiffLineEntry[])
    - useDiff (React hook: delta, mode, diffActive, compare, reset, setMode)
    - DiffMode type
    - UseDiffReturn interface
    - DiffLineType type
    - DiffLineEntry interface
  affects:
    - 03-02 (imports diffDecorationsField + diffTheme + DiffLineType for ComparePaneEditor extensions prop)
    - 03-03 (imports all pure utilities + useDiff for ComparePanel)
tech_stack:
  added:
    - jsondiffpatch@0.7.3
  patterns:
    - TDD red-green per task
    - CodeMirror StateField + StateEffect for externally-controlled decorations
    - RangeSetBuilder with sorted entries (Pitfall 1 avoidance)
    - EditorView.baseTheme for CSS class injection
    - useCallback for stable hook function references
key_files:
  created:
    - src/lib/diffDecorations.ts
    - src/lib/diffDecorations.test.ts
    - src/hooks/useDiff.ts
    - src/hooks/useDiff.test.ts
  modified:
    - package.json (jsondiffpatch dependency added)
    - package-lock.json
decisions:
  - "findLineForPath uses (pathIdx + 1) * 2 indent formula — top-level JSON keys sit inside root `{` so they start at 2 spaces indent, not 0"
  - "filterStructural re-attaches _t marker only when the nested container has surviving non-marker children — prevents phantom array containers"
  - "useDiff.setMode wrapped in useCallback for stable reference even though it only calls setModeState"
metrics:
  duration_minutes: 4
  tasks_completed: 2
  files_created: 4
  files_modified: 2
  tests_added: 26
  tests_total: 118
  completed_date: "2026-04-27"
requirements_completed: [CMP-01, CMP-02]
---

# Phase 03 Plan 01: Diff Core (diffDecorations + useDiff) Summary

**One-liner:** jsondiffpatch@0.7.3 installed; pure-function diff utilities (StateField, theme, filterStructural, buildPaneDecorations, deltaToLineEntries) and useDiff React hook shipped with 26 TDD unit tests.

## What Was Built

### src/lib/diffDecorations.ts

Pure utility module for CodeMirror diff integration:

- `setDiffDecorations` — `StateEffect<DecorationSet>` for externally dispatching decoration sets into an editor pane
- `diffDecorationsField` — `StateField<DecorationSet>` that holds/provides decorations; maps through document changes and applies incoming effects
- `diffTheme` — `EditorView.baseTheme` extension injecting three CSS classes: `.cm-diff-removed` (`#4b1818`), `.cm-diff-added` (`#1a3a1a`), `.cm-diff-changed` (`#3a2a00`)
- `buildPaneDecorations(doc, entries)` — builds a sorted `DecorationSet` from line entries; drops out-of-range lines; sorts before building to satisfy RangeSetBuilder constraint
- `filterStructural(delta)` — keeps only added (`[v]`) and deleted (`[v,0,0]`) delta entries; drops modified (`[a,b]`); recurses into nested object deltas; re-attaches `_t` array markers only when container has surviving children
- `deltaToLineEntries(delta, formattedJson, side)` — walks a jsondiffpatch delta tree, finds 1-based line numbers in formatted JSON text using indent-depth matching, applies side filter (added → right only, removed → left only, changed → both)

### src/hooks/useDiff.ts

React hook encapsulating diff state:

- `compare(leftJson, rightJson)` — parses both, calls `jsondiffpatch.diff()`, stores delta, sets `diffActive=true`; throws `SyntaxError` to caller on invalid JSON
- `reset()` — clears delta to `undefined`, sets `diffActive=false`
- `setMode(m)` — updates mode without touching delta or diffActive
- Initial state: `delta=undefined`, `mode='value'`, `diffActive=false` (D-06)

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | diffDecorations utility + jsondiffpatch install | c7d35fe | package.json, package-lock.json, src/lib/diffDecorations.ts, src/lib/diffDecorations.test.ts |
| 2 | useDiff hook with TDD coverage | 160e968 | src/hooks/useDiff.ts, src/hooks/useDiff.test.ts |

## Test Coverage

| Describe | Tests | Status |
|----------|-------|--------|
| filterStructural | 7 | PASS |
| buildPaneDecorations | 4 | PASS |
| deltaToLineEntries | 6 | PASS |
| useDiff | 9 | PASS |
| **Total added** | **26** | — |
| Full suite | 118 | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] findLineForPath indent formula corrected**
- **Found during:** Task 1 GREEN phase (5 deltaToLineEntries tests failed)
- **Issue:** The plan's `<line_walker_algorithm>` specified `expectedIndent = pathIdx * 2` for matching JSON keys. However, JSON keys inside a root object `{...}` are at indent 2 (one level deep), not indent 0. A top-level key at `pathIdx=0` needs indent 2, not 0. The formula `pathIdx * 2` yields 0 for the first path segment, which never matches.
- **Fix:** Changed formula to `(pathIdx + 1) * 2`. Top-level keys match at indent 2; nested keys at indent 4, etc.
- **Files modified:** `src/lib/diffDecorations.ts`
- **Commit:** c7d35fe

**2. [Rule 1 - Bug] Unused variable in test file caused TypeScript error**
- **Found during:** Task 1 Step 6 (`npx tsc -b`)
- **Issue:** Test 2.4 had an unused `doc` variable (5-line doc defined then immediately replaced by `doc3`)
- **Fix:** Removed the unused variable declaration
- **Files modified:** `src/lib/diffDecorations.test.ts`
- **Commit:** c7d35fe

## Known Algorithmic Limitations (for Plan 03's awareness)

1. **findLineForPath — key-name collision at same depth:** The walker advances `pathIdx` greedily on the first matching key at the expected indent level. If two sibling objects at the same depth both contain a key with the same name (e.g., `{ "a": { "x": 1 }, "b": { "x": 2 } }` where both `x` keys changed), the walker may match the wrong `x`. This is the V1 documented limitation from RESEARCH.md Open Questions #1.

2. **findArrayElementLine — V1 heuristic:** Array element line = `parentLine + idx + 1`. This works for flat arrays of scalars. Arrays with multi-line nested objects will produce shifted line numbers. Documented as V1 limitation.

3. **filterStructural and empty nested containers:** When a nested array delta has only modified entries (all filtered out), the container key is also dropped. This is correct behavior but means the parent key disappears entirely from the filtered delta — Plan 03 should not expect a sparse container in that case.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All processing is in-browser pure functions. The `useDiff` hook propagates `SyntaxError` from `JSON.parse` to callers — no threat surface change from plan's `<threat_model>`. `dangerouslySetInnerHTML` is absent from all new files (verified: grep clean).

## Known Stubs

None — all exports are fully implemented and unit-tested. No placeholder data flows to UI rendering (this plan is headless; no UI components).

## Self-Check: PASSED

Files exist:
- src/lib/diffDecorations.ts: FOUND
- src/lib/diffDecorations.test.ts: FOUND
- src/hooks/useDiff.ts: FOUND
- src/hooks/useDiff.test.ts: FOUND

Commits exist:
- c7d35fe: FOUND (feat(03-01): diffDecorations utility + jsondiffpatch install)
- 160e968: FOUND (feat(03-01): useDiff hook with TDD coverage)

Tests: 118/118 passing
TypeScript: tsc -b exits 0
