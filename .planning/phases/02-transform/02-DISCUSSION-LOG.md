# Phase 2: Transform - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 02-transform
**Areas discussed:** jq library, Transform panel layout, Live preview behavior, Error display style

---

## jq Library

| Option | Description | Selected |
|--------|-------------|----------|
| jq-wasm + spike first | Run a spike to validate Vite WASM path resolution and production build before committing | |
| jq-wasm, trust and build | Skip spike, commit to jq-wasm now | |
| jq-web (fiatjaf), no spike | More battle-tested in browser; no WASM path validation spike needed | ✓ |

**User's choice:** jq-web (fiatjaf), no spike needed
**Notes:** STATE.md had flagged jq-wasm's low adoption (18 stars) as a concern. User opted for the more proven library over a spike.

---

## Transform Panel Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Expression + Output only | jq expression input (top) + output pane (bottom); input JSON from Editor tab state | ✓ |
| 3-pane: Input \| Expression \| Output | All three visible at once — input JSON left, expression top-right, output bottom-right | |

**User's choice:** Expression + Output only
**Notes:** Clean and focused. Users edit JSON in the Editor tab, then switch to Transform to run expressions. No duplication of the input JSON pane.

---

## Live Preview Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-run with debounce | Output updates ~300-500ms after typing stops; Run button also available | |
| Run button only | User clicks Run to execute; no auto-run | ✓ |
| Auto-run, no Run button | Fully automatic, no manual trigger | |

**User's choice:** Run button only
**Notes:** Explicit execution preferred. No background re-evaluation while typing.

---

## Error Display Style

| Option | Description | Selected |
|--------|-------------|----------|
| Error banner replaces output | Styled error state (red/amber banner) replaces output pane; last successful output disappears | ✓ |
| Error shown below output | Last successful output stays; error section appears below it | |
| Inline error in output pane | Error message as styled content within the output area | |

**User's choice:** Error banner replaces output
**Notes:** Clear visual signal that the expression is broken. Last successful output does not persist when an error occurs.

---

## Claude's Discretion

- Worker communication protocol (raw postMessage vs Comlink)
- Expression input component (CodeMirror vs plain textarea)
- Run button placement and keyboard shortcut
- Output pane syntax highlighting
- Run button debounce/throttle

## Deferred Ideas

None.
