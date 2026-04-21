const IDENTIFIER_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

/**
 * Append a key segment to a JSONPath string.
 * - Number keys → bracket notation: `$.users[0]`
 * - Identifier-safe string keys → dot notation: `$.users.name`
 * - Non-identifier string keys → bracket+quote: `$.users["first-name"]`
 *
 * Internal double quotes in the key are escaped with `\"`.
 */
export function buildPath(parentPath: string, key: string | number): string {
  if (typeof key === 'number') {
    return `${parentPath}[${key}]`;
  }
  if (IDENTIFIER_RE.test(key)) {
    return `${parentPath}.${key}`;
  }
  const escaped = key.replace(/"/g, '\\"');
  return `${parentPath}["${escaped}"]`;
}
