/**
 * Sanitize a jq-web error for display to the user.
 *
 * jq-web throws Error instances whose `.message` includes Emscripten runtime
 * noise: a "Non-zero exit code: N" prefix, followed by "jq: " prefixed stderr
 * lines. This function strips those prefixes, returns only the first
 * non-empty line, and falls back to a generic message when nothing remains.
 */
export function sanitizeJqError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg
    .replace(/^Non-zero exit code:\s*\d+\s*/i, '')
    .replace(/^jq:\s*/i, '')
    .split('\n')[0]
    .trim() || 'jq expression failed';
}
