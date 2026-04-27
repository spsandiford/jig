---
status: partial
phase: 03-compare
source: [03-VERIFICATION.md]
started: 2026-04-27T14:30:00Z
updated: 2026-04-27T14:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Parse error banner renders
expected: Type invalid JSON into a pane, expect a red banner with "Invalid JSON" heading to appear (Test 8 was skipped in CI due to jsdom/CodeMirror limitations)
result: [pending]

### 2. Inline diff highlights appear
expected: Paste two differing JSON documents, click Compare, expect correct color-coded line highlights in both panes
result: [pending]

### 3. Structure mode removes changed highlights
expected: Switch mode to Structure after comparing, expect amber (changed) highlights to disappear while red/green (added/removed) remain
result: [pending]

### 4. File load auto-resets diff
expected: Load a file into an active-diff pane, expect highlights to clear and panes to become editable
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
