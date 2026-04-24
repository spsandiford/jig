export interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      data-testid="error-banner"
      className="m-3 p-3 pl-4 border-l-[3px] border-[#f44747] bg-[#1e1e1e]"
    >
      <div className="text-[12px] font-semibold text-[#f44747] mb-1">
        Expression error
      </div>
      <div className="text-[12px] text-[#d4d4d4] font-mono whitespace-pre-wrap">
        {message}
      </div>
    </div>
  );
}
