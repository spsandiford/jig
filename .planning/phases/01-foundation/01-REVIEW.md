---
phase: 01-foundation
reviewed: 2026-04-21T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - src/components/AppShell.tsx
  - src/components/CodeMirrorEditor.tsx
  - src/components/Toolbar.tsx
  - src/components/TreeView.tsx
  - src/components/StatusBar.tsx
  - src/components/TreeErrorBoundary.tsx
  - src/components/TreeNode.tsx
  - src/hooks/useJsonDocument.ts
  - src/hooks/useEditorRef.ts
  - src/lib/utils.ts
  - src/lib/jsonTransform.ts
  - src/lib/clipboard.ts
  - src/lib/jsonPath.ts
  - src/lib/__tests__/jsonTransform.test.ts
  - src/lib/__tests__/clipboard.test.ts
  - src/lib/jsonPath.test.ts
  - src/components/TreeNode.test.tsx
  - src/test/setup.ts
  - vite.config.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-21T00:00:00Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

This is a well-structured React/TypeScript codebase for a JSON editor. The component decomposition is clean, state management is appropriately simple, and the library utilities have good test coverage. No security vulnerabilities were found. There are four warnings around correctness and reliability (a state desync risk, an unhandled promise path, a regex gap in JSONPath, and a missing cleanup in setTimeout) and three info-level quality notes.

## Warnings

### WR-01: Toolbar `handleFormat`/`handleMinify` update the editor view but not `rawJson` state — causes desync

**File:** `src/components/Toolbar.tsx:143-157`

**Issue:** `handleFormat` and `handleMinify` call `replaceDoc(editorRef, ...)` which dispatches directly into the CodeMirror view. The CodeMirror `onChange` callback will fire and propagate back through `useJsonDocument.onChange` to update `rawJson`, **but only if the editor is mounted and its `onChange` prop is wired**. When the user is on the Tree tab (editor unmounted / hidden by `TabsContent`), `replaceDoc` is a no-op because `editorRef.current?.view` is `undefined`, yet the toolbar is still visible (only transform buttons are hidden). If a future refactor hides the editor differently (e.g., `display:none` with `keepMounted`), the view would exist but `onChange` might not fire, leaving `rawJson` and the view out of sync permanently.

More concretely: `handleOpenFile` correctly dual-writes (`setRawJson(text)` + `replaceDoc`) for exactly this reason. `handleFormat` and `handleMinify` only call `replaceDoc` — if the editor is hidden/unmounted they silently no-op without notifying the caller. Consistency with the Open File pattern would require catching the transformed result and calling `setRawJson` as well.

**Fix:**
```tsx
function handleFormat() {
  const raw = readDoc(editorRef, rawJson);
  try {
    const formatted = format(raw);
    setRawJson(formatted);           // keep React state in sync
    replaceDoc(editorRef, formatted); // reset cursor/scroll if view is live
  } catch {
    // Invalid JSON — leave unchanged
  }
}

function handleMinify() {
  const raw = readDoc(editorRef, rawJson);
  try {
    const minified = minify(raw);
    setRawJson(minified);
    replaceDoc(editorRef, minified);
  } catch {
    // Invalid JSON — no-op
  }
}
```

---

### WR-02: `handleCopy` silently succeeds when clipboard write is skipped — `ok` can be `false` from `execCommand`

**File:** `src/lib/clipboard.ts:29` and `src/components/Toolbar.tsx:174-183`

**Issue:** The `execCommand('copy')` fallback returns a `boolean` — `false` when the browser refuses (e.g., no user gesture in certain environments, document not focused). The outer `writeToClipboard` function already propagates this `false` return correctly. However the `handleCopy` handler in Toolbar checks `if (ok)` and treats `false` as a failure (shows error status) — that part is fine.

The actual gap is in the `writeToClipboard` fallback path: the `textarea` is appended to `document.body` and focused before `execCommand`. In jsdom / test environments `document.body` is always available, but in production if the document is not yet fully loaded (unlikely but possible during fast app startup), `document.body.appendChild` will throw a `TypeError` which is caught by the outer `catch` returning `false`. This is the intended behavior so the error is swallowed correctly.

**Actual concern:** In `clipboard.ts` line 29, `document.execCommand('copy')` is called without checking whether `document.body` exists first. The `el.parentNode` null-check in `finally` guards cleanup, but `document.body.appendChild(el)` on line 25 will throw if body is null — caught by the inner catch, returning `false`. This is acceptable defensive behavior but `document.body` should be checked explicitly for clarity:

**Fix:**
```ts
if (!document.body) return false;
document.body.appendChild(el);
```

This makes the intent explicit and avoids relying on exception control flow for a predictable condition.

---

### WR-03: `buildPath` does not escape backslashes in bracket-quoted key segments

**File:** `src/lib/jsonPath.ts:18`

**Issue:** The `buildPath` function escapes double-quote characters in non-identifier keys (`key.replace(/"/g, '\\"')`), but does not first escape backslashes. A key containing a literal backslash (e.g., `"path\\to"`) will produce `$["path\to"]` — the backslash is not doubled, making the resulting JSONPath string technically invalid for consumers that parse escape sequences (e.g., jq, JSONPath libraries). The test suite does not include a backslash-in-key case.

**Fix:**
```ts
const escaped = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
return `${parentPath}["${escaped}"]`;
```

Add a test:
```ts
it('escapes backslashes in keys', () => {
  expect(buildPath('$', 'path\\to')).toBe('$["path\\\\to"]');
});
```

---

### WR-04: `showStatus` `setTimeout` callback is not cleared on unmount — potential setState-after-unmount

**File:** `src/components/Toolbar.tsx:100-104`

**Issue:** `showStatus` schedules `window.setTimeout(() => { setStatusTone(null); setStatusText(''); }, durationMs)`. If the `Toolbar` component unmounts before the timeout fires (e.g., user navigates away or the app is torn down), React will attempt to call `setStatusTone`/`setStatusText` on the unmounted component. In React 18 this does not throw, but it is a stale-closure / potential memory-retention issue and will generate warnings in strict-mode development.

The same pattern applies to `handleCopy`'s `window.setTimeout(() => setCopied(false), 1500)` on line 179.

**Fix:** Collect timer IDs and clear them in a cleanup. The cleanest approach given the functional component pattern is to use `useEffect` for any timer that needs cancellation, or to accumulate IDs in a ref:

```tsx
const timerRef = useRef<ReturnType<typeof window.setTimeout>[]>([]);

function scheduleReset(ms: number, fn: () => void) {
  const id = window.setTimeout(fn, ms);
  timerRef.current.push(id);
}

useEffect(() => {
  return () => timerRef.current.forEach(window.clearTimeout);
}, []);
```

Then replace direct `window.setTimeout(...)` calls with `scheduleReset(...)`.

---

## Info

### IN-01: `TreeView` maintains its own `selectedPath` state that duplicates `AppShell` state

**File:** `src/components/TreeView.tsx:29`

**Issue:** `TreeView` holds `const [selectedPath, setSelectedPath] = useState<string | null>(null)` internally, while `AppShell` also holds `const [selectedPath, setSelectedPath] = useState<string | null>(null)`. The `AppShell` copy is used for the `StatusBar`. Both are updated on selection, but if `TreeView` is ever unmounted and remounted (tab switch), its local `selectedPath` resets to `null`, losing the visual highlight even though `AppShell`'s `selectedPath` still holds the last value. The `StatusBar` will still show the correct path but the tree highlight will be gone.

**Fix:** Either pass `selectedPath` down from `AppShell` as a prop (making `TreeView` fully controlled for selection), or remove `TreeView`'s local state and use the parent's value directly. The `onNodeSelect` callback already goes up to `AppShell`, so the state just needs to come back down:

```tsx
// AppShell
<TreeView rawJson={rawJson} selectedPath={selectedPath} onNodeSelect={setSelectedPath} />

// TreeView — remove internal selectedPath state, use prop
export interface TreeViewProps {
  rawJson: string;
  selectedPath: string | null;
  onNodeSelect: (path: string) => void;
}
```

---

### IN-02: `clipboard.test.ts` only tests the happy path — fallback path has no test coverage

**File:** `src/lib/__tests__/clipboard.test.ts`

**Issue:** The two tests only exercise the `navigator.clipboard.writeText` success path. The `execCommand` fallback path (lines 16-36 of `clipboard.ts`) has zero test coverage. Given that the fallback contains non-trivial DOM manipulation and a null-check in `finally`, a test that simulates clipboard API unavailability (setting `navigator.clipboard` to `undefined`) would catch regressions.

**Fix:** Add tests:
```ts
it('falls back to execCommand when clipboard API is unavailable', async () => {
  Object.defineProperty(globalThis, 'navigator', {
    value: {},
    writable: true,
    configurable: true,
  });
  document.execCommand = vi.fn().mockReturnValue(true);
  const { writeToClipboard } = await import('../clipboard');
  const result = await writeToClipboard('fallback text');
  expect(result).toBe(true);
});

it('returns false when both clipboard API and execCommand fail', async () => {
  Object.defineProperty(globalThis, 'navigator', {
    value: {},
    writable: true,
    configurable: true,
  });
  document.execCommand = vi.fn().mockImplementation(() => { throw new Error('denied'); });
  const { writeToClipboard } = await import('../clipboard');
  const result = await writeToClipboard('text');
  expect(result).toBe(false);
});
```

---

### IN-03: `StatusBar` receives `rawJson` as optional but `AppShell` never passes it

**File:** `src/components/StatusBar.tsx:11` and `src/components/AppShell.tsx:93`

**Issue:** `StatusBarProps` declares `rawJson?: string` as optional, and the JSDoc says "when omitted the 'Valid JSON' indicator still requires errorCount === 0 to render." However, `AppShell` renders `<StatusBar selectedPath={selectedPath} errorCount={errorCount} />` without passing `rawJson`. This means `hasContent` defaults to `true` (line 18: `rawJson === undefined ? true : ...`), and the "Valid JSON" badge appears even when the editor is empty and `errorCount === 0`. The label is cosmetically misleading — empty content is not "valid JSON."

**Fix:** Pass `rawJson` from `AppShell` so the component can distinguish empty-document from valid-document:

```tsx
<StatusBar selectedPath={selectedPath} errorCount={errorCount} rawJson={rawJson} />
```

This uses the prop that already exists in `StatusBar` but is never supplied by its only consumer.

---

_Reviewed: 2026-04-21T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
