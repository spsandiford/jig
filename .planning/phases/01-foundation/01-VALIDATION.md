---
phase: 01
slug: foundation
status: validated
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-21
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.4 + @testing-library/react + jsdom |
| **Config file** | `vite.config.ts` (test.environment: jsdom, globals: true, setupFiles: ['./src/test/setup.ts']) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-T1 | 01 | 1 | EDIT-01 | T-01-01 | CodeMirror renders text only; no eval/innerHTML | unit | `npm test` | ✅ | ✅ green |
| 01-01-T2 | 01 | 1 | EDIT-01, EDIT-03, NAV-03 | T-01-01 | jsonParseLinter marks errors; searchKeymap enabled | unit | `npm test` | ✅ | ✅ green |
| 01-01-T3 | 01 | 1 | EDIT-01, EDIT-03 | T-01-01 | AppShell wires hooks; CodeMirrorEditor renders with lint | integration | `npm test` | ✅ | ✅ green |
| 01-02-T1 | 02 | 2 | EDIT-04, EDIT-05, EDIT-06, EDIT-07 | T-02-02 | format/minify/repair throw on invalid; writeToClipboard async | unit | `npm test` | ✅ | ✅ green |
| 01-02-T2 | 02 | 2 | EDIT-02, EDIT-04, EDIT-05, EDIT-06, EDIT-07 | T-02-01, T-02-03 | FileReader produces string; clipboard requires user gesture | integration | `npm test` | ✅ | ✅ green |
| 01-03-T1 | 03 | 2 | NAV-01, NAV-02 | T-03-02 | JSX escapes all tree values; Object.entries ignores prototype | unit | `npm test` | ✅ | ✅ green |
| 01-03-T2 | 03 | 2 | NAV-01, NAV-02 | T-03-01 | JSON.parse does not execute code; size gate limits input mass | integration | `npm test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. vitest was installed during plan execution (Plan 02 Task 1, deviation auto-fixed). No Wave 0 stubs needed.

---

## Test File Inventory

| File | Tests | Requirements | Added By |
|------|-------|--------------|----------|
| `src/lib/__tests__/jsonTransform.test.ts` | 11 | EDIT-04, EDIT-05, EDIT-06 | Plan 02 TDD |
| `src/lib/__tests__/clipboard.test.ts` | 3 | EDIT-07 | Plan 02 TDD |
| `src/lib/jsonPath.test.ts` | 8 | NAV-02 | Plan 03 TDD |
| `src/components/TreeNode.test.tsx` | 14 | NAV-01 | Plan 03 TDD |
| `src/hooks/useJsonDocument.test.ts` | 5 | EDIT-01 | Nyquist audit |
| `src/components/TreeView.test.tsx` | 6 | NAV-01 | Nyquist audit |
| `src/components/StatusBar.test.tsx` | 7 | NAV-02 | Nyquist audit |
| `src/components/Toolbar.test.tsx` | 11 | EDIT-02, EDIT-04, EDIT-05, EDIT-06, EDIT-07 | Nyquist audit |
| **Total** | **65** | EDIT-01..07, NAV-01, NAV-02 | |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time lint squiggles appear under invalid JSON characters | EDIT-03 | CodeMirror renders lint markers as DOM decorations; jsdom cannot measure or render canvas/SVG decorations reliably | Paste `{"a":` in editor → red squiggle appears under unclosed bracket |
| Ctrl+F opens CodeMirror's built-in search panel | NAV-03 | CodeMirror's `searchKeymap` is a keyboard handler bound to the EditorView DOM; jsdom does not dispatch real keyboard events to CodeMirror internals | Focus editor → press Ctrl+F → search panel slides in at top of editor |

---

## Validation Audit 2026-04-21

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved (automated) | 4 |
| Escalated to manual-only | 0 |
| Pre-existing manual-only | 2 (EDIT-03, NAV-03 — inherently browser-dependent) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or documented manual-only reason
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0: not needed — framework installed during execution
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-21
