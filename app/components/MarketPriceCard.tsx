import { formatPKR } from "../lib/utils";

interface Props {
  price: number | null;
  source: string;
  freshnessSeconds: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function MarketPriceCard({
  price,
  source,
  freshnessSeconds,
  loading,
  error,
  onRetry,
}: Props) {
  if (error) {
    return (
      <div className="surface p-6 sm:p-8" role="alert">
        <p className="eyebrow mb-3">Market reference</p>
        <h2 className="text-2xl font-semibold text-[#0D4A46]">
          Pricing unavailable
        </h2>
        <p className="mt-2 max-w-xl text-sm text-[#66736E]">
          Live pricing is temporarily unavailable. Trading is paused until a
          trusted source responds.
        </p>
        <button onClick={onRetry} className="secondary-button mt-5">
          Try again
        </button>
      </div>
    );
  }

  if (loading || !price) {
    return (
      <div className="surface min-h-48 animate-pulse p-6 sm:p-8">
        <div className="h-3 w-28 rounded bg-[#E9F2F0]" />
        <div className="mt-5 h-12 w-64 rounded bg-[#E9F2F0]" />
        <div className="mt-5 h-3 w-48 rounded bg-[#E9F2F0]" />
      </div>
    );
  }

  return (
    <div className="surface p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Market overview</p>
          <p className="text-2xl font-semibold text-[#1A1F1B]">24K Gold</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#E9F2F0] px-3 py-1.5 text-xs font-semibold text-[#0D4A46]">
          <span className="h-2 w-2 rounded-full bg-[#8CCB50]" /> Live
        </span>
      </div>
      <p className="mt-7 text-4xl font-semibold tracking-tight text-[#0D4A46] sm:text-5xl">
        {formatPKR(price)}
        <span className="ml-2 text-lg font-medium text-[#66736E]">/ gram</span>
      </p>
      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#DFE8E4] pt-4 text-sm text-[#66736E]">
        <span>
          Source: <strong className="text-[#1A1F1B]">{source}</strong>
        </span>
        <span>
          Updated{" "}
          {freshnessSeconds === 0 ? "just now" : `${freshnessSeconds}s ago`}
        </span>
      </div>
    </div>
  );
}
