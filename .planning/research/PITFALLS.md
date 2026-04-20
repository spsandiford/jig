# Domain Pitfalls: JSON Editor / Workbench SPA

**Domain:** JSON editor/workbench single-page application
**Researched:** 2026-04-20
**Confidence:** HIGH (verified against real issues in production libraries and browser specs)

---

## Critical Pitfalls

Mistakes that cause rewrites, feature removal, or make the product unusable for the stated goal.

---

### Pitfall 1: Rendering Large JSON on the Main Thread

**What goes wrong:** Loading a multi-MB JSON file into a text editor or tree view without virtualization freezes the browser. A 20 MB JSON payload (1.2 million lines) has been observed to freeze VS Code for minutes; a ~20 MB payload in Chrome DevTools stalls the inspector for 4+ seconds. Editors that render the full document DOM — tree nodes, syntax-highlighted lines — allocate enormous memory and block the main thread during initial parse and render.

**Why it happens:** Standard text editors (naive `<textarea>` or even some CodeMirror configurations) render the entire document. Tree views that expand JSON into DOM nodes do the same. JSON.parse itself is synchronous and blocks for MB-scale inputs.

**Consequences:** The tab or whole browser freezes. Users with real data exports (the stated use case) hit this immediately. The product fails its explicit performance requirement.

**Prevention:**
- Use a text editor with built-in viewport virtualization (CodeMirror 6 does line-level virtualization; Monaco does too).
- Move `JSON.parse` into a Web Worker so the main thread is never blocked by parse time.
- For the tree view, implement virtual scrolling — render only visible nodes plus a buffer.
- Apply a size threshold (e.g., >2 MB): warn the user, disable tree view, offer text-only mode.
- Parse incrementally where possible; use `requestIdleCallback` for non-critical rendering work.

**Detection (warning signs):**
- Paste a 5 MB JSON file; browser tab hangs for >2 seconds.
- Chrome Task Manager shows memory spike beyond 500 MB on load.
- Any test with a real API export (e.g., a large GitHub dependency graph) that triggers freezing.

**Phase:** Must be addressed in the initial editor pane phase, before any other features land. Performance retrofitting is 10x harder than designing for it from the start.

---

### Pitfall 2: WASM jq Blocking the Main Thread and Loading Race Conditions

**What goes wrong:** jq WASM bundles (jq-web, jq-wasm, owenthereal/jq-wasm) are loaded asynchronously by the Emscripten runtime. If jq is called before the `.wasm` file finishes loading, the library silently returns a default empty result (`{}`) instead of throwing an error. The caller has no idea the query failed. Additionally, running jq on the main thread for a large input blocks the UI.

**Why it happens:** Emscripten's async initialization is not always surfaced as a promise the caller is forced to await. Bundlers (Webpack, Vite) alter `.wasm` filenames with content hashes and may place them in different directories, breaking Emscripten's default path resolution.

**Consequences:** Silent wrong results (empty output instead of error), UI freezes on large transforms, broken production builds that work fine in dev.

**Prevention:**
- Always use the promised API (`jq.promised.json(...)`) and await it; never call the sync API.
- Run jq in a Web Worker. The main thread stays responsive for any input size.
- Explicitly configure the `.wasm` file path in the bundler (Vite's `assetsInlineLimit`, Webpack's `copy-webpack-plugin`) so the runtime can find it.
- Show a "loading engine..." indicator while WASM initializes; disable the run button until ready.
- Add an explicit test: run a known query on load; if result is wrong or empty, surface an error rather than silently proceeding.

**Detection (warning signs):**
- Transform returns `{}` for valid jq and valid input — classic uninitialized WASM.
- Production build 404s on `.wasm` file (check browser network tab).
- Typing a long jq expression against MB-scale JSON locks the UI.

**Phase:** jq execution design (Worker + async init) must be settled before the transform feature is built, not added later.

---

### Pitfall 3: SharedArrayBuffer / Cross-Origin Isolation Requirement for Threaded WASM

**What goes wrong:** Some WASM builds rely on `SharedArrayBuffer` for pthread-based threading. `SharedArrayBuffer` requires the page to be cross-origin isolated, which requires serving two HTTP headers: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. GitHub Pages cannot set these headers. Netlify and Vercel require explicit configuration. A WASM build that works locally (with the right dev server config) may silently break in production deployment.

**Why it happens:** Chrome 92+ restricted `SharedArrayBuffer` to cross-origin-isolated contexts. The restriction applies to desktop and mobile. COEP `require-corp` also blocks loading any cross-origin resource (fonts, CDN assets) that doesn't send `Cross-Origin-Resource-Policy`.

**Consequences:** The jq WASM binary loads but threading is disabled or the module fails entirely. If the app is deployed to GitHub Pages, it cannot be fixed without moving to a different host.

**Prevention:**
- Choose a jq WASM build that does NOT require `SharedArrayBuffer`/pthreads (single-threaded Emscripten build). `jq-web` (fiatjaf) and `owenthereal/jq-wasm` are single-threaded and avoid this entirely.
- If threaded WASM is ever needed, configure COOP/COEP headers in the deployment target before writing any code that depends on them.
- Test production deployment early (before shipping), not just `localhost`.

**Detection (warning signs):**
- WASM works on `localhost:5173` but breaks on the deployed URL.
- Browser console shows: "SharedArrayBuffer is not defined" or COEP blocking errors.

**Phase:** Deployment target and WASM build selection must be decided in Phase 1. Retrofitting hosting requirements mid-project is disruptive.

---

### Pitfall 4: Text Diff Treating Reformatted JSON as Entirely Changed

**What goes wrong:** Using a line-based or character-based diff (Myers algorithm, unified diff) on two JSON documents produces a diff that shows every single line as changed when the only real difference is formatting (minified vs. pretty-printed) or key ordering. The diff is technically correct but useless — it obscures the real changes in noise.

**Why it happens:** Text diff tools operate on sequences of characters/lines. They have no understanding that `{"a":1,"b":2}` and `{\n  "a": 1,\n  "b": 2\n}` are semantically identical. Similarly, JSON objects are defined as unordered maps, but `JSON.stringify` imposes a key order — two JSON documents with different key orders that come from different serializers (Python, Go, JS) will produce false positives.

**Consequences:** The diff view is cluttered with formatting noise. Users cannot identify real data changes. The feature appears broken even though the underlying logic is correct.

**Prevention:**
- For the value diff and structural diff features, always parse both inputs, normalize (sort keys, canonical stringify), then diff the normalized forms.
- Use a semantic JSON diff library (jsondiffpatch, json-diff) that operates on parsed structures, not strings.
- Offer a "normalize before diff" step the user can trigger explicitly.
- For the text editor diff (before/after transform), apply canonical formatting to both sides before running a text diff.

**Detection (warning signs):**
- Pretty-printing one side shows every line as "changed".
- Copying JSON from Python (`json.dumps`) and JS (`JSON.stringify`) with the same data shows false diffs due to key ordering.

**Phase:** Must be addressed when building the diff/compare feature. Do not use `jsdiff` (text diff) directly on raw JSON strings.

---

### Pitfall 5: Array Diff Order Sensitivity Confusion

**What goes wrong:** JSON arrays are order-sensitive by spec, but users often treat arrays-of-objects like sets. A semantic diff that reports every element as changed because the array was sorted differently is confusing and wrong for many real-world payloads (API responses where item order is arbitrary).

**Why it happens:** The LCS (Longest Common Subsequence) algorithm used by most diff libraries treats arrays as ordered sequences. If item 0 and item 1 swap positions, LCS reports two deletions and two insertions instead of a "moved" delta.

**Consequences:** A diff of two semantically equivalent arrays (same items, different order) shows the entire array contents as changed. Users lose trust in the diff feature.

**Prevention:**
- Use `jsondiffpatch` with its array move detection enabled. It tracks moves using LCS and marks them as relocations rather than delete+insert pairs.
- For arrays of objects, consider a "match by key" option: if objects share a common unique field (e.g., `id`), use it as an anchor for matching items across positions.
- Clearly document in the UI whether array comparison is order-sensitive or order-insensitive.

**Detection (warning signs):**
- Sorting an array and diffing with its original produces a "massive" diff when the user expects "no real changes."
- Arrays of objects with an `id` field show complete replacement instead of matched deltas.

**Phase:** Array diff strategy must be decided upfront when building the diff engine, not tweaked after UX feedback.

---

## Moderate Pitfalls

Mistakes that degrade UX significantly but don't require full rewrites.

---

### Pitfall 6: Bidirectional Sync Between Text and Tree Views

**What goes wrong:** When a user edits in the text pane, the tree view must stay in sync, and vice versa. Naive implementations sync on every keystroke, causing expensive full re-parses. Debounced sync is safer but creates a perceptible lag where the tree shows stale data. More critically: if the text is mid-edit and not valid JSON, the tree cannot update — the sync must tolerate invalid intermediate states.

**Why it happens:** There is no clean event-driven boundary between a text editor and a structured view. The text editor emits character-level changes; the tree view requires a fully valid document. Bridging these two models is inherently complex.

**Consequences:** Flickering, lag, undo history getting out of sync between panes, cursor position jumping. Users editing in tree view lose their text pane scroll position. The `svelte-jsoneditor` library spent significant effort solving this — their changelog shows repeated sync-related fixes.

**Prevention:**
- Choose one source of truth: the parsed JSON object. Both views render from it; both write back to it.
- Text view writes to the shared state only when the document parses successfully (with a debounce of 200–300ms).
- Tree view writes immediately on field edits (already structured, no parse needed).
- Undo/redo history must operate at the shared-state level, not within each individual view's history.
- Consider using `svelte-jsoneditor` (which has solved this for its own use case) rather than building a custom sync layer.

**Detection (warning signs):**
- Edit a field in tree view; text pane shows the old value for a moment.
- Mid-typing `{"a": `, tree view shows an error flash then jumps.
- Undo in text view, tree view doesn't update.

**Phase:** Sync architecture must be designed before any multi-view feature ships. Build a single shared state model in Phase 1 even if only one view is shown.

---

### Pitfall 7: Monaco Editor Bundle Size Bloat

**What goes wrong:** Monaco Editor is 5–10 MB uncompressed (~2.4 MB compressed). Replit found Monaco contributed 51 MB to their uncompressed bundle. For a lightweight browser tool, this is a significant payload that increases initial load time and may deter casual users.

**Why it happens:** Monaco is the VS Code editor engine, designed for full IDE scenarios. It includes language servers, extensive syntax support, and worker infrastructure — most of which a JSON workbench does not need.

**Consequences:** Slow initial page load. The tool feels heavy. GitHub Pages or CDN deployment amplifies this for users on slow connections.

**Prevention:**
- Prefer CodeMirror 6 over Monaco. CodeMirror 6 has a modular architecture — only import what is needed. A JSON editor with syntax highlighting and linting is approximately 300–600 KB total (uncompressed), versus Monaco's 2–5 MB minimum.
- If Monaco is chosen, configure it to load only the JSON language worker and strip unused language packs. Use dynamic imports so Monaco loads after initial paint.
- Measure bundle size with `rollup-plugin-visualizer` or `vite-bundle-analyzer` at the start of the project, not after shipping.

**Detection (warning signs):**
- `npm run build` output shows a chunk >1 MB for the editor library.
- Lighthouse shows a long "parse and execute JavaScript" waterfall on first load.

**Phase:** Editor library selection is a Phase 1 architectural decision. Switching editors later (Sourcegraph did this) is a major migration.

---

### Pitfall 8: Clipboard API Silent Failures

**What goes wrong:** `navigator.clipboard.writeText()` silently fails (or throws an unhandled promise rejection) in contexts where it is not permitted: the page is not in HTTPS/localhost, the tab does not have focus, or the user has not granted clipboard permission. The user clicks "Copy" and nothing happens.

**Why it happens:** The Clipboard API is gated on a secure context (HTTPS or localhost) and on the tab having focus. In Firefox and Safari, a user gesture is required. Safari has historically had its own quirks around async clipboard operations. Even though Baseline status was achieved in March 2025, edge-case behavior (focus loss, permission revocation) still varies.

**Consequences:** The primary exit path for the product ("copy to clipboard") silently breaks. Users cannot get their results out of the tool.

**Prevention:**
- Always wrap clipboard writes in a try/catch with a user-visible fallback (e.g., pre-select text in a textarea for manual copy).
- Check `navigator.clipboard` existence before calling; fall back to `document.execCommand('copy')` on the selection for older contexts (deprecated but still works in some environments).
- Show a success/failure toast after every clipboard write attempt so failure is always visible.
- Test clipboard behavior specifically in Firefox private mode and Safari.

**Detection (warning signs):**
- Copy button does nothing in Firefox when the tab loses focus between click and write.
- Running the app on `http://` (not `https://`) breaks clipboard silently.

**Phase:** Address in any phase that ships the copy-to-clipboard feature. Build the fallback into the first copy implementation, not as a follow-up.

---

### Pitfall 9: Visual Transform UI Scope Creep

**What goes wrong:** A "visual/GUI field mapper" for JSON transformation sounds simple but expands rapidly: drag-and-drop mapping between source and target fields, nested object support, array handling (map, filter, flatten, zip), computed/derived fields, conditional mappings, type coercion, constant injection. Each of these is a UX design problem on its own. Production tools (Altova MapForce, Liquid Data Mapper) are full products built around this single feature.

**Why it happens:** Every real JSON transformation exercise reveals a new edge case. Users with real data will immediately ask for array operations, string manipulation, conditional field inclusion, and renaming. A simple "map field A to field B" UI cannot serve these without becoming a visual programming language.

**Consequences:** The feature is never "done." The UX becomes a maze of modes and options. Development time expands to swallow the rest of the roadmap.

**Prevention:**
- Strictly define the MVP scope of the visual mapper before building it. A reasonable v1: map top-level and one-level-deep fields from source to target by drag-and-drop, with rename and constant injection only.
- Explicitly do NOT include: array operations, computed fields, conditional logic, nested array flattening in v1. These are scope gates, not stretch goals.
- Consider whether jq (code expression) already covers the "power user" transform case. The visual mapper may only need to cover simple field-rename/reorder scenarios.
- Build the visual mapper as its own isolated phase so it can be cut or deferred without affecting other features.

**Detection (warning signs):**
- First design session produces a list of "but what about..." edge cases that doubles the component count.
- The visual mapper needs its own mini query language to be useful.

**Phase:** Visual transform is a dedicated phase. Define the cut line before starting. Revisit scope at the phase boundary, not mid-build.

---

## Minor Pitfalls

---

### Pitfall 10: JSONPath Implementation Fragmentation

**What goes wrong:** JSONPath has no single authoritative specification (unlike jq, which has a clear reference implementation). Different JS libraries (`jsonpath`, `jsonpath-plus`, `JSONPath`) implement different subsets. Expressions that work in one library fail silently or return wrong results in another. RFC 9535 (2024) attempted to standardize JSONPath but adoption in JS libraries is uneven.

**Why it happens:** JSONPath originated as an informal specification with no test suite. Implementations diverged independently.

**Consequences:** Users familiar with JSONPath from other tools (Kubernetes, AWS Step Functions) find expressions that don't work. Trust erodes.

**Prevention:**
- Pick one library and document which JSONPath variant is supported.
- Alternatively, drop JSONPath in favor of jq exclusively — jq is strictly more powerful and has a stable reference implementation.
- If supporting JSONPath, use `jsonpath-plus` which has the broadest feature coverage.

**Phase:** Transform expression language selection is a Phase 1 architectural decision.

---

### Pitfall 11: Undo/Redo History Across View Modes

**What goes wrong:** If the text editor and tree view each maintain their own undo stack, switching between modes corrupts history. The user edits in text mode, switches to tree mode, makes a change, then undoes — the undo operates on the tree's local history, not the full document history. The user cannot get back to a pre-switch state.

**Why it happens:** Code editors (CodeMirror, Monaco) have built-in undo history. Tree views have their own. Combining two independent undo stacks into one coherent history requires deliberate architecture.

**Prevention:**
- Maintain a single undo/redo stack at the shared document state level (not within either view).
- Disable or ignore the built-in undo history of the code editor; intercept `Ctrl+Z` and route it to the shared stack.
- Each edit (text or tree) emits a command object; undo/redo replays or reverses commands.

**Phase:** Design the command/history model before building either view. It is much harder to retrofit.

---

### Pitfall 12: jq Error Messages Are Cryptic

**What goes wrong:** jq's error messages (from the reference implementation compiled to WASM) are terse and reference internal types. Users without jq expertise see `null (null) and string ("foo") cannot be iterated over` and have no idea what their expression did wrong.

**Prevention:**
- Display the raw jq error message, but prefix it with context: "jq error at expression [expr]: [message]".
- Provide a link to jq documentation or a cheat sheet.
- Consider a small library of example jq expressions in the UI to orient new users.

**Phase:** UX for error display should be addressed in the same phase as the jq transform feature.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Editor pane (text input) | Main thread block on large file load | Parse in Worker; use virtualized editor; size-gate tree view |
| jq/transform feature | WASM async init race + main thread block | Worker thread; promised API; bundler WASM path config |
| Deployment setup | SharedArrayBuffer / COEP headers breaking WASM | Choose single-threaded WASM build; test production host early |
| Diff/compare feature | Text diff treating reformatted JSON as fully changed | Normalize (canonical sort) before diff; use semantic diff library |
| Diff/compare feature | Array order false-positives | Use jsondiffpatch with move detection; document order semantics |
| Multi-view (text + tree) | Sync lag, stale data, split undo history | Single shared state; route undo at state level not view level |
| Editor library selection | Monaco bundle size bloat | Choose CodeMirror 6; measure bundle at project start |
| Copy to clipboard | Silent failure in non-HTTPS or unfocused tab | Try/catch + visible fallback + success/failure toast |
| Visual field mapper | Unbounded scope creep | Hard v1 scope gate before building; isolate as a dedicated phase |
| jq/JSONPath query language | JSONPath fragmentation across libraries | Pick jq as primary; document which JSONPath variant if added |

---

## Sources

- [json-editor/json-editor issue #252: performance with large JSON](https://github.com/json-editor/json-editor/issues/252)
- [svelte-jsoneditor GitHub](https://github.com/josdejong/svelte-jsoneditor)
- [svelte-jsoneditor bundle size issue #413](https://github.com/josdejong/svelte-jsoneditor/issues/413)
- [jq-web (fiatjaf)](https://github.com/fiatjaf/jq-web)
- [jq-wasm (owenthereal)](https://github.com/owenthereal/jq-wasm)
- [pboutes/jq-wasm](https://github.com/pboutes/jq-wasm)
- [Sourcegraph: Migrating from Monaco to CodeMirror](https://sourcegraph.com/blog/migrating-monaco-codemirror)
- [Replit: Betting on CodeMirror](https://blog.replit.com/codemirror)
- [web.dev: Cross-Origin Isolation Guide](https://web.dev/articles/cross-origin-isolation-guide)
- [web.dev: WebAssembly Threads](https://web.dev/articles/webassembly-threads)
- [MDN: Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [web.dev: Copy Text Pattern](https://web.dev/patterns/clipboard/copy-text)
- [jsondiffpatch](https://github.com/benjamine/jsondiffpatch)
- [Trail of Bits: Graphtage semantic diff](https://blog.trailofbits.com/2020/08/28/graphtage/)
- [Stop Using Text Diff for JSON (DEV.to)](https://dev.to/diffguru/stop-using-text-diff-for-json-a-better-way-to-compare-objects-4j75)
- [Hacker News: Visual data mapper for JSON](https://news.ycombinator.com/item?id=40214714)
- [LogRocket: SharedArrayBuffer and cross-origin isolation](https://blog.logrocket.com/understanding-sharedarraybuffer-and-cross-origin-isolation/)
- [JSON performance optimization guide](https://superjson.ai/blog/2025-08-30-json-performance-optimization-large-files-guide/)
