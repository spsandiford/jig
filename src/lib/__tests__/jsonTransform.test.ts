import { describe, it, expect } from 'vitest';
import { format, minify, repair, isValidJson } from '../jsonTransform';

describe('format', () => {
  it('pretty-prints valid JSON with 2-space indent', () => {
    expect(format('{"a":1}')).toBe('{\n  "a": 1\n}');
  });

  it('throws SyntaxError on invalid JSON', () => {
    expect(() => format('invalid')).toThrow(SyntaxError);
  });

  it('preserves key order (b before a)', () => {
    expect(format('{"b":2,"a":1}')).toBe('{\n  "b": 2,\n  "a": 1\n}');
  });
});

describe('minify', () => {
  it('collapses JSON to a single line', () => {
    expect(minify('{\n  "a": 1\n}')).toBe('{"a":1}');
  });

  it('throws SyntaxError on invalid JSON', () => {
    expect(() => minify('not json')).toThrow(SyntaxError);
  });
});

describe('repair', () => {
  it('fixes unquoted keys and trailing commas', () => {
    const result = repair('{a:1,}');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ a: 1 });
  });

  it('converts single quotes to double quotes', () => {
    const result = repair("{'a': 1}");
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ a: 1 });
  });

  it('returns semantically equivalent JSON for already-valid input', () => {
    const result = repair('{"a":1}');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ a: 1 });
  });
});

describe('isValidJson', () => {
  it('returns true for valid JSON', () => {
    expect(isValidJson('{"a":1}')).toBe(true);
  });

  it('returns false for invalid JSON', () => {
    expect(isValidJson('{bad}')).toBe(false);
  });

  it('returns true for JSON array', () => {
    expect(isValidJson('[1,2,3]')).toBe(true);
  });
});
