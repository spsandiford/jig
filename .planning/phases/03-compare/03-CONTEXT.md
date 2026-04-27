# Phase 3: Compare - Context

**Gathered:** 2026-04-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a Compare tab where users can load two independent JSON documents side-by-side and view differences between them. Two diff modes: semantic value diff (CMP-01) and structural diff (CMP-02). All computation runs client-side; no backend required.

Requirements in scope: CMP-01, CMP-02.

</domain>

<decisions>
## Implementation Decisions

### Input Sources
- **D-01:** Compare tab has two independent CodeMirror editor panes (Left and Right). Each supports paste and Open File. Completely self-contained — no dependency on the Editor tab's current document. Reuses `CodeMirrorEditor` component.
- **D-02:** Each pane should support both paste and file open (matching EDIT-01 and EDIT-02 behavior from Phase 1).

### Diff View Style
- **D-03:** Inline highlights directly in the Left and Right panes — diffs are decorated within each editor (removed content highlighted red in Left, added content highlighted green in Right, changed values highlighted amber). No separate output panel.
- **D-04:** Panes become read-only after the Compare action is triggered. A Reset/Edit button clears the diff state and re-enables editing. Prevents confusing stale highlights while typing.

### Mode Switching
- **D-05:** A pill/toggle control ("Value | Structure") sits above the panes. Switching mode re-runs the diff immediately and updates the inline highlights. No nested sub-tabs.
- **D-06:** Default mode on load is Value Diff (CMP-01).

### Diff Library
- **D-07:** Use **jsondiffpatch** — structured delta format that maps directly to JSON key paths, enabling precise CodeMirror decoration placement. Handles deep objects, arrays, and scalar value changes. This choice drives the inline-highlights approach: the delta tree is traversed to compute decoration ranges for each pane.
- **D-08:** Value Diff (CMP-01) uses jsondiffpatch's full delta (ignoring whitespace and key order — `jsondiffpatch.diff()` on parsed objects). Structural Diff (CMP-02) uses a custom post-processing pass on the same delta to extract key-existence-only differences (keys present in one side but not the other), suppressing value-change entries.

### Claude's Discretion
- Compare button placement (above the panes, between them, or in the toolbar): Claude decides, keeping it discoverable alongside the mode toggle.
- Exact highlight colors — Claude follows the established dark theme (`#1e1e1e` / `#252526` / `#0078d4`) and picks red/green/amber that read clearly against the dark background.
- Whether jsondiffpatch runs on the main thread or in the Worker: Claude decides based on complexity and whether the Worker Facade from Phase 2 is worth extending for this use case.
- Empty state when one or both panes are empty: Claude decides (e.g., disabled Compare button with a tooltip).
- Array diff granularity: Claude decides whether to highlight array element changes by index or show whole-array replacements.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Full v1 requirement list; CMP-01 and CMP-02 are the Phase 3 requirements.
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope list (CMP-V2-01 before/after transform diff is deferred to v2).

### Roadmap
- `.planning/ROADMAP.md` — Phase 3 success criteria (2 criteria) and dependency notes.

### Prior Phase Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Established patterns: tab layout, CodeMirrorEditor component, dark theme tokens, Toolbar pattern.
- `.planning/phases/02-transform/02-CONTEXT.md` — Worker Facade (jqWorker), run-button-only pattern, error display conventions.

No external ADRs or specs — all decisions captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/AppShell.tsx` — Tab layout with `TabValue` type; Compare tab needs to be added as a 4th value (`'compare'`). Established tab bar styling pattern to follow.
- `src/components/CodeMirrorEditor.tsx` — Reusable editor component; Compare will instantiate two of these for Left and Right panes.
- `src/components/Toolbar.tsx` — Toolbar receives `activeTab` and `outputText`; may need Compare-specific Copy behavior wired in.
- `src/hooks/useJsonDocument.ts` — Reference for managing JSON document state; Compare will need its own left/right document state (new hook or two instances).
- `src/workers/jqWorker.ts` — Worker Facade pattern using raw postMessage; designed for a second consumer (Phase 2 CONTEXT.md noted this). Compare's diff computation may or may not reuse this.
- `src/components/ErrorBanner.tsx` — Existing error display component; reuse if invalid JSON is pasted into a Compare pane.

### Established Patterns
- Tab-based layout: `editor` | `tree` | `transform` — Compare is the 4th tab.
- Dark theme tokens: `#1e1e1e` background, `#252526` tab bar, `#0078d4` active tab underline, `#d4d4d4` active text, `#858585` inactive text — apply same tokens in Compare panel.
- Run-button pattern from Phase 2: user triggers computation explicitly; no auto-run.
- Toolbar Copy routes based on `activeTab` — Compare tab will need its own copy target.

### Integration Points
- `AppShell.tsx` `TabValue` type needs `'compare'` added.
- A new tab trigger and `<TabsContent value="compare">` block in AppShell.
- Compare panel is self-contained with its own Left and Right document state; does not read `rawJson` from `useJsonDocument` (unlike TransformPanel).

</code_context>

<specifics>
## Specific Ideas

- No specific UI references provided beyond the established VS Code-style dark aesthetic from Phase 1.
- Inline diff highlights should feel like CodeMirror's own lint squiggles — subtle decorations within the editor, not overlaid overlays.

</specifics>

<deferred>
## Deferred Ideas

- **CMP-V2-01**: Before/after transform diff (show what a jq expression changed relative to the original input) — already tracked in v2 deferred items.

</deferred>

---

*Phase: 03-compare*
*Context gathered: 2026-04-27*
