---
status: complete
phase: 02-transform
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md]
started: 2026-04-27T00:00:00Z
updated: 2026-04-27T00:01:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

## Current Test

[testing complete]

## Tests

### 1. Transform Tab Enabled
expected: Click the Transform tab in the top nav. It should be clickable (not greyed out or tooltipped with "coming soon"). The tab becomes active and the Transform panel is visible below — showing an expression input area and a Run button.
result: pass

### 2. Run a jq Expression
expected: Load any JSON document (or use one already open). Switch to the Transform tab. Type `.` (dot) into the expression input and click Run. After a moment, the OutputPane below shows the full JSON pretty-printed. While the query runs, the Run button shows a spinner.
result: pass

### 3. Ctrl+Enter Shortcut
expected: With the Transform tab open and a jq expression typed (e.g., `.key`), press Ctrl+Enter inside the expression input. The expression runs without clicking the Run button — output appears in the OutputPane.
result: pass

### 4. Error Banner on Bad Expression
expected: Type an invalid jq expression (e.g., `.[[[`) and click Run. The OutputPane shows a red left-bordered error banner with an "Expression error" heading and a sanitized error message (no Emscripten noise like "exit code" prefixes).
result: pass

### 5. Copy Copies Transform Output
expected: Run a valid expression so output is visible in the OutputPane. Click the Copy button in the toolbar. Paste somewhere — only the jq output is pasted, not the source JSON.
result: pass

### 6. Engine Loading State
expected: Hard-refresh the page and immediately switch to the Transform tab before the WASM finishes loading. The Run button shows "Loading…" and is disabled. Once the engine is ready the button changes to "Run" and is enabled.
result: skipped
reason: WASM loads too fast to manually catch the loading state before it transitions to ready

## Summary

total: 6
passed: 5
issues: 0
pending: 0
skipped: 1

## Gaps

[none yet]
