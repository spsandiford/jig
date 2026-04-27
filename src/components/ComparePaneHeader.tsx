import { useRef } from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface ComparePaneHeaderProps {
  label: 'Left' | 'Right';
  onLoad: (text: string) => void;
  disabled?: boolean;
}

export function ComparePaneHeader({ label, onLoad, disabled }: ComparePaneHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    if (disabled) return;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? '';
      onLoad(text);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <div
      data-testid={`compare-pane-header-${label.toLowerCase()}`}
      className="flex items-center justify-between h-7 px-2 bg-[#252526] border-b border-[#3e3e42] shrink-0"
    >
      <span className="text-xs font-semibold text-[#d4d4d4]">{label}</span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClick}
              disabled={disabled}
              data-testid={`compare-pane-open-${label.toLowerCase()}`}
              className="h-6 w-6 p-0 text-[#d4d4d4] hover:bg-[#2d2d30] hover:text-[#d4d4d4] focus-visible:ring-1 focus-visible:ring-[#0078d4] focus-visible:outline-none disabled:opacity-40"
            >
              <FolderOpen className="w-4 h-4" />
            </Button>
          }
        />
        <TooltipContent>Load JSON file into this pane</TooltipContent>
      </Tooltip>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json,text/plain"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
