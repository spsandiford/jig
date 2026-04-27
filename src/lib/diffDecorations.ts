import { StateField, StateEffect, RangeSetBuilder, type Extension } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';
import type { Text } from '@codemirror/state';

export type DiffLineType = 'removed' | 'added' | 'changed';

export interface DiffLineEntry {
  line: number;   // 1-based line number in the formatted JSON text
  type: DiffLineType;
}

// ----- CodeMirror integration -----

export const setDiffDecorations = StateEffect.define<DecorationSet>();

export const diffDecorationsField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setDiffDecorations)) deco = effect.value;
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const diffTheme: Extension = EditorView.baseTheme({
  '&.cm-editor .cm-diff-removed': { backgroundColor: '#4b1818' },
  '&.cm-editor .cm-diff-added':   { backgroundColor: '#1a3a1a' },
  '&.cm-editor .cm-diff-changed': { backgroundColor: '#3a2a00' },
});

// ----- Pure utilities -----

/**
 * Build a sorted DecorationSet for one editor pane from an array of diff line entries.
 * Entries are sorted by line number before building (RangeSetBuilder requires sorted order).
 * Out-of-range line numbers are silently dropped.
 */
export function buildPaneDecorations(doc: Text, entries: DiffLineEntry[]): DecorationSet {
  if (entries.length === 0) return Decoration.none;
  const builder = new RangeSetBuilder<Decoration>();
  const sorted = [...entries].sort((a, b) => a.line - b.line);
  for (const { line, type } of sorted) {
    if (line < 1 || line > doc.lines) continue;
    const { from } = doc.line(line);
    const cls =
      type === 'removed' ? 'cm-diff-removed' :
      type === 'added'   ? 'cm-diff-added'   :
                           'cm-diff-changed';
    builder.add(from, from, Decoration.line({ class: cls }));
  }
  return builder.finish();
}

/**
 * Determine the delta entry type from its value array.
 * Returns null if the value is not a recognised delta leaf (i.e. it's a nested object).
 */
function entryType(value: unknown): DiffLineType | null {
  if (!Array.isArray(value)) return null;
  if (value.length === 1) return 'added';
  if (value.length === 2) return 'changed';
  if (value.length === 3 && value[1] === 0 && value[2] === 0) return 'removed';
  if (value.length === 3 && value[2] === 2) return 'changed'; // text-diff
  return null;
}

/**
 * Filter a jsondiffpatch delta to keep only structural changes (added/removed entries).
 * Modified (value-changed) entries are dropped, satisfying CMP-02 / D-08.
 */
export function filterStructural(delta: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(delta)) {
    if (key === '_t') continue; // array marker — re-attached below if container survives
    const t = entryType(value);
    if (t === 'added' || t === 'removed') {
      result[key] = value;
    } else if (t === null && typeof value === 'object' && value !== null) {
      const nested = filterStructural(value as Record<string, unknown>);
      // Only keep the container if at least one child survived
      const nonMarkerKeys = Object.keys(nested).filter((k) => k !== '_t');
      if (nonMarkerKeys.length > 0) {
        // Restore the _t array marker from the original container
        const sourceMarker = (value as Record<string, unknown>)._t;
        if (sourceMarker !== undefined) {
          (nested as Record<string, unknown>)._t = sourceMarker;
        }
        result[key] = nested;
      }
    }
    // 'changed' (length 2) and text-diff (length 3, index 2 === 2) → drop
  }
  return result;
}

/**
 * Escape a JSON key string for use in a key pattern match (matches JSON.stringify key encoding).
 */
function escapeForJson(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Walk the formatted JSON lines and find the 1-based line number of the key at keyPath.
 * Returns null if the key path cannot be fully matched.
 *
 * Known limitation: If two sibling objects at the same depth both contain a key with the
 * same name, this walker may match the first occurrence regardless of parent context.
 * This is documented as a V1 limitation; sufficient for typical JSON documents.
 */
function findLineForPath(keyPath: string[], lines: string[]): number | null {
  if (keyPath.length === 0) return null;

  // If any path segment is a numeric/underscore-numeric key, defer to array element finder
  const lastKey = keyPath[keyPath.length - 1];
  if (/^_?\d+$/.test(lastKey)) {
    return null; // signal caller to use array-element path
  }

  let pathIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Count leading spaces
    let leading = 0;
    while (leading < line.length && line[leading] === ' ') leading++;
    const trimmed = line.slice(leading);

    if (pathIdx < keyPath.length) {
      // Keys inside a JSON object are indented (pathIdx + 1) levels deep:
      // top-level keys (pathIdx=0) are at indent 2 (inside the root `{`),
      // nested keys (pathIdx=1) are at indent 4, etc.
      const expectedIndent = (pathIdx + 1) * 2;
      const expectedKey = keyPath[pathIdx];

      if (
        leading === expectedIndent &&
        trimmed.startsWith(`"${escapeForJson(expectedKey)}"`)
      ) {
        pathIdx++;
        if (pathIdx === keyPath.length) {
          return i + 1; // 1-based
        }
      }
    }
  }

  return pathIdx === keyPath.length ? 1 : null;
}

/**
 * Find the approximate line number of an array element at a numeric index.
 * V1 heuristic: element N is at parentLine + N + 1.
 * Known limitation: arrays with multi-line elements or nested objects may not align perfectly.
 */
function findArrayElementLine(
  parentPath: string[],
  indexKey: string,
  lines: string[],
): number | null {
  // Strip leading underscore from removal markers (_N → N)
  const idxStr = indexKey.startsWith('_') ? indexKey.slice(1) : indexKey;
  const idx = Number.parseInt(idxStr, 10);
  if (!Number.isFinite(idx)) return null;

  // Find parent line
  const parentLine =
    parentPath.length === 0
      ? 1
      : findLineForPath(parentPath, lines);
  if (parentLine === null) return null;

  // V1 heuristic: array element line = parentLine + idx + 1
  const candidate = parentLine + idx + 1;
  if (candidate < 1 || candidate > lines.length) return null;
  return candidate;
}

/**
 * Walk a jsondiffpatch delta and produce one DiffLineEntry per changed key path,
 * filtered by which side (left/right) should show the entry.
 *
 * - 'added' entries appear on the right side only
 * - 'removed' entries appear on the left side only
 * - 'changed' entries appear on both sides
 *
 * Returns [] if delta is undefined (identical documents — Pitfall 5).
 */
export function deltaToLineEntries(
  delta: Record<string, unknown> | undefined,
  formattedJson: string,
  side: 'left' | 'right',
): DiffLineEntry[] {
  if (!delta) return [];
  const lines = formattedJson.split('\n');
  const out: DiffLineEntry[] = [];

  function walk(node: Record<string, unknown>, path: string[]) {
    const isArrayDelta = node._t === 'a';
    for (const [key, value] of Object.entries(node)) {
      if (key === '_t') continue;
      const t = entryType(value);
      if (t !== null) {
        // Side filter
        if (t === 'added'   && side === 'left')  continue;
        if (t === 'removed' && side === 'right') continue;

        let lineNum: number | null;
        if (isArrayDelta) {
          lineNum = findArrayElementLine(path, key, lines);
        } else {
          lineNum = findLineForPath([...path, key], lines);
        }
        if (lineNum !== null) out.push({ line: lineNum, type: t });
      } else if (typeof value === 'object' && value !== null) {
        walk(value as Record<string, unknown>, [...path, key]);
      }
    }
  }

  walk(delta, []);
  return out;
}
