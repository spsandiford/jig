import { describe, it, expect, vi, beforeEach } from 'vitest';

// clipboard.ts uses browser APIs; mock them for node test environment
describe('writeToClipboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns true when navigator.clipboard.writeText succeeds', async () => {
    // Mock navigator.clipboard
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
      configurable: true,
    });

    const { writeToClipboard } = await import('../clipboard');
    const result = await writeToClipboard('hello');
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('returns Promise<boolean>', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      writable: true,
      configurable: true,
    });

    const { writeToClipboard } = await import('../clipboard');
    const result = writeToClipboard('test');
    expect(result).toBeInstanceOf(Promise);
    const val = await result;
    expect(typeof val).toBe('boolean');
  });
});
