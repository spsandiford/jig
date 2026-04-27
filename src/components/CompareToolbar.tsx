import { GitCompare, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ModeToggle } from './ModeToggle';
import type { DiffMode } from '../hooks/useDiff';

export interface CompareToolbarProps {
  mode: DiffMode;
  onModeChange: (m: DiffMode) => void;
  diffActive: boolean;
  onCompare: () => void;
  onReset: () => void;
  compareDisabled: boolean;
  compareDisabledReason: 'both-empty' | 'one-empty' | 'invalid-json' | null;
}

function compareTooltipFor(
  reason: CompareToolbarProps['compareDisabledReason'],
): string {
  if (reason === 'both-empty')   return 'Paste or load JSON into both panes to compare';
  if (reason === 'one-empty')    return 'Both panes need JSON to compare';
  if (reason === 'invalid-json') return 'Fix invalid JSON before comparing';
  return 'Compare documents';
}

export function CompareToolbar({
  mode,
  onModeChange,
  diffActive,
  onCompare,
  onReset,
  compareDisabled,
  compareDisabledReason,
}: CompareToolbarProps) {
  return (
    <div
      data-testid="compare-toolbar"
      className="flex items-center h-9 px-2 gap-2 bg-[#252526] border-b border-[#3e3e42] shrink-0"
    >
      <ModeToggle mode={mode} onChange={onModeChange} disabled={!diffActive} />

      <Separator orientation="vertical" className="h-5 mx-1 bg-[#3e3e42]" />

      <div className="flex-1" />

      {diffActive ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
                data-testid="compare-reset-button"
                className="h-7 px-3 gap-1.5 text-xs text-[#d4d4d4] hover:bg-[#2d2d30] hover:text-[#d4d4d4] focus-visible:ring-1 focus-visible:ring-[#0078d4] focus-visible:outline-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            }
          />
          <TooltipContent>Clear diff and re-enable editing</TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onCompare}
                disabled={compareDisabled}
                data-testid="compare-button"
                className="h-7 px-3 gap-1.5 text-xs bg-[#0078d4] hover:bg-[#1188e4] text-white focus-visible:ring-1 focus-visible:ring-[#0078d4] focus-visible:outline-none disabled:opacity-40"
              >
                <GitCompare className="w-3.5 h-3.5" />
                Compare
              </Button>
            }
          />
          <TooltipContent>{compareTooltipFor(compareDisabledReason)}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
