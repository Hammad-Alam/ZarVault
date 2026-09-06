import { useState } from "react";
import { formatGold, formatPKR, roundGold } from "../lib/utils";

interface Props {
  marketPrice: number | null;
  onGetQuote: (
    side: "BUY" | "SELL",
    inputType: "PKR" | "GOLD",
    amount: number,
  ) => Promise<void>;
  loading: boolean;
  disabled: boolean;
}

export function TradeForm({
  marketPrice,
  onGetQuote,
  loading,
  disabled,
}: Props) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [inputType, setInputType] = useState<"PKR" | "GOLD">("PKR");
  const [inputAmount, setInputAmount] = useState<string>("");
  const [isInputMenuOpen, setIsInputMenuOpen] = useState(false);

  const calculatedAmount =
    marketPrice && inputAmount
      ? inputType === "PKR"
        ? roundGold(parseFloat(inputAmount) / (marketPrice * 1.1))
        : parseFloat(inputAmount) * (marketPrice * 0.9)
      : 0;

  const handleGetQuote = async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) return;
    await onGetQuote(side, inputType, parseFloat(inputAmount));
  };

  return (
    <div className="surface p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Trade gold</p>
          <h2 className="mt-2 text-xl font-semibold text-[#1A1F1B]">
            Make your move
          </h2>
        </div>
        <span className="rounded-full bg-[#F0F5E8] px-3 py-1 text-xs font-semibold text-[#537629]">
          24K
        </span>
      </div>

      {/* Side toggle */}
      <div className="mt-6 grid grid-cols-2 rounded-xl bg-[#F2F6F4] p-1">
        <button
          onClick={() => setSide("BUY")}
          className={`rounded-lg py-2.5 text-sm font-semibold transition ${
            side === "BUY"
              ? "bg-[#0D4A46] text-white shadow-sm"
              : "text-[#66736E] hover:text-[#0D4A46]"
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide("SELL")}
          className={`rounded-lg py-2.5 text-sm font-semibold transition ${
            side === "SELL"
              ? "bg-[#0D4A46] text-white shadow-sm"
              : "text-[#66736E] hover:text-[#0D4A46]"
          }`}
        >
          SELL
        </button>
      </div>

      {/* Input section */}
      <div className="mt-7">
        <p className="text-sm font-medium text-[#1A1F1B]">I want to</p>
        <p className="mt-1 text-sm text-[#66736E]">
          {side === "BUY"
            ? "Enter the amount of PKR you want to spend."
            : "Enter the amount of gold you want to sell."}
        </p>
        <div className="mt-4 flex gap-2">
          <div className="relative w-32">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isInputMenuOpen}
              onClick={() => setIsInputMenuOpen((open) => !open)}
              className="flex min-h-[48px] w-full items-center justify-between rounded-lg border border-[#C9D8D2] bg-white px-3 text-sm font-semibold text-[#0D4A46]"
            >
              <span>{inputType === "PKR" ? "PKR" : "Gold (g)"}</span>
              <span
                aria-hidden="true"
                className={`text-xs transition-transform ${isInputMenuOpen ? "rotate-180" : ""}`}
              >
                ⌄
              </span>
            </button>
            {isInputMenuOpen && (
              <div
                role="listbox"
                aria-label="Input currency"
                className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full overflow-hidden rounded-xl border border-[#C9D8D2] bg-white p-1 shadow-[0_12px_30px_rgba(13,74,70,0.14)]"
              >
                {[
                  {
                    value: "PKR" as const,
                    label: "PKR",
                    hint: "Pakistani rupees",
                  },
                  {
                    value: "GOLD" as const,
                    label: "Gold (g)",
                    hint: "Gold in grams",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={inputType === option.value}
                    onClick={() => {
                      setInputType(option.value);
                      setIsInputMenuOpen(false);
                    }}
                    className={`block w-full rounded-lg px-3 py-2.5 text-left ${inputType === option.value ? "bg-[#E9F2F0] text-[#0D4A46]" : "text-[#1A1F1B] hover:bg-[#F2F6F4]"}`}
                  >
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-normal text-[#66736E]">
                      {option.hint}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder={inputType === "PKR" ? "20,000" : "0.50000"}
            min="0"
            step="any"
            className="min-w-0 flex-1 rounded-lg border border-[#C9D8D2] px-3 py-3 text-lg text-[#1A1F1B] placeholder:text-[#A5B2AD]"
          />
        </div>
      </div>

      {/* Display calculated amount */}
      <div className="mt-4 min-h-5">
        <p className="text-sm text-[#66736E]">
          Estimated receive:{" "}
          {inputType === "PKR"
            ? formatGold(calculatedAmount)
            : formatPKR(calculatedAmount)}
        </p>
      </div>

      {/* Get quote button */}
      <button
        onClick={handleGetQuote}
        disabled={loading || disabled || !inputAmount}
        className="primary-button mt-5 w-full"
      >
        {loading ? "Getting quote..." : "Get quote"}
      </button>
    </div>
  );
}
