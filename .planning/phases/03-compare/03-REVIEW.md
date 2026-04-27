---
phase: 03-compare
reviewed: 2026-04-27T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/lib/diffDecorations.ts
  - src/lib/diffDecorations.test.ts
  - src/hooks/useDiff.ts
  - src/hooks/useDiff.test.ts
  - src/components/ParseErrorBanner.tsx
  - src/components/ModeToggle.tsx
  - src/components/ComparePaneHeader.tsx
  - src/components/ComparePaneEditor.tsx
  - src/components/CompareToolbar.tsx
  - src/components/ComparePanel.tsx
  - src/components/ComparePanel.test.tsx
  - src/components/AppShell.tsx
  - src/components/Toolbar.tsx
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-27
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed the full Compare phase implementation: the `diffDecorations` library, the `useDiff` hook, and all Compare UI components, plus integration points in `Toolbar.tsx` and `AppShell.tsx`. The core diff logic is well-structured with clear separation between pure utilities and CodeMirror integration. Tests are thorough and clearly cross-referenced to requirements. Three warnings were found: a misleading "Copied" confirmation when the Compare tab is active (copies empty string), a missing `FileReader.onerror` handler in `ComparePaneHeader`, and a dead-code return path in `findLineForPath`. Three informational items cover a redundant guard, a skipped test gap, and a minor style point.

## Warnings

### WR-01: Copy action on Compare tab silently copies empty string but shows "Copied" feedback

**File:** `src/components/Toolbar.tsx:179-188`

**Issue:** When `activeTab === 'compare'`, `handleCopy` hardcodes `text = ''` and then calls `writeToClipboard('')`. If the write succeeds (which it typically will for an empty string), `setCopied(true)` fires and the button label switches to "Copied" — giving the user false confirmation that something useful was copied. The user's clipboard is actually cleared or left with an empty string.

**Fix:** Disable the Copy button when `activeTab === 'compare'` (the Compare panel has no single output to copy), or skip the `writeToClipboard` call and show no feedback:

```tsx
// Option A — disable the button
<ToolbarButton
  icon={Copy}
  label={copied ? 'Copied' : 'Copy'}
  tooltip="Copy to clipboard"
  onClick={handleCopy}
  disabled={activeTab === 'compare'}
/>

// Option B — guard inside handleCopy
async function handleCopy() {
  if (activeTab === 'compare') return; // no-op: nothing to copy
  const text = activeTab === 'transform'
    ? (outputText ?? '')
    : readDoc(editorRef, rawJson);
  // ...rest unchanged
}
```

---

### WR-02: Missing FileReader error handler in ComparePaneHeader — silent failure on unreadable file

**File:** `src/components/ComparePaneHeader.tsx:23-29`

**Issue:** `handleFileChange` creates a `FileReader` and attaches `reader.onload` but no `reader.onerror`. If the file system read fails (e.g., permission error, file removed between selection and read), the failure is swallowed with no user feedback. `Toolbar.tsx` correctly handles this case with `reader.onerror` (line 130-137); the same pattern is missing here.

**Fix:**

```tsx
reader.onerror = () => {
  // surface error to user — prop or local state depending on design
  onLoad(''); // or call a dedicated onError prop
};
reader.readAsText(file);
```

A cleaner approach would add an optional `onLoadError?: (message: string) => void` prop so `ComparePanel` can surface the error via its existing parse-error display infrastructure.

---

### WR-03: Dead return branch in `findLineForPath` — unreachable literal `1` return

**File:** `src/lib/diffDecorations.ts:150`

**Issue:** The final `return` statement is:

```ts
return pathIdx === keyPath.length ? 1 : null;
```

The condition `pathIdx === keyPath.length` can never be true at this point. The only path where `pathIdx` reaches `keyPath.length` is inside the loop at line 143, which immediately returns `i + 1`. If the loop exits without that early return, `pathIdx < keyPath.length` always holds, so the ternary always evaluates to `null`. The `? 1` branch is dead code. While this does not cause incorrect behaviour (null is the correct sentinel), the literal `1` suggests a copy-paste artefact that could confuse future maintainers into thinking line 1 is a valid fallback.

**Fix:** Simplify to an unconditional `return null`:

```ts
  return null;
}
```

## Info

### IN-01: Redundant disabled guard in ModeToggle onClick handler

**File:** `src/components/ModeToggle.tsx:24`

**Issue:** The `onClick` handler checks `if (!disabled) onChange(id)` while the button already has `disabled={disabled}`. A disabled HTML button does not fire click events, making the runtime guard unnecessary. The double-guard is harmless but adds noise.

**Fix:** Remove the runtime guard and rely on the native `disabled` attribute:

```tsx
onClick={() => onChange(id)}
```

---

### IN-02: Skipped test leaves Compare button enable path untested

**File:** `src/components/ComparePanel.test.tsx:121`

**Issue:** Test 8 (`shows ParseErrorBanner when left pane contains invalid JSON`) is marked `.skip` with a comment that the `cmView` seam is not available in jsdom. This leaves the parse-error banner display path and the Compare-button enable/disable transition with real text untested at the integration level. The skip note recommends manual UAT.

**Suggestion:** Consider extracting a narrower unit test that exercises `parseProbe` directly (it is currently an unexported internal function in `ComparePanel.tsx`), or exporting and testing it separately. Alternatively, a Playwright/browser-mode test would be able to interact with the live CodeMirror view.

---

### IN-03: `handleReset` wrapper in ComparePanel is a no-op indirection

**File:** `src/components/ComparePanel.tsx:73-75`

**Issue:** `handleReset` is:

```ts
const handleReset = useCallback(() => {
  reset();
}, [reset]);
```

This wraps `reset` in an identical callback with the same dependency. It adds no logic and could be replaced by passing `reset` directly to `onReset`.

**Fix:**

```tsx
<CompareToolbar
  ...
  onReset={reset}
  ...
/>
```

---

_Reviewed: 2026-04-27_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
