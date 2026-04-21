# Phase 01 — UI Review

**Audited:** 2026-04-21
**Baseline:** 01-UI-SPEC.md (approved design contract)
**Screenshots:** Not captured — Playwright browser binaries not installed; code-only audit

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All 10 spec-mandated copy strings match verbatim; no generic labels found |
| 2. Visuals | 3/4 | Clear focal hierarchy; toolbar buttons lack aria-labels; JetBrains Mono not loaded |
| 3. Color | 4/4 | Accent used only on 3 spec-declared elements; all hex values map to design tokens |
| 4. Typography | 3/4 | Two sub-scale arbitrary sizes (10px, 11px) violate 12px minimum; JetBrains Mono absent |
| 5. Spacing | 3/4 | Scale is consistent; one minor under-padding on tree panel; py-0.5 below scale minimum |
| 6. Experience Design | 3/4 | All parse states handled; no keyboard handlers on tree nodes; empty-copy not guarded |

**Overall: 20/24**

---

## Top 3 Priority Fixes

1. **Sub-scale text sizes in StatusBar** — The error badge (`text-[10px]`) and "Valid JSON" indicator (`text-[10px]`) and toolbar status messages (`text-[11px]`) fall below the spec's declared 12px minimum for labels. At 10px these are hard to read on high-DPI displays and fail WCAG 1.4.4 (resize text). Fix: replace `text-[10px]` with `text-xs` (12px) in `StatusBar.tsx:32` and `StatusBar.tsx:37`, and replace `text-[11px]` with `text-xs` in `Toolbar.tsx:244`.

2. **Toolbar buttons are inaccessible without a pointer** — `ToolbarButton` in `Toolbar.tsx` wraps a `Button` inside a `Tooltip` but exposes no `aria-label` on the button element itself. Screen readers and keyboard-only users who do not trigger hover will only hear the icon SVG (no accessible name). Fix: add `aria-label={tooltip}` to the `Button` in `ToolbarButton` (`Toolbar.tsx:48-60`), and add `onKeyDown` handlers (`Enter`/`Space`) to `TreeNode` click containers (`TreeNode.tsx:39`, `TreeNode.tsx:66`).

3. **JetBrains Mono not loaded — spec font contract broken** — The UI-SPEC declares "JetBrains Mono 14px for editor/code areas". The tree nodes use `font-mono` which resolves to the browser's system monospace fallback (Courier New / DejaVu Sans Mono depending on OS). Only Geist Variable is imported in `index.css`. Fix: add `@import "@fontsource/jetbrains-mono"` (or the variable variant) to `src/index.css` and declare `--font-mono: 'JetBrains Mono', ui-monospace, monospace` in the `@theme inline` block, then set `font-family: var(--font-mono)` for `.cm-editor` in `index.css` and use `font-[family-name:var(--font-mono)]` in `TreeNode.tsx`.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

All 10 Copywriting Contract entries are implemented verbatim:

| Contract Entry | Expected | Found In | Status |
|----------------|----------|----------|--------|
| Empty state heading | "Paste or load JSON to get started" | `TreeView.tsx:40` | PASS |
| Empty state body | "Paste JSON into the editor, or click Open File..." | `TreeView.tsx:43-44` | PASS |
| Syntax error badge | "{N} error" / "{N} errors" | `StatusBar.tsx:34` | PASS |
| Valid JSON indicator | "Valid JSON" | `StatusBar.tsx:37` | PASS |
| JSONPath empty state | "Select a node in the Tree view to see its path" | `StatusBar.tsx:16` | PASS |
| Clipboard success | "Copied" (1.5s label swap) | `Toolbar.tsx:236` | PASS |
| File load error | "Could not read file. Make sure it is a valid text file and try again." | `Toolbar.tsx:131` | PASS |
| Repair: nothing to fix | "JSON is already valid — nothing to repair." | `Toolbar.tsx:163` | PASS |
| Transform tab tooltip | "Transform with jq — available in the next phase" | `AppShell.tsx:63` | PASS |
| Oversize state | "File too large for tree view — use the editor." | `TreeView.tsx:53` | PASS |
| Invalid JSON state | "Cannot display tree — JSON is not valid." | `TreeView.tsx:61` | PASS |

No generic "Submit", "OK", "Cancel", or "Save" labels were found. Toolbar CTA labels (Format, Minify, Repair, Copy) follow the spec's verb-only convention.

One note: the error recovery copy for Repair (`"Could not repair JSON — input is too malformed."` at `Toolbar.tsx:169`) is not listed in the Copywriting Contract but is reasonable defensive copy.

---

### Pillar 2: Visuals (3/4)

**Strengths:**
- Clear primary focal point: CodeMirror editor occupies the full flex-1 content area — largest visual region, receives initial focus on load.
- Tab bar icon + text label pairs (FileJson/Editor, GitBranch/Tree, Zap/Transform) provide clear affordance for each tab.
- Toolbar buttons all have icon + label + tooltip — three-layer affordance.
- Active tab underline (`shadow-[inset_0_-3px_0_0_#0078d4]`) provides a clear selection indicator.
- Disabled Transform tab is visually muted at `opacity-40`, consistent with the spec's Interaction States table.

**Issues:**
- **Toolbar buttons lack aria-label**: `ToolbarButton` (`Toolbar.tsx:38-65`) renders a `Button` with an icon and a text label, but passes no `aria-label` or `aria-describedby`. When the tooltip is not triggered (keyboard focus, no hover), screen readers read the button text label only — acceptable for text buttons but the label and tooltip convey different information. More critically, for users relying on tooltips for full context (e.g., shortcut hints), those are invisible without mouse interaction.
- **Tree node rows are click-only**: `TreeNode` container and leaf rows (`TreeNode.tsx:39`, `TreeNode.tsx:66`) use `onClick` with no `onKeyDown` handler and no `role="button"` or `tabIndex`. Keyboard-only users cannot navigate the tree.
- **JetBrains Mono absent**: Spec declares "JetBrains Mono 14px for editor/code areas." The tree node rows use `font-mono` but no JetBrains Mono font is imported — resolves to system monospace. The VS Code Dark theme in CodeMirror likely pulls its own monospace from the theme bundle, so the editor itself may render correctly, but TreeNode rows will not match.

---

### Pillar 3: Color (4/4)

Accent color `#0078d4` appears on exactly the 3 elements declared in the spec:
1. Active tab underline: `data-[state=active]:shadow-[inset_0_-3px_0_0_#0078d4]` — `AppShell.tsx:39,46`
2. Selected tree node background tint: `bg-[#0078d41a]` — `TreeNode.tsx:32`
3. Toolbar button focus ring: `focus-visible:ring-[#0078d4]` — `Toolbar.tsx:55`

No `text-primary`, `bg-primary`, or `border-primary` usage found (0 matches) — the app uses the custom CSS property system throughout.

All hardcoded hex values map to design tokens:

| Hex | Token | Usage |
|-----|-------|-------|
| `#1e1e1e` | `--color-bg-dominant` | App background |
| `#252526` | `--color-bg-secondary` | Tab bar, toolbar, status bar |
| `#0078d4` | `--color-accent` | Active tab, selection, focus ring |
| `#f44747` | `--color-error` | Error badge, toolbar error messages |
| `#4ec9b0` | `--color-success` | "Valid JSON" indicator |
| `#d4d4d4` | `--color-text-primary` | Body text, toolbar button text |
| `#858585` | `--color-text-muted` | Muted labels, tree node punctuation |
| `#3e3e42` | `--color-border` | All borders and separators |

Two additional colors appear in `TreeNode.tsx` that are outside the UI-SPEC token set:
- `#9cdcfe` — VS Code JSON key color (light blue) at `TreeNode.tsx:45,75`
- `#ce9178` — VS Code JSON value color (light orange) at `TreeNode.tsx:47`
- `#2a2d2e` — tree row hover at `TreeNode.tsx:33` (matches spec Interaction States table)
- `#37373d` — tree row active at `TreeNode.tsx:33` (matches spec Interaction States table)
- `#2d2d30` — toolbar button hover at `Toolbar.tsx:55` (matches spec Interaction States table)

The VS Code syntax colors are deliberate and appropriate for a developer JSON tool. They do not conflict with the UI chrome palette. These 2 extra values are a conscious extension, not a violation.

The `index.css` also defines a parallel shadcn OKLCH token set (light + dark) that coexists with the custom properties. These tokens are used only by shadcn component internals (Badge, Button, Tooltip) and do not leak into custom components.

---

### Pillar 4: Typography (3/4)

**Named scale usage (from Tailwind):**

| Class | px equiv | Spec token | Files |
|-------|----------|------------|-------|
| `text-xs` | 12px | Label | StatusBar.tsx, Toolbar.tsx, TreeNode.tsx, TreeErrorBoundary.tsx |
| `text-sm` | 14px | Body | TreeNode.tsx, TreeView.tsx (state placeholders) |
| `text-base` | 16px | Heading | TreeView.tsx:39 (empty-state heading) |

Three named sizes — within the spec's 4-size limit.

**Font weights:**

| Class | Spec role | Files |
|-------|-----------|-------|
| `font-semibold` | Heading (600) | TreeView.tsx:39 |
| `font-mono` | Structural (code areas) | TreeNode.tsx, StatusBar.tsx |

Two weights — matches spec's declared "400 and 600 only".

**Issues:**

- `text-[10px]` used in `StatusBar.tsx:32` (error badge) and `StatusBar.tsx:37` ("Valid JSON") — 10px is below the spec's 12px label minimum and below WCAG 1.4.4 recommended minimum for UI text.
- `text-[11px]` used in `Toolbar.tsx:244` (inline status messages) — 11px similarly below spec minimum.
- **JetBrains Mono not imported**: Spec states "JetBrains Mono 14px for editor/code areas." `font-mono` in TreeNode resolves to system monospace. The CodeMirror editor theme (vscodeDark) may apply its own monospace internally, but no explicit JetBrains Mono font-face is loaded for tree rows. `@fontsource-variable/geist` is imported but no `@fontsource/jetbrains-mono`.

---

### Pillar 5: Spacing (3/4)

**Standard scale values in use:**

| Value | Tailwind class | Spec token | Usage |
|-------|---------------|------------|-------|
| 4px | `gap-1` | xs | Toolbar button gaps, TreeNode row gap |
| 8px | `px-2`, `p-2` | sm | Toolbar padding, TreeNode padding, tree panel |
| 12px | `px-3` | — | Status bar horizontal padding |
| 16px | `px-4` | md | Tab trigger padding |
| 24px | `p-6` | lg | TreeView empty-state padding |
| 36px | `h-9` | Exception | Tab bar and toolbar height (spec-declared) |
| 28px | `h-7` | Exception | Status bar height (spec-declared) |

All major layout regions match spec heights exactly (h-9 for tab/toolbar, h-7 for status bar).

**Issues:**
- `py-0.5` (2px) on TreeNode rows (`TreeNode.tsx:30`) is below the spacing scale's 4px minimum (xs). This creates compact 2px top+bottom padding on tree rows — visually acceptable for a dense tree view (VS Code convention) but technically below the declared scale.
- `p-2` (8px) on the tree panel content wrapper (`TreeView.tsx:67`) gives less breathing room than the spec's `md` (16px) for panel content. The `p-4` (16px) used for state placeholder messages is correct.
- `gap-1.5` (6px) in toolbar button gaps (`Toolbar.tsx:55`) and icon-label gaps is not in the declared spacing scale (xs=4, sm=8). Functionally fine but an off-scale value.

**No problematic arbitrary values:** `max-w-[70%]` in StatusBar is a layout constraint, not a spacing value. All other arbitrary values are color/height references, not spacing.

---

### Pillar 6: Experience Design (3/4)

**State coverage analysis:**

| State Type | Covered | Evidence |
|------------|---------|----------|
| Loading states | N/A | All operations are synchronous; no async data fetching. No loading state needed. |
| Error boundary | YES | `TreeErrorBoundary` wraps `TreeView` with `getDerivedStateFromError` — `TreeErrorBoundary.tsx:10` |
| Empty state — editor | YES | "Paste or load JSON to get started" 2-part copy — `TreeView.tsx:36-47` |
| Invalid state | YES | "Cannot display tree — JSON is not valid." — `TreeView.tsx:58-63` |
| Oversize state | YES | "File too large for tree view — use the editor." — `TreeView.tsx:50-55` |
| Error state — file load | YES | "Could not read file..." with auto-clear — `Toolbar.tsx:128-135` |
| Error state — repair failure | YES | "Could not repair JSON — input is too malformed." — `Toolbar.tsx:168` |
| Disabled state | YES | Transform tab at `opacity-40` with tooltip — `AppShell.tsx:55-64` |
| Success feedback | YES | "Copied" label swap for 1.5s — `Toolbar.tsx:178-180` |
| Confirmation for destructive | N/A | Spec explicitly states no confirmation required in Phase 1 |

**Issues:**

- **Tree node rows are not keyboard-accessible**: Click handlers on `TreeNode` (`TreeNode.tsx:39`, `TreeNode.tsx:66`) have no corresponding `onKeyDown` (Enter/Space), no `tabIndex`, and no `role="button"`. Users who navigate with Tab/Enter cannot interact with the tree.
- **Copy of empty content not guarded**: `handleCopy` in `Toolbar.tsx:174` calls `readDoc(editorRef, rawJson)` and writes whatever is in the buffer to clipboard regardless of length, including empty string. A user on the Tree tab clicking Copy will silently write an empty string to the clipboard. A simple `if (!text) return;` or a feedback message would improve the experience.
- **Status bar "Valid JSON" on initial empty load**: On first paint, `rawJson = ''` and `errorCount = 0`. AppShell passes `rawJson` to StatusBar, so `hasContent = false` and the "Valid JSON" slot correctly renders an empty `<span />`. This was verified in code — the fix from Plan 03 to pass `rawJson` as an optional prop works correctly.

---

## Registry Safety

Registry audit: shadcn initialized (`components.json` present). UI-SPEC.md Registry Safety table lists only "shadcn official" components (Button, Tabs, Tooltip, Badge, Separator) with no third-party registries. 0 third-party blocks checked, no flags.

---

## Files Audited

- `src/components/AppShell.tsx`
- `src/components/CodeMirrorEditor.tsx`
- `src/components/Toolbar.tsx`
- `src/components/TreeView.tsx`
- `src/components/TreeNode.tsx`
- `src/components/StatusBar.tsx`
- `src/components/TreeErrorBoundary.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/tooltip.tsx`
- `src/hooks/useJsonDocument.ts`
- `src/hooks/useEditorRef.ts`
- `src/lib/jsonTransform.ts`
- `src/lib/clipboard.ts`
- `src/lib/jsonPath.ts`
- `src/index.css`
- `components.json`
