import { describe, it, expect } from 'vitest';
import { sanitizeJqError } from '../jqErrors';

describe('sanitizeJqError', () => {
  it('strips Non-zero exit code prefix and subsequent jq: prefix (Test 1)', () => {
    // "Non-zero exit code: 5\njq: compile error" → strip exit code prefix → "jq: compile error"
    // then strip "jq: " prefix → "compile error"
    expect(
      sanitizeJqError(new Error('Non-zero exit code: 5\njq: compile error'))
    ).toBe('compile error');
  });

  it('strips Non-zero exit code prefix and jq: prefix, returns first line (Test 2)', () => {
    expect(
      sanitizeJqError(new Error('Non-zero exit code: 3\njq: 1 compile error\n<stack>'))
    ).toBe('1 compile error');
  });

  it('strips leading jq: prefix without exit code prefix (Test 3)', () => {
    expect(
      sanitizeJqError(new Error('jq: error: syntax error at .foo'))
    ).toBe('error: syntax error at .foo');
  });

  it('returns fallback string for empty message (Test 4)', () => {
    expect(sanitizeJqError(new Error(''))).toBe('jq expression failed');
  });

  it('returns plain string as-is when not an Error (Test 5)', () => {
    expect(sanitizeJqError('plain string, not Error')).toBe('plain string, not Error');
  });

  it('returns fallback string when message is all whitespace (Test 6)', () => {
    expect(sanitizeJqError(new Error('   \n   \n'))).toBe('jq expression failed');
  });

  it('strips Non-zero exit code prefix with no space before number (Test 7)', () => {
    expect(
      sanitizeJqError(new Error('Non-zero exit code:7   some single line message'))
    ).toBe('some single line message');
  });
});
