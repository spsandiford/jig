---
phase: 01-foundation
plan: "03"
subsystem: ui
tags: [react, typescript, jsonpath, tree-view, status-bar, vitest, testing-library]

# Dependency graph
requires:
  - phase: 01-foundation/01
    provides: AppShell layout, TreeView/StatusBar stubs with typed prop interfaces, useJsonDocument/useEditorRef hooks

provides:
  - Recursive collapsible JSON tree explorer (TreeNode + TreeView) closing NAV-01
  - JSONPath breadcrumb status bar closing NAV-02
  - JSONPath string builder utility (src/lib/jsonPath.ts)
  - Vitest + @testing-library/react test infrastructure with 22 passing tests

affects: [02-transform, all future phases using tree navigation]

# Tech tracking
tech-stack:
  added: [vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom]
  patterns:
    - "Recursive component pattern: TreeNode renders itself for nested objects/arrays"
    - "useMemo parse pattern: TreeView memoizes JSON.parse on rawJson to avoid re-parsing on re-render"
    - "Discriminated union parse result: Parsed type with empty/invalid/oversize/ok status"
    - "Optional backwards-compatible prop: StatusBarProps.rawJson is optional so AppShell needs no change"
    - "TDD RED/GREEN via vitest: tests written against non-existent files first, then implemented"

key-files:
  created:
    - src/lib/jsonPath.ts
    - src/lib/jsonPath.test.ts
    - src/components/TreeNode.tsx
    - src/components/TreeNode.test.tsx
    - src/test/setup.ts
  modified:
    - src/components/TreeView.tsx (stub replaced with full recursive implementation)
    - src/components/StatusBar.tsx (stub replaced with JSONPath + error/valid indicator)
    - vite.config.ts (vitest test config added)
    - tsconfig.app.json (vitest/globals and @testing-library/jest-dom types added)
    - tsconfig.node.json (vitest/config types added for tsc -b compatibility)
    - package.json (vitest + testing libraries added, test script added)

key-decisions:
  - "Vitest installed as test framework (no prior test infrastructure existed); triple-slash reference added to vite.config.ts for tsc -b build compatibility"
  - "StatusBarProps.rawJson added as optional prop for precise empty-state behavior; AppShell unchanged"
  - "Initial tree expand depth set to depth < 2 (root + first level auto-expanded, deeper collapsed)"
  - "2 MB size gate uses rawJson.length comparison (byte-approximate for ASCII JSON) per plan spec"

patterns-established:
  - "Recursive React component (TreeNode) uses useState(depth < 2) for auto-expand at root/first level"
  - "buildPath dispatches on typeof key === 'number' then IDENTIFIER_RE test then quoted-bracket fallback"
  - "TreeView uses discriminated union Parsed type to handle empty/invalid/oversize/ok states cleanly"
  - "StatusBar optional rawJson prop: undefined => hasContent true (backwards compat); provided => non-empty check"

requirements-completed: [NAV-01, NAV-02]

# Metrics
duration: 4min
completed: 2026-04-21
---

# Phase 01 Plan 03: Tree View + Status Bar Summary

**Recursive collapsible JSON tree (NAV-01) and JSONPath breadcrumb status bar (NAV-02) replacing stubs, with vitest TDD infrastructure and 22 passing behavioral tests**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-21T01:19:54Z
- **Completed:** 2026-04-21T01:23:17Z
- **Tasks:** 2 (Task 1 TDD: RED + GREEN commits; Task 2: feat commit)
- **Files modified:** 12

## Accomplishments

- JSONPath builder (`buildPath`) with dot/bracket/quoted-bracket notation covering all identifier edge cases
- Recursive `TreeNode` component with expand/collapse, selection highlight (`bg-[#0078d41a]`), depth-based auto-expand (depth < 2), and correct child path construction
- `TreeView` replacing stub: memoized JSON parse with 2 MB size gate, empty/invalid/oversize/valid states, root TreeNode render
- `StatusBar` replacing stub: JSONPath breadcrumb (truncated with `max-w-[70%]`), error badge (`#f44747`), "Valid JSON" (`#4ec9b0`), empty-editor empty slot
- Vitest + @testing-library/react test infrastructure (22 tests, 100% pass)
- `AppShell.tsx` untouched — zero diff
- `npx tsc --noEmit` and `npm run build` both pass

## TDD Gate Compliance

- RED commit: `e2ae46f` — `test(01-03): add failing tests for jsonPath and TreeNode (RED)`
- GREEN commit: `55717e5` — `feat(01-03): implement jsonPath builder and TreeNode recursive component (GREEN)`
- No REFACTOR phase needed — implementation matched spec exactly on first pass

## Task Commits

1. **[RED] Test infrastructure + failing tests** - `e2ae46f` (test)
2. **[GREEN] jsonPath + TreeNode implementation** - `55717e5` (feat)
3. **TreeView + StatusBar full implementations** - `a4e549c` (feat)

## Files Created/Modified

- `src/lib/jsonPath.ts` — `buildPath(parentPath, key)` with IDENTIFIER_RE, bracket, and escaped-quote notation
- `src/lib/jsonPath.test.ts` — 8 behavioral tests covering all path-building scenarios
- `src/components/TreeNode.tsx` — Recursive tree node: primitive leaf + object/array container with expand/collapse
- `src/components/TreeNode.test.tsx` — 14 behavioral tests: primitives, objects, arrays, indentation, selection
- `src/components/TreeView.tsx` — Full implementation replacing stub; imports TreeNode; handles 4 parse states
- `src/components/StatusBar.tsx` — Full implementation replacing stub; Badge error count, Valid JSON, empty slot
- `src/test/setup.ts` — Vitest jsdom setup file importing @testing-library/jest-dom
- `vite.config.ts` — Added `/// <reference types="vitest" />` and test config block
- `tsconfig.app.json` — Added `vitest/globals` and `@testing-library/jest-dom` to types
- `tsconfig.node.json` — Added `vitest/config` to types (required for `tsc -b` build)
- `package.json` — Added vitest + testing-library devDependencies + `test` script
- `package-lock.json` — Updated lockfile

## Decisions Made

- Installed vitest as test framework (none existed) — Rule 3 (blocking: TDD plan required test infrastructure)
- Added `/// <reference types="vitest" />` triple-slash directive to vite.config.ts and `vitest/config` to tsconfig.node.json to fix `tsc -b` build error (Rule 1 — auto-fix: build was broken by the test config)
- `StatusBarProps.rawJson` added as optional prop: `undefined` defaults to `hasContent = true` so existing AppShell call (`selectedPath` + `errorCount` only) continues to work without modification

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed vitest test framework and configured jsdom environment**
- **Found during:** Task 1 (TDD plan with no test infrastructure)
- **Issue:** Plan is `tdd="true"` but no test framework existed in project
- **Fix:** Installed vitest, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom, jsdom; added `test` script; created `src/test/setup.ts`
- **Files modified:** package.json, package-lock.json, vite.config.ts, tsconfig.app.json, tsconfig.node.json, src/test/setup.ts
- **Verification:** `npm test` runs all 22 tests in 1.4s
- **Committed in:** e2ae46f (RED commit, part of Task 1)

**2. [Rule 1 - Bug] Added `/// <reference types="vitest" />` and vitest/config type to fix build**
- **Found during:** Task 2 verification (`npm run build` failed)
- **Issue:** `tsc -b` compiles `vite.config.ts` via `tsconfig.node.json`; the `test` property was unknown without vitest types
- **Fix:** Added triple-slash reference to vite.config.ts; added `vitest/config` to tsconfig.node.json types
- **Files modified:** vite.config.ts, tsconfig.node.json
- **Verification:** `npm run build` exits 0
- **Committed in:** a4e549c (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking infra setup, 1 build bug)
**Impact on plan:** Both fixes were necessary for correctness. No scope creep beyond enabling TDD and fixing the build.

## Issues Encountered

None beyond the two auto-fixed deviations above.

## Known Stubs

None — all stub components in TreeView.tsx and StatusBar.tsx were fully replaced with working implementations.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All surface is read-only JSON rendering in-browser.

## AppShell Verification

`git diff src/components/AppShell.tsx` shows zero diff — AppShell.tsx is bit-for-bit identical to Plan 01 output.

## Phase 1 Requirements Status

All 10 Phase 1 requirements are now functionally live across Plans 01, 02, and 03:

- EDIT-01 through EDIT-07: Editor, file open, validation, format/repair, keyboard shortcuts — Plan 01 + Plan 02
- NAV-01: Recursive collapsible JSON tree — this plan (Plan 03)
- NAV-02: JSONPath breadcrumb in status bar — this plan (Plan 03)
- NAV-03: Status bar error count + valid indicator — this plan (Plan 03, StatusBar)

## Next Phase Readiness

- Phase 1 Foundation is complete — all 3 plans executed
- Tree navigation and editor validation are fully wired end-to-end
- Phase 2 Transform can import TreeView, StatusBar, and AppShell without modification
- The 2 MB size gate and recursive TreeNode architecture are in place for large-JSON safety

---
*Phase: 01-foundation*
*Completed: 2026-04-21*
