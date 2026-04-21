import { jsonrepair } from 'jsonrepair';

/**
 * Pretty-print JSON with 2-space indent.
 * Throws SyntaxError if `raw` is not valid JSON — caller is responsible for
 * catching and leaving the editor content unchanged.
 */
export function format(raw: string): string {
  return JSON.stringify(JSON.parse(raw), null, 2);
}

/**
 * Collapse JSON to a single line (no whitespace).
 * Throws SyntaxError if `raw` is not valid JSON.
 */
export function minify(raw: string): string {
  return JSON.stringify(JSON.parse(raw));
}

/**
 * Attempt to repair malformed JSON (trailing commas, single quotes,
 * unquoted keys, LLM output). Throws `JSONRepairError` from `jsonrepair`
 * if the input is too broken to recover.
 */
export function repair(raw: string): string {
  return jsonrepair(raw);
}

/**
 * Probe whether `raw` is already valid JSON. Used by the Toolbar to
 * show the "JSON is already valid — nothing to repair." message.
 */
export function isValidJson(raw: string): boolean {
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
}
