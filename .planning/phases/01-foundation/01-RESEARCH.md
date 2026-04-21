# Phase 1: Foundation - Research

**Researched:** 2026-04-21
**Domain:** React 19 + Vite 6 + CodeMirror 6 + Tailwind 4 + shadcn/ui SPA — JSON editor, tree view, clipboard
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** React 18 + TypeScript + Vite — SPA, static build output, no backend required.
  *(Note: npm registry confirms React latest is 19.2.5 and STATE.md records "React 19 + Vite 6 + Monaco + Zustand + Tailwind 4 + shadcn/ui" — React 19 is the effective target. See Assumptions Log.)*
- **D-02:** Tailwind CSS for all styling — utility-first, consistent spacing and color system throughout.
- **D-03:** CodeMirror 6 via `@uiw/react-codemirror` — `@codemirror/lang-json` for syntax + real-time validation linting, `@codemirror/lint` for error squiggles, `@codemirror/search` for Ctrl+F search (NAV-03). Format, minify, and repair are custom CodeMirror extensions/commands invoked via toolbar buttons.
- **D-04:** File loading (EDIT-02) via a hidden `<input type="file">` — reads file as text and populates the editor.
- **D-05:** Custom recursive React component — no library dependency. Props: `value`, `path`, `depth`, expanded state. Clicking a node emits its JSONPath to the status bar (NAV-02). Styled with Tailwind.
- **D-06:** Tab-based layout — single content area with tabs to switch between Editor view and Tree view. Tabs share the same JSON document state — switching tabs changes the lens, not the data.
- **D-07:** Status bar below the tab panel — displays JSONPath of selected tree node (NAV-02) and real-time syntax error summary from CodeMirror lint.

### Claude's Discretion

- Auto-repair library choice (EDIT-06): Claude decides between `jsonrepair` npm package or a custom implementation. `jsonrepair` is well-maintained and handles trailing commas, single quotes, and LLM output — using it is the pragmatic call unless a simpler approach is clearly sufficient.
- Tab ordering and tab labels: Claude decides.
- Toolbar button placement (format/minify/repair/copy): Claude decides, keeping it clean and accessible.
- Color palette and spacing tokens in Tailwind config: Claude decides, targeting a dark developer-tool aesthetic.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDIT-01 | User can paste JSON text into an editor pane | `@uiw/react-codemirror` controlled via `value`/`onChange` |
| EDIT-02 | User can load a JSON file from disk via file picker | Hidden `<input type="file">` with `FileReader.readAsText` |
| EDIT-03 | Editor highlights JSON syntax errors in real time | `jsonParseLinter()` from `@codemirror/lang-json` + `linter()` extension |
| EDIT-04 | User can format / pretty-print JSON with one action | `JSON.parse` + `JSON.stringify(_, null, 2)` dispatched via `view.dispatch` |
| EDIT-05 | User can minify JSON to a single line | `JSON.parse` + `JSON.stringify` (no indent) dispatched via `view.dispatch` |
| EDIT-06 | User can auto-repair malformed JSON | `jsonrepair` npm package — handles trailing commas, single quotes, LLM output |
| EDIT-07 | User can copy any JSON result to the clipboard | `navigator.clipboard.writeText()` with try/catch fallback |
| NAV-01 | User can view JSON as a collapsible tree with expand/collapse per node | Custom recursive React component using `useState` for per-node expand state |
| NAV-02 | Editor displays the JSONPath of the currently selected node | Node click emits path string; status bar renders it |
| NAV-03 | User can search across keys and values within the document (Ctrl+F) | `@codemirror/search` — included in `basicSetup`, Ctrl+F activates built-in search panel |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield React 19 + Vite 6 SPA built with CodeMirror 6 (via `@uiw/react-codemirror`) as the editor surface, shadcn/ui components for the shell, and a custom recursive tree component. All key libraries are confirmed current via npm registry. The architecture is straightforward: one shared JSON string (`rawJson`) in component state, rendered by either the CodeMirror editor or the tree view depending on the active tab. No Worker infrastructure is needed in Phase 1 — JSON operations (format, minify, repair) are fast enough on the main thread for typical document sizes, and the performance concern for very large files (>2 MB) is addressed by CodeMirror's built-in line virtualization plus a size gate on tree parsing.

The most important Phase 1 design decision with future-phase consequences is the shared-state architecture: the single JSON string must be the source of truth so that Phase 2 (Transform) and Phase 3 (Compare) can subscribe to it without restructuring. The tab-based layout must accommodate a disabled "Transform" placeholder from day one.

The `@uiw/codemirror-theme-vscode` package provides a ready-made VS Code dark theme that aligns with the UI-SPEC's color palette; using it instead of `createTheme` saves non-trivial styling effort with no functional cost.

**Primary recommendation:** Scaffold with `npm create vite@latest` (react-ts template) → install Tailwind 4 + `@tailwindcss/vite` → initialize shadcn with `npx shadcn@latest init -t vite` → install CodeMirror packages → implement shared document state hook → build the editor wrapper → build the tree component → wire status bar.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| JSON text editing (EDIT-01) | Browser / Client — CodeMirror | — | Fully client-side; CodeMirror owns the text buffer |
| File loading (EDIT-02) | Browser / Client — FileReader API | — | `<input type="file">` + `FileReader.readAsText` runs in-browser |
| Real-time syntax validation (EDIT-03) | Browser / Client — CodeMirror lint | — | `jsonParseLinter` runs synchronously within CodeMirror's update cycle |
| Format / minify / repair (EDIT-04/05/06) | Browser / Client — toolbar commands | — | `JSON.parse` + `JSON.stringify` / `jsonrepair` are fast enough on main thread |
| Clipboard copy (EDIT-07) | Browser / Client — Clipboard API | — | `navigator.clipboard.writeText` is a browser primitive |
| Collapsible tree view (NAV-01) | Browser / Client — React component | — | Recursive React component reads parsed JSON; no server needed |
| JSONPath display (NAV-02) | Browser / Client — React state | — | Path string is emitted by tree node click, stored in parent state |
| In-editor search (NAV-03) | Browser / Client — CodeMirror search | — | `@codemirror/search` extension handles Ctrl+F natively |
| Tab layout / shell | Browser / Client — shadcn Tabs | — | Pure UI layout; no data concern |
| Document state | Browser / Client — React useState/useReducer | — | Single `rawJson` string as source of truth |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.5 | UI framework | Latest stable; shadcn/ui 4.x is compatible; hooks model fits this architecture [VERIFIED: npm registry] |
| react-dom | 19.2.5 | DOM renderer | Paired with react [VERIFIED: npm registry] |
| typescript | 5.8.x (5.x) | Type safety | Vite react-ts template ships 5.x; all dependencies have first-class types [VERIFIED: npm view typescript version → 6.0.3 is next; 5.x is stable latest] |
| vite | 8.0.9 | Build tool + dev server | Latest stable; native ESM HMR; `@tailwindcss/vite` plugin requires Vite [VERIFIED: npm registry] |
| @vitejs/plugin-react | 6.0.1 | React Fast Refresh | Standard Vite React plugin [VERIFIED: npm registry] |
| tailwindcss | 4.2.3 | Utility CSS | v4 GA; `@tailwindcss/vite` replaces PostCSS config; dark-only palette fits this tool [VERIFIED: npm registry] |
| @tailwindcss/vite | 4.2.3 | Tailwind v4 Vite plugin | Replaces `tailwind.config.js` for v4 — single plugin install [VERIFIED: npm registry] |

### Editor

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @uiw/react-codemirror | 4.25.9 | CodeMirror 6 React wrapper | High-reputation Context7 library; controlled `value`/`onChange`; exposes `ref.view` for programmatic dispatch [VERIFIED: npm registry + Context7 /uiwjs/react-codemirror] |
| @codemirror/lang-json | 6.0.2 | JSON syntax + `jsonParseLinter` export | Exports `json()` extension and `jsonParseLinter()` for real-time error detection [VERIFIED: npm registry + web search] |
| @codemirror/lint | 6.9.5 | Lint squiggles + `diagnosticCount` | `linter()`, `lintGutter()`, `diagnosticCount()` — confirmed API for status bar error count [VERIFIED: Context7 /codemirror/lint] |
| @codemirror/search | 6.6.0 | Ctrl+F search panel | Included in `basicSetup` from `@uiw/react-codemirror`; provides NAV-03 automatically [VERIFIED: npm registry] |
| @codemirror/view | 6.41.1 | `EditorView` for programmatic dispatch | Used to replace content for format/minify/repair via `view.dispatch` [VERIFIED: npm registry] |
| @codemirror/state | 6.6.0 | `EditorState` for state reads | Needed to read doc content before transform operations [VERIFIED: npm registry] |
| @uiw/codemirror-theme-vscode | 4.25.9 | Ready-made VS Code dark theme | Matches UI-SPEC color palette (same `#1e1e1e` background); avoids hand-rolling `createTheme` [VERIFIED: npm registry] |

### JSON Operations

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsonrepair | 3.14.0 | Auto-repair malformed JSON (EDIT-06) | Handles trailing commas, single quotes, unquoted keys, LLM output, concatenated JSON — more robust than any hand-rolled solution; ESM-native; Claude's Discretion explicitly calls this out [VERIFIED: npm registry + Context7 /josdejong/jsonrepair] |

### UI Shell

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui | 4.3.1 (CLI) | Copy-paste Radix-based components | Tabs, Button, Tooltip, Badge, Separator — components are owned code, no runtime dep drift [VERIFIED: npm view shadcn version] |
| lucide-react | 1.8.0 | Icon set | Specified in UI-SPEC; `FileJson`, `GitBranch`, `Zap`, `FolderOpen`, `AlignLeft`, `Minimize2`, `Wrench`, `Copy` icons used [VERIFIED: npm registry + UI-SPEC] |
| @radix-ui/react-tabs | 1.1.13 | Tabs primitive (via shadcn) | Installed by shadcn `add tabs` [VERIFIED: npm registry] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@uiw/codemirror-theme-vscode` | `createTheme` from `@uiw/codemirror-themes` | `createTheme` gives finer control but requires mapping all lezer tags manually — the VS Code theme already matches the spec palette |
| `jsonrepair` | `JSON.parse` try/catch + custom fix | Custom repair misses LLM output patterns, concatenated JSON, and JS-style syntax; not worth building |
| `@codemirror/search` (built-in) | Custom search UI | Built-in panel handles Ctrl+F, case toggle, regex toggle — zero implementation cost for NAV-03 |
| shadcn `Tabs` | Custom tab component | shadcn provides accessibility (ARIA roles, keyboard nav) automatically |

**Installation:**
```bash
# Scaffold
npm create vite@latest json-workbench -- --template react-ts
cd json-workbench

# Tailwind v4
npm install tailwindcss @tailwindcss/vite

# shadcn init (Vite target, Tailwind v4)
npx shadcn@latest init -t vite

# shadcn components
npx shadcn@latest add tabs button tooltip badge separator

# CodeMirror
npm install @uiw/react-codemirror @codemirror/lang-json @codemirror/lint \
  @codemirror/search @codemirror/view @codemirror/state \
  @uiw/codemirror-theme-vscode

# JSON repair
npm install jsonrepair

# Icons (may already be installed by shadcn)
npm install lucide-react
```

**Version verification (confirmed 2026-04-21):**

| Package | Verified Version | Source |
|---------|-----------------|--------|
| react | 19.2.5 | npm registry |
| vite | 8.0.9 | npm registry |
| tailwindcss | 4.2.3 | npm registry |
| @tailwindcss/vite | 4.2.3 | npm registry |
| @uiw/react-codemirror | 4.25.9 | npm registry |
| @codemirror/lang-json | 6.0.2 | npm registry |
| @codemirror/lint | 6.9.5 | npm registry |
| @codemirror/search | 6.6.0 | npm registry |
| @codemirror/view | 6.41.1 | npm registry |
| @codemirror/state | 6.6.0 | npm registry |
| @uiw/codemirror-theme-vscode | 4.25.9 | npm registry |
| jsonrepair | 3.14.0 | npm registry |
| shadcn (CLI) | 4.3.1 | npm registry |
| lucide-react | 1.8.0 | npm registry |
| @radix-ui/react-tabs | 1.1.13 | npm registry |
| typescript | 5.x (6.0.3 is "next") | npm registry |

---

## Architecture Patterns

### System Architecture Diagram

```
User input (paste / file drag)
        │
        ▼
  CodeMirrorEditor component
  (onChange) ──────────────────────────────────────┐
        │                                           │
        ▼                                           ▼
  useJsonDocument hook                    jsonParseLinter (in CM)
  rawJson: string (source of truth)       produces Diagnostics
        │                                           │
   ┌────┴────────────────┐                          ▼
   │                     │                 diagnosticCount()
   ▼                     ▼                 ──► StatusBar error badge
Editor tab active    Tree tab active
   │                     │
   ▼                     ▼
CodeMirrorEditor     TreeView
(full editor)        JSON.parse(rawJson)
                     → recursive TreeNode tree
                     node click → selectedPath: string
                                       │
                                       ▼
                               StatusBar JSONPath text

Toolbar actions (Format / Minify / Repair / Copy)
        │
        ▼
  read view.state.doc.toString()
  → transform (JSON.parse + JSON.stringify / jsonrepair)
  → view.dispatch({ changes: { from:0, to:len, insert:newValue } })
  → rawJson synced via onChange
```

### Recommended Project Structure

```
src/
├── components/
│   ├── AppShell.tsx          # Root layout: flex-col 100dvh, Tab bar + Toolbar + TabPanel + StatusBar
│   ├── CodeMirrorEditor.tsx  # @uiw/react-codemirror wrapper; exposes ref for toolbar dispatch
│   ├── Toolbar.tsx           # Format / Minify / Repair / Copy / Open File buttons
│   ├── TreeView.tsx          # Outer: parse JSON, render root TreeNode
│   ├── TreeNode.tsx          # Recursive: object/array/primitive; expand/collapse state
│   ├── StatusBar.tsx         # JSONPath text + error count badge (28px fixed)
│   └── ui/                   # shadcn copy-pasted components (tabs, button, etc.)
├── hooks/
│   ├── useJsonDocument.ts    # useState<string> for rawJson; shared between editor + tree
│   └── useEditorRef.ts       # Typed ref for CodeMirror EditorView access
├── lib/
│   ├── jsonTransform.ts      # format(), minify(), repair() — pure functions on string
│   ├── jsonPath.ts           # buildPath(key, parentPath) utility for tree node paths
│   └── clipboard.ts          # writeToClipboard() with try/catch + fallback
├── main.tsx
├── App.tsx
└── index.css                 # @import "tailwindcss"; + CSS custom properties
```

### Pattern 1: Shared Document State via Hook

**What:** A single `useJsonDocument` hook owns `rawJson: string`. Both the `CodeMirrorEditor` and `TreeView` receive it as a prop. The editor's `onChange` writes back to it.

**When to use:** All components that need to read or write the JSON document.

**Example:**
```typescript
// Source: CodeMirror controlled component pattern (Context7 /uiwjs/react-codemirror)
function useJsonDocument() {
  const [rawJson, setRawJson] = useState('');
  const onChange = useCallback((val: string) => setRawJson(val), []);
  return { rawJson, setRawJson, onChange };
}

// In AppShell:
const { rawJson, setRawJson, onChange } = useJsonDocument();

<CodeMirrorEditor value={rawJson} onChange={onChange} editorRef={editorRef} />
<TreeView rawJson={rawJson} onNodeSelect={setSelectedPath} />
```

### Pattern 2: Toolbar Dispatch via EditorView Ref

**What:** Toolbar buttons access the CodeMirror `EditorView` via a ref and call `view.dispatch()` to replace document content with formatted/minified/repaired JSON.

**When to use:** Format, Minify, Repair actions.

**Example:**
```typescript
// Source: Context7 /uiwjs/react-codemirror — Programmatic Editor Control via Ref
function handleFormat(editorRef: React.RefObject<{ view: EditorView }>) {
  const view = editorRef.current?.view;
  if (!view) return;
  const raw = view.state.doc.toString();
  try {
    const formatted = JSON.stringify(JSON.parse(raw), null, 2);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: formatted },
    });
  } catch {
    // leave invalid JSON in place; lint will show the error
  }
}
```

### Pattern 3: JSON Lint with Status Bar Error Count

**What:** `jsonParseLinter()` is passed to `linter()` as a CodeMirror extension. An `EditorView.updateListener` uses `diagnosticCount()` to update a React state variable that the status bar renders.

**When to use:** Editor mount + every document change (via updateListener).

**Example:**
```typescript
// Source: Context7 /codemirror/lint — Count Active Diagnostics
import { linter, diagnosticCount } from '@codemirror/lint';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';

const extensions = [
  json(),
  linter(jsonParseLinter()),
  EditorView.updateListener.of((update) => {
    const count = diagnosticCount(update.state);
    setErrorCount(count); // React state setter passed via closure
  }),
];
```

### Pattern 4: Recursive TreeNode with JSONPath

**What:** A recursive `TreeNode` component renders objects, arrays, and primitives. Each node receives its `path` string (e.g., `$.users[0].name`). Clicking a node calls `onSelect(path)` which updates the status bar.

**When to use:** NAV-01 and NAV-02.

**Example:**
```typescript
// Source: [ASSUMED] — standard recursive React tree pattern
interface TreeNodeProps {
  nodeKey: string | number;
  value: unknown;
  path: string;
  depth: number;
  onSelect: (path: string) => void;
}

function TreeNode({ nodeKey, value, path, depth, onSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2); // auto-expand first 2 levels
  const isObject = value !== null && typeof value === 'object';

  if (!isObject) {
    return (
      <div onClick={() => onSelect(path)} className="tree-leaf">
        <span className="tree-key">{String(nodeKey)}</span>:{' '}
        <span className="tree-value">{JSON.stringify(value)}</span>
      </div>
    );
  }
  // ... render expand/collapse toggle + children
}

// Path building utility:
function buildPath(parentPath: string, key: string | number): string {
  if (typeof key === 'number') return `${parentPath}[${key}]`;
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return `${parentPath}.${key}`;
  return `${parentPath}["${key}"]`;
}
```

### Pattern 5: Clipboard Write with Visible Feedback

**What:** `navigator.clipboard.writeText()` wrapped in try/catch. On success, briefly swap the button label to "Copied" (1.5 s). On failure, show an accessible error state.

**When to use:** EDIT-07 Copy button.

**Example:**
```typescript
// Source: MDN Clipboard API pattern [CITED: developer.mozilla.org/docs/Web/API/Clipboard_API]
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: create a temporary textarea, select, execCommand
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}
```

### Pattern 6: jsonrepair Usage

**What:** `jsonrepair()` takes a malformed JSON string and returns a repaired JSON string. Throws if the input is too broken to repair.

**When to use:** EDIT-06 Repair button.

**Example:**
```typescript
// Source: Context7 /josdejong/jsonrepair
import { jsonrepair } from 'jsonrepair';

function handleRepair(editorRef) {
  const view = editorRef.current?.view;
  if (!view) return;
  const raw = view.state.doc.toString();
  try {
    const repaired = jsonrepair(raw);
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: repaired },
    });
  } catch {
    // Already valid or unrepairable — UI-SPEC: show "JSON is already valid — nothing to repair."
    // Check: if JSON.parse(raw) succeeds, show that message; otherwise show a generic error
  }
}
```

### Pattern 7: File Loading

**What:** Hidden `<input type="file" accept=".json,application/json">` triggered by the "Open File" toolbar button via `ref.current.click()`. `FileReader.readAsText` reads the file; result is set as `rawJson`.

**When to use:** EDIT-02.

**Example:**
```typescript
// Source: [ASSUMED] — standard File API pattern
const fileInputRef = useRef<HTMLInputElement>(null);

function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const text = ev.target?.result as string;
    setRawJson(text);
    // Reset input so same file can be re-loaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  reader.onerror = () => {
    // UI-SPEC: "Could not read file. Make sure it is a valid text file and try again."
    setFileError(true);
  };
  reader.readAsText(file);
}
```

### Anti-Patterns to Avoid

- **Storing `JSON.parse(rawJson)` in component state alongside `rawJson`:** For MB-scale files, a parsed object is 3–5× the string size in memory. Parse transiently, on demand. [CITED: .planning/research/ARCHITECTURE.md]
- **Driving CodeMirror as a fully-controlled component on every keystroke:** Causes cursor-jump bugs. CodeMirror is semi-controlled — set `value` on programmatic updates (format, load), let `onChange` sync back. Do not re-set `value` from state on every render. [VERIFIED: Context7 /uiwjs/react-codemirror]
- **Not resetting `<input type="file">` value after load:** Without `fileInputRef.current.value = ''`, selecting the same file a second time fires no `change` event.
- **Parsing JSON in the tree component on every render:** Memoize `JSON.parse(rawJson)` with `useMemo` — reparse only when `rawJson` changes.
- **Not handling `JSON.parse` failure in TreeView:** If the user has typed mid-edit and the document is temporarily invalid, `JSON.parse` throws. TreeView must catch and render an "invalid JSON" placeholder without crashing.
- **Forgetting the Transform tab placeholder:** The layout must render a disabled "Transform" tab from Phase 1 so the tab bar width is stable when Phase 2 adds it. [CITED: CONTEXT.md — Phase 2 integration point]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON real-time syntax errors | Custom linter | `jsonParseLinter()` from `@codemirror/lang-json` + `linter()` | Integrated into CodeMirror's diagnostic lifecycle; handles cursor positioning, squiggle decoration, gutter markers |
| In-editor search (Ctrl+F) | Custom search UI | `@codemirror/search` via `basicSetup` | Handles case sensitivity, regex, next/prev match, keyboard shortcuts — fully featured with zero implementation |
| JSON repair | Custom fixup logic | `jsonrepair` 3.14.0 | Handles 20+ classes of malformed JSON including LLM output, JS-style objects, unquoted keys, trailing commas, and concatenated JSON |
| Dark VS Code theme | Custom `createTheme` | `@uiw/codemirror-theme-vscode` | Already maps all lezer highlight tags to VS Code dark colors; matches the `#1e1e1e` background from UI-SPEC |
| Accessible tab component | Custom div-tabs | `shadcn Tabs` (Radix) | ARIA roles, keyboard navigation (arrow keys), focus management — accessibility requirements out of the box |
| Toolbar button accessible tooltips | Custom tooltip div | `shadcn Tooltip` | Handles pointer, keyboard, touch with correct ARIA; includes delay and positioning |

**Key insight:** The CodeMirror ecosystem (lang-json + lint + search) handles the three hardest editor requirements (EDIT-03, NAV-03, status bar integration) with composition of extensions — no custom implementation needed.

---

## Common Pitfalls

### Pitfall 1: CodeMirror Controlled Component Cursor-Jump

**What goes wrong:** Setting the `value` prop on `@uiw/react-codemirror` from state that is itself derived from `onChange` causes an infinite update loop or cursor position reset on every keystroke.

**Why it happens:** `@uiw/react-codemirror` watches `value` prop changes and calls `view.dispatch` to reconcile. If the parent re-renders with the same value (from `onChange`), CodeMirror sees a prop change and resets the cursor.

**How to avoid:** Use `onChange` to update `rawJson` state. Pass `value` only for initial load and programmatic updates (format, file load, repair). The library handles the internal buffer; do not feed `onChange` output back into `value` synchronously.

**Warning signs:** Cursor jumps to document end on every keystroke; undo history resets after typing.

[VERIFIED: Context7 /uiwjs/react-codemirror — "Monaco as Uncontrolled with Debounced Sync" pattern applies equally to CodeMirror]

---

### Pitfall 2: TreeView Crash on Invalid JSON Mid-Edit

**What goes wrong:** The Tree tab renders while the user is mid-edit with temporarily invalid JSON. `JSON.parse(rawJson)` throws, and the TreeNode component crashes without a try/catch, taking down the whole page if there is no error boundary.

**Why it happens:** `JSON.parse` is synchronous and throws on any syntax error. The text editor and tree share `rawJson`, so every partial edit is visible to the tree.

**How to avoid:** Wrap `JSON.parse` in the `TreeView` in try/catch. Render a "Cannot display tree — JSON is not valid" placeholder when parsing fails. Add an error boundary above `TreeView` as a safety net.

**Warning signs:** Switching to Tree tab while the editor has an error causes a React "uncaught error" crash.

[ASSUMED based on React error behavior — standard defensive pattern]

---

### Pitfall 3: Large JSON Freezing the Tree View

**What goes wrong:** A 2+ MB JSON file (e.g., a large API export) parsed into a React tree renders thousands or millions of nodes, freezing the browser tab.

**Why it happens:** The custom recursive tree component creates a DOM node for every JSON value. A 500 KB JSON object with 10,000 keys generates at minimum 10,000 React elements — initially collapsed, but still instantiated.

**How to avoid:**
- Only render children of a node when it is expanded — `expanded` state prevents recursing into collapsed subtrees.
- Apply a size gate: if `rawJson.length > 2_000_000` (2 MB), disable the Tree tab and show "File too large for tree view — use the editor."
- Start with all nodes collapsed by default (except depth 0–1) to minimize initial render.

**Warning signs:** Switching to Tree tab on a large file hangs the browser; React DevTools shows a render that takes >1 second.

[CITED: .planning/research/PITFALLS.md — Pitfall 1: Rendering Large JSON on the Main Thread]

---

### Pitfall 4: Clipboard API Silent Failure

**What goes wrong:** `navigator.clipboard.writeText()` fails silently when the page is served over HTTP (not HTTPS/localhost), when the tab loses focus between click and write, or in Firefox private mode.

**Why it happens:** The Clipboard API is gated on a secure context and the document having focus. Firefox requires a user gesture within the same task as the clipboard write.

**How to avoid:** Always wrap in try/catch. Fall back to `document.execCommand('copy')` on a temporary `<textarea>`. Show visible "Copied" / error feedback so the user knows whether the operation succeeded.

**Warning signs:** Copy button does nothing in Firefox private mode; running on `http://` breaks clipboard.

[CITED: .planning/research/PITFALLS.md — Pitfall 8: Clipboard API Silent Failures]

---

### Pitfall 5: shadcn Init Requires Existing Vite Project

**What goes wrong:** Running `npx shadcn@latest init -t vite` on a directory that does not already have a `package.json` / Vite config fails or scaffolds incorrectly.

**Why it happens:** The shadcn CLI reads existing project config to determine path aliases and framework version.

**How to avoid:** Always scaffold with `npm create vite@latest` first, install Tailwind v4, confirm `vite.config.ts` exists, then run `npx shadcn@latest init -t vite`.

**Warning signs:** shadcn init completes but components fail to import with path alias errors (`@/components/ui/button` resolves to wrong directory).

[CITED: ui.shadcn.com/docs/installation/vite]

---

### Pitfall 6: Forgetting to Reset File Input After Load

**What goes wrong:** The user loads a file, modifies it in the editor, then tries to reload the same file. No `change` event fires because the browser sees the same file already selected.

**Why it happens:** Browser security model: `<input type="file">` tracks the file path and does not re-fire `change` for the same file.

**How to avoid:** After successfully reading the file in `reader.onload`, reset the input: `fileInputRef.current.value = ''`.

**Warning signs:** "Open File" does nothing on second click with the same file.

[ASSUMED — standard File API known behavior]

---

## Code Examples

Verified patterns from official sources:

### CodeMirror Editor with JSON Linting and VS Code Dark Theme

```typescript
// Source: Context7 /uiwjs/react-codemirror — Basic React CodeMirror Component
// + Context7 /codemirror/lint — Count Active Diagnostics
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter, diagnosticCount } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (val: string) => void;
  onErrorCountChange: (n: number) => void;
}

export function CodeMirrorEditor({ value, onChange, onErrorCountChange }: CodeMirrorEditorProps) {
  const extensions = useMemo(() => [
    json(),
    linter(jsonParseLinter()),
    lintGutter(),
    EditorView.updateListener.of((update) => {
      onErrorCountChange(diagnosticCount(update.state));
    }),
  ], [onErrorCountChange]);

  return (
    <CodeMirror
      value={value}
      theme={vscodeDark}
      extensions={extensions}
      onChange={onChange}
      height="100%"
      className="flex-1 overflow-hidden"
    />
  );
}
```

### jsonrepair for EDIT-06

```typescript
// Source: Context7 /josdejong/jsonrepair
import { jsonrepair } from 'jsonrepair';

export function repairJson(raw: string): string {
  return jsonrepair(raw); // throws if input cannot be repaired
}
```

### Tailwind v4 CSS Entry Point

```css
/* src/index.css */
/* Source: ui.shadcn.com/docs/installation/vite */
@import "tailwindcss";
```

### shadcn Tabs with Disabled Transform Placeholder

```tsx
// Source: Context7 /shadcn-ui/ui — Tabs Component Usage
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

<Tabs defaultValue="editor" className="flex flex-col h-full">
  <TabsList className="h-9 bg-[#252526]">
    <TabsTrigger value="editor">Editor</TabsTrigger>
    <TabsTrigger value="tree">Tree</TabsTrigger>
    <Tooltip>
      <TooltipTrigger asChild>
        <span> {/* span needed because disabled button blocks tooltip */}
          <TabsTrigger value="transform" disabled>Transform</TabsTrigger>
        </span>
      </TooltipTrigger>
      <TooltipContent>Transform with jq — available in the next phase</TooltipContent>
    </Tooltip>
  </TabsList>
  <TabsContent value="editor" className="flex-1 overflow-hidden">
    {/* CodeMirrorEditor */}
  </TabsContent>
  <TabsContent value="tree" className="flex-1 overflow-auto">
    {/* TreeView */}
  </TabsContent>
</Tabs>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PostCSS config for Tailwind | `@tailwindcss/vite` plugin; `@import "tailwindcss"` in CSS | Tailwind v4 (2025) | No `tailwind.config.js` needed for basic setup |
| `npx shadcn-ui@latest init` | `npx shadcn@latest init -t vite` | shadcn renamed package + Vite template flag added | Use new package name and `-t vite` flag |
| React 18 `createRoot` | React 19 `createRoot` (same API, new features) | React 19 GA (late 2024) | No breaking changes; `forwardRef` wrappers removed in shadcn v4 components |
| `lintKeymap` required separately | Included in `basicSetup` | CodeMirror 6 stable | `basicSetup` bundles search, lint keymap, fold gutter — no separate keymap imports needed |

**Deprecated / outdated:**
- `npx shadcn-ui@latest`: Old package name — use `npx shadcn@latest` instead. [CITED: ui.shadcn.com/docs/installation/vite]
- `@uiw/react-codemirror` v3.x: Previous major — v4.25.9 is current and required for React 19 compatibility. [VERIFIED: npm registry]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CONTEXT.md says "React 18" but STATE.md says "React 19 + Vite 6" and npm latest is 19.2.5. Research assumes React 19. | Standard Stack | If user intends React 18 explicitly, the planner should pin `react@18` — shadcn v4 is compatible with both |
| A2 | TreeNode expand state managed with local `useState` (no global state for tree expansion) | Architecture Patterns (Pattern 4) | If expand state needs to persist across tab switches, it must be lifted to parent or stored in a context/map |
| A3 | Large file threshold of 2 MB for disabling tree view | Common Pitfalls (Pitfall 3) | Actual threshold should be validated with profiling; 2 MB is a conservative starting point based on general browser limits |
| A4 | `@uiw/codemirror-theme-vscode` `vscodeDark` export matches UI-SPEC color palette closely enough without customization | Standard Stack | If theme colors diverge from `#1e1e1e`/`#0078d4`/`#d4d4d4` spec, a custom `createTheme` overlay is needed |
| A5 | `basicSetup` in `@uiw/react-codemirror` already includes `@codemirror/search` keymap (Ctrl+F) | Standard Stack (NAV-03) | If search is not in basicSetup, `searchKeymap` must be explicitly added to extensions |

---

## Open Questions

1. **React 18 vs React 19 — which version is locked?**
   - What we know: CONTEXT.md says "React 18 + TypeScript + Vite"; STATE.md records the initial stack decision as "React 19 + Vite 6"; npm latest is 19.2.5
   - What's unclear: Whether "React 18" in CONTEXT.md was a deliberate downpin or an artifact of early discussion
   - Recommendation: Default to React 19 (npm latest; shadcn v4 compatible); if the user had a specific reason for React 18, it should be re-confirmed

2. **Tree expand state persistence across tab switches**
   - What we know: Tab switching re-mounts TabsContent components by default in shadcn/Radix
   - What's unclear: Whether users expect tree expansion state to survive tab switches
   - Recommendation: Lift expand state to a `Map<string, boolean>` in the parent (keyed by node path) so it survives tab switches without full re-initialization

3. **Status bar JSONPath display when no tree node is selected**
   - What we know: UI-SPEC copy: "Select a node in the Tree view to see its path"
   - What's unclear: Whether this placeholder appears even when on the Editor tab (where no tree node can be selected)
   - Recommendation: Show the placeholder text at all times when `selectedPath` is null; clear it when the JSON document changes (paths become stale)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite dev server, npm install | ✓ | v24.15.0 | — |
| npm | Package installation | ✓ | 11.12.1 | — |
| Vite (global) | Dev server | ✓ | 8.0.9 (via npx) | Run via `npx vite` |
| Browser (Chromium/Firefox) | Testing SPA | Not verified | — | Developer installs locally |

**Missing dependencies with no fallback:** None — all required tools are available.

**Missing dependencies with fallback:** None identified.

---

## Validation Architecture

> `workflow.nyquist_validation` is `false` in config.json — this section is SKIPPED.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No user accounts in this tool |
| V3 Session Management | No | No session; stateless SPA |
| V4 Access Control | No | Single-user local tool |
| V5 Input Validation | Yes (limited) | JSON content is user-supplied but never executed; `jsonrepair` + `JSON.parse` are safe |
| V6 Cryptography | No | No secrets, tokens, or encrypted data |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via rendered JSON values | Tampering | React's JSX escapes all rendered values — `JSON.stringify(value)` in tree nodes is a string, never raw HTML |
| Prototype pollution via `JSON.parse` | Tampering | `JSON.parse` is safe against prototype pollution; it does not execute code or set `__proto__` on existing objects |
| Malicious file content | Spoofing | File is read as text and never executed; CodeMirror renders it as a string; no `eval` or `Function` constructor used |
| Clipboard API abuse | Information Disclosure | Only called on explicit user action (Copy button); never reads from clipboard |

**Note on `jsonrepair`:** The library parses and reconstructs JSON — it does not execute arbitrary code. The repair algorithm is a string transformer, not an interpreter. [CITED: github.com/josdejong/jsonrepair]

---

## Sources

### Primary (HIGH confidence)
- Context7 `/uiwjs/react-codemirror` — Component API, programmatic dispatch, custom theme pattern
- Context7 `/josdejong/jsonrepair` — Usage API, ESM import, error handling
- Context7 `/codemirror/lint` — `diagnosticCount`, `lintGutter`, `setDiagnostics` API
- Context7 `/shadcn-ui/ui` — Tabs component, Vite installation steps
- npm registry (2026-04-21) — All package versions verified

### Secondary (MEDIUM confidence)
- [ui.shadcn.com/docs/installation/vite](https://ui.shadcn.com/docs/installation/vite) — Vite init steps, Tailwind v4 setup
- [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4) — Tailwind v4 production-ready status
- WebSearch: `jsonParseLinter` usage pattern — multiple CodeMirror 6 sources confirm the API

### Tertiary (LOW confidence)
- .planning/research/STACK.md (2026-04-20) — Prior research (recommended Monaco; superseded by CONTEXT.md decisions)
- .planning/research/PITFALLS.md (2026-04-20) — Clipboard, large file, and sync pitfalls carried forward where applicable to CodeMirror
- .planning/research/ARCHITECTURE.md (2026-04-20) — Shared document state and Worker patterns (Worker not needed in Phase 1 but state model is relevant)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry 2026-04-21
- Architecture: HIGH — patterns derived from verified library APIs
- Pitfalls: MEDIUM-HIGH — CodeMirror-specific pitfalls verified; large-file threshold is [ASSUMED]
- Security: HIGH — no complex security surface for a client-side JSON viewer

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable libraries; Vite/React/Tailwind release cadence is moderate)
