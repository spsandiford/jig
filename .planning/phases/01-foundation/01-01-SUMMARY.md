---
phase: 01-foundation
plan: 01
subsystem: ui
tags: [react, vite, tailwind, codemirror, shadcn, typescript, scaffolding]

# Dependency graph
requires: []
provides:
  - Vite 8 + React 19 + TypeScript SPA at repo root with full dev/build pipeline
  - Tailwind v4 design system with dark palette CSS custom properties
  - shadcn/ui components: Tabs, Button, Tooltip, Badge, Separator (via @base-ui/react)
  - CodeMirrorEditor wrapper with JSON lint (EDIT-03), paste/type (EDIT-01), Ctrl+F search (NAV-03)
  - useJsonDocument hook: single rawJson string source of truth shared across all tabs
  - useEditorRef hook: typed ref for CodeMirror EditorView toolbar dispatch
  - AppShell layout: tab bar (Editor/Tree/disabled Transform) + toolbar row + content panel + status bar
  - Toolbar, TreeView, StatusBar typed stubs with correct prop signatures for Plans 02 and 03
  - TreeErrorBoundary class component wrapping TreeView

affects: [01-02, 01-03, phase-02, phase-03]

# Tech tracking
tech-stack:
  added:
    - react@19.2.5
    - react-dom@19.2.5
    - vite@8.0.9
    - "@vitejs/plugin-react@6.0.1"
    - typescript@5.8.3
    - tailwindcss@4.2.3
    - "@tailwindcss/vite@4.2.3"
    - "@uiw/react-codemirror@4.25.9"
    - "@codemirror/lang-json@6.0.2"
    - "@codemirror/lint@6.9.5"
    - "@codemirror/search@6.6.0"
    - "@codemirror/view@6.41.1"
    - "@codemirror/state@6.6.0"
    - "@uiw/codemirror-theme-vscode@4.25.9"
    - jsonrepair@3.14.0
    - lucide-react@1.8.0
    - shadcn@4.3.1 (CLI, not runtime)
    - "@base-ui/react@1.4.1 (installed by shadcn as tooltip primitive)"
  patterns:
    - Single rawJson string as shared state via useJsonDocument hook
    - CodeMirror semi-controlled component (value on programmatic updates, onChange for user input)
    - JSON lint error count surfaced via diagnosticCount updateListener -> React state -> StatusBar
    - Path alias @/* -> ./src/* in both tsconfig and vite.config.ts
    - Class error boundary wrapping third-party-dependent tree component

key-files:
  created:
    - src/components/AppShell.tsx
    - src/components/CodeMirrorEditor.tsx
    - src/components/Toolbar.tsx
    - src/components/TreeView.tsx
    - src/components/StatusBar.tsx
    - src/components/TreeErrorBoundary.tsx
    - src/components/ui/tabs.tsx
    - src/components/ui/button.tsx
    - src/components/ui/tooltip.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/separator.tsx
    - src/hooks/useJsonDocument.ts
    - src/hooks/useEditorRef.ts
    - src/lib/utils.ts
    - components.json
    - vite.config.ts
    - tsconfig.app.json
    - tsconfig.json
    - package.json
    - src/index.css
  modified: []

key-decisions:
  - "Used @base-ui/react (Base UI) for tooltip instead of @radix-ui/react-tooltip — shadcn 4.x defaults to Base UI"
  - "TooltipTrigger uses render prop API (render={<span />}) instead of Radix asChild pattern"
  - "shadcn init adds tw-animate-css, @fontsource-variable/geist, and @base-ui/react as deps — kept as-is"
  - "lucide-react@1.8.0 installed as standalone package (shadcn did not install it automatically)"

patterns-established:
  - "Pattern: AppShell owns all shared state; sub-components receive props only, never reach up"
  - "Pattern: useJsonDocument returns { rawJson, setRawJson, onChange } — onChange is memoized"
  - "Pattern: Toolbar/TreeView/StatusBar are typed stubs replaced in-place by Plans 02 and 03"
  - "Pattern: TreeErrorBoundary wraps any component that calls JSON.parse to prevent render crashes"

requirements-completed: [EDIT-01, EDIT-03, NAV-03]

# Metrics
duration: 6min
completed: 2026-04-21
---

# Phase 01 Plan 01: Foundation Scaffold Summary

**Vite 8 + React 19 SPA with CodeMirror 6 JSON editor (lint squiggles + Ctrl+F search), dark VS Code shell, and typed stubs establishing the shared-state architecture for Plans 02 and 03**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-21T01:09:37Z
- **Completed:** 2026-04-21T01:15:38Z
- **Tasks:** 3
- **Files modified:** 24 (created)

## Accomplishments

- Greenfield SPA scaffolded with all Phase 1 dependencies at pinned versions (React 19.2.5, Vite 8.0.9, TypeScript 5.8.3, tailwindcss 4.2.3, @uiw/react-codemirror 4.25.9)
- Full dark-themed AppShell layout: 36px tab bar (Editor/Tree/disabled Transform), 36px toolbar row, flex-1 content panel, 28px status bar — all using design-system custom properties
- CodeMirrorEditor with JSON syntax highlighting, real-time lint squiggles via jsonParseLinter, lintGutter, and Ctrl+F search via basicSetup.searchKeymap — delivers EDIT-01, EDIT-03, NAV-03
- Typed stubs for Toolbar, TreeView, and StatusBar with exact prop signatures so Plans 02 and 03 replace bodies without touching AppShell

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Vite + React 19 + TypeScript project** - `5507704` (feat)
2. **Task 2: Shared-state hooks and CodeMirrorEditor** - `45e6c97` (feat)
3. **Task 3: AppShell + stubs for Toolbar/TreeView/StatusBar** - `8d9ccbf` (feat)

## Files Created/Modified

- `src/components/AppShell.tsx` — Root shell: TooltipProvider > flex-col h-dvh > Tabs + Toolbar + TabsContent + StatusBar
- `src/components/CodeMirrorEditor.tsx` — @uiw/react-codemirror wrapper with json(), linter, lintGutter, diagnosticCount, vscodeDark, searchKeymap
- `src/components/Toolbar.tsx` — Stub (full impl in Plan 02): h-9 toolbar row with placeholder text
- `src/components/TreeView.tsx` — Stub (full impl in Plan 03): empty-state + char count display
- `src/components/StatusBar.tsx` — Stub (full impl in Plan 03): JSONPath placeholder + error count
- `src/components/TreeErrorBoundary.tsx` — Class error boundary with getDerivedStateFromError
- `src/hooks/useJsonDocument.ts` — useState<string> hook with memoized onChange
- `src/hooks/useEditorRef.ts` — Typed useRef<ReactCodeMirrorRef>
- `src/components/ui/{tabs,button,tooltip,badge,separator}.tsx` — shadcn/ui components
- `src/lib/utils.ts` — cn() utility for shadcn
- `src/index.css` — @import "tailwindcss" + design-system CSS custom properties + shadcn theme tokens
- `vite.config.ts` — @tailwindcss/vite plugin + @/ path alias
- `tsconfig.app.json` / `tsconfig.json` — baseUrl + paths for @/* alias
- `components.json` — shadcn configuration
- `package.json` / `package-lock.json` — all dependencies at pinned versions

## Decisions Made

- Used `@base-ui/react` (Base UI) for tooltip primitives instead of `@radix-ui/react-tooltip` — shadcn 4.x CLI now defaults to Base UI, which has a different API (render props instead of asChild)
- shadcn init added `tw-animate-css`, `@fontsource-variable/geist`, and `@base-ui/react` automatically — kept as-is since they're standard shadcn 4.x defaults
- Vite template used `--overwrite` flag instead of the interactive "Ignore files and continue" prompt, which preserves the `.planning/` and `.git/` directories

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TooltipTrigger asChild incompatibility with Base UI**
- **Found during:** Task 3 (AppShell composition)
- **Issue:** Plan specified `<TooltipTrigger asChild>` which is the Radix UI API. shadcn 4.x installed `@base-ui/react` tooltip, which uses a render prop API and does not support `asChild`. TypeScript error: `Property 'asChild' does not exist on type 'IntrinsicAttributes & Props<unknown>'`
- **Fix:** Changed `<TooltipTrigger asChild><span>...</span></TooltipTrigger>` to `<TooltipTrigger render={<span />}>...</TooltipTrigger>` using Base UI's render prop pattern
- **Files modified:** `src/components/AppShell.tsx`
- **Verification:** `npx tsc --noEmit` exits 0; `npm run build` exits 0
- **Committed in:** `8d9ccbf` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug from API mismatch due to shadcn CLI version drift)

**Impact on plan:** Auto-fix necessary for correctness; the tooltip behavior is functionally equivalent. No scope creep.

## Issues Encountered

- shadcn 4.3.1 CLI defaults to Base UI instead of Radix UI — this affects the tooltip API. The RESEARCH.md documented `@radix-ui/react-tabs` (Radix) but shadcn now uses a mix: Tabs still use Radix, while Tooltip moved to Base UI. The fix was straightforward via Base UI's render prop API.
- npm create vite interactive prompt cannot be bypassed via stdin piping; used `--overwrite` flag instead.

## Known Stubs

The following stubs are intentional and tracked for Plans 02 and 03:

| File | Description | Resolving Plan |
|------|-------------|----------------|
| `src/components/Toolbar.tsx` | Renders "Toolbar (stub)" placeholder | Plan 02 |
| `src/components/TreeView.tsx` | Shows char count only, no tree rendering | Plan 03 |
| `src/components/StatusBar.tsx` | Shows JSONPath placeholder, no breadcrumb | Plan 03 |

These stubs prevent the plan's goal from being blocked — the AppShell layout and CodeMirror editor (EDIT-01, EDIT-03, NAV-03) are fully functional. The stub components expose correct TypeScript interfaces so Plans 02 and 03 replace only the function bodies.

## Threat Surface Scan

No new threat surface beyond the plan's threat model. No network endpoints, no auth paths, no file access patterns beyond the browser's built-in file picker (not yet wired in this plan), no schema changes.

The T-01-01 mitigation is in place: CodeMirror renders user input as editor text only; no `eval`, `Function`, `innerHTML`, or `dangerouslySetInnerHTML` in any created file.

## Next Phase Readiness

- Plans 02 and 03 can begin immediately — AppShell is stable, stub interfaces match the contracts specified in the plan's `<interfaces>` block
- Plan 02 (Toolbar): receives `editorRef`, `rawJson`, `setRawJson`, `activeTab` — replace Toolbar.tsx body only
- Plan 03 (TreeView + StatusBar): receives `rawJson`/`onNodeSelect` and `selectedPath`/`errorCount` — replace TreeView.tsx and StatusBar.tsx bodies only
- AppShell.tsx must NOT be modified by Plans 02 or 03

## Self-Check

Verified all key artifacts exist:

```
src/components/AppShell.tsx: FOUND
src/components/CodeMirrorEditor.tsx: FOUND
src/hooks/useJsonDocument.ts: FOUND
src/hooks/useEditorRef.ts: FOUND
components.json: FOUND
dist/index.html: FOUND (build passes)
```

Commit hashes verified in git log:
- 5507704: FOUND (Task 1)
- 45e6c97: FOUND (Task 2)
- 8d9ccbf: FOUND (Task 3)

---

## Self-Check: PASSED

---
*Phase: 01-foundation*
*Completed: 2026-04-21*
