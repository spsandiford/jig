# Phase 3: Compare - Research

**Researched:** 2026-04-27
**Domain:** JSON diff computation (jsondiffpatch) + CodeMirror 6 line decorations + React component composition
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Compare tab has two independent CodeMirror editor panes (Left and Right). Each supports paste and Open File. Completely self-contained — no dependency on the Editor tab's current document. Reuses `CodeMirrorEditor` component.
- **D-02:** Each pane supports both paste and file open (matching EDIT-01 and EDIT-02 behavior from Phase 1).
- **D-03:** Inline highlights directly in the Left and Right panes — diffs are decorated within each editor (removed content highlighted red in Left, added content highlighted green in Right, changed values highlighted amber). No separate output panel.
- **D-04:** Panes become read-only after the Compare action is triggered. A Reset/Edit button clears the diff state and re-enables editing.
- **D-05:** A pill/toggle control ("Value | Structure") sits above the panes. Switching mode re-runs the diff immediately and updates the inline highlights. No nested sub-tabs.
- **D-06:** Default mode on load is Value Diff (CMP-01).
- **D-07:** Use **jsondiffpatch** — structured delta format that maps directly to JSON key paths. Handles deep objects, arrays, and scalar value changes.
- **D-08:** Value Diff (CMP-01) uses `jsondiffpatch.diff()` on parsed objects. Structural Diff (CMP-02) uses a custom post-processing pass on the same delta to extract key-existence-only differences, suppressing value-change entries.

### Claude's Discretion

- Compare button placement (above the panes, between them, or in the toolbar): Claude decides.
- Exact highlight colors — Claude follows the established dark theme and picks red/green/amber that read clearly against the dark background.
- Whether jsondiffpatch runs on the main thread or in the Worker: Claude decides. (UI-SPEC has already resolved this to main thread.)
- Empty state when one or both panes are empty: Claude decides.
- Array diff granularity: Claude decides whether to highlight array element changes by index or show whole-array replacements.

### Deferred Ideas (OUT OF SCOPE)

- **CMP-V2-01:** Before/after transform diff (show what a jq expression changed relative to the original input) — tracked in v2 backlog, not in scope for Phase 3.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CMP-01 | User can open two JSON documents and view a semantic value diff (ignores whitespace and key order) | `jsondiffpatch.diff()` on parsed objects already normalises key order and whitespace; delta traversal drives decoration placement. |
| CMP-02 | User can view a structural diff showing which keys exist in one document but not the other | Post-processing pass on the same jsondiffpatch delta: retain only `[oldValue, 0, 0]` (deleted) and `[newValue]` (added) entries; suppress `[oldValue, newValue]` (changed value) entries. |

</phase_requirements>

---

## Summary

Phase 3 adds a Compare tab to the existing four-tab SPA. Two independent CodeMirror panes display inline diff decorations computed by `jsondiffpatch`. The architecture is purely client-side React; no worker is required because `jsondiffpatch.diff()` is synchronous and fast for typical JSON documents (UI-SPEC confirmed this in the interaction contract).

The primary technical challenge is translating a jsondiffpatch delta tree into CodeMirror `Decoration` objects keyed to document positions. The delta format is a plain JavaScript object whose structure mirrors the JSON path tree — added keys produce `[newValue]` entries, deleted keys produce `[oldValue, 0, 0]`, modified values produce `[oldValue, newValue]`, and arrays carry a `_t: 'a'` marker. A recursive traversal maps each delta node to one or more line numbers in the formatted JSON text, then emits `Decoration.line()` marks with the appropriate background CSS class plus a `GutterMarker` for the dot indicator.

**Primary recommendation:** Install `jsondiffpatch@0.7.3`, write a `useDiff` hook that holds `(delta | null, mode)` state and exposes `compare()` and `reset()` actions, write a `diffDecorations(delta, mode, doc)` utility that produces a `DecorationSet` for one pane, and pass the result as an `extensions` prop to each `CodeMirrorEditor` via a `StateField`.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| JSON diff computation | Browser / Client (main thread) | — | jsondiffpatch is synchronous, fast for typical docs; UI-SPEC explicitly chose main thread over worker |
| Diff decoration placement | Browser / Client (CodeMirror extension) | — | Decorations are editor-state concerns; must be in the same thread as the CodeMirror view |
| Mode switching (Value/Structure) | Browser / Client (React state) | — | Mode is a UI toggle; re-runs decoration computation, not a backend concern |
| Pane state (left/right JSON text) | Browser / Client (React state) | — | Self-contained; no dependency on global `useJsonDocument` |
| File loading per pane | Browser / Client (FileReader) | — | Same pattern as EDIT-02 in Phase 1; already proven |
| Tab registration | Browser / Client (AppShell.tsx) | — | Extends existing Tabs/TabsContent layout; Add `'compare'` to `TabValue` union |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsondiffpatch | 0.7.3 | Structured JSON delta computation | Only library in ecosystem producing a key-path-indexed delta tree suitable for CodeMirror decoration placement; locked by D-07. [VERIFIED: npm registry] |
| @codemirror/view | 6.41.1 (already installed) | Decoration, GutterMarker, StateField, StateEffect | CodeMirror's own decoration API; already a project dependency [VERIFIED: package.json] |
| @codemirror/state | 6.6.0 (already installed) | StateField, StateEffect, RangeSetBuilder | State management layer for CodeMirror decorations [VERIFIED: package.json] |
| @uiw/react-codemirror | 4.25.9 (already installed) | React wrapper; `extensions` prop, `readOnly` prop | Already in use; `readOnly` prop controls pane lock after diff [VERIFIED: package.json + Context7] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 1.8.0 (already installed) | `GitCompare` icon for Compare tab, `FolderOpen` for pane Open File buttons | All icon usage in this project [VERIFIED: package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsondiffpatch | json-diff | json-diff produces text-diff output, not a structured key-path delta — incompatible with inline highlight approach |
| jsondiffpatch | Custom recursive diff | More maintenance burden; jsondiffpatch handles array LCS, move detection, and deep nesting out of the box |
| Decoration.line() for highlights | Decoration.mark() on character ranges | Line-level decorations are simpler and sufficient; character-level would require knowing the exact positions of each key/value in the JSON text |

**Installation:**
```bash
npm install jsondiffpatch
```

**Version verification:** `npm view jsondiffpatch version` → `0.7.3` (latest as of 2026-04-27). [VERIFIED: npm registry]

---

## Architecture Patterns

### System Architecture Diagram

```
User pastes / loads JSON into Left pane
User pastes / loads JSON into Right pane
         |                       |
    [leftJson: string]     [rightJson: string]
         |                       |
         +-----------+-----------+
                     |
              User clicks Compare
                     |
             JSON.parse(leftJson)
             JSON.parse(rightJson)
                     |
            jsondiffpatch.diff(leftParsed, rightParsed)
                     |
                [delta: Delta | undefined]
                     |
         +-----------+-----------+
         |                       |
    mode === 'value'        mode === 'structure'
    (use delta as-is)       (filter delta: keep only
                            added/deleted entries,
                            suppress value-changes)
         |                       |
         +-----------+-----------+
                     |
         diffDecorations(delta, doc)
         called once per pane
                     |
    Walk delta tree → find line numbers in doc text
    → Decoration.line({class: ...}) per diff entry
    → GutterMarker per diff line
                     |
         StateField dispatches decoration set
         into each CodeMirrorEditor via extensions prop
                     |
         CodeMirror renders highlighted panes (read-only)
```

### Recommended Project Structure

```
src/
├── components/
│   ├── ComparePanel.tsx         # Root panel for Compare tab
│   ├── CompareToolbar.tsx       # Mode toggle + Compare/Reset buttons
│   ├── ModeToggle.tsx           # Pill: Value | Structure
│   ├── ComparePaneHeader.tsx    # "Left"/"Right" label + Open File icon button
│   ├── ComparePaneEditor.tsx    # Wraps CodeMirrorEditor + ParseErrorBanner
│   └── ParseErrorBanner.tsx    # Inline error banner for invalid JSON in a pane
├── hooks/
│   └── useDiff.ts              # Holds delta state; exposes compare(), reset(), mode
└── lib/
    └── diffDecorations.ts      # Pure utility: delta + doc → DecorationSet (per pane)
```

**Test files (one per new source file):**
```
src/
├── components/
│   ├── ComparePanel.test.tsx
│   └── CompareToolbar.test.tsx  (or inline in ComparePanel.test.tsx)
├── hooks/
│   └── useDiff.test.ts
└── lib/
    └── diffDecorations.test.ts
```

### Pattern 1: jsondiffpatch Delta Format

The delta is a recursive object. Understanding it is required to write `diffDecorations`.

```typescript
// Source: https://github.com/benjamine/jsondiffpatch/blob/master/docs/deltas.md
// [VERIFIED: Context7 /benjamine/jsondiffpatch]

import { diff } from 'jsondiffpatch';

const left  = { a: 1, b: 2, c: 3 };
const right = { a: 99, c: 3, d: 4 };

const delta = diff(left, right);
// delta = {
//   a: [1, 99],          // modified: [oldValue, newValue]
//   b: [2, 0, 0],        // deleted: [oldValue, 0, 0]
//   d: [4],              // added: [newValue]
//   // c is absent — unchanged
// }
```

**Delta node type rules:**
- `undefined` or absent key → unchanged (skip)
- `[newValue]` (length 1) → added (exists in right, not in left)
- `[oldValue, newValue]` (length 2) → modified value
- `[oldValue, 0, 0]` (length 3, `[1] === 0`, `[2] === 0`) → deleted
- `[unidiff, 0, 2]` (length 3, `[2] === 2`) → text diff (treat as modified for decorations)
- `{ _t: 'a', ... }` → array delta; iterate numeric keys and `_N` keys
- Object without `_t` → nested object delta; recurse

### Pattern 2: CodeMirror Decoration via StateField + StateEffect

The recommended pattern is a `StateField` that stores a `DecorationSet`. A `StateEffect` carries a new `DecorationSet` in from React. This is the correct pattern for externally-controlled decorations (React owns the diff state, not CodeMirror).

```typescript
// Source: Context7 /codemirror/view — Implement Decorations in CodeMirror
// [VERIFIED: Context7]

import { StateField, StateEffect } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';

// Define the effect that carries a new decoration set into the editor
export const setDiffDecorations = StateEffect.define<DecorationSet>();

// Define the field that holds and provides decorations
export const diffDecorationsField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    // Map existing decorations through document changes (if any)
    deco = deco.map(tr.changes);
    // Apply incoming effects
    for (const effect of tr.effects) {
      if (effect.is(setDiffDecorations)) {
        deco = effect.value;
      }
    }
    return deco;
  },
  provide: f => EditorView.decorations.from(f),
});
```

**Applying decorations from React (via EditorView ref):**

```typescript
// When diff is computed, dispatch new decorations into each pane's editor
function applyDecorations(view: EditorView, decoSet: DecorationSet) {
  view.dispatch({
    effects: setDiffDecorations.of(decoSet),
  });
}

// Reset decorations
function clearDecorations(view: EditorView) {
  view.dispatch({
    effects: setDiffDecorations.of(Decoration.none),
  });
}
```

The `diffDecorationsField` extension must be included in the `extensions` array of each `CodeMirrorEditor` that participates in diff. Since `CodeMirrorEditor` currently accepts an `extensions` prop via `@uiw/react-codemirror`, pass `[diffDecorationsField]` in the array (alongside existing `json()`, `linter(...)`, etc.).

### Pattern 3: Line Number → Document Position Mapping

`diffDecorations` must find the `from` position of each line in the CodeMirror document. The formatted JSON text is pretty-printed (2-space indent). Finding which line corresponds to a given JSON key path requires walking the JSON text.

**Approach:** Format both sides to pretty-printed JSON before passing to CodeMirror. Walk the formatted text line by line, matching key names. For each delta entry at a given path, find the line number in the formatted JSON, then use `state.doc.line(lineNumber).from` to get the document position.

```typescript
// Source: CodeMirror Text API — standard pattern
// [VERIFIED: Context7 /codemirror/view]

import { Text } from '@codemirror/state';
import { Decoration, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

// Example: highlight line 3 with a "removed" background
function buildDecorations(doc: Text, lineNumbers: Array<{ line: number; type: 'removed' | 'added' | 'changed' }>): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  // RangeSetBuilder requires ranges added in sorted order (ascending from position)
  const sorted = [...lineNumbers].sort((a, b) => a.line - b.line);
  for (const { line, type } of sorted) {
    if (line < 1 || line > doc.lines) continue;
    const { from } = doc.line(line);
    builder.add(from, from, Decoration.line({
      class: type === 'removed' ? 'cm-diff-removed'
           : type === 'added'   ? 'cm-diff-added'
                                 : 'cm-diff-changed',
    }));
  }
  return builder.finish();
}
```

**CSS classes for decoration** — inject via `EditorView.baseTheme`:

```typescript
// Source: CodeMirror EditorView.baseTheme — standard extension pattern
// [VERIFIED: Context7 /codemirror/view]

const diffTheme = EditorView.baseTheme({
  '&.cm-editor .cm-diff-removed':  { backgroundColor: '#4b1818' },
  '&.cm-editor .cm-diff-added':    { backgroundColor: '#1a3a1a' },
  '&.cm-editor .cm-diff-changed':  { backgroundColor: '#3a2a00' },
});
```

Include `diffTheme` in the `extensions` array alongside `diffDecorationsField`.

### Pattern 4: Key Path to Line Number Mapping

The delta tree mirrors the JSON key path structure. For a top-level key `b`, the delta entry is `delta.b`. To find line number of `"b"` in a formatted JSON string:

```typescript
// [ASSUMED] — This is the standard approach for simple key-based matching.
// For complex nested paths a recursive walk is needed.

function findKeyLineNumber(formattedJson: string, keyPath: string[]): number | null {
  const lines = formattedJson.split('\n');
  // Build the indented key pattern: depth * 2 spaces + '"keyName"'
  const depth = keyPath.length - 1;
  const key = keyPath[keyPath.length - 1];
  const indent = '  '.repeat(depth);
  const pattern = `${indent}"${key}"`;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith(`"${key}"`)) {
      // Verify indent matches depth
      if (lines[i].startsWith(pattern)) return i + 1; // 1-based line number
    }
  }
  return null;
}
```

**Important:** For arrays (`_t: 'a'`), array elements at index `N` appear at line `parent_line + N + 1` (approximate; walk sequentially). Highlight the entire element line. This covers the "array diff granularity" discretion item: the UI-SPEC chose to highlight entire array element lines by index. [CITED: 03-UI-SPEC.md — "Array diff: highlight entire array element lines by index"]

### Pattern 5: Structural Diff Filter (CMP-02)

The Structural Diff mode reuses the same delta from jsondiffpatch but filters out value-change entries. Only added and deleted entries remain:

```typescript
// Source: CONTEXT.md D-08 + jsondiffpatch delta format docs
// [VERIFIED: Context7 /benjamine/jsondiffpatch]

type Delta = Record<string, unknown>;

function isAdded(entry: unknown): boolean {
  return Array.isArray(entry) && entry.length === 1;
}

function isDeleted(entry: unknown): boolean {
  return Array.isArray(entry) && entry.length === 3 && entry[1] === 0 && entry[2] === 0;
}

function isModified(entry: unknown): boolean {
  return Array.isArray(entry) && entry.length === 2;
}

function filterStructural(delta: Delta): Delta {
  const result: Delta = {};
  for (const [key, value] of Object.entries(delta)) {
    if (key === '_t') { result[key] = value; continue; } // preserve array marker
    if (isAdded(value) || isDeleted(value)) {
      result[key] = value;  // keep existence-only changes
    } else if (!isModified(value) && typeof value === 'object' && value !== null) {
      // Recurse into nested objects
      const nested = filterStructural(value as Delta);
      if (Object.keys(nested).length > 0) result[key] = nested;
    }
    // isModified → drop (value changed, but key exists in both)
  }
  return result;
}
```

### Pattern 6: useDiff Hook Shape

```typescript
// [ASSUMED] — Shape based on useJqWorker.ts analog pattern from Phase 2 PATTERNS.md

import { useState, useCallback } from 'react';
import { diff as jdpDiff } from 'jsondiffpatch';

type DiffMode = 'value' | 'structure';
type Delta = Record<string, unknown> | undefined;

export interface UseDiffReturn {
  delta: Delta;
  mode: DiffMode;
  setMode: (m: DiffMode) => void;
  compare: (left: string, right: string) => void;
  reset: () => void;
  diffActive: boolean;
}

export function useDiff(): UseDiffReturn {
  const [delta, setDelta] = useState<Delta>(undefined);
  const [mode, setMode] = useState<DiffMode>('value');
  const [diffActive, setDiffActive] = useState(false);

  const compare = useCallback((left: string, right: string) => {
    const leftParsed = JSON.parse(left);
    const rightParsed = JSON.parse(right);
    const d = jdpDiff(leftParsed, rightParsed);
    setDelta(d);
    setDiffActive(true);
  }, []);

  const reset = useCallback(() => {
    setDelta(undefined);
    setDiffActive(false);
  }, []);

  return { delta, mode, setMode, compare, reset, diffActive };
}
```

### Anti-Patterns to Avoid

- **Re-parsing JSON on every render:** `jsondiffpatch.diff()` should only run when the user explicitly clicks Compare or switches mode. Do not call it inside a `useMemo` that reacts to the raw text changing — that would re-diff on every keystroke.
- **Rebuilding extensions array on every render:** Pass `[diffDecorationsField, diffTheme]` as a stable array (e.g., `useMemo(() => [...], [])`) to avoid CodeMirror re-creating the editor state on each React render.
- **Applying decorations before the editor view is mounted:** Check that `editorRef.current?.view` is non-null before dispatching effects.
- **Sorting RangeSetBuilder entries incorrectly:** `RangeSetBuilder.add()` requires entries in ascending `from` position order. Sort the line number array before building. Violating this throws a runtime error.
- **Using `Decoration.mark()` across multi-line values:** For an object value that spans multiple lines (e.g., a nested object), highlighting with a mark decoration on the character range would require knowing the exact character boundaries. Use `Decoration.line()` on each line of the range instead — simpler and sufficient per the UI-SPEC intent.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON diff computation | Custom recursive diff | jsondiffpatch | Array LCS, move detection, deep nesting, text diffing — all handled; locked by D-07 |
| JSON parse validation | Custom JSON validator | `JSON.parse()` try/catch | Already the project pattern; CodeMirror linter also catches syntax errors in real time |
| File reading | Custom file API | `FileReader.readAsText()` | Established EDIT-02 pattern in Toolbar.tsx; identical per-pane Open File behavior |
| CodeMirror theme injection | Inline style attributes | `EditorView.baseTheme()` | Correct CodeMirror extension API; inline styles bypass CodeMirror's rendering pipeline |
| Tab registration | New routing system | Extend existing Tabs/TabsContent in AppShell.tsx | AppShell already handles `TabValue` union and routing; adding `'compare'` is a one-line type change + tab trigger |

**Key insight:** The diff computation is a pure function (no async, no side effects). The complexity is entirely in the decoration placement layer — specifically mapping delta key paths to line numbers in the formatted JSON string. Keep `diffDecorations.ts` as a pure utility (inputs: delta, mode, doc text → outputs: DecorationSet per pane) so it can be unit-tested without mounting a CodeMirror instance.

---

## Common Pitfalls

### Pitfall 1: RangeSetBuilder Requires Sorted Order
**What goes wrong:** `RangeSetBuilder.add()` throws `"Ranges must be added sorted by \`from\` position"` at runtime if decoration ranges are added out of order.
**Why it happens:** The delta walk order follows JSON key order in the delta object, which does not correspond to line order in the formatted JSON.
**How to avoid:** Collect all `{ from, type }` entries first, sort by `from` ascending, then iterate to call `builder.add()`.
**Warning signs:** Runtime error in console immediately on first diff attempt.

### Pitfall 2: CodeMirrorEditor `extensions` Prop Instability
**What goes wrong:** Passing a new array literal `extensions={[diffDecorationsField, diffTheme]}` on every React render causes `@uiw/react-codemirror` to destroy and recreate the editor state, losing cursor position and scroll position.
**Why it happens:** React reference equality; a new array literal fails `===` check on every render.
**How to avoid:** Define the base extensions array outside the component or in a stable `useMemo(() => [...], [])` with no dependencies. Only the dynamically-dispatched `DecorationSet` changes (via `StateEffect`); the extension list itself is static.
**Warning signs:** Editor flickers or loses focus when diff mode is toggled.

### Pitfall 3: Dispatching StateEffect to an Unmounted View
**What goes wrong:** `view.dispatch(...)` throws `"Calling EditorView.dispatch on a view that has already been destroyed"` if the Compare tab was previously active but has since been unmounted.
**Why it happens:** React unmounts `TabsContent` when the user switches tabs; the editor view is destroyed but the React state (delta) persists.
**How to avoid:** Guard all `view.dispatch(...)` calls with a non-null check: `if (leftViewRef.current?.view) { ... }`. Re-apply decorations in a `useEffect` that runs when the Compare tab becomes active again.
**Warning signs:** Console error on tab switching after a diff has been computed.

### Pitfall 4: Toolbar `activeTab` Type Union Excludes `'compare'`
**What goes wrong:** `Toolbar.tsx` `ToolbarProps.activeTab` is typed as `'editor' | 'tree' | 'transform'`. Passing `'compare'` will produce a TypeScript type error.
**Why it happens:** The type union was not extended in Phase 2 to anticipate Phase 3.
**How to avoid:** Update `ToolbarProps.activeTab` to `'editor' | 'tree' | 'transform' | 'compare'` simultaneously with adding `'compare'` to `AppShell.tsx`'s `TabValue` type. Check that `Toolbar.tsx`'s `handleCopy` and `showTransforms` branches handle the `'compare'` case gracefully (suppress Format/Minify/Repair; Copy can be a no-op or copy Left pane content).
**Warning signs:** TypeScript build error on first test run after adding the Compare tab.

### Pitfall 5: jsondiffpatch Delta Is `undefined` When Documents Are Identical
**What goes wrong:** `jsondiffpatch.diff(left, right)` returns `undefined` (not `{}`) when the two objects are semantically equal. Code that iterates `Object.entries(delta)` without a null check will throw.
**Why it happens:** jsondiffpatch's contract is that `undefined` means "no differences". [VERIFIED: Context7 /benjamine/jsondiffpatch]
**How to avoid:** Check `if (!delta)` before traversing; show the "Documents are identical" / "Same keys in both documents" empty state from the UI-SPEC copywriting contract.
**Warning signs:** TypeError: Cannot convert undefined to object when clicking Compare on two identical documents.

### Pitfall 6: `readOnly` Prop vs `editable` Prop in @uiw/react-codemirror
**What goes wrong:** Setting `editable={false}` prevents the user from focusing or clicking the editor, which is too restrictive. The intent (D-04) is to prevent typing but still allow text selection and keyboard copying.
**Why it happens:** `editable: false` sets the `contenteditable` attribute to `false`, blocking all user interaction. `readOnly: true` allows selection but prevents modification. [VERIFIED: Context7 /uiwjs/react-codemirror]
**How to avoid:** Use `readOnly={diffActive}` — not `editable={!diffActive}` — when locking panes after Compare is triggered.
**Warning signs:** Users cannot select and copy text from diff panes.

---

## Code Examples

### Verified Pattern: jsondiffpatch diff import

```typescript
// Source: Context7 /benjamine/jsondiffpatch
import { diff } from 'jsondiffpatch';

const delta = diff(leftParsed, rightParsed);
// delta is undefined if no differences
```

### Verified Pattern: CodeMirror line decoration with RangeSetBuilder

```typescript
// Source: Context7 /codemirror/view
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet } from '@codemirror/view';

function buildLineDecos(doc: import('@codemirror/state').Text, lines: number[], cls: string): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const sorted = [...lines].sort((a, b) => a - b);
  for (const n of sorted) {
    if (n < 1 || n > doc.lines) continue;
    builder.add(doc.line(n).from, doc.line(n).from, Decoration.line({ class: cls }));
  }
  return builder.finish();
}
```

### Verified Pattern: StateField with StateEffect for externally-driven decorations

```typescript
// Source: Context7 /codemirror/view
import { StateField, StateEffect } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';

export const setDiffDecos = StateEffect.define<DecorationSet>();

export const diffDecosField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setDiffDecos)) deco = e.value;
    }
    return deco;
  },
  provide: f => EditorView.decorations.from(f),
});
```

### Verified Pattern: readOnly prop for @uiw/react-codemirror

```tsx
// Source: Context7 /uiwjs/react-codemirror — ReactCodeMirrorProps
<CodeMirror
  value={text}
  readOnly={diffActive}  // prevents editing; still allows text selection
  extensions={editorExtensions}
  // ...
/>
```

### Established Project Pattern: File loading per pane (mirrors Toolbar.tsx EDIT-02)

```typescript
// Source: Toolbar.tsx handleFileChange (lines 114-138) — established pattern
// Apply identical logic in ComparePaneHeader for left/right pane file loading

function handlePaneFileChange(e: React.ChangeEvent<HTMLInputElement>, onLoad: (text: string) => void) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const text = (ev.target?.result as string) ?? '';
    onLoad(text);
    if (e.target) e.target.value = '';
  };
  reader.readAsText(file);
}
```

### Established Project Pattern: AppShell tab extension

```typescript
// Source: AppShell.tsx — established pattern for adding tabs
// Type change (line 14):
type TabValue = 'editor' | 'tree' | 'transform' | 'compare';

// Tab trigger (after Transform trigger, same className pattern):
<TabsTrigger
  value="compare"
  className="h-9 px-4 rounded-none data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-[#d4d4d4] data-[state=active]:shadow-[inset_0_-3px_0_0_#0078d4] text-[#858585]"
>
  <GitCompare className="w-3.5 h-3.5 mr-1.5" />
  Compare
</TabsTrigger>

// TabsContent (after Transform content):
<TabsContent value="compare" className="flex-1 overflow-hidden m-0">
  <ComparePanel />
</TabsContent>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate diff output panel (list of changes) | Inline highlights in source panes | N/A (design decision D-03) | No output panel needed; all state lives in pane decorations |
| Worker for diff computation | Main thread synchronous | N/A (UI-SPEC decision) | Simpler architecture; no message-passing overhead |
| Manual JSON key diffing | jsondiffpatch structured delta | N/A | All edge cases (arrays, deep nesting, key ordering) handled by library |

**Deprecated/outdated:**
- `json-diff` npm package: text-diff oriented output, not a key-path delta — unsuitable for inline decoration placement.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `findKeyLineNumber` approach using indent-depth matching to locate JSON keys in formatted text is sufficient for all delta paths | Pattern 4 | If wrong, decoration placement will highlight incorrect lines; requires a more robust JSON-text-to-position mapper |
| A2 | `useDiff` hook shape (stateful compare/reset/mode) is the right abstraction boundary | Pattern 6 | Low risk — can be refactored; shape is informed by `useJqWorker` analog |
| A3 | Array element diff highlights by index produce correct line alignment when both documents have different-length arrays | Anti-Patterns section | If wrong, highlights may shift by the array index difference; may require a more careful traversal for array deltas |

---

## Open Questions

1. **Key path to line number mapping for deeply nested structures**
   - What we know: Simple top-level key matching by indent depth works for flat objects.
   - What's unclear: How to precisely locate a nested key like `delta.a.b.c` in the formatted JSON text when sibling keys at the same depth are visually identical (e.g., two nested objects both containing key `"name"`).
   - Recommendation: For v1, walk the JSON text sequentially and track depth by counting `{`, `[` characters. This is sufficient for the typical case. Document the limitation and defer character-accurate multi-level highlighting to v2 if needed.

2. **Gutter markers (dot indicators from UI-SPEC)**
   - What we know: The UI-SPEC specifies gutter dot markers (`#f44747` on Left, `#4ec9b0` on Right). CodeMirror's `gutter` + `GutterMarker` API supports this.
   - What's unclear: `GutterMarker` requires either adding a custom gutter (separate from `lintGutter`) or using `gutterLineClass` to add a CSS class to the existing line number gutter. The `lintGutter` already occupies the gutter column.
   - Recommendation: Use `gutterLineClass` to add a CSS class to the line number gutter cell, then style the `::after` pseudo-element to show the dot. This avoids adding a second gutter column. If this proves difficult in testing, downgrade to a coloured left-border on the line decoration (simpler, still communicates diff type).

---

## Environment Availability

Step 2.6: No new external dependencies beyond `jsondiffpatch` (npm install). Node, npm, and all existing tooling confirmed present from Phase 2.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test | ✓ | (system) | — |
| npm | Package install | ✓ | (system) | — |
| jsondiffpatch | CMP-01, CMP-02 | ✗ (not yet installed) | 0.7.3 (latest) | None — required by D-07 |
| Vitest | Test suite | ✓ | ^4.1.4 | — |

**Missing dependencies with no fallback:**
- `jsondiffpatch` — must be installed before implementation. `npm install jsondiffpatch`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react |
| Config file | `vite.config.ts` (test section inline) |
| Quick run command | `npm test -- --reporter=verbose` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMP-01 | `diffDecorations()` produces removed/added/changed line entries from a value diff delta | unit | `npm test -- src/lib/diffDecorations.test.ts` | ❌ Wave 0 |
| CMP-01 | `filterStructural()` preserves all entries (no-op for value mode) | unit | `npm test -- src/lib/diffDecorations.test.ts` | ❌ Wave 0 |
| CMP-01 | `useDiff.compare()` sets `diffActive: true` and delta with correct type | unit | `npm test -- src/hooks/useDiff.test.ts` | ❌ Wave 0 |
| CMP-01 | `ComparePanel` renders diff decorations state after Compare button click | component | `npm test -- src/components/ComparePanel.test.tsx` | ❌ Wave 0 |
| CMP-02 | `filterStructural()` drops modified entries, keeps only added/deleted | unit | `npm test -- src/lib/diffDecorations.test.ts` | ❌ Wave 0 |
| CMP-02 | Mode toggle switch from Value to Structure calls re-diff with filtered result | component | `npm test -- src/components/ComparePanel.test.tsx` | ❌ Wave 0 |
| Both | Compare button disabled when either pane is empty or has invalid JSON | component | `npm test -- src/components/ComparePanel.test.tsx` | ❌ Wave 0 |
| Both | Reset clears diffActive state and re-enables pane editing | component | `npm test -- src/components/ComparePanel.test.tsx` | ❌ Wave 0 |
| Both | Identical documents produce undefined delta and "Documents are identical" state | unit | `npm test -- src/lib/diffDecorations.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/diffDecorations.test.ts` — covers delta traversal, RangeSetBuilder, structural filter (CMP-01, CMP-02)
- [ ] `src/hooks/useDiff.test.ts` — covers compare/reset/mode state transitions (CMP-01, CMP-02)
- [ ] `src/components/ComparePanel.test.tsx` — covers Compare button states, Reset, mode toggle, empty state (CMP-01, CMP-02)

Framework already installed; no additional setup needed.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | `JSON.parse()` try/catch for pane content; invalid input shows ParseErrorBanner, blocks Compare button |
| V6 Cryptography | no | — |

### Known Threat Patterns for client-side JSON diff

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Excessively large JSON input causing UI freeze | Denial of Service (client-side) | No explicit size limit in v1; `jsondiffpatch.diff()` on main thread is synchronous — warn in PLAN that documents > 1 MB may cause jank. Defer size guard to v2. |
| Malformed JSON from file picker | Tampering | `JSON.parse()` try/catch; show ParseErrorBanner; disable Compare button when either pane is invalid |

No server-side surface; all processing is in the browser. XSS from diff output is not applicable because decorations are applied as CSS classes to CodeMirror lines, not as `innerHTML`.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/benjamine/jsondiffpatch` — delta format, diff function, array format, formatters
- Context7 `/codemirror/view` — Decoration, DecorationSet, StateField, StateEffect, RangeSetBuilder, GutterMarker patterns
- Context7 `/uiwjs/react-codemirror` — `readOnly` prop, `extensions` prop, `ReactCodeMirrorProps` interface
- `/home/node/jig/package.json` — confirmed installed packages and versions
- `/home/node/jig/src/components/AppShell.tsx` — existing tab layout, `TabValue` type
- `/home/node/jig/src/components/CodeMirrorEditor.tsx` — existing extensions pattern, `ReactCodeMirrorRef` usage
- `/home/node/jig/.planning/phases/03-compare/03-UI-SPEC.md` — UI design contract (layout, colors, interaction states, copywriting)
- `/home/node/jig/.planning/phases/03-compare/03-CONTEXT.md` — locked decisions D-01 through D-08
- npm registry (`npm view jsondiffpatch version`) — confirmed 0.7.3 latest

### Secondary (MEDIUM confidence)
- `/home/node/jig/.planning/phases/02-transform/02-PATTERNS.md` — established test patterns and component analog patterns from Phase 2

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against npm registry and project package.json
- Architecture: HIGH — jsondiffpatch delta format verified via Context7; CodeMirror decoration API verified via Context7; UI-SPEC provides exact layout and interaction contract
- Pitfalls: HIGH — most derived from CodeMirror and React reference equality facts verified via Context7; A1/A3 in Assumptions Log are the remaining uncertainty areas
- Test map: HIGH — requirement IDs from REQUIREMENTS.md; test framework from vite.config.ts

**Research date:** 2026-04-27
**Valid until:** 2026-05-27 (jsondiffpatch is stable; CodeMirror 6 API is stable)
