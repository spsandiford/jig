# Phase 3: Compare - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-27
**Phase:** 03-compare
**Areas discussed:** Input sources, Diff view style, Mode switching, Diff library

---

## Input Sources

| Option | Description | Selected |
|--------|-------------|----------|
| Two independent panes | Compare tab has its own Left and Right CodeMirror inputs — self-contained, no Editor tab dependency | ✓ |
| Editor doc as Left, new Right | Left pane mirrors Editor tab's current document; only Right is a new input | |

**User's choice:** Two independent panes — both left and right are independent CodeMirror editors within the Compare tab.

**Follow-up: Input pane type:**

| Option | Description | Selected |
|--------|-------------|----------|
| CodeMirror panes | Syntax highlighting, error squiggles, consistent with Editor tab | ✓ |
| Plain textareas | Simpler but visually inconsistent | |

**User's choice:** Full CodeMirror instances — reuse existing `CodeMirrorEditor` component.

---

## Diff View Style

| Option | Description | Selected |
|--------|-------------|----------|
| Results panel below | Inputs at top, diff output rendered below as a list/tree of changes | |
| Inline highlights in panes | Differences highlighted directly in Left/Right editor panes; no separate output panel | ✓ |

**User's choice:** Inline highlights — decorations applied directly within the CodeMirror panes (red/green/amber).

**Follow-up: Pane editability while diff is shown:**

| Option | Description | Selected |
|--------|-------------|----------|
| Read-only with Reset/Edit button | Panes lock after Compare; Reset clears diff and re-enables editing | ✓ |
| Editable, re-diff on Run | Panes stay editable; user clicks Compare again to refresh | |
| Editable with live re-diff | Diff updates automatically as user types (debounced) | |

**User's choice:** Read-only after Compare is clicked; Reset/Edit button to return to editing mode.

---

## Mode Switching

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle buttons above panes | Pill/toggle control ("Value \| Structure") above panes; switching re-runs diff | ✓ |
| Sub-tabs inside Compare | Nested "Value Diff" and "Structure Diff" sub-tabs within the Compare tab | |
| Separate top-level tabs | Two distinct top-level tabs for value and structural diff | |

**User's choice:** Toggle buttons (pill control) — lightweight, stays within the Compare tab, re-runs diff on switch.

---

## Diff Library

| Option | Description | Selected |
|--------|-------------|----------|
| jsondiffpatch | Rich structured delta format; maps to JSON key paths for CodeMirror decoration | ✓ |
| Custom recursive comparison | Full control, no dependency; more code to maintain | |
| json-diff | Text-diff oriented; less structured output for inline highlights | |

**User's choice:** jsondiffpatch — best fit for inline highlight approach given structured delta output.

---

## Claude's Discretion

- Compare button placement
- Exact highlight colors within dark theme
- Worker vs. main thread for diff computation
- Empty state when panes are empty
- Array diff granularity

## Deferred Ideas

- CMP-V2-01: Before/after transform diff — already in v2 backlog, not in scope for Phase 3.
