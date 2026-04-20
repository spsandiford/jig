# Technology Stack

**Project:** JSON Workbench (SPA)
**Researched:** 2026-04-20

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.x | UI framework | Largest ecosystem for the specific libraries this project needs (Monaco wrapper, JSON tree editors, diff renderers all have mature React bindings). React 19 is stable and actively developed. Svelte would require porting or writing adapter layers for most key dependencies. |
| TypeScript | 5.x | Type safety | Industry default. All recommended libraries ship first-class TS types. Catches prop shape bugs early, which matters when wiring Monaco editor state through diff and transform pipelines. |
| Vite | 6.x | Build tool / dev server | Definitive CRA replacement as of 2025. Native ESM dev server gives instant HMR. Critical for this project: Vite's worker plugin handles Monaco's wasm/worker assets without custom webpack config. |

### Code Editor Component

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @monaco-editor/react | 4.x | Primary JSON text editor panes | Monaco is the VS Code engine. It ships built-in JSON language support (syntax highlighting, error squiggles, formatting) with zero configuration. ~380k weekly npm downloads vs ~114k for the older react-monaco-editor wrapper. The `DiffEditor` export provides a side-by-side diff view out of the box — eliminating a custom diff rendering component entirely. |

**Why not CodeMirror 6:** CodeMirror 6 has a smaller bundle (~300KB core vs Monaco's ~5-10MB) and better mobile support, but this project targets desktop developer workflows where bundle size is secondary to feature richness. Monaco's built-in diff editor, JSON language server, and familiar VS Code keybindings are direct wins. Sourcegraph migrated FROM Monaco TO CodeMirror for their specific needs (mobile, custom grammar, huge scale), which are not this project's constraints.

**Why not Ace:** Ace is effectively legacy. CodeMirror 6 and Monaco have both passed it in DX, performance, and ecosystem support.

**Known limitation:** Pasting JSON files over ~10MB can cause transient lock-up (GitHub issue #4238). For multi-MB data export files, expose a streaming load path via the File API that parses JSON off the main thread before handing text to Monaco. Flag this as a Phase 1 performance concern.

### JSON Diff / Compare

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| jsondiffpatch | 0.7.3 | Value diff and structural diff computation | Most feature-complete JS JSON diffing library. Computes a delta format that supports: deep value diff, array move detection, text-level string diffs via diff-match-patch, and HTML visualization. The built-in `formatters.html` module renders an annotated diff view directly, avoiding custom rendering. 588+ dependents; latest version 0.7.3 published ~April 2025 — maintenance is sustainable. |
| Monaco DiffEditor | (bundled) | Side-by-side text diff display | Use Monaco's `DiffEditor` component for the raw text diff view. It provides inline and side-by-side modes with full editor features. This covers the "before/after transform" comparison mode without a separate library. |

**Architecture note:** Use two distinct diff modes: (1) jsondiffpatch for semantic/structural diff (tree-aware, shows added/removed/moved keys), (2) Monaco DiffEditor for text diff (character-level, familiar to developers). Surface both in the compare panel as tabs.

### jq Execution in Browser

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| jq-wasm | latest | Execute jq filter expressions in the browser | WebAssembly build of the real jq binary. Zero server requirement. `owenthereal/jq-wasm` is the most active fork as of 2025 — TypeScript definitions included, ESM-compatible, no native dependencies. |

**Why not jq-web (fiatjaf):** jq-web is considered discontinued — no releases in 12+ months per Snyk health data.

**Why not a JS reimplementation (e.g., jqts):** A reimplementation is perpetually incomplete — jq filters used by power users rely on builtins, path expressions, and try-catch that reimplementations often miss. The real binary compiled to WASM is the only way to guarantee filter parity.

**Async loading note:** WASM modules load asynchronously. Wrap the jq-wasm initialization in a React context/provider so the engine is ready before the first transform attempt. Show a subtle loading indicator during the ~100-200ms WASM init.

### JSONPath Execution in Browser

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| jsonpath-plus | >=10.3.0 | Execute JSONPath expressions as a transform mode | Pure JavaScript — no WASM needed. The dominant JSONPath library for browser use (direct ESM import). **Must be 10.3.0 or higher**: CVE-2025-1302 (code injection via crafted path expressions) affects all prior versions. Actively maintained with a demo playground and full TypeScript support. |

**Why not the `jsonpath` package (dchester):** `jsonpath` uses `vm` module for script evaluation, which is Node.js-only — it does not run in browsers. jsonpath-plus was designed with browser execution as a first-class target.

### Visual / GUI JSON Tree Editor

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| json-edit-react | 1.29.x | Visual GUI field mapper and JSON tree editor | The most actively maintained full-editing JSON tree component for React as of 2025 (version 1.29.0, last published October 2025 per npm data). Supports inline editing, add/remove/reorder operations, drag-and-drop array reordering, TypeScript, custom components per node type, and theming. The "visual field mapper" requirement maps directly to its built-in capabilities. |

**Why not react-json-view:** Abandoned — last published 2022, no React 18/19 support.

**Why not @uiw/react-json-view:** Read-only viewer focused; editing is add-on and less polished than json-edit-react.

**Why not react-json-view-lite:** Read-only. Not suitable for the GUI editing requirement.

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.x | Application-level state (documents, panels, transform results) | The workbench has a small number of interconnected stores: left-pane JSON, right-pane JSON, active transform mode, diff result, filter expression. Zustand's slice pattern handles this cleanly. No boilerplate overhead of Redux; more explicit than Jotai atoms for developer-tool state that changes infrequently but is read in many places. |

### UI / Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility styling | No runtime overhead, purged at build. Tailwind 4 ships with native CSS cascade layers and a Vite plugin — no PostCSS config required. Ideal for a developer tool where layout (flex/grid split panes, resize handles) is the UI heavy lifting. |
| shadcn/ui | (copy-paste) | Accessible primitives (buttons, tabs, dropdowns, toasts) | Components are copied into the repo — no runtime dependency version drift. Built on Radix UI primitives for accessibility. Covers the tab switching (diff modes), dropdown (format options), and clipboard toast that the workbench needs. |

**Radix UI maintenance note:** The original Radix UI team has shifted focus to Base UI. shadcn/ui is aware of this and is tracking the migration. For this project's scope, existing Radix-based shadcn/ui components are stable and will not need migration during v1 development.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | React 19 | Svelte 5 | Smaller ecosystem — Monaco, jsondiffpatch, json-edit-react all have first-class React integrations; Svelte equivalents are lower quality or absent |
| Build tool | Vite 6 | webpack 5 | webpack requires custom config for Monaco's workers; Vite handles them via the `vite-plugin-monaco-editor` plugin with near-zero config |
| Code editor | Monaco (@monaco-editor/react) | CodeMirror 6 | Monaco's built-in DiffEditor and JSON language server are direct feature requirements; CM6 would need third-party packages for both |
| jq runtime | jq-wasm | jq-web | jq-web discontinued; jq-wasm has TypeScript types and active maintenance |
| JSONPath | jsonpath-plus >=10.3.0 | jsonpath (dchester) | `jsonpath` is Node.js-only, does not run in browsers |
| Diff library | jsondiffpatch | deep-diff | jsondiffpatch has HTML visualizer, array move detection, and text diff integration; deep-diff is bare-bones delta computation only |
| State | Zustand | Jotai | For workbench state (2-3 document slots, one active mode), Zustand's explicit store slices are easier to reason about than an atom graph |
| UI primitives | shadcn/ui + Tailwind | MUI / Ant Design | MUI/Ant bring large runtime CSS-in-JS overhead and impose design language; shadcn/ui is owned code, styled to match whatever the workbench needs |

---

## Installation

```bash
# Scaffold project
npm create vite@latest json-workbench -- --template react-ts
cd json-workbench

# Core editor
npm install @monaco-editor/react

# JSON diff
npm install jsondiffpatch

# jq WASM runtime
npm install jq-wasm

# JSONPath (pinned to security-safe version)
npm install jsonpath-plus@^10.3.0

# Visual JSON tree editor
npm install json-edit-react

# State management
npm install zustand

# Styling
npm install tailwindcss @tailwindcss/vite
# shadcn/ui initialized via CLI (copies components into repo)
npx shadcn@latest init

# Dev dependencies
npm install -D typescript @types/react @types/react-dom
```

---

## Confidence Levels

| Area | Confidence | Notes |
|------|------------|-------|
| React + Vite + TypeScript | HIGH | Industry consensus, official React docs point to Vite for SPAs |
| Monaco (@monaco-editor/react) | HIGH | Verified via npm (380k weekly downloads), @monaco-editor/react v4.7.0-rc for React 19 |
| jsondiffpatch | MEDIUM | v0.7.3 published ~April 2025; sustainable maintenance per Snyk; HTML visualizer confirmed |
| jq-wasm (owenthereal) | MEDIUM | Active per search results but only 18 GitHub stars; low-usage risk — verify with a prototype spike in Phase 1 |
| jsonpath-plus >=10.3.0 | HIGH | CVE-2025-1302 patched in 10.3.0; actively maintained with demos and TS types |
| json-edit-react | HIGH | v1.29.0 published October 2025; active discussions; best-in-class for React editing tree |
| Zustand | HIGH | Dominant lightweight state manager in 2025; v5 released and stable |
| Tailwind CSS 4 | HIGH | v4 GA with Vite plugin; widely adopted |
| shadcn/ui | MEDIUM | Radix UI team transition to Base UI creates minor long-term uncertainty; no action needed for v1 |

---

## Sources

- Monaco vs CodeMirror comparison: https://sourcegraph.com/blog/migrating-monaco-codemirror, https://agenthicks.com/research/codemirror-vs-monaco-editor-comparison
- @monaco-editor/react: https://github.com/suren-atoyan/monaco-react, https://monaco-react.surenatoyan.com
- jq-wasm: https://github.com/owenthereal/jq-wasm
- jq-web status: https://snyk.io/advisor/npm-package/jq-web
- jsonpath-plus CVE: https://ccb.belgium.be/advisories/warning-high-code-injection-vulnerability-javascript-library-jsonpath-plus-can-be-exploited-remotely-patch-immediately
- jsonpath-plus docs: https://jsonpath-plus.github.io/JSONPath/docs/ts/
- jsondiffpatch: https://github.com/benjamine/jsondiffpatch
- json-edit-react: https://github.com/CarlosNZ/json-edit-react
- Vite for SPAs: https://vite.dev/guide/, https://dev.to/codeparrot/advanced-guide-to-using-vite-with-react-in-2025-377f
- shadcn/ui vs Radix: https://javascript.plainenglish.io/shadcn-ui-vs-radix-ui-vs-tailwind-ui-which-should-you-choose-in-2025-b8b4cadeaa25
- Zustand vs Jotai: https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k
- Monaco large file issue: https://github.com/microsoft/monaco-editor/issues/4238
- React vs Svelte 2025: https://svar.dev/blog/svelte-vs-react/
