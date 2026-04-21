import { Badge } from '@/components/ui/badge';

export interface StatusBarProps {
  selectedPath: string | null;
  errorCount: number;
  /**
   * rawJson is optional; when omitted the "Valid JSON" indicator still
   * requires errorCount === 0 to render. When provided, the indicator
   * additionally requires rawJson to be non-empty.
   */
  rawJson?: string;
}

export function StatusBar({ selectedPath, errorCount, rawJson }: StatusBarProps) {
  const pathText =
    selectedPath ?? 'Select a node in the Tree view to see its path';

  const hasContent = rawJson === undefined ? true : rawJson.trim().length > 0;

  return (
    <div
      data-testid="statusbar"
      className="flex items-center justify-between h-7 px-3 bg-[#252526] border-t border-[#3e3e42] shrink-0"
    >
      <span className="text-xs text-[#858585] font-mono truncate max-w-[70%]">
        {pathText}
      </span>

      {errorCount > 0 ? (
        <Badge
          variant="destructive"
          className="h-4 px-1.5 text-[10px] bg-[#f44747] text-white rounded-sm border-0"
        >
          {errorCount} {errorCount === 1 ? 'error' : 'errors'}
        </Badge>
      ) : hasContent ? (
        <span className="text-[10px] text-[#4ec9b0]">Valid JSON</span>
      ) : (
        <span />
      )}
    </div>
  );
}
