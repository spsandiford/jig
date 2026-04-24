import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../workers/jqWorker.ts?worker', () => {
  // Define MockWorker entirely inside the factory to avoid hoisting issues.
  class MockWorker extends EventTarget {
    onmessage: ((e: MessageEvent) => void) | null = null;
    postMessage = vi.fn();
    terminate = vi.fn();
    constructor() {
      super();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).__lastMockWorkerInstance = this;
    }
  }
  return { default: MockWorker };
});

import { useJqWorker } from './useJqWorker';

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__lastMockWorkerInstance = null;
});

// Helper to get the current mock worker instance created during renderHook
function getInstance() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).__lastMockWorkerInstance as {
    onmessage: ((e: MessageEvent) => void) | null;
    postMessage: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
  };
}

describe('useJqWorker', () => {
  it('Test 1 (XFRM-02): initial state is engineReady=false, running=false, output=null, error=null', () => {
    const { result } = renderHook(() => useJqWorker());
    expect(result.current.engineReady).toBe(false);
    expect(result.current.running).toBe(false);
    expect(result.current.output).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('Test 2 (XFRM-02): engineReady flips to true when worker posts { type: "ready" }', () => {
    const { result } = renderHook(() => useJqWorker());
    expect(result.current.engineReady).toBe(false);

    act(() => {
      getInstance().onmessage?.({ data: { type: 'ready' } } as MessageEvent);
    });

    expect(result.current.engineReady).toBe(true);
  });

  it('Test 3 (XFRM-01): after ready, run() posts message and sets running=true', () => {
    const { result } = renderHook(() => useJqWorker());

    act(() => {
      getInstance().onmessage?.({ data: { type: 'ready' } } as MessageEvent);
    });

    act(() => {
      result.current.run('.', '{"a":1}');
    });

    expect(getInstance().postMessage).toHaveBeenCalledWith({ type: 'run', expr: '.', json: '{"a":1}' });
    expect(result.current.running).toBe(true);
  });

  it('Test 4 (XFRM-01): when worker posts result, output is set, error is null, running is false', () => {
    const { result } = renderHook(() => useJqWorker());

    act(() => {
      getInstance().onmessage?.({ data: { type: 'ready' } } as MessageEvent);
    });

    act(() => {
      result.current.run('.', '{"a":1}');
    });

    act(() => {
      getInstance().onmessage?.({ data: { type: 'result', output: '"hello"' } } as MessageEvent);
    });

    expect(result.current.output).toBe('"hello"');
    expect(result.current.error).toBeNull();
    expect(result.current.running).toBe(false);
  });

  it('Test 5 (XFRM-03 + XFRM-01): when worker posts error, error is set, output is null, running is false', () => {
    const { result } = renderHook(() => useJqWorker());

    act(() => {
      getInstance().onmessage?.({ data: { type: 'ready' } } as MessageEvent);
    });

    act(() => {
      result.current.run('.', '{"a":1}');
    });

    act(() => {
      getInstance().onmessage?.({ data: { type: 'error', message: 'compile error' } } as MessageEvent);
    });

    expect(result.current.error).toBe('compile error');
    expect(result.current.output).toBeNull();
    expect(result.current.running).toBe(false);
  });

  it('Test 6 (XFRM-02): run() is a no-op when engineReady=false', () => {
    const { result } = renderHook(() => useJqWorker());

    act(() => {
      result.current.run('.', '{}');
    });

    expect(getInstance().postMessage).not.toHaveBeenCalled();
    expect(result.current.running).toBe(false);
  });

  it('Test 7 (XFRM-02): run() is a no-op when running=true (double call)', () => {
    const { result } = renderHook(() => useJqWorker());

    act(() => {
      getInstance().onmessage?.({ data: { type: 'ready' } } as MessageEvent);
    });

    act(() => {
      result.current.run('.', '{}');
    });

    // Second call while running — should be a no-op
    act(() => {
      result.current.run('.', '{}');
    });

    expect(getInstance().postMessage).toHaveBeenCalledTimes(1);
  });

  it('Test 8: successful run after error clears error; error after success clears output', () => {
    const { result } = renderHook(() => useJqWorker());

    act(() => {
      getInstance().onmessage?.({ data: { type: 'ready' } } as MessageEvent);
    });

    // First run produces an error
    act(() => {
      result.current.run('.bad(', '{}');
    });
    act(() => {
      getInstance().onmessage?.({ data: { type: 'error', message: 'compile error' } } as MessageEvent);
    });
    expect(result.current.error).toBe('compile error');
    expect(result.current.output).toBeNull();

    // Second run succeeds — clears error, sets output
    act(() => {
      result.current.run('.', '{"x":1}');
    });
    act(() => {
      getInstance().onmessage?.({ data: { type: 'result', output: '{"x":1}' } } as MessageEvent);
    });
    expect(result.current.output).toBe('{"x":1}');
    expect(result.current.error).toBeNull();

    // Third run produces error — clears output
    act(() => {
      result.current.run('.bad', '{}');
    });
    act(() => {
      getInstance().onmessage?.({ data: { type: 'error', message: 'another error' } } as MessageEvent);
    });
    expect(result.current.error).toBe('another error');
    expect(result.current.output).toBeNull();
  });

  it('Test 9: on unmount, terminate() is called', () => {
    const { unmount } = renderHook(() => useJqWorker());
    const instance = getInstance();
    expect(instance).not.toBeNull();

    unmount();

    expect(instance.terminate).toHaveBeenCalledTimes(1);
  });
});
