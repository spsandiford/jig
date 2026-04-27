import { useState, useMemo, useEffect, useCallback } from 'react';
import { Decoration } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { CompareToolbar } from './CompareToolbar';
import type { CompareToolbarProps } from './CompareToolbar';
import { ComparePaneHeader } from './ComparePaneHeader';
import { ComparePaneEditor } from './ComparePaneEditor';
import { useDiff } from '../hooks/useDiff';
import { useEditorRef } from '../hooks/useEditorRef';
import {
  buildPaneDecorations,
  filterStructural,
  deltaToLineEntries,
  setDiffDecorations,
  diffDecorationsField,
  diffTheme,
} from '../lib/diffDecorations';

function parseProbe(json: string): string | null {
  const trimmed = json.trim();
  if (trimmed.length === 0) return null;
  try {
    JSON.parse(trimmed);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid JSON';
  }
}

export function ComparePanel() {
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const leftEditorRef = useEditorRef();
  const rightEditorRef = useEditorRef();
  const { delta, mode, setMode, compare, reset, diffActive } = useDiff();

  // Stable extensions — MUST NOT recreate per render (Pitfall 2)
  const extraExtensions: Extension[] = useMemo(
    () => [diffDecorationsField, diffTheme],
    [],
  );

  // Per-pane parse validation
  const leftParseError = useMemo(() => parseProbe(leftJson), [leftJson]);
  const rightParseError = useMemo(() => parseProbe(rightJson), [rightJson]);

  // Compare-disabled gating (UI-SPEC interaction states)
  const { compareDisabled, compareDisabledReason } = useMemo(() => {
    const leftEmpty = !leftJson.trim();
    const rightEmpty = !rightJson.trim();
    let reason: CompareToolbarProps['compareDisabledReason'];
    if (leftEmpty && rightEmpty) reason = 'both-empty';
    else if (leftEmpty || rightEmpty) reason = 'one-empty';
    else if (leftParseError || rightParseError) reason = 'invalid-json';
    else reason = null;
    return { compareDisabled: reason !== null, compareDisabledReason: reason };
  }, [leftJson, rightJson, leftParseError, rightParseError]);

  const handleCompare = useCallback(() => {
    if (compareDisabled) return;
    try {
      // Pretty-print both sides so deltaToLineEntries can match key paths to lines.
      const leftFormatted = JSON.stringify(JSON.parse(leftJson), null, 2);
      const rightFormatted = JSON.stringify(JSON.parse(rightJson), null, 2);
      setLeftJson(leftFormatted);
      setRightJson(rightFormatted);
      compare(leftFormatted, rightFormatted);
    } catch {
      // Defensive — gate should already prevent this. Parse banners already showing.
    }
  }, [leftJson, rightJson, compareDisabled, compare]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const handleLeftLoad = useCallback((text: string) => {
    if (diffActive) reset();
    setLeftJson(text);
  }, [diffActive, reset]);

  const handleRightLoad = useCallback((text: string) => {
    if (diffActive) reset();
    setRightJson(text);
  }, [diffActive, reset]);

  // Decoration dispatch — runs after delta/mode/diffActive/pane text changes
  useEffect(() => {
    const leftView = leftEditorRef.current?.view;
    const rightView = rightEditorRef.current?.view;
    if (!leftView || !rightView) return;

    if (!diffActive) {
      // Clear decorations on both sides
      leftView.dispatch({ effects: setDiffDecorations.of(Decoration.none) });
      rightView.dispatch({ effects: setDiffDecorations.of(Decoration.none) });
      return;
    }

    // diff is active — derive decorations from delta + mode
    const effectiveDelta = delta && mode === 'structure' ? filterStructural(delta) : delta;
    const leftEntries = deltaToLineEntries(effectiveDelta, leftJson, 'left');
    const rightEntries = deltaToLineEntries(effectiveDelta, rightJson, 'right');
    const leftDeco = buildPaneDecorations(leftView.state.doc, leftEntries);
    const rightDeco = buildPaneDecorations(rightView.state.doc, rightEntries);
    leftView.dispatch({ effects: setDiffDecorations.of(leftDeco) });
    rightView.dispatch({ effects: setDiffDecorations.of(rightDeco) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delta, mode, diffActive, leftJson, rightJson]);
  // Refs are not in deps (refs are stable; React rule).

  return (
    <div data-testid="compare-panel" className="flex flex-col h-full bg-[#1e1e1e]">
      <CompareToolbar
        mode={mode}
        onModeChange={setMode}
        diffActive={diffActive}
        onCompare={handleCompare}
        onReset={handleReset}
        compareDisabled={compareDisabled}
        compareDisabledReason={compareDisabledReason}
      />
      <div className="flex-1 flex flex-row overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
          <ComparePaneHeader label="Left" onLoad={handleLeftLoad} />
          <ComparePaneEditor
            value={leftJson}
            onChange={setLeftJson}
            editorRef={leftEditorRef}
            readOnly={diffActive}
            extraExtensions={extraExtensions}
            parseError={leftParseError}
            testId="compare-pane-left"
          />
        </div>
        <div className="w-px bg-[#3e3e42] shrink-0" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <ComparePaneHeader label="Right" onLoad={handleRightLoad} />
          <ComparePaneEditor
            value={rightJson}
            onChange={setRightJson}
            editorRef={rightEditorRef}
            readOnly={diffActive}
            extraExtensions={extraExtensions}
            parseError={rightParseError}
            testId="compare-pane-right"
          />
        </div>
      </div>
    </div>
  );
}
