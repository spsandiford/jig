export interface ExpressionInputProps {
  value: string;
  onChange: (val: string) => void;
  onRun: () => void;
  disabled?: boolean;
}

export function ExpressionInput({ value, onChange, onRun, disabled }: ExpressionInputProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onRun();
    }
  }

  return (
    <textarea
      data-testid="expression-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="."
      disabled={disabled}
      className="w-full min-h-[80px] resize-none bg-[#252526] text-[#d4d4d4] font-mono text-[13px] leading-normal p-4 border border-[#3e3e42] rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-[#0078d4] placeholder-[#858585] disabled:opacity-40"
    />
  );
}
