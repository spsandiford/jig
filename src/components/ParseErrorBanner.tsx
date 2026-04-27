export interface ParseErrorBannerProps {
  message: string;
}

export function ParseErrorBanner({ message }: ParseErrorBannerProps) {
  return (
    <div
      data-testid="parse-error-banner"
      className="mx-3 mt-2 p-3 pl-4 border-l-[3px] border-[#f44747] bg-[#1e1e1e]"
    >
      <div className="text-[12px] font-semibold text-[#f44747] mb-1">
        Invalid JSON
      </div>
      <div className="text-[12px] text-[#d4d4d4] font-mono whitespace-pre-wrap">
        {message}
      </div>
    </div>
  );
}
