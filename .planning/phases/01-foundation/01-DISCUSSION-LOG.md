# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 1-foundation
**Areas discussed:** Framework & styling, Editor component, Tree view approach, Panel layout

---

## Framework & styling

| Option | Description | Selected |
|--------|-------------|----------|
| React + Vite | React 18 + TypeScript + Vite, largest ecosystem, best library support | ✓ |
| Vue 3 + Vite | Excellent DX, good ecosystem but fewer editor/tree libraries | |
| Svelte / SvelteKit | Smallest bundle, fewer ready-made complex component libraries | |

**User's choice:** React + Vite

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind CSS | Utility-first, consistent spacing/color system, great for tool UIs | ✓ |
| CSS Modules | Scoped styles, no shared design system out of the box | |
| Plain CSS / vanilla | Zero dependencies, harder to keep consistent as component count grows | |

**User's choice:** Tailwind CSS

---

## Editor component

| Option | Description | Selected |
|--------|-------------|----------|
| CodeMirror 6 | ~100KB, extensible, excellent JSON support, @codemirror/search built-in | ✓ |
| Monaco Editor | VS Code's editor, ~4MB, full IDE power, heavier initial load | |
| Textarea + custom layer | Zero dependency, requires building all features from scratch | |

**User's choice:** CodeMirror 6

---

## Tree view approach

| Option | Description | Selected |
|--------|-------------|----------|
| Custom recursive component | Full control, JSONPath on click, Tailwind styled, no external dependency | ✓ |
| react-json-view library | Fast to integrate but maintenance risk (last release 2021), limited theming | |

**User's choice:** Custom recursive component

---

## Panel layout

| Option | Description | Selected |
|--------|-------------|----------|
| Tabs | Single panel, switch between Editor and Tree tabs, status bar below | ✓ |
| Side-by-side split | Editor left, tree right, always visible, eats horizontal space | |
| Editor-primary, tree as drawer | Full-width editor, tree slides in on demand | |

**User's choice:** Tabs (with status bar for JSONPath and error summary)

---

## Claude's Discretion

- Auto-repair library (EDIT-06): Claude decides — `jsonrepair` is the pragmatic default.
- Tab ordering and labels.
- Toolbar button placement.
- Dark developer-tool color palette.

## Deferred Ideas

None.
