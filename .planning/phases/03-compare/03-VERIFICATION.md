---
phase: 03-compare
verified: 2026-04-27T14:30:00Z
status: human_needed
score: 15/16 must-haves verified
overrides_applied: 0
---

# Phase 3: Compare Verification Report

**Phase Goal:** Users can open two JSON documents and view both value-level and structural differences between them
**Verified:** 2026-04-27T14:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can load two JSON documents and see a semantic value diff that ignores whitespace and key ordering (SC-1 / CMP-01) | VERIFIED | `ComparePaneHeader` has `new FileReader` + `onLoad` callback. `ComparePanel.handleCompare` calls `JSON.stringify(JSON.parse(...))` before `useDiff.compare()`. `useDiff.compare` calls `jsondiffpatch.diff()` on parsed objects. `useDiff.test.ts` Test 5/6 confirm key-order and whitespace insensitivity pass. |
| 2 | User can switch to a structural diff view showing which keys exist in one document but not the other (SC-2 / CMP-02) | VERIFIED | `ComparePanel` checks `mode === 'structure'` and calls `filterStructural(delta)` before building decorations. `filterStructural` drops `changed` entries (length 2) and keeps only `added` (length 1) and `removed` (length 3, `[v,0,0]`). 7 unit tests for `filterStructural` all pass. |
| 3 | AppShell has a fourth tab labelled `Compare` with the GitCompare icon, ordered after Transform | VERIFIED | `AppShell.tsx` imports `GitCompare` from `lucide-react`; has `<TabsTrigger value="compare">` with `GitCompare` icon and "Compare" label after the Transform trigger. `TabValue` type includes `'compare'`. |
| 4 | ComparePanel manages its own left/right JSON state — completely independent of useJsonDocument (D-01) | VERIFIED | `ComparePanel.tsx` uses `useState('')` for `leftJson`/`rightJson`; no import of `useJsonDocument`. `<ComparePanel />` mounted in `AppShell` with no props. |
| 5 | Compare button triggers useDiff.compare() which jsondiffpatch.diff()s the parsed objects and stores the delta (CMP-01) | VERIFIED | `handleCompare` formats both sides via `JSON.stringify(JSON.parse(...))` then calls `compare(leftFormatted, rightFormatted)`. `useDiff.compare` calls `jdpDiff(leftParsed, rightParsed)` and stores result. |
| 6 | After Compare, both panes flip to readOnly=true and inline diff decorations are dispatched into each editor view via the setDiffDecorations StateEffect (D-04) | VERIFIED | `ComparePanel` passes `readOnly={diffActive}` to both `ComparePaneEditor` instances. `useEffect` dispatches `setDiffDecorations.of(leftDeco)` / `setDiffDecorations.of(rightDeco)` after `compare()`. |
| 7 | Reset button clears delta + dispatches Decoration.none into both panes; panes return to editable (D-04) | VERIFIED | `handleReset` calls `reset()` (clears delta, sets `diffActive=false`). `useEffect` on `!diffActive` dispatches `Decoration.none` to both views. `readOnly={diffActive}` becomes `readOnly={false}`. Test 5 confirms reset click calls `resetSpy`. |
| 8 | Mode toggle Switch from Value to Structure rebuilds decorations from the same delta filtered by filterStructural — does NOT re-call jsondiffpatch.diff (D-05, D-08) | VERIFIED | `ComparePanel` `useEffect` uses `mode` from `useDiff` and applies `filterStructural` when `mode === 'structure'`. Test 10 confirms `compareSpy` is not called on mode switch. |
| 9 | Default mode on first render is Value (D-06) | VERIFIED | `useDiff` initialises `mode` via `useState<DiffMode>('value')`. Test 2 (ComparePanel) confirms `mode-toggle-value` has `aria-pressed="true"` on initial render. |
| 10 | Compare button is disabled with the right tooltip reason for all three disabled states (CMP-01) | VERIFIED | `ComparePanel` computes `compareDisabledReason` as `'both-empty' | 'one-empty' | 'invalid-json' | null`. `CompareToolbar` maps each reason to its UI-SPEC tooltip string. All four tooltip strings present in `CompareToolbar.tsx`. |
| 11 | When either pane has invalid JSON, that pane shows a ParseErrorBanner; valid panes do not show banners | VERIFIED (partial — UI path verified, jsdom seam skipped) | `parseProbe()` in `ComparePanel` returns the `SyntaxError.message` for invalid input. `ComparePaneEditor` renders `<ParseErrorBanner message={parseError} />` when `parseError !== null`. Test 8 is skipped (CodeMirror `cmView` not exposed in jsdom); manual UAT required. |
| 12 | Identical documents produce delta=undefined; panes still flip to readOnly=true (Pitfall 5) | VERIFIED | `useDiff.compare` sets `diffActive=true` regardless of delta value. Test 4 (useDiff) confirms identical input yields `delta === undefined, diffActive === true`. Test 9 (ComparePanel) confirms Reset button visible in this state. |
| 13 | Loading a file via ComparePaneHeader's Open File while diff is active automatically calls reset() (UI-SPEC) | VERIFIED | `handleLeftLoad` / `handleRightLoad` both check `if (diffActive) reset()` before `setLeftJson`/`setRightJson`. |
| 14 | Toolbar.tsx ToolbarProps.activeTab type union includes 'compare' (Pitfall 4) | VERIFIED | `Toolbar.tsx` line 25: `activeTab: 'editor' | 'tree' | 'transform' | 'compare'` |
| 15 | Toolbar.tsx Format/Minify/Repair buttons remain hidden on the Compare tab | VERIFIED | `showTransforms = activeTab === 'editor'` — unchanged. Transform buttons only rendered when `showTransforms` is true. `'compare'` never equals `'editor'`. |
| 16 | Toolbar.tsx Copy on the Compare tab returns empty string (no regression of EDIT-07) | VERIFIED | `handleCopy` has `activeTab === 'compare' ? '' :` branch (line 179-180 in `Toolbar.tsx`). |

**Score:** 15/16 truths verified at code level. Truth 11 is verified for the code path but the browser-visible render requires human confirmation (Test 8 skipped in jsdom).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | jsondiffpatch dependency | VERIFIED | `"jsondiffpatch": "^0.7.3"` in `dependencies` |
| `src/lib/diffDecorations.ts` | StateField/StateEffect/baseTheme + 3 utilities | VERIFIED | All 8 required exports present; color tokens `#4b1818`, `#1a3a1a`, `#3a2a00` confirmed; `RangeSetBuilder` used; sorted entries pattern implemented |
| `src/lib/diffDecorations.test.ts` | 17+ unit tests | VERIFIED | 17 `it(` blocks across 3 describe groups (`filterStructural` x7, `buildPaneDecorations` x4, `deltaToLineEntries` x6) |
| `src/hooks/useDiff.ts` | React hook: compare/reset/setMode | VERIFIED | Exports `useDiff`, `DiffMode`, `UseDiffReturn`; `jdpDiff` imported; no `try/catch` in `compare`; `useCallback` used |
| `src/hooks/useDiff.test.ts` | 9 unit tests | VERIFIED | 9 `it(` blocks; `toThrow` assertion for invalid JSON present |
| `src/components/ParseErrorBanner.tsx` | Error banner component | VERIFIED | `data-testid="parse-error-banner"`, `border-[#f44747]`, `font-mono whitespace-pre-wrap`, `Invalid JSON` heading |
| `src/components/ModeToggle.tsx` | Pill mode toggle | VERIFIED | `data-testid="mode-toggle"`, `aria-pressed`, `bg-[#0078d4]` active segment; imports `DiffMode` from `../hooks/useDiff` (reconciled in Plan 03) |
| `src/components/ComparePaneHeader.tsx` | Per-pane file loader | VERIFIED | `new FileReader`, `accept=".json,application/json,text/plain"`, `fileInputRef.current.value = ''` reset, `FolderOpen` icon |
| `src/components/ComparePaneEditor.tsx` | CodeMirror + ParseErrorBanner | VERIFIED | `useMemo([extraExtensions])`, `readOnly={readOnly}` (no `editable={`), `<ParseErrorBanner` on `parseError` |
| `src/components/CompareToolbar.tsx` | ModeToggle + Compare/Reset | VERIFIED | All 5 tooltip strings present; `<ModeToggle disabled={!diffActive}>` (corrected from plan's `disabled={diffActive}`); `data-testid="compare-toolbar"`, `compare-button`, `compare-reset-button` |
| `src/components/ComparePanel.tsx` | Root Compare panel | VERIFIED | `useDiff()`, 2x `useEditorRef()`, `<CompareToolbar>`, 2x `<ComparePaneEditor>`, 2x `<ComparePaneHeader>`, `setDiffDecorations.of(`, `Decoration.none`, `filterStructural(delta)`, `deltaToLineEntries(`, `buildPaneDecorations(`, `data-testid="compare-panel"`, `if (diffActive) reset()` |
| `src/components/ComparePanel.test.tsx` | 10-test composition coverage | VERIFIED | `describe('ComparePanel'`, `vi.mock('../hooks/useDiff'`, 9 active `it(` + 1 `it.skip` |
| `src/components/AppShell.tsx` | Compare tab mounted | VERIFIED | `GitCompare` import, `ComparePanel` import, `TabValue` includes `'compare'`, `<TabsTrigger value="compare">`, `<TabsContent value="compare">` with `<ComparePanel />` |
| `src/components/Toolbar.tsx` | activeTab widened | VERIFIED | `'editor' | 'tree' | 'transform' | 'compare'` union; `activeTab === 'compare' ? '' :` in `handleCopy`; `showTransforms` unchanged |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/hooks/useDiff.ts` | `jsondiffpatch` | `import { diff as jdpDiff } from 'jsondiffpatch'` | WIRED | Confirmed at line 2 |
| `src/lib/diffDecorations.ts` | `@codemirror/state` | `StateField, StateEffect, RangeSetBuilder` imports | WIRED | Confirmed at line 1 |
| `src/lib/diffDecorations.ts` | `@codemirror/view` | `Decoration, DecorationSet, EditorView` imports | WIRED | Confirmed at line 2 |
| `src/components/ComparePanel.tsx` | `src/hooks/useDiff.ts` | `const { delta, mode, ... } = useDiff()` | WIRED | Line 35 |
| `src/components/ComparePanel.tsx` | `src/lib/diffDecorations.ts` | imports `buildPaneDecorations, filterStructural, deltaToLineEntries, setDiffDecorations, diffDecorationsField, diffTheme` | WIRED | Lines 10-17; all called in `useEffect` |
| `src/components/ComparePanel.tsx` | `src/components/ComparePaneEditor.tsx` | `<ComparePaneEditor` x2 | WIRED | Lines 126, 139 |
| `src/components/ComparePanel.tsx` | `src/components/CompareToolbar.tsx` | `<CompareToolbar` | WIRED | Line 114 |
| `src/components/ComparePaneEditor.tsx` | `src/components/CodeMirrorEditor.tsx` (via CodeMirror) | `<CodeMirror` | WIRED | Uses `@uiw/react-codemirror` |
| `src/components/ComparePaneEditor.tsx` | `src/components/ParseErrorBanner.tsx` | `<ParseErrorBanner` on `parseError` | WIRED | Conditional render |
| `src/components/CompareToolbar.tsx` | `src/components/ModeToggle.tsx` | `<ModeToggle` | WIRED | Line 41 |
| `src/components/ComparePaneHeader.tsx` | `FileReader` | `new FileReader` in `handleFileChange` | WIRED | Line 23; `onLoad(text)` called in `reader.onload` |
| `src/components/AppShell.tsx` | `src/components/ComparePanel.tsx` | `<ComparePanel />` in `<TabsContent value="compare">` | WIRED | Line 92 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ComparePanel.tsx` | `delta` | `useDiff().compare()` → `jdpDiff(parsed_left, parsed_right)` | Yes — real jsondiffpatch computation | FLOWING |
| `ComparePanel.tsx` | `leftJson`/`rightJson` | User input via CodeMirror `onChange` + `ComparePaneHeader.onLoad` via `FileReader` | Yes — real user-supplied text | FLOWING |
| `ComparePanel.tsx` | `leftParseError`/`rightParseError` | `parseProbe()` calls `JSON.parse()` on state | Yes — real validation result | FLOWING |
| `ComparePanel.tsx` | `effectiveDelta` | `filterStructural(delta)` when `mode === 'structure'`, else `delta` | Yes — real delta filtered/passed through | FLOWING |
| Decoration dispatch | `leftDeco`/`rightDeco` | `buildPaneDecorations(view.state.doc, entries)` where `entries` come from `deltaToLineEntries(effectiveDelta, ...)` | Yes — real CodeMirror decorations from real delta | FLOWING |

### Behavioral Spot-Checks

| Behavior | Result | Status |
|----------|--------|--------|
| Full test suite (127 tests) | 127 passing, 1 skipped | PASS |
| TypeScript build (`npx tsc -b`) | Exits 0, no errors | PASS |
| `jsondiffpatch` in `package.json` | `"^0.7.3"` confirmed | PASS |
| All 11 phase 3 files tracked in git | All listed by `git ls-files` | PASS |
| `dangerouslySetInnerHTML` absent from all created files | No matches across `src/` | PASS |
| `editable={` absent from `ComparePaneEditor.tsx` | No matches (Pitfall 6 avoided) | PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CMP-01 | 03-01, 03-02, 03-03 | User can open two JSON documents and view a semantic value diff (ignores whitespace and key order) | SATISFIED | `useDiff.compare()` calls `jsondiffpatch.diff()` on parsed objects; `ComparePanel.handleCompare` normalises via `JSON.parse`/`JSON.stringify`; value-mode decorations dispatched via `setDiffDecorations`; 9 useDiff unit tests pass including key-order and whitespace tests |
| CMP-02 | 03-01, 03-02, 03-03 | User can view a structural diff showing which keys exist in one document but not the other | SATISFIED | `filterStructural()` drops `changed` entries and keeps only `added`/`removed`; mode toggle in `CompareToolbar` (ModeToggle with `disabled={!diffActive}`); `ComparePanel.useEffect` applies `filterStructural` when `mode === 'structure'`; 7 filterStructural unit tests pass |

No orphaned requirements — both CMP-01 and CMP-02 are fully claimed and implemented across all three plans.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/components/ComparePanel.test.tsx` line 121 | `it.skip` — parse error banner test skipped (CodeMirror `cmView` not exposed in jsdom) | Warning | Test 8 is not running; the code path is implemented and works, but not automatically verified in CI. Manual UAT required. |

No blocking anti-patterns found. No placeholder components, empty handlers, or disconnected stubs detected in production code paths.

### Human Verification Required

#### 1. Parse Error Banner Renders in Browser

**Test:** Open Compare tab. Type `not json` into the left pane.
**Expected:** A red-bordered banner appears above the left editor with the heading "Invalid JSON" and the specific SyntaxError message in monospace font. The Compare button becomes disabled with tooltip "Fix invalid JSON before comparing". The right pane shows no banner.
**Why human:** Test 8 is `it.skip` because CodeMirror's `cmView` property is not exposed on `.cm-editor` elements in the jsdom environment. The `parseProbe()` function and `ParseErrorBanner` component are both implemented correctly, but the end-to-end render path through CodeMirror's controlled `onChange` cannot be reliably tested in jsdom.

#### 2. Inline Diff Highlights Appear in Both Panes

**Test:** Paste `{"a": 1, "b": 2, "c": 3}` into the left pane and `{"a": 99, "c": 3, "d": 4}` into the right pane. Click Compare.
**Expected:** Both panes become read-only. Line with `"a"` is highlighted amber (`#3a2a00`) in both panes (changed). Line with `"b"` is highlighted red (`#4b1818`) in the left pane only (removed). Line with `"d"` is highlighted green (`#1a3a1a`) in the right pane only (added).
**Why human:** CodeMirror `EditorView.decorations` rendering requires a real browser DOM. The decoration dispatch logic is unit-tested at the pure-function level (`diffDecorations.test.ts`) and the `setDiffDecorations` effect is dispatched correctly in the `useEffect`, but visual line highlighting cannot be verified in jsdom.

#### 3. Structure Mode Shows Only Added/Removed Keys

**Test:** Using the same documents as test 2 above, after comparing in Value mode, click the "Structure" pill in the mode toggle.
**Expected:** The amber (`#3a2a00`) highlight on line `"a"` (changed/modified) disappears from both panes. The red highlight on `"b"` (removed) remains in the left pane. The green highlight on `"d"` (added) remains in the right pane. The mode toggle button now shows "Structure" as active (blue background).
**Why human:** This tests the `filterStructural → decoration rebuild → visual update` chain in a real browser. The logic is unit-tested (`filterStructural` and Test 10 for no-compare-spy-call), but visual verification of the highlight removal requires a running browser.

#### 4. File Load Auto-Resets Diff

**Test:** With an active diff showing highlights, click the "Open File" button in either pane and select a JSON file.
**Expected:** All diff highlights immediately disappear from both panes. Both panes return to editable (non-read-only). The toolbar switches from showing "Reset" back to showing "Compare". The loaded file's content appears in the pane where the button was clicked.
**Why human:** This tests the `handleLeftLoad → reset() → Decoration.none dispatch → UI state` chain. The code path is implemented with `if (diffActive) reset()` guards, but the visual state transition (highlights clearing, panes becoming editable) requires a browser.

---

## Gaps Summary

No gaps blocking goal achievement were found. All production code is implemented and substantive. The phase goal — "Users can open two JSON documents and view both value-level and structural differences between them" — is delivered end-to-end at the code level.

The single outstanding item (Test 8 skipped) reflects a jsdom limitation for CodeMirror-rendered UI, not a code deficiency. The `parseProbe()` and `ParseErrorBanner` implementations are correct and verified at the unit level; only the browser render path requires human confirmation.

**Human verification is required before this phase can be marked `passed`.** All 4 human tests above should be run against the dev server (`npm run dev`).

---

_Verified: 2026-04-27T14:30:00Z_
_Verifier: Claude (gsd-verifier)_
