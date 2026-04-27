import { describe, it, expect } from 'vitest';
import { EditorState, Text } from '@codemirror/state';
import {
  filterStructural,
  buildPaneDecorations,
  deltaToLineEntries,
  diffDecorationsField,
  type DiffLineEntry,
} from './diffDecorations';

function makeDoc(lines: string[]): Text {
  const state = EditorState.create({
    doc: lines.join('\n'),
    extensions: [diffDecorationsField],
  });
  return state.doc;
}

describe('filterStructural', () => {
  it('Test 1.1 (CMP-02): keeps [newValue] (added) entries', () => {
    expect(filterStructural({ d: [4] })).toEqual({ d: [4] });
  });

  it('Test 1.2 (CMP-02): keeps [oldValue, 0, 0] (deleted) entries', () => {
    expect(filterStructural({ b: [2, 0, 0] })).toEqual({ b: [2, 0, 0] });
  });

  it('Test 1.3 (CMP-02 / D-08): drops [oldValue, newValue] (modified value) entries', () => {
    expect(filterStructural({ a: [1, 99] })).toEqual({});
  });

  it('Test 1.4 (CMP-02): handles array marker _t — drops modified-only nested array, keeps deletion', () => {
    // modified-only nested array drops
    expect(filterStructural({ arr: { _t: 'a', '0': [1, 9] } })).toEqual({});
    // if a deletion exists, it should be kept
    expect(filterStructural({ arr: { _t: 'a', '_0': [1, 0, 0] } })).toEqual({
      arr: { _t: 'a', '_0': [1, 0, 0] },
    });
  });

  it('Test 1.5 (CMP-02): recurses into nested object deltas', () => {
    expect(filterStructural({ outer: { inner: [99] } })).toEqual({
      outer: { inner: [99] },
    });
  });

  it('Test 1.6 (CMP-02): drops empty nested objects after recursion', () => {
    // modified-only inner drops; outer becomes empty and is dropped
    expect(filterStructural({ outer: { inner: [1, 99] } })).toEqual({});
  });

  it('Test 1.7: handles empty input', () => {
    expect(filterStructural({})).toEqual({});
  });
});

describe('buildPaneDecorations', () => {
  it('Test 2.1: returns Decoration.none (size === 0) when entries is empty', () => {
    const doc = makeDoc(['{', '  "a": 1', '}']);
    const result = buildPaneDecorations(doc, []);
    expect(result.size).toBe(0);
  });

  it('Test 2.2 (Pitfall 1): unsorted line entries must NOT throw and returns DecorationSet with size === 2', () => {
    const doc = makeDoc(['{', '  "a": 1', '}']);
    const entries: DiffLineEntry[] = [
      { line: 3, type: 'added' },
      { line: 1, type: 'removed' },
    ];
    // Should not throw
    const result = buildPaneDecorations(doc, entries);
    expect(result.size).toBe(2);

    // Verify iteration order is by `from` ascending (line 1 first)
    const iter = result.iter();
    expect(iter.from).toBe(0); // line 1, from position 0
    iter.next();
    // line 3 starts after '{', '\n', '  "a": 1', '\n'
    expect(iter.value).not.toBeNull();
  });

  it('Test 2.3: out-of-range line numbers are dropped', () => {
    const doc = makeDoc(['{', '  "a": 1', '}']); // 3 lines
    const entries: DiffLineEntry[] = [
      { line: 0, type: 'added' },  // out of range (too low)
      { line: 99, type: 'removed' }, // out of range (too high)
      { line: 2, type: 'changed' },  // valid
    ];
    const result = buildPaneDecorations(doc, entries);
    expect(result.size).toBe(1);
  });

  it('Test 2.4: emits the correct CSS class per type', () => {
    // Use a 3-line doc: lines 1, 2, 3 for removed, added, changed
    const doc3 = makeDoc(['{', '  "a": 1', '}']);
    const entries: DiffLineEntry[] = [
      { line: 1, type: 'removed' },
      { line: 2, type: 'added' },
      { line: 3, type: 'changed' },
    ];
    const decoSet = buildPaneDecorations(doc3, entries);
    const classes: string[] = [];
    const iter = decoSet.iter();
    while (iter.value !== null) {
      const spec = (iter.value as unknown as { spec?: { class?: string } }).spec;
      if (spec?.class) classes.push(spec.class);
      iter.next();
    }
    expect(classes).toContain('cm-diff-removed');
    expect(classes).toContain('cm-diff-added');
    expect(classes).toContain('cm-diff-changed');
  });
});

describe('deltaToLineEntries', () => {
  it('Test 3.1 (CMP-01): undefined delta returns []', () => {
    expect(deltaToLineEntries(undefined, '{"a":1}', 'left')).toEqual([]);
  });

  it('Test 3.2 (CMP-01): added entry on right side only', () => {
    const delta = { d: [4] };
    const formatted = '{\n  "a": 1,\n  "d": 4\n}';
    // right side: should return [{line: 3, type: 'added'}]
    expect(deltaToLineEntries(delta, formatted, 'right')).toEqual([{ line: 3, type: 'added' }]);
    // left side: added does not exist on left → []
    expect(deltaToLineEntries(delta, formatted, 'left')).toEqual([]);
  });

  it('Test 3.3 (CMP-01): removed entry on left side only', () => {
    const delta = { b: [2, 0, 0] };
    const formatted = '{\n  "a": 1,\n  "b": 2\n}';
    // left side: should return [{line: 3, type: 'removed'}]
    expect(deltaToLineEntries(delta, formatted, 'left')).toEqual([{ line: 3, type: 'removed' }]);
    // right side: removed does not exist on right → []
    expect(deltaToLineEntries(delta, formatted, 'right')).toEqual([]);
  });

  it('Test 3.4 (CMP-01): changed entry on both sides', () => {
    const delta = { a: [1, 99] };
    const formatted = '{\n  "a": 1\n}';
    expect(deltaToLineEntries(delta, formatted, 'left')).toEqual([{ line: 2, type: 'changed' }]);
    expect(deltaToLineEntries(delta, formatted, 'right')).toEqual([{ line: 2, type: 'changed' }]);
  });

  it('Test 3.5 (CMP-01): nested key matching', () => {
    const delta = { outer: { inner: [1, 99] } };
    const formatted = '{\n  "outer": {\n    "inner": 1\n  }\n}';
    expect(deltaToLineEntries(delta, formatted, 'left')).toEqual([{ line: 3, type: 'changed' }]);
    expect(deltaToLineEntries(delta, formatted, 'right')).toEqual([{ line: 3, type: 'changed' }]);
  });

  it('Test 3.6 (CMP-02): structural-mode input — only emits added/removed entries', () => {
    // Compose filterStructural + deltaToLineEntries
    // filterStructural({ a: [1, 99], d: [4] }) should drop the 'changed' a entry
    // and keep only the 'added' d entry
    const delta = filterStructural({ a: [1, 99], d: [4] });
    const formatted = '{\n  "a": 1,\n  "d": 4\n}';
    // right side: only added d should appear
    expect(deltaToLineEntries(delta, formatted, 'right')).toEqual([{ line: 3, type: 'added' }]);
  });
});
