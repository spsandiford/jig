import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiff } from './useDiff';

describe('useDiff', () => {
  it('Test 1 (CMP-01 / D-06): initial state — delta === undefined, mode === "value", diffActive === false', () => {
    const { result } = renderHook(() => useDiff());
    expect(result.current.delta).toBeUndefined();
    expect(result.current.mode).toBe('value');
    expect(result.current.diffActive).toBe(false);
  });

  it('Test 2 (CMP-01): compare() sets diffActive === true and delta with expected shape', () => {
    const { result } = renderHook(() => useDiff());
    act(() => {
      result.current.compare('{"a":1}', '{"a":2}');
    });
    expect(result.current.diffActive).toBe(true);
    expect(result.current.delta).toBeDefined();
    expect(result.current.delta).toEqual({ a: [1, 2] });
  });

  it('Test 3 (CMP-01 / D-04): reset() sets delta back to undefined and diffActive to false', () => {
    const { result } = renderHook(() => useDiff());
    act(() => {
      result.current.compare('{"a":1}', '{"a":2}');
    });
    expect(result.current.diffActive).toBe(true);
    expect(result.current.delta).toBeDefined();

    act(() => {
      result.current.reset();
    });
    expect(result.current.delta).toBeUndefined();
    expect(result.current.diffActive).toBe(false);
  });

  it('Test 4 (Pitfall 5): identical inputs — delta === undefined, diffActive === true', () => {
    const { result } = renderHook(() => useDiff());
    act(() => {
      result.current.compare('{"a":1}', '{"a":1}');
    });
    // jsondiffpatch returns undefined for identical documents
    expect(result.current.delta).toBeUndefined();
    // diffActive is still true — compare WAS triggered
    expect(result.current.diffActive).toBe(true);
  });

  it('Test 5 (key-order / whitespace ignored — CMP-01): key-order-insensitive compare', () => {
    const { result } = renderHook(() => useDiff());
    act(() => {
      result.current.compare('{"a":1, "b":2}', '{"b":2,"a":1}');
    });
    // jsondiffpatch is key-order-insensitive; semantically equal → undefined delta
    expect(result.current.delta).toBeUndefined();
    expect(result.current.diffActive).toBe(true);
  });

  it('Test 6 (key-order ignored, semantically equal with whitespace): whitespace in JSON is irrelevant', () => {
    const { result } = renderHook(() => useDiff());
    act(() => {
      result.current.compare('  {"a":1}  ', '{\n  "a": 1\n}');
    });
    // After JSON.parse, whitespace is irrelevant → semantically equal → undefined delta
    expect(result.current.delta).toBeUndefined();
    expect(result.current.diffActive).toBe(true);
  });

  it('Test 7 (CMP-02 / D-05): setMode("structure") updates mode without clearing delta', () => {
    const { result } = renderHook(() => useDiff());
    act(() => {
      result.current.compare('{"a":1}', '{"a":2}');
    });
    expect(result.current.diffActive).toBe(true);
    expect(result.current.delta).toBeDefined();

    act(() => {
      result.current.setMode('structure');
    });
    expect(result.current.mode).toBe('structure');
    expect(result.current.delta).toBeDefined();
    expect(result.current.diffActive).toBe(true);
  });

  it('Test 8 (invalid JSON propagation): compare() throws SyntaxError for invalid JSON', () => {
    const { result } = renderHook(() => useDiff());
    expect(() => {
      act(() => {
        result.current.compare('not json', '{"a":1}');
      });
    }).toThrow(SyntaxError);
  });

  it('Test 9 (compare after reset): compare → reset → compare produces fresh delta', () => {
    const { result } = renderHook(() => useDiff());

    // First compare
    act(() => {
      result.current.compare('{"a":1}', '{"a":2}');
    });
    expect(result.current.diffActive).toBe(true);
    expect(result.current.delta).toEqual({ a: [1, 2] });

    // Reset
    act(() => {
      result.current.reset();
    });
    expect(result.current.delta).toBeUndefined();
    expect(result.current.diffActive).toBe(false);

    // Second compare with different values
    act(() => {
      result.current.compare('{"a":1}', '{"a":99}');
    });
    expect(result.current.diffActive).toBe(true);
    expect(result.current.delta).toEqual({ a: [1, 99] });
  });
});
