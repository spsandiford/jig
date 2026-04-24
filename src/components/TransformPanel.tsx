import { useEffect, useState, useCallback } from 'react';
import { ExpressionInput } from './ExpressionInput';
import { RunButton } from './RunButton';
import { OutputPane } from './OutputPane';
import { useJqWorker } from '../hooks/useJqWorker';
import { useJsonDocument } from '../hooks/useJsonDocument';

export interface TransformPanelProps {
  rawJson?: string;
  onOutputChange?: (output: string | null) => void;
}

export function TransformPanel({ rawJson: rawJsonProp, onOutputChange }: TransformPanelProps) {
  const [expr, setExpr] = useState('');
  const { engineReady, running, output, error, run } = useJqWorker();
  const fallback = useJsonDocument();
  const rawJson = rawJsonProp ?? fallback.rawJson;

  const handleRun = useCallback(() => {
    if (!expr.trim()) return;
    run(expr, rawJson);
  }, [expr, rawJson, run]);

  useEffect(() => {
    onOutputChange?.(output);
  }, [output, onOutputChange]);

  const hasExpression = expr.trim().length > 0;

  return (
    <div data-testid="transform-panel" className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="shrink-0 p-4">
        <div className="text-xs text-[#858585] mb-2">jq expression</div>
        <ExpressionInput
          value={expr}
          onChange={setExpr}
          onRun={handleRun}
          disabled={!engineReady}
        />
        <div className="flex items-center gap-3 mt-3">
          <RunButton
            onClick={handleRun}
            engineReady={engineReady}
            running={running}
            hasExpression={hasExpression}
          />
        </div>
      </div>
      <div className="h-px bg-[#3e3e42]" />
      <OutputPane output={output} error={error} engineReady={engineReady} />
    </div>
  );
}
