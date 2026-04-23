# Phase 2: Transform - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the Transform tab with a jq expression runner. Deliver: jq-web WASM engine loaded in a Web Worker (Worker Facade), a Transform panel (expression input + output pane), a Run button to trigger execution, a loading indicator while the engine initializes, and clear error display. The Transform tab already has a stub in AppShell — this phase enables it.

Requirements in scope: XFRM-01, XFRM-02, XFRM-03.

</domain>

<decisions>
## Implementation Decisions

### jq Library
- **D-01:** Use **jq-web** (fiatjaf) — more battle-tested in browser environments, no WASM path validation spike required. Skipping jq-wasm (owenthereal) due to low adoption concern logged in STATE.md.

### Transform Panel Layout
- **D-02:** Expression + Output only — the Transform tab shows a jq expression input at the top and an output pane below. Input JSON is sourced from `useJsonDocument`'s `rawJson` (the Editor tab state). No third input pane — users edit JSON in the Editor tab, then switch to Transform to run expressions.

### Live Preview Behavior
- **D-03:** Run button only — output updates only when the user explicitly clicks Run (or keyboard equivalent). No auto-run / debounce. Predictable execution with no background re-evaluation.

### Error Display
- **D-04:** Error banner replaces output — when jq errors, the output pane shows a styled error state (red/amber banner with a human-readable message). Last successful output is not retained. Clear visual signal that the expression is broken.

### Worker Architecture
- **D-05 (Claude's Discretion):** Worker Facade pattern — jq-web runs inside a dedicated Web Worker. The facade exposes a simple async API (e.g., `run(expr, json): Promise<string>`). Claude decides the communication protocol (raw postMessage vs Comlink) based on jq-web's API shape.

### Claude's Discretion
- Worker communication protocol (raw postMessage vs Comlink): Claude decides based on jq-web API.
- Expression input component: CodeMirror instance (consistent with Editor) or a plain `<textarea>` — Claude decides based on what jq-web needs and complexity budget.
- Run button placement and keyboard shortcut (e.g., Ctrl+Enter): Claude decides, keeping it discoverable.
- Output pane syntax highlighting (treat output as JSON when valid): Claude decides.
- Debounce/throttle for the Run button (prevent double-click spam): Claude decides.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Full v1 requirement list; XFRM-01, XFRM-02, XFRM-03 are the Phase 2 requirements.
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope list.

### Roadmap
- `.planning/ROADMAP.md` — Phase 2 success criteria (3 criteria) and dependency notes.

### Prior Phase Context
- `.planning/phases/01-foundation/01-CONTEXT.md` — Phase 1 decisions that Phase 2 builds on (tab layout, useJsonDocument hook, styling conventions).

No external ADRs or specs — all decisions captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/AppShell.tsx` — Transform tab stub already exists (disabled, `<Zap>` icon). Phase 2 enables this tab.
- `src/hooks/useJsonDocument.ts` — Provides `rawJson` as the jq input. The Transform panel reads from this hook, no new state needed for input.
- `src/components/CodeMirrorEditor.tsx` — Existing CodeMirror setup; can inform expression input if CodeMirror is used there too.
- Tailwind + shadcn/ui — All styling follows the established pattern. Error banner uses Tailwind color utilities consistent with the dark theme.

### Established Patterns
- Tab-based layout: Editor / Tree tabs established. Transform is the third tab — already wired in AppShell's `TabValue` type.
- Dark aesthetic: `#1e1e1e` background, `#252526` tab bar, `#0078d4` active tab underline — apply same tokens in Transform panel.
- React 19 + Vite + TypeScript: no new framework decisions.

### Integration Points
- AppShell `activeTab` state drives tab switching — Transform panel mounts when `activeTab === 'transform'`.
- `useJsonDocument().rawJson` is the jq input — Transform panel reads this directly, no prop drilling needed if the hook is called in AppShell or a shared context.
- Phase 3 (Compare) will reuse the Worker Facade — design the Worker API to be general enough for a second consumer.

</code_context>

<specifics>
## Specific Ideas

- No specific UI references provided beyond the established VS Code-style dark aesthetic from Phase 1.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-transform*
*Context gathered: 2026-04-23*
