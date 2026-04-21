export interface StatusBarProps {
  selectedPath: string | null;
  errorCount: number;
}

// Stub — Plan 03 replaces this body with JSONPath breadcrumb + error/valid badge.
export function StatusBar({ selectedPath, errorCount }: StatusBarProps) {
  return (
    <div
      data-testid="statusbar-stub"
      className="flex items-center justify-between h-7 px-3 bg-[#252526] border-t border-[#3e3e42] shrink-0 text-xs text-[#858585] font-mono"
    >
      <span>{selectedPath ?? 'Select a node in the Tree view to see its path'}</span>
      <span>{errorCount > 0 ? `${errorCount} error${errorCount === 1 ? '' : 's'}` : ''}</span>
    </div>
  );
}
