# Requirements: JSON Workbench

**Defined:** 2026-04-20
**Core Value:** One unified tool that handles every JSON task — edit, validate, transform, compare — without leaving the browser.

## v1 Requirements

### Editor

- [ ] **EDIT-01**: User can paste JSON text into an editor pane
- [ ] **EDIT-02**: User can load a JSON file from disk via file picker
- [ ] **EDIT-03**: Editor highlights JSON syntax errors in real time
- [ ] **EDIT-04**: User can format / pretty-print JSON with one action
- [ ] **EDIT-05**: User can minify JSON to a single line
- [ ] **EDIT-06**: User can auto-repair malformed JSON (trailing commas, single quotes, LLM output)
- [ ] **EDIT-07**: User can copy any JSON result to the clipboard

### Navigation

- [ ] **NAV-01**: User can view JSON as a collapsible tree with expand/collapse per node
- [ ] **NAV-02**: Editor displays the JSONPath of the currently selected node in a status bar or breadcrumb
- [ ] **NAV-03**: User can search across keys and values within the document (Ctrl+F)

### Transform

- [ ] **XFRM-01**: User can enter a jq expression and see live output preview
- [ ] **XFRM-02**: jq engine loads asynchronously with a loading indicator; Run button is disabled until ready
- [ ] **XFRM-03**: Transform errors display a clear message (not a raw jq error dump)

### Compare

- [ ] **CMP-01**: User can open two JSON documents and view a semantic value diff (ignores whitespace and key order)
- [ ] **CMP-02**: User can view a structural diff showing which keys exist in one document but not the other

## v2 Requirements

### Transform

- **XFRM-V2-01**: Visual / GUI field mapper — no-code field mapping that generates jq expressions
- **XFRM-V2-02**: Transform expression history saved to localStorage for recall

### Compare

- **CMP-V2-01**: Before/after transform diff — show what a jq expression changed relative to the original input

### Editor

- **EDIT-V2-01**: Drag-and-drop file input
- **EDIT-V2-02**: Download result as .json file
- **EDIT-V2-03**: Dark / light theme toggle

### Query

- **QURY-V2-01**: JSONPath expression runner (second query language alongside jq)

## Out of Scope

| Feature | Reason |
|---------|--------|
| JSON Schema validation | Not requested; syntax-only validation covers the use case |
| Fetch JSON from URL | Not requested; paste and file picker cover the use cases |
| Download / save to file | Copy to clipboard is the primary exit path; download deferred to v2 |
| Backend / server | Browser-only SPA; all operations run client-side |
| Mobile layout | Developer tool; desktop browser is the target |
| Real-time collaboration | Single-user personal tool |
| Visual field mapper (v1) | High complexity, no dependents; isolated to v2 — can be cut without affecting v1 |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EDIT-01 | — | Pending |
| EDIT-02 | — | Pending |
| EDIT-03 | — | Pending |
| EDIT-04 | — | Pending |
| EDIT-05 | — | Pending |
| EDIT-06 | — | Pending |
| EDIT-07 | — | Pending |
| NAV-01 | — | Pending |
| NAV-02 | — | Pending |
| NAV-03 | — | Pending |
| XFRM-01 | — | Pending |
| XFRM-02 | — | Pending |
| XFRM-03 | — | Pending |
| CMP-01 | — | Pending |
| CMP-02 | — | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 15 ⚠️

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 after initial definition*
