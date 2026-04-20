# Project Research Summary

**Project:** JSON Workbench
**Domain:** Developer productivity SPA — JSON editing, transformation, and diffing
**Researched:** 2026-04-20
**Confidence:** HIGH

## Executive Summary

JSON Workbench is a developer productivity SPA that consolidates the fragmented JSON workflow (editor, linter, jq runner, diff tool) into one in-browser session. The research consensus is clear: build on React 19 + Vite 6 + TypeScript, use Monaco as the editor backbone (its built-in DiffEditor and JSON language server directly satisfy several feature requirements), run jq via WASM in a Web Worker, and keep all computation off the main thread from day one. Every expert-built JSON tool in this category — svelte-jsoneditor, jsoneditoronline, VS Code's JSON support — makes the same architectural decisions around worker offloading and virtualized rendering.

The recommended approach is a layered architecture with a Zustand document-slot store at the center, Monaco editor instances per panel, and a typed Worker Facade that routes jq and diff jobs to background threads. Layout is persistent split panes via react-resizable-panels rather than page-level tabs. The Editor Panel is the gateway for all data and must be built first; every other panel reads the rawJson document slot from the store. The Worker Facade is shared infrastructure and must precede the Transform and Compare panels.

The primary risks are performance (large JSON files freezing the browser if parsed synchronously on the main thread), WASM async initialization race conditions (jq returning empty results silently if called before the WASM module is ready), and scope creep on the visual field mapper (production equivalents are full products in their own right). All three have known mitigations that must be built in from Phase 1, not retrofitted.

## Key Findings

### Recommended Stack

The stack is well-settled with high confidence across the board. React 19 + Vite 6 is the industry default for 2025 SPAs and the only ecosystem with first-class bindings for every required library. Monaco is the correct editor choice over CodeMirror 6 for this project: its built-in DiffEditor eliminates a custom diff renderer, and its JSON language server provides syntax validation at zero configuration cost. The 5-10 MB bundle cost is the trade-off, mitigated by lazy loading Monaco after first paint.

**Core technologies:**
- React 19 + TypeScript 5: UI framework and type safety — largest ecosystem for Monaco, jsondiffpatch, and json-edit-react integrations
- Vite 6: Build tool — native ESM dev server, handles Monaco WASM worker assets via plugin with near-zero config
- @monaco-editor/react 4.x: Primary editor and diff display — built-in DiffEditor and JSON language server cover multiple feature requirements directly
- jsondiffpatch 0.7.3: Semantic JSON diff — structural delta, array move detection, HTML visualization; maintained as of April 2025
- jq-wasm (owenthereal): jq execution in browser — real jq binary compiled to WASM; TypeScript types; ESM-compatible. Verify with prototype spike in Phase 1 (only 18 GitHub stars)
- jsonpath-plus >=10.3.0: JSONPath execution — must be pinned to 10.3.0+; earlier versions have CVE-2025-1302 code injection vulnerability
- json-edit-react 1.29.x: Visual JSON tree editor — drag-and-drop reorder, inline edit, custom node types; best-in-class for React as of 2025
- Zustand 5.x: State management — document slot model, slice pattern, no boilerplate
- Tailwind CSS 4 + shadcn/ui: Styling and accessible primitives — Tailwind 4 Vite plugin; shadcn/ui components copied into repo (no version drift)
- react-resizable-panels: Split-pane layout with localStorage persistence

### Expected Features

**Must have (table stakes):**
- Syntax highlighting and real-time JSON validation — users abandon without this
- Format/pretty-print and minify — most common single action on any JSON tool
- Copy to clipboard — primary exit path for browser tools
- Load from local file via file picker — how users get real data in
- Tree / collapsible view with expand/collapse — navigating nested JSON requires this
- Path display (breadcrumb or status bar showing JSONPath of selected node)
- JSON repair / auto-fix — malformed JSON from LLMs, trailing commas, single quotes is ubiquitous; use jsonrepair library
- Search within document (Ctrl+F across keys and values)

**Should have (competitive differentiators):**
- jq expression runner with live preview — gold standard for JSON transformation; no server needed with WASM
- Visual / GUI field mapper — non-jq users need a no-code extraction path; most tools lack this
- Value diff (semantic, side-by-side) — compare two JSON docs ignoring key order and whitespace
- Structural diff — which keys exist in one but not the other; answers "did the API shape change?"
- Before/after transform diff — show what a jq expression changed; rare in existing tools; killer feature
- Multiple document tabs — required for compare-two-docs workflow; most competitors are single-document

**Defer to v2+:**
- JSON Schema validation (explicitly out of scope per PROJECT.md)
- JSONPath as a second query language (add after jq works and is validated)
- Transform expression history (localStorage, low effort, but not blocking)
- Keyboard-first navigation polish (ongoing; do not delay ship)
- URL fetch, drag-and-drop input, download to file, dark/light theme toggle, mobile layout

### Architecture Approach

A three-tier layered architecture: App Shell (layout, keyboard shortcuts) -> Panel Components (Editor, Transform, Compare) -> Worker Layer (jq Worker, Diff Worker). A single Zustand store holds named document slots (slot-A, slot-B, slot-transform). All panels read from and write to slots by name. Heavy computation is routed through a typed Worker Facade that assigns job IDs to cancel stale results when newer jobs arrive — critical for live preview as the user types a jq expression.

**Major components:**
1. App Shell — PanelGroup layout, panel visibility store, global keyboard shortcuts
2. Editor Panel — Monaco instance, file load, clipboard copy, debounced rawJson sync to store (150ms)
3. Transform Panel — jq expression input, visual field mapper UI, result display (read-only Monaco); writes via Worker Facade
4. Compare Panel — value diff / structural diff / before-after tabs; reads two document slots; diffs via Worker Facade
5. Zustand Store — single source of truth: documents Map, transformResult, diffResult, panelLayout
6. Worker Facade — typed async wrapper over postMessage; job-ID cancellation; resolves promises and dispatches store writes
7. jq Worker — stateless; receives {expression, input}, runs jq-wasm, returns {result} or {error}
8. Diff Worker — stateless; receives {left, right, mode}, runs jsondiffpatch, returns delta

**Critical design rules:**
- Store only rawJson (string), never the parsed JSON object — parsed objects at MB scale use 3-5x more memory
- Monaco runs as uncontrolled; store sync is debounced, not keystroke-driven
- Workers never write to store directly; only Worker Facade dispatches store writes
- Validate Panel is not a separate split region — use Monaco gutter decorations with a collapsible error list

### Critical Pitfalls

1. **Large JSON on the main thread** — A 20 MB file freezes the browser. Use Monaco's built-in viewport virtualization; move JSON.parse to a Web Worker; apply a size threshold (>2 MB) to gate or warn before rendering the tree view. Must be designed in from Phase 1.

2. **WASM jq async init race** — jq-wasm returns {} silently if called before the WASM module finishes loading. Always use the promised API and await it; run jq in a Web Worker; show a "loading engine" indicator; disable the Run button until ready. Confirm WASM file path config in Vite does not break production builds.

3. **SharedArrayBuffer / cross-origin isolation** — Threaded WASM requires COOP/COEP headers that GitHub Pages cannot serve. Use single-threaded jq-wasm builds (owenthereal/jq-wasm is single-threaded); test production deployment early, not just localhost.

4. **Semantic diff vs text diff** — Line-based diff on reformatted JSON marks every line as changed. Always normalize both inputs (sort keys, canonical stringify) before diffing; use jsondiffpatch (structural) rather than raw text diff on JSON strings.

5. **Visual field mapper scope creep** — Production equivalents (Altova MapForce) are full products. Hard-cap v1 scope to: map top-level and one-level-deep fields, rename, constant injection only. No array operations, computed fields, or conditional logic in v1. Build as an isolated phase so it can be cut without affecting the rest of the roadmap.

## Implications for Roadmap

Based on architecture dependency order and pitfall prevention requirements:

### Phase 1: Foundation — App Shell + Editor Panel
**Rationale:** The Editor Panel is the gateway for all JSON data. Nothing else works without it. Large-file handling must be designed in here, not retrofitted. WASM path and deployment config must also be validated early.
**Delivers:** Working JSON editor — paste/load, real-time validation, format, minify, repair, tree view, copy to clipboard, path display
**Features:** All table stakes features from FEATURES.md; jsonrepair integration
**Avoids:** Main-thread large-file freeze (Monaco virtualization + Worker parse); clipboard silent failure (try/catch + toast); sync architecture for text/tree views
**Research flag:** Standard patterns — Monaco + Vite + Zustand are well-documented

### Phase 2: Worker Infrastructure + jq Transform
**Rationale:** Worker Facade is shared infrastructure for both Transform and Compare. Building it before either panel avoids retrofitting. jq-wasm needs a prototype spike to validate the low-star library actually works reliably in production builds.
**Delivers:** jq expression runner with live preview; WASM engine loading with init guard; Worker Facade with job-ID cancellation
**Features:** jq transform with live preview; transform expression history (localStorage)
**Avoids:** WASM async init race; main-thread jq blocking; SharedArrayBuffer deployment issue; jq cryptic errors (UX for error display)
**Research flag:** Needs phase research — jq-wasm (owenthereal) has low adoption; validate bundler WASM path resolution and production deployment behavior before committing

### Phase 3: Compare / Diff Panel
**Rationale:** Depends on Worker Facade (Phase 2) for the Diff Worker. Value diff must be built before structural diff (same infrastructure, simpler algorithm first). Before/after diff requires transform result in store, so it depends on Phase 2.
**Delivers:** Side-by-side value diff, structural diff, before/after transform diff — three compare modes
**Features:** All three diff modes from PROJECT.md requirements
**Avoids:** Text diff treating reformatted JSON as fully changed (normalize before diff); array order false positives (jsondiffpatch move detection)
**Research flag:** Standard patterns — jsondiffpatch is well-documented; Monaco DiffEditor is built-in

### Phase 4: Visual Field Mapper
**Rationale:** Deliberately isolated phase with a hard scope gate. Has no dependents — can be cut or deferred without affecting Phase 1-3 features. The most complex UI piece; builds on json-edit-react and the jq infrastructure from Phase 2.
**Delivers:** GUI field mapper (top-level + one-level-deep field mapping, rename, constant injection only)
**Features:** Visual/GUI field mapper from PROJECT.md; explicitly NOT array operations, computed fields, or conditional logic
**Avoids:** Scope creep (hard v1 cut line defined before Phase 4 starts)
**Research flag:** Needs phase research — visual mapper UX patterns, drag-and-drop mapping interactions, and jq code generation from GUI state are all under-documented

### Phase Ordering Rationale

- Editor Panel first because every feature reads its rawJson store output — nothing else can be built without it
- Worker Facade before Transform and Compare because both panels share it — building it early avoids writing two different ad-hoc worker communication layers
- Compare after Transform because before/after diff mode requires transformResult to already exist in the store
- Visual mapper last because it has no dependents and is the highest-risk scope item — isolating it lets the rest of the product ship even if the mapper is cut or delayed

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (jq Transform):** jq-wasm has only 18 GitHub stars; needs prototype spike to confirm Vite bundler WASM path resolution works in production, promised API behaves as expected, and single-threaded build is sufficient performance
- **Phase 4 (Visual Field Mapper):** UX patterns for drag-and-drop field mapping and jq code generation from GUI interactions are sparse; needs design research before implementation begins

Phases with standard patterns (can skip research-phase):
- **Phase 1 (Foundation):** React + Vite + Monaco + Zustand are industry defaults with extensive documentation
- **Phase 3 (Compare):** jsondiffpatch HTML visualizer and Monaco DiffEditor are both well-documented with worked examples

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | React/Vite/Monaco/Zustand are industry consensus; jsonpath-plus version pinned to CVE fix; only jq-wasm is MEDIUM due to low adoption |
| Features | HIGH | Multiple production tools audited (jsoneditoronline, jqplay, jsondiff.com); competitive gaps clearly identified |
| Architecture | HIGH | Worker Facade + document slot patterns are well-established; data flow validated against real editor implementations |
| Pitfalls | HIGH | Verified against real GitHub issues, browser specs (COEP/COOP), CVE database, and production migration case studies (Sourcegraph, Replit) |

**Overall confidence:** HIGH

### Gaps to Address

- **jq-wasm production reliability:** owenthereal/jq-wasm has low npm adoption (18 stars). Run a prototype spike in Phase 2 before committing to the full transform implementation. Fallback: jq-web (fiatjaf) if owenthereal has bundler issues, though jq-web has no recent releases.
- **jsonpath-plus as second query language:** Research recommends deferring; validate during Phase 2 whether jq alone satisfies power-user needs before adding a second query language.
- **Visual mapper UX design:** No authoritative pattern exists for "GUI that generates jq." Needs a design spike before Phase 4 planning. The specific interaction model (dropdowns vs drag-and-drop connectors) is unresolved.
- **Undo/redo across text and tree views:** Must be designed before building multi-view (text + tree). Single shared undo stack at store level; intercept Monaco/tree built-in undo and route through it. Non-trivial complexity.

## Sources

### Primary (HIGH confidence)
- https://github.com/suren-atoyan/monaco-react — @monaco-editor/react v4 docs and React 19 compatibility
- https://github.com/benjamine/jsondiffpatch — jsondiffpatch v0.7.3, HTML formatter, array move detection
- https://github.com/CarlosNZ/json-edit-react — json-edit-react v1.29.0 feature set
- https://jsonpath-plus.github.io/JSONPath/docs/ts/ — jsonpath-plus TypeScript docs + CVE-2025-1302 context
- https://vite.dev/guide/ — Vite 6 SPA setup
- https://github.com/bvaughn/react-resizable-panels — Layout component, localStorage persistence
- https://web.dev/articles/cross-origin-isolation-guide — COEP/COOP headers for WASM deployment
- https://sourcegraph.com/blog/migrating-monaco-codemirror — Monaco vs CodeMirror trade-off analysis

### Secondary (MEDIUM confidence)
- https://github.com/owenthereal/jq-wasm — jq-wasm library; active but low adoption
- https://snyk.io/advisor/npm-package/jq-web — jq-web discontinuation
- https://github.com/josdejong/svelte-jsoneditor — sync architecture patterns, bundle size data
- https://jsoneditoronline.org/features/ — competitive feature audit
- https://jqplay.org/ — live transform preview UX pattern
- https://dev.to/diffguru/stop-using-text-diff-for-json-a-better-way-to-compare-objects-4j75 — semantic diff rationale

### Tertiary (needs validation)
- jq-wasm Vite bundler WASM path resolution — inferred from general WASM-in-Vite patterns; must be verified in spike
- Visual field mapper jq code generation — inferred from jsoneditoronline Wizard (JMESPath); no jq equivalent documented

---
*Research completed: 2026-04-20*
*Ready for roadmap: yes*
