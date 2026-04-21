import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJsonDocument } from './useJsonDocument';

describe('useJsonDocument', () => {
  it('default initialValue is empty string', () => {
    const { result } = renderHook(() => useJsonDocument());
    expect(result.current.rawJson).toBe('');
  });

  it('initialValue sets rawJson', () => {
    const { result } = renderHook(() => useJsonDocument('{"a":1}'));
    expect(result.current.rawJson).toBe('{"a":1}');
  });

  it('setRawJson updates rawJson', () => {
    const { result } = renderHook(() => useJsonDocument());
    act(() => {
      result.current.setRawJson('hello');
    });
    expect(result.current.rawJson).toBe('hello');
  });

  it('onChange updates rawJson', () => {
    const { result } = renderHook(() => useJsonDocument());
    act(() => {
      result.current.onChange('new value');
    });
    expect(result.current.rawJson).toBe('new value');
  });

  it('onChange is memoized (same reference across renders)', () => {
    const { result, rerender } = renderHook(() => useJsonDocument());
    const firstOnChange = result.current.onChange;
    act(() => {
      result.current.setRawJson('trigger rerender');
    });
    rerender();
    expect(result.current.onChange).toBe(firstOnChange);
  });
});
