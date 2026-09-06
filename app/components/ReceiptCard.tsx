import { formatGold, formatPKR } from "../lib/utils";

interface Props {
  trade: any;
  wallet: any;
  onDone: () => void;
}

export function ReceiptCard({ trade, wallet, onDone }: Props) {
  return (
    <div className="surface fade-in p-6 sm:p-8">
      <div className="border-b border-[#DFE8E4] pb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F5E8] text-xl text-[#537629]">
          ✓
        </div>
        <p className="eyebrow mt-5">Trade completed</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#0D4A46]">
          {trade.side === "BUY" ? "Gold purchased" : "Gold sold"}
        </h2>
        <p className="mt-2 text-3xl font-semibold text-[#1A1F1B]">
          {formatGold(trade.goldGrams)}
        </p>
      </div>

      {/* Trade details */}
      <div className="grid gap-4 py-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-[#66736E]">
            Amount {trade.side === "BUY" ? "paid" : "received"}
          </p>
          <p className="mt-1 font-semibold">{formatPKR(trade.totalPKR)}</p>
        </div>
        <div>
          <p className="text-sm text-[#66736E]">Execution price</p>
          <p className="mt-1 font-semibold">
            {formatPKR(trade.executionPrice)}/g
          </p>
        </div>
      </div>

      {/* IDs and timestamp */}
      <div className="space-y-2 border-t border-[#DFE8E4] pt-5 text-xs text-[#66736E]">
        <p>
          Reference:{" "}
          <span className="font-mono text-[#1A1F1B]">
            ZV-{trade.tradeId.slice(0, 8).toUpperCase()}
          </span>
        </p>
        <p>Completed: {new Date(trade.completedAt).toLocaleString()}</p>
        <p>
          Status: <span className="font-semibold text-[#537629]">Settled</span>
        </p>
      </div>

      {/* Updated balances */}
      <div className="mt-6 rounded-xl bg-[#F2F6F4] p-4">
        <p className="eyebrow mb-3">Updated balances</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>PKR Wallet</span>
            <span className="font-semibold">{formatPKR(wallet.pkr)}</span>
          </div>
          <div className="flex justify-between">
            <span>Gold Holdings</span>
            <span className="font-semibold">
              {formatGold(wallet.goldGrams)}
            </span>
          </div>
        </div>
      </div>

      {/* Done button */}
      <button onClick={onDone} className="primary-button mt-6 w-full">
        Done
      </button>
    </div>
  );
}
