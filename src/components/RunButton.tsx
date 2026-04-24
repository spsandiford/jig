import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface RunButtonProps {
  onClick: () => void;
  engineReady: boolean;
  running: boolean;
  hasExpression: boolean;
}

export function RunButton({ onClick, engineReady, running, hasExpression }: RunButtonProps) {
  const isDisabled = !engineReady || running || !hasExpression;

  let icon: React.ReactNode;
  let label: string;

  if (!engineReady) {
    icon = <Loader2 className="w-4 h-4 animate-spin" />;
    label = 'Loading…';
  } else if (running) {
    icon = <Loader2 className="w-4 h-4 animate-spin" />;
    label = 'Run';
  } else {
    icon = <Zap className="w-3.5 h-3.5" />;
    label = 'Run';
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-testid="run-button"
            type="button"
            variant="default"
            size="sm"
            onClick={onClick}
            disabled={isDisabled}
            className="h-7 px-3 gap-1.5 text-xs bg-[#0078d4] hover:bg-[#1188e4] text-white focus-visible:ring-1 focus-visible:ring-[#0078d4] focus-visible:outline-none disabled:opacity-40"
          >
            {icon}
            {label}
          </Button>
        }
      />
      <TooltipContent>Run jq expression (Ctrl+Enter)</TooltipContent>
    </Tooltip>
  );
}
