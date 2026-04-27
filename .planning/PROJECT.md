# JSON Workbench

## What This Is

A single-page web application for working with JSON files — edit, validate, transform, and compare JSON documents in one place. Built for a developer replacing the scattered workflow of jumping between jsonlint, jq, diff tools, and online formatters.

## Core Value

One unified tool that handles every JSON task — edit, validate, transform, compare — without leaving the browser.

## Requirements

### Validated

- ✓ User can transform JSON using a code expression (jq) — Phase 2
- ✓ User can copy any result to the clipboard — Phase 2

### Active

- [ ] User can paste JSON text into an editor pane
- [ ] User can load a JSON file from disk via file picker
- [ ] Editor validates JSON syntax in real time, highlighting errors
- [ ] User can format/pretty-print JSON with one action
- [ ] User can transform JSON using a visual/GUI field mapper
- [ ] User can compare two JSON documents side by side (value diff)
- [ ] User can view a structural diff between two JSON documents (schema-level differences)
- [ ] User can compare before/after a transformation

### Out of Scope

- JSON Schema validation — user wants syntax-only validation for v1
- Fetching JSON from a URL — not requested; paste and file open cover the use cases
- Download/save to file — copy to clipboard is sufficient
- Drag-and-drop file input — not requested

## Context

- Personal productivity tool replacing scattered utilities (jsonlint, jq, diff tools, online formatters)
- All JSON types in scope: API responses, config files (package.json, OpenAPI specs), data exports (potentially large/MB-scale)
- Transform authoring: both code expressions (jq/JSONPath) and a visual GUI field mapper
- Comparison: three modes — value diff, structural diff, before/after transform
- Output: copy to clipboard is the primary exit path

## Constraints

- **Platform**: Single-page web app — runs entirely in the browser, no backend required
- **Input**: Paste text + open local file (no URL fetch, no drag-and-drop for v1)
- **Performance**: Must handle large JSON files (MB-scale data exports) without freezing

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SPA with no backend | User wants a browser tool; no server needed for these operations | — Pending |
| Both code + visual transforms | Power users want expressions; quick edits benefit from GUI | — Pending |
| jq-web@0.6.2 over jq-wasm | jq-wasm spike found Vite WASM path issues; jq-web (fiatjaf) resolved them with dev middleware + closeBundle copy | Phase 2 ✓ |
| Worker Facade for jq | CPU-bound WASM in dedicated Web Worker; hook owns ready/running/output/error state | Phase 2 ✓ |
| Vite middleware for WASM serving | Dev server intercepts *.wasm GETs and streams from node_modules; closeBundle copies to dist/assets/ for prod | Phase 2 ✓ |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-27 after Phase 2*
