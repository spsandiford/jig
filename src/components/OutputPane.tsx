import { Loader2 } from 'lucide-react';
import { ErrorBanner } from './ErrorBanner';

export interface OutputPaneProps {
  output: string | null;
  error: string | null;
  engineReady: boolean;
}

function formatOutput(raw: string): string {
  const trimmed = raw.trim();
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return trimmed;
  }
}

export function OutputPane({ output, error, engineReady }: OutputPaneProps) {
  return (
    <div data-testid="output-pane" className="flex-1 overflow-auto bg-[#1e1e1e]">
      {!engineReady ? (
        <div className="flex items-center gap-2 p-4 text-[#858585] text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          jq engine loading — Run will be available shortly
        </div>
      ) : error != null ? (
        <ErrorBanner message={error} />
      ) : output != null ? (
        <pre className="p-4 font-mono text-[13px] leading-normal text-[#d4d4d4] whitespace-pre-wrap">
          {formatOutput(output)}
        </pre>
      ) : (
        <div className="flex flex-col items-start gap-1 p-4 text-[#858585]">
          <div className="text-sm">No output yet</div>
          <div className="text-[12px]">Enter a jq expression above and click Run to see the result.</div>
        </div>
      )}
    </div>
  );
}
