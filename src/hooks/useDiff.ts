import { useState, useCallback } from 'react';
import { diff as jdpDiff } from 'jsondiffpatch';

export type DiffMode = 'value' | 'structure';

export interface UseDiffReturn {
  delta: Record<string, unknown> | undefined;
  mode: DiffMode;
  setMode: (m: DiffMode) => void;
  compare: (leftJson: string, rightJson: string) => void; // throws SyntaxError on invalid JSON
  reset: () => void;
  diffActive: boolean;
}

/**
 * React hook that holds the jsondiffpatch delta, current diff mode, and diffActive flag.
 *
 * - compare() parses both JSON strings, calls jsondiffpatch.diff(), and stores the delta.
 *   Throws SyntaxError to the caller on invalid JSON — caller is responsible for try/catch.
 * - reset() clears delta and diffActive (D-04).
 * - setMode() switches between 'value' and 'structure' without clearing delta (D-05).
 *
 * Identical-document delta: jsondiffpatch returns undefined when inputs are semantically equal.
 * In this case delta === undefined but diffActive === true (compare was triggered — Pitfall 5).
 */
export function useDiff(): UseDiffReturn {
  const [delta, setDelta] = useState<Record<string, unknown> | undefined>(undefined);
  const [mode, setModeState] = useState<DiffMode>('value');
  const [diffActive, setDiffActive] = useState(false);

  const compare = useCallback((leftJson: string, rightJson: string) => {
    // Throws SyntaxError on invalid JSON — propagated to caller.
    const leftParsed = JSON.parse(leftJson);
    const rightParsed = JSON.parse(rightJson);
    const d = jdpDiff(leftParsed, rightParsed);
    setDelta(d as Record<string, unknown> | undefined);
    setDiffActive(true);
  }, []);

  const reset = useCallback(() => {
    setDelta(undefined);
    setDiffActive(false);
  }, []);

  const setMode = useCallback((m: DiffMode) => {
    setModeState(m);
  }, []);

  return { delta, mode, setMode, compare, reset, diffActive };
}
