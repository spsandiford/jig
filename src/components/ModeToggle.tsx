import type { DiffMode } from '../hooks/useDiff';

export interface ModeToggleProps {
  mode: DiffMode;
  onChange: (mode: DiffMode) => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  const segments: Array<{ id: DiffMode; label: string }> = [
    { id: 'value', label: 'Value' },
    { id: 'structure', label: 'Structure' },
  ];
  return (
    <div
      data-testid="mode-toggle"
      className={`flex items-center rounded bg-[#3e3e42] p-0.5 gap-0.5 ${disabled ? 'opacity-40' : ''}`}
    >
      {segments.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          data-testid={`mode-toggle-${id}`}
          onClick={() => { if (!disabled) onChange(id); }}
          disabled={disabled}
          aria-pressed={mode === id}
          className={`h-6 px-3 rounded text-xs transition-colors ${
            mode === id
              ? 'bg-[#0078d4] text-white'
              : 'text-[#858585] hover:text-[#d4d4d4] hover:bg-[#2d2d30]'
          } disabled:cursor-not-allowed focus-visible:ring-1 focus-visible:ring-[#0078d4] focus-visible:outline-none`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
