# Roadmap: JSON Workbench

## Overview

JSON Workbench ships in three phases that follow the natural dependency order of its architecture. Phase 1 delivers the editor — the gateway through which all JSON data enters the tool. Phase 2 wires up the Worker infrastructure and ships the jq transform runner, which requires validating a low-adoption WASM library in production. Phase 3 delivers the compare and diff panel, which reuses the Worker infrastructure from Phase 2. Every v1 requirement is covered across these three phases.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - App shell + editor panel with full JSON editing, validation, navigation, and clipboard support
- [ ] **Phase 2: Transform** - Worker Facade infrastructure + jq WASM engine + live transform runner
- [ ] **Phase 3: Compare** - Side-by-side value diff and structural diff panel

## Phase Details

### Phase 1: Foundation
**Goal**: Users can load, edit, navigate, and copy JSON in a working browser application
**Depends on**: Nothing (first phase)
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. User can paste JSON text or load a local file and see it displayed in an editor
  2. The editor highlights syntax errors in real time as the user types
  3. User can format, minify, or auto-repair JSON with a single action
  4. User can view JSON as a collapsible tree and expand/collapse any node
  5. User can search across keys and values, see the JSONPath of the selected node, and copy any result to clipboard
**Plans**: 3 plans
Plans:
- [x] 01-01-PLAN.md — Scaffold Vite+React 19+Tailwind 4+shadcn, wire AppShell layout, CodeMirror editor with lint and Ctrl+F search (EDIT-01, EDIT-03, NAV-03)
- [x] 01-02-PLAN.md — Toolbar: Open File, Format, Minify, Repair, Copy + jsonTransform and clipboard utilities (EDIT-02, EDIT-04..07)
- [x] 01-03-PLAN.md — Recursive TreeView + TreeNode + JSONPath builder + full StatusBar (NAV-01, NAV-02)
**UI hint**: yes

### Phase 2: Transform
**Goal**: Users can run jq expressions against their JSON and see live output, with the Worker Facade in place as shared infrastructure
**Depends on**: Phase 1
**Requirements**: XFRM-01, XFRM-02, XFRM-03
**Success Criteria** (what must be TRUE):
  1. User can type a jq expression and click Run (or Ctrl+Enter) to see output — D-03 locked click-to-run, no debounce/auto-run
  2. The jq engine shows a loading indicator while initializing; the Run button is disabled until the engine is ready
  3. Transform errors display a clear, readable message — not a raw jq error dump
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md — Install jq-web + stage public/jq.wasm + Worker Facade (jqWorker, useJqWorker, sanitizeJqError) + Wave 0 unit tests (XFRM-01, XFRM-02, XFRM-03)
- [x] 02-02-PLAN.md — Transform UI components: TransformPanel, ExpressionInput, RunButton, OutputPane, ErrorBanner + TransformPanel test suite (XFRM-01, XFRM-02, XFRM-03)
- [x] 02-03-PLAN.md — Enable Transform tab in AppShell + lift transformOutput state + Toolbar Copy-on-Transform routing + human verification of dev/production WASM serving (XFRM-01, XFRM-02, XFRM-03)

### Phase 3: Compare
**Goal**: Users can open two JSON documents and view both value-level and structural differences between them
**Depends on**: Phase 2
**Requirements**: CMP-01, CMP-02
**Success Criteria** (what must be TRUE):
  1. User can load two JSON documents and see a semantic value diff that ignores whitespace and key ordering
  2. User can switch to a structural diff view showing which keys exist in one document but not the other
**Plans**: 3 plans
Plans:
- [ ] 03-01-PLAN.md — Install jsondiffpatch@0.7.3 + diffDecorations.ts (StateField, theme, filterStructural, buildPaneDecorations, deltaToLineEntries) + useDiff hook with full TDD coverage (CMP-01, CMP-02)
- [ ] 03-02-PLAN.md — Compare leaf components: ParseErrorBanner, ModeToggle, ComparePaneHeader, ComparePaneEditor, CompareToolbar (CMP-01, CMP-02)
- [ ] 03-03-PLAN.md — ComparePanel composition + 10-test suite + AppShell Compare tab + Toolbar activeTab union widening (CMP-01, CMP-02)
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Transform | 0/3 | Not started | - |
| 3. Compare | 0/3 | Not started | - |
