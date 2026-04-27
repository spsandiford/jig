---
phase: 03-compare
plan: 02
subsystem: ui
tags: [react, codemirror, shadcn, tailwind, lucide, compare, json-diff]

# Dependency graph
requires:
  - phase: 02-transform
    provides: Established CodeMirrorEditor composition pattern, Toolbar FileReader pattern, ErrorBanner template
provides:
  - ParseErrorBanner: inline parse-error banner with f44747 left border and font-mono body
  - ModeToggle: pill toggle for Value/Structure diff modes with aria-pressed and disabled guard
  - ComparePaneHeader: per-pane label + FolderOpen file picker using FileReader + input reset pattern
  - ComparePaneEditor: CodeMirrorEditor composition with useMemo extensions merge and readOnly prop
  - CompareToolbar: ModeToggle + Separator + conditional Compare/Reset buttons with full tooltip copy
  - ParseErrorBannerProps, ModeToggleProps, ComparePaneHeaderProps, ComparePaneEditorProps, CompareToolbarProps

affects:
  - 03-03 (ComparePanel composes all five leaves; AppShell mounts ComparePanel)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useMemo([extraExtensions]) for stable CodeMirror extensions array — prevents editor state destruction on re-render (Pitfall 2)"
    - "readOnly prop instead of editable=false on CodeMirror — correct control pattern (Pitfall 6)"
    - "FileReader + input.value='' reset pattern — replicates Toolbar EDIT-02 for same-file re-load"
    - "Local DiffMode type alias with FIXME comment for cross-plan type import reconciliation in Plan 03"

key-files:
  created:
    - src/components/ParseErrorBanner.tsx
    - src/components/ModeToggle.tsx
    - src/components/ComparePaneHeader.tsx
    - src/components/ComparePaneEditor.tsx
    - src/components/CompareToolbar.tsx
  modified: []

key-decisions:
  - "DiffMode defined locally in ModeToggle.tsx and CompareToolbar.tsx with FIXME comments — Plan 01 (useDiff hook) runs in parallel Wave 1; Plan 03 will reconcile imports"
  - "CompareToolbar passes disabled={diffActive} to ModeToggle — mode toggle locked while diff is active per D-05"
  - "ComparePaneEditor caller (Plan 03's ComparePanel) is responsible for passing stable extraExtensions ref — documented in code"
  - "invalid-json tooltip copy: 'Fix invalid JSON before comparing' — UI-SPEC did not lock exact wording for this state; direct phrasing chosen for clarity"

patterns-established:
  - "Leaf component pattern: pure presentational, all state via props, data-testid on every interactive element"
  - "useMemo extensions merge: [...baseExtensions, ...extraExtensions] with [extraExtensions] dep array"

requirements-completed: [CMP-01, CMP-02]

# Metrics
duration: 2min
completed: 2026-04-27
---

# Phase 3 Plan 02: Compare Leaf UI Components Summary

**Five pure presentational leaf components for the Compare tab — ParseErrorBanner, ModeToggle, ComparePaneHeader, ComparePaneEditor, CompareToolbar — with exact UI-SPEC design tokens, copywriting, and data-testid hooks ready for Plan 03 composition**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-27T14:05:19Z
- **Completed:** 2026-04-27T14:07:28Z
- **Tasks:** 2
- **Files modified:** 5 created

## Accomplishments
- Built three minimal leaf components (ParseErrorBanner, ModeToggle, ComparePaneHeader) matching exact UI-SPEC tokens and copywriting
- Built two composite leaf components (ComparePaneEditor, CompareToolbar) with correct CodeMirror readOnly/extensions patterns and full tooltip copy for all five Compare states
- All 92 existing Vitest tests pass — zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Build three minimal leaves — ParseErrorBanner, ModeToggle, ComparePaneHeader** - `df0e2d0` (feat)
2. **Task 2: Build composite leaves — ComparePaneEditor and CompareToolbar** - `31d70bd` (feat)

## Files Created/Modified
- `src/components/ParseErrorBanner.tsx` - Inline error banner with border-[#f44747] left border, font-mono body, data-testid="parse-error-banner"
- `src/components/ModeToggle.tsx` - Pill toggle with bg-[#0078d4] active segment, aria-pressed, disabled guard preventing onChange
- `src/components/ComparePaneHeader.tsx` - Per-pane label + FolderOpen file picker with FileReader + input reset pattern, accept=".json,application/json,text/plain"
- `src/components/ComparePaneEditor.tsx` - CodeMirrorEditor composition with useMemo([extraExtensions]) extension merge, readOnly prop, ParseErrorBanner on parseError non-null
- `src/components/CompareToolbar.tsx` - ModeToggle + Separator + conditional Compare/Reset buttons with all five tooltip strings

## Decisions Made
- DiffMode defined locally in ModeToggle.tsx and CompareToolbar.tsx (FIXME comments) because Plan 01 (useDiff hook) runs in parallel — Plan 03 will reconcile imports to `../hooks/useDiff`
- invalid-json tooltip: "Fix invalid JSON before comparing" — chosen for direct phrasing; UI-SPEC did not lock exact wording for this state
- CompareToolbar passes disabled={diffActive} to ModeToggle — mode toggle locked while diff is active, consistent with D-05 requirement

## Deviations from Plan

None — plan executed exactly as written. DiffMode local alias was pre-authorized by plan instructions ("fall back to a local type alias").

## Known Stubs

The `DiffMode` type is defined locally in two files with FIXME comments:
- `src/components/ModeToggle.tsx:1` — `type DiffMode = 'value' | 'structure'` (intentional; Plan 03 reconciles import)
- `src/components/CompareToolbar.tsx:6` — `type DiffMode = 'value' | 'structure'` (intentional; Plan 03 reconciles import)

These stubs do not prevent the plan's goal — the type is fully correct. Plan 03 will update both imports to `from '../hooks/useDiff'` once Plan 01 lands.

## Issues Encountered
None. TypeScript clean on first attempt.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- All five leaf components are wire-ready for Plan 03's ComparePanel composition
- ComparePaneEditor accepts `extraExtensions: Extension[]` — Plan 03 passes `[diffDecorationsField, diffTheme]` from Plan 01
- All data-testid hooks are in place for ComparePanel.test.tsx in Plan 03
- No blocking concerns

---
*Phase: 03-compare*
*Completed: 2026-04-27*
