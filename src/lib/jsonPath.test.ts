import { describe, it, expect } from 'vitest';
import { buildPath } from './jsonPath';

describe('buildPath', () => {
  it('appends a string key using dot notation for identifier-safe keys', () => {
    expect(buildPath('$', 'name')).toBe('$.name');
  });

  it('appends a numeric key using bracket notation', () => {
    expect(buildPath('$', 0)).toBe('$[0]');
  });

  it('chains dot notation on nested paths', () => {
    expect(buildPath('$.users[0]', 'name')).toBe('$.users[0].name');
  });

  it('appends a numeric key to a nested path', () => {
    expect(buildPath('$.users', 0)).toBe('$.users[0]');
  });

  it('uses bracket+quote notation for keys with hyphens', () => {
    expect(buildPath('$', 'first-name')).toBe('$["first-name"]');
  });

  it('uses bracket+quote notation for keys starting with a digit', () => {
    expect(buildPath('$', '123abc')).toBe('$["123abc"]');
  });

  it('uses dot notation for keys starting with underscore', () => {
    expect(buildPath('$', '_private')).toBe('$._private');
  });

  it('escapes internal double-quotes in keys', () => {
    expect(buildPath('$', 'with"quote')).toBe('$["with\\"quote"]');
  });
});
