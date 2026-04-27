---
phase: 3
slug: compare
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-27
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | CMP-01 | — | JSON.parse try/catch; invalid input shows ParseErrorBanner | unit | `npm test -- src/lib/diffDecorations.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | CMP-01 | — | N/A | unit | `npm test -- src/lib/diffDecorations.test.ts` | ❌ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | CMP-01 | — | N/A | unit | `npm test -- src/hooks/useDiff.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | CMP-02 | — | N/A | unit | `npm test -- src/lib/diffDecorations.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | CMP-02 | — | N/A | component | `npm test -- src/components/ComparePanel.test.tsx` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | CMP-01 | — | Malformed JSON shows ParseErrorBanner, blocks Compare | component | `npm test -- src/components/ComparePanel.test.tsx` | ❌ W0 | ⬜ pending |
| 3-03-02 | 03 | 2 | CMP-01 | — | N/A | component | `npm test -- src/components/ComparePanel.test.tsx` | ❌ W0 | ⬜ pending |
| 3-03-03 | 03 | 2 | CMP-01, CMP-02 | — | N/A | unit | `npm test -- src/lib/diffDecorations.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/diffDecorations.test.ts` — stubs for CMP-01, CMP-02 (delta traversal, RangeSetBuilder, structural filter)
- [ ] `src/hooks/useDiff.test.ts` — stubs for CMP-01, CMP-02 (compare/reset/mode state transitions)
- [ ] `src/components/ComparePanel.test.tsx` — stubs for CMP-01, CMP-02 (Compare button states, Reset, mode toggle, empty state)

*Framework already installed; no additional test infrastructure setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Inline diff highlights visually render with correct colors (red/green/amber) | CMP-01 | CSS class rendering cannot be verified in jsdom | Load two JSON docs, click Compare, visually confirm left pane shows red removed lines, right pane shows green added lines |
| Gutter dot markers appear on diff lines | CMP-01, CMP-02 | GutterMarker rendering in jsdom has limited CSS support | After Compare, verify colored dots appear in gutter alongside highlighted lines |
| Mode toggle re-runs diff and updates highlights without flicker | CMP-02 | Animation/visual transition cannot be unit tested | Toggle Value/Structure, confirm highlights update immediately with no editor flash |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
