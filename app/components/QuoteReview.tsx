import { formatGold, formatPKR } from "../lib/utils";
import { QuoteCountdown } from "./QuoteCountdown";

interface Props {
  quote: any;
  onConfirm: () => Promise<void>;
  onExpired: () => void;
  onStartOver: () => void;
  loading: boolean;
  error: string | null;
}

export function QuoteReview({
  quote,
  onConfirm,
  onExpired,
  onStartOver,
  loading,
  error,
}: Props) {
  const isExpired =
    quote.status === "EXPIRED" ||
    Date.now() >= new Date(quote.expiresAt).getTime();

  return (
    <div
      className={`surface fade-in p-6 sm:p-7 ${isExpired ? "opacity-90" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">
            {isExpired ? "Quote expired" : "Locked quote"}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#1A1F1B]">
            {isExpired
              ? "This offer is no longer valid"
              : "Your price is secured"}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isExpired ? "bg-[#FBEDEA] text-[#A5483D]" : "bg-[#F0F5E8] text-[#537629]"}`}
        >
          {isExpired ? "Expired" : "Active"}
        </span>
      </div>

      {error && (
        <div
          className="mt-5 rounded-lg border border-[#E8C2BB] bg-[#FBEDEA] p-3 text-sm text-[#8F3E35]"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Quote details */}
      <div className="mt-7 grid gap-4 border-y border-[#DFE8E4] py-5 sm:grid-cols-2">
        <div>
          <span className="block text-sm text-[#66736E]">Side</span>
          <strong className="mt-1 block text-[#0D4A46]">
            {quote.side} · {formatGold(quote.goldGrams)}
          </strong>
        </div>
        <div>
          <span className="block text-sm text-[#66736E]">You pay</span>
          <strong className="mt-1 block text-[#1A1F1B]">
            {formatPKR(quote.totalPKR)}
          </strong>
        </div>
        <div>
          <span className="block text-sm text-[#66736E]">Execution price</span>
          <strong className="mt-1 block text-[#1A1F1B]">
            {formatPKR(quote.executionPrice)}/g
          </strong>
        </div>
        <div>
          <span className="block text-sm text-[#66736E]">Market reference</span>
          <strong className="mt-1 block text-[#1A1F1B]">
            {formatPKR(quote.marketPrice)}/g
          </strong>
        </div>
        <div>
          <span className="block text-sm text-[#66736E]">Source</span>
          <strong className="mt-1 block text-[#1A1F1B]">
            {quote.priceSource}
          </strong>
        </div>
        <div>
          <span className="block text-sm text-[#66736E]">You receive</span>
          <strong className="mt-1 block text-[#0D4A46]">
            {formatGold(quote.goldGrams)}
          </strong>
        </div>
      </div>

      {/* Countdown */}
      <div
        className={`rounded-xl p-4 mt-2 ${isExpired ? "bg-[#F6F7F6]" : "bg-[#F2F6F4]"}`}
      >
        <p className="text-sm font-medium text-[#66736E]">
          {isExpired ? "Your funds have not been charged." : "Quote expires in"}
        </p>
        {!isExpired && (
          <QuoteCountdown expiresAt={quote.expiresAt} onExpired={onExpired} />
        )}
        {isExpired && (
          <p className="mt-2 text-sm text-[#66736E]">
            Market prices may have changed. Get a new quote to continue.
          </p>
        )}
      </div>

      {/* Quote ID */}
      <p className="mt-5 text-xs text-[#66736E]">
        Quote reference:{" "}
        <span className="font-mono">
          {quote.quoteId.slice(0, 8).toUpperCase()}
        </span>
      </p>

      {/* Confirm button */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          onClick={isExpired ? onStartOver : onConfirm}
          disabled={loading}
          className="primary-button flex-1"
        >
          {loading
            ? "Confirming..."
            : isExpired
              ? "Get new quote"
              : "Confirm & pay"}
        </button>
      </div>
    </div>
  );
}
