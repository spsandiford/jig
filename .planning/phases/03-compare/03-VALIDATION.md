---
phase: 3
slug: compare
status: ready
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-27
updated: 2026-04-27
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react |
| **Config file** | `vite.config.ts` (test section inline) |
| **Quick run command** | `npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Source | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | CMP-01, CMP-02 | T-3-01, T-3-03 | jsondiffpatch parse via JSON.parse; SyntaxError surfaced to caller; structural filter excludes value-changes | unit | `npm test -- src/lib/diffDecorations.test.ts` | created in 03-01 (TDD) | ⬜ pending |
| 3-01-02 | 01 | 1 | CMP-01, CMP-02 | T-3-02 | useDiff state machine: idle → comparing → active → reset | unit | `npm test -- src/hooks/useDiff.test.ts` | created in 03-01 (TDD) | ⬜ pending |
| 3-02-01 | 02 | 1 | CMP-01, CMP-02 | T-3-08 | ParseErrorBanner uses textContent (no innerHTML); ModeToggle disabled state blocks onChange | (covered by Plan 03 composition tests) | (no per-leaf tests; verified via ComparePanel) | created in 03-02 | ⬜ pending |
| 3-02-02 | 02 | 1 | CMP-01, CMP-02 | T-3-06, T-3-10 | File picker accepts whitelist `.json,application/json,text/plain`; extensions array stable via useMemo | (covered by Plan 03 composition tests) | (no per-leaf tests; verified via ComparePanel) | created in 03-02 | ⬜ pending |
| 3-03-01 | 03 | 2 | CMP-01, CMP-02 | T-3-08, T-3-11 | Malformed JSON → ParseErrorBanner; Compare disabled with `invalid-json` reason; setDiffDecorations dispatch guarded against destroyed views | component | `npm test -- src/components/ComparePanel.test.tsx` | created in 03-03 | ⬜ pending |
| 3-03-02 | 03 | 2 | CMP-01, CMP-02 | T-3-13, T-3-14 | AppShell Compare tab mounts; Toolbar.activeTab union widened so Copy on Compare is no-op (D-01 isolation) | component | `npm test -- src/components/ComparePanel.test.tsx` | modified in 03-03 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 test files are created **inside** the relevant plans rather than as a separate Wave 0 plan, because Plans 01 and 03 are TDD plans that create tests *before* implementation:

- [x] `src/lib/diffDecorations.test.ts` — created by Plan 03-01 Task 1 (RED phase) before any implementation
- [x] `src/hooks/useDiff.test.ts` — created by Plan 03-01 Task 2 (RED phase) before any implementation
- [x] `src/components/ComparePanel.test.tsx` — created by Plan 03-03 Task 1 alongside ComparePanel.tsx

*Plan 02 leaves are exercised through Plan 03's ComparePanel composition test rather than per-component tests; this avoids redundant unit tests for thin presentation wrappers and matches the Phase 2 pattern (TransformPanel.test.tsx covers ExpressionInput / RunButton / OutputPane).*

*Framework already installed; no additional test infrastructure setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Inline diff highlights visually render with correct colors (red `#4b1818` / green `#1a3a1a` / amber `#3a2a00`) | CMP-01 | CSS class rendering cannot be reliably verified in jsdom | Load two JSON docs (left = `{"a":1,"b":2}`, right = `{"a":1,"b":3,"c":4}`), click Compare. Confirm: left pane has no removed line for `b` (changed, not removed); right pane shows `b: 3` highlighted amber and `c: 4` highlighted green. |
| Gutter dot markers appear on diff lines | CMP-01, CMP-02 | GutterMarker rendering in jsdom has limited CSS support | After Compare, verify colored dots appear in gutter alongside highlighted lines (not blocking — feature is purely additive on top of background highlights) |
| Mode toggle re-runs decoration build and updates highlights without flicker | CMP-02 | Animation/visual transition cannot be unit tested | Toggle Value → Structure: amber `b: 3` highlight should disappear (modified entries removed by filterStructural), green `c: 4` should remain (added entries preserved). Toggle back to Value: amber `b: 3` reappears. No editor flash. |
| Pane readOnly state visually applied after Compare | D-04 | jsdom does not render the readOnly cursor / dimmed appearance | After Compare, attempt to type in either pane — keystrokes should be ignored. After Reset, panes accept keystrokes again. |
| Loading a file via Open File button while diff is active triggers reset | UI-SPEC | File input behavior + downstream state machine triggers are easier to validate end-to-end | Run Compare, then click Left's FolderOpen icon and pick any `.json` file. Confirm diff highlights vanish, both panes return to editable, mode toggle remains visible (state preserved). |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are covered by composition tests one wave later
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (Wave 1 Plan 02 leaves are verified by Wave 2 Plan 03 composition tests)
- [x] Wave 0 covers all MISSING references (test files created inside TDD tasks)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved-by-planner — ready for execution
