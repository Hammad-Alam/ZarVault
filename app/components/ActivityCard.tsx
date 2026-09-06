import { useState } from "react";
import { formatGold, formatPKR } from "../lib/utils";

interface Props {
  trades: any[];
}

export function ActivityCard({ trades }: Props) {
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(trades.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleTrades = trades.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <section className="surface p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Activity</p>
          <h2 className="mt-2 text-xl font-semibold text-[#1A1F1B]">
            Recent trades
          </h2>
        </div>
        <span className="text-xs text-[#66736E]">
          {trades.length} {trades.length === 1 ? "trade" : "trades"}
        </span>
      </div>
      {trades.length === 0 ? (
        <div className="mt-6 rounded-xl bg-[#F2F6F4] p-5 text-sm text-[#66736E]">
          Your completed trades will appear here.
        </div>
      ) : (
        <div className="mt-5 divide-y divide-[#DFE8E4]">
          {visibleTrades.map((trade) => (
            <div
              key={trade.tradeId}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${trade.side === "BUY" ? "bg-[#F0F5E8] text-[#537629]" : "bg-[#E9F2F0] text-[#0D4A46]"}`}
                >
                  {trade.side}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-[#1A1F1B]">
                    {formatGold(trade.goldGrams)}
                  </p>
                  <p className="truncate text-xs text-[#66736E]">
                    {new Date(trade.completedAt).toLocaleString("en-PK", {
                      timeZone: "Asia/Karachi",
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[#1A1F1B]">
                  {formatPKR(trade.totalPKR)}
                </p>
                <p className="text-xs text-[#537629]">Completed</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {trades.length > pageSize && (
        <div className="mt-5 flex items-center justify-between border-t border-[#DFE8E4] pt-4">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage === 1}
            className="secondary-button min-h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <div
            className="flex items-center gap-1.5"
            aria-label="Activity pages"
          >
            {Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  aria-current={currentPage === pageNumber ? "page" : undefined}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold ${currentPage === pageNumber ? "bg-[#0D4A46] text-white" : "text-[#66736E] hover:bg-[#E9F2F0] hover:text-[#0D4A46]"}`}
                >
                  {pageNumber}
                </button>
              ),
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(pageCount, current + 1))
            }
            disabled={currentPage === pageCount}
            className="secondary-button min-h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
