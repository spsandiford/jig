# Phase 1: Foundation - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a working browser application where users can load, edit, navigate, and copy JSON. Covers the app shell, the CodeMirror-based editor panel (input, validation, format/minify/repair, clipboard), and the collapsible tree navigation panel (NAV-01, NAV-02, NAV-03). No backend — runs entirely in the browser.

Requirements in scope: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, NAV-01, NAV-02, NAV-03.

</domain>

<decisions>
## Implementation Decisions

### Framework & Tooling
- **D-01:** React 18 + TypeScript + Vite — SPA, static build output, no backend required.
- **D-02:** Tailwind CSS for all styling — utility-first, consistent spacing and color system throughout.

### Editor Component
- **D-03:** CodeMirror 6 via `@uiw/react-codemirror` — `@codemirror/lang-json` for syntax + real-time validation linting, `@codemirror/lint` for error squiggles, `@codemirror/search` for Ctrl+F search (NAV-03). Format, minify, and repair are custom CodeMirror extensions/commands invoked via toolbar buttons.
- **D-04:** File loading (EDIT-02) via a hidden `<input type="file">` — reads file as text and populates the editor.

### Tree View
- **D-05:** Custom recursive React component — no library dependency. Props: `value`, `path`, `depth`, expanded state. Clicking a node emits its JSONPath to the status bar (NAV-02). Styled with Tailwind.

### Panel Layout
- **D-06:** Tab-based layout — single content area with tabs to switch between Editor view and Tree view. Tabs share the same JSON document state — switching tabs changes the lens, not the data.
- **D-07:** Status bar below the tab panel — displays JSONPath of selected tree node (NAV-02) and real-time syntax error summary from CodeMirror lint.

### Claude's Discretion
- Auto-repair library choice (EDIT-06): Claude decides between `jsonrepair` npm package or a custom implementation. `jsonrepair` is well-maintained and handles trailing commas, single quotes, and LLM output — using it is the pragmatic call unless a simpler approach is clearly sufficient.
- Tab ordering and tab labels: Claude decides.
- Toolbar button placement (format/minify/repair/copy): Claude decides, keeping it clean and accessible.
- Color palette and spacing tokens in Tailwind config: Claude decides, targeting a dark developer-tool aesthetic.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — Full v1 requirement list with IDs (EDIT-01 through NAV-03); traceability table showing which requirements belong to Phase 1.
- `.planning/PROJECT.md` — Core value, constraints, out-of-scope list.

### Roadmap
- `.planning/ROADMAP.md` — Phase 1 success criteria (5 criteria) and dependency notes.

No external ADRs or specs — all decisions captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing source files.

### Established Patterns
- None — this phase establishes the patterns that Phases 2 and 3 will follow.

### Integration Points
- Phase 2 (Transform) will add a Worker Facade and jq panel alongside the editor — the tab layout chosen here should accommodate a third "Transform" tab without restructuring.
- Phase 3 (Compare) will add a Compare panel — same tab extension pattern.

</code_context>

<specifics>
## Specific Ideas

- No specific UI references provided — open to a clean, dark developer-tool aesthetic consistent with tools like VS Code's JSON editor or Insomnia.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-20*
