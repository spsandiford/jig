# Feature Landscape: JSON Editor/Workbench

**Domain:** JSON editor / workbench SPA
**Researched:** 2026-04-20
**Sources:** jsoneditoronline.org, svelte-jsoneditor (GitHub), jsondiff.com, jqplay.org, jsonconsole.com, jsonquerylang/jsonquery (GitHub), jq-wasm implementations, HyperTest JSON Comparison

---

## Table Stakes

Features users expect from any JSON tool. Missing one = users abandon to a competitor immediately.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Syntax highlighting | Every code editor does this; raw text is unusable | Low | Use CodeMirror 6 or Monaco; CodeMirror preferred for bundle size |
| Real-time error highlighting | Users expect to see broken JSON instantly, not on submit | Low | Mark error line + show message; JSON.parse errors are sufficient for v1 |
| Format / pretty-print | Most common single action on any JSON tool | Low | Indent 2 spaces is the convention; offer compact/minify as sibling action |
| Minify / compact | Pair action to format; needed for copy-to-API workflows | Low | One button; inverse of format |
| Copy to clipboard | Primary exit path for browser tools; no download required | Low | Copy raw, copy formatted, copy compacted — offer at minimum one |
| Paste from clipboard | How users get data in; implicit but must be seamless | Low | Just works via native paste; no special handling needed |
| Load from local file | Users have JSON files on disk | Low | `<input type="file">` with `.json` filter |
| Undo / Redo | Standard for any editor; users make mistakes | Low | Native browser undo in text mode; needs explicit stack in tree mode |
| Search within document | Finding keys/values in large JSON is painful without search | Medium | Ctrl+F that searches keys AND values |
| Tree / collapsible view | Navigating nested JSON requires collapsible nodes | Medium | Expand/collapse individual nodes + expand-all/collapse-all |
| Path display | Users need to know where they are in deep structures | Low | Show JSONPath of selected node in a breadcrumb or status bar |
| JSON repair / auto-fix | Malformed JSON (trailing commas, single quotes, LLM output) is ubiquitous | Medium | Libraries: `jsonrepair` (josdejong). Users arrive with broken JSON constantly |
| Large file handling | API responses and data exports routinely exceed 1 MB | High | Virtualized rendering required; CodeMirror handles up to ~500 MB in preview mode; naively rendering a 10 MB tree will freeze the browser |

---

## Differentiators

Features that set this tool apart from the crowd. Not universally expected, but high value when present.

### Transform / Query Capabilities

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| jq expression runner | jq is the gold standard for JSON transformation; power users know it | High | Use jq-wasm (owenthereal/jq-wasm or fiatjaf/jq-web) to run natively in browser; no server needed. jq WASM bundles are ~1–2 MB |
| Visual / GUI field mapper | Non-jq users need a no-code path to extract and reshape fields | High | Most tools lack this; jsoneditoronline has a "Wizard" that generates JMESPath from dropdowns — this is the right model. Show input fields, target fields, let user draw connections or select from dropdowns |
| Live transform preview | Show output updating as the user types the expression | Medium | Split pane: expression on top, live result below. jqplay.org does this well |
| Transform expression history | Remember recent queries for re-use | Low | LocalStorage; extremely useful for repeated workflows |
| Multiple query languages | Offer jq (power), JSONPath (familiar), maybe jsonquery (lightweight) | Medium | jsonquery is 4 kB and pure JS; jq requires WASM. Pick at most two for v1: jq + a lightweight JS option. Don't add all six query languages — decision fatigue |

### Diff / Compare Capabilities

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Value diff (semantic) | Compare two JSON docs ignoring key order and whitespace | Medium | "Semantic" diff: `{"a":1,"b":2}` equals `{"b":2,"a":1}`. Color-code additions (green), deletions (red), modifications (amber) |
| Structural / schema-level diff | Show which keys exist in one but not the other, ignoring values | Medium | Answers: "Did the shape of this API response change?" Separate mode from value diff |
| Before/after transform diff | Show what changed after running a jq/visual transform | Medium | Powerful: user runs a transform, then clicks "Show diff vs input" — instantly sees what the expression changed. Rare in existing tools |
| Side-by-side diff layout | Two panels with synchronized scrolling | Medium | Industry standard layout for diffs; inline diff is an acceptable alternative for small docs |

### Editor UX Polish

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Copy path to node | "What's the JSONPath to this field?" is a constant question | Low | Right-click context menu on tree node; copy as JSONPath dot notation and bracket notation |
| Copy node as JSON | Grab a subtree without manually selecting text | Low | Right-click → "Copy as JSON" |
| Breadcrumb navigation | Shows current path while editing deep structures | Low | Status bar at bottom, or above editor. Changes on cursor move |
| Multiple tabs / documents | Users work with more than one JSON at a time | Medium | Most online tools are single-document; tabs are a genuine differentiator. Required for compare-two-docs workflows |
| Keyboard-first navigation | Power users want to work without a mouse | Medium | Ctrl+F search, arrow key tree navigation, keyboard shortcuts for format/compact |
| "Smart format" | Detect and format even slightly-malformed JSON (trailing commas, comments) | Low | Repair then format in one action; jsoneditoronline calls this "Smart Format" |

---

## Anti-Features

Features to explicitly NOT build in v1. Listed with rationale to prevent scope creep.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| JSON Schema validation | Useful but complex; the PROJECT.md explicitly defers this | Ship syntax-only validation; schema validation is a v2 item |
| URL fetch / HTTP request | Adds attack surface, CORS complexity, server-side proxy needs; not requested | Users paste or load files; that covers 95% of real workflows |
| Collaborative editing (multiplayer) | Requires backend, WebSockets, CRDTs — a full product in itself | Out of scope for a personal productivity tool |
| Save to cloud / history sync | Requires authentication, storage backend, data retention policy | Use browser LocalStorage for session persistence only |
| JSON → CSV, XML, YAML conversion | Feature creep; these are separate tools | Keep scope as JSON-in / JSON-out; transformations output JSON |
| Plugin / extension system | Enormous engineering overhead; premature for v1 | Revisit after core workflow is proven |
| Drag-and-drop file input | Explicitly called out as out of scope in PROJECT.md | File picker button is sufficient |
| Download to file | PROJECT.md explicitly defers this; copy-to-clipboard covers the workflow | Copy button; browser's "Save As" covers the edge case |
| AI-powered transform suggestions | High complexity, requires API calls, privacy concerns | Users who want this have ChatGPT already |
| Dark/light theme toggle | Nice to have, not a workflow blocker | Default to system preference via `prefers-color-scheme`; don't build a settings panel |
| Mobile-responsive layout | JSON editing is a desktop/keyboard workflow; mobile UX for code editors is poor | Desktop-first layout; don't optimize for touch |

---

## Feature Dependencies

```
File picker input     → Editor pane (must have editor before file input matters)
Format/pretty-print   → Editor pane
Real-time validation  → Editor pane
Search               → Editor pane
Tree view            → Editor pane (tree is an alternative rendering of the same data)
Copy path            → Tree view (path is relative to tree node selection)
Copy node as JSON    → Tree view
Repair               → Editor pane (repair outputs to editor)

jq transform         → Editor pane (input source) + Result pane (output target)
Visual field mapper  → jq transform OR standalone (generates jq/JSONPath internally)
Live preview         → jq transform (preview IS the result updating in real time)
Transform history    → jq transform

Value diff           → Two editor panes (or one editor + one result)
Structural diff      → Two editor panes
Before/after diff    → jq transform + diff (diff compares pre/post transform output)

Multiple tabs        → Editor pane (tabs are instances of the editor)
Compare modes        → Multiple tabs (compare requires two documents loaded)
```

Key insight: **tabs enable everything else**. The compare modes, before/after diff, and dual-document transforms all require two documents to be in memory simultaneously. Building tabs early unblocks the rest.

---

## MVP Recommendation

### Must ship (blocks core value):
1. Editor pane with syntax highlighting, real-time validation, format, minify
2. Load from file + paste (copy-to-clipboard output)
3. JSON repair
4. Tree view with expand/collapse and copy-path
5. jq transform with live preview (jq-wasm, no server)
6. Value diff (semantic, side-by-side, two-pane)

### High value, ship next:
7. Visual / GUI field mapper (the main differentiator vs existing tools)
8. Structural / schema-level diff
9. Before/after transform diff
10. Multiple tabs / documents

### Defer:
- Transform expression history (localStorage, easy, but not blocking)
- JSONPath as second query language (nice-to-have after jq works)
- Keyboard-first navigation polish (ongoing; don't delay ship for it)

---

## Competitive Gaps (Where This Tool Can Win)

Auditing jsoneditoronline.org, jqplay.org, jsondiff.com, and similar tools:

1. **Integrated workflow** — Every competitor is a single-function tool. None integrate edit + transform + diff in one document session. This is the primary gap.
2. **Before/after transform diff** — No major tool does this. It's a killer feature for users refining jq expressions.
3. **Visual field mapper that generates jq** — jsoneditoronline's "Wizard" generates JMESPath (limited), not jq. A GUI that produces real jq expressions is novel.
4. **jq in-browser, no server** — jqplay.org sends snippets to a server for sharing; jq-wasm means this tool can be fully local and private.
5. **Tabs enabling multi-document compare** — Most tools are single-document. Tabs that feed into compare are an obvious gap nobody has filled cleanly.

---

## Sources

- [JSON Editor Online features](https://jsoneditoronline.org/features/)
- [svelte-jsoneditor GitHub](https://github.com/josdejong/svelte-jsoneditor)
- [jsoneditor GitHub](https://github.com/josdejong/jsoneditor)
- [jq WASM — owenthereal](https://github.com/owenthereal/jq-wasm)
- [jq playground — jqplay.org](https://jqplay.org/)
- [JSON Diff — jsondiff.com](https://www.jsondiff.com/)
- [json-diff-kit npm](https://www.npmjs.com/package/json-diff-kit)
- [jsonquerylang/jsonquery](https://github.com/jsonquerylang/jsonquery)
- [Best JSON editor tools 2025 — jsonconsole.com](https://jsonconsole.com/blog/ultimate-json-editor-viewer-tools-guide-2025)
- [10 Best JSON query languages — jsoneditoronline.org](https://jsoneditoronline.org/indepth/query/10-best-json-query-languages/)
- [HyperTest JSON Comparison](https://www.hypertest.co/json-comparison-tool)
- [Sourcegraph: Migrating Monaco to CodeMirror](https://sourcegraph.com/blog/migrating-monaco-codemirror)
