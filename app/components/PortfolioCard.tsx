import { formatGold, formatPKR } from "../lib/utils";

interface Props {
  wallet: { pkr: number; goldGrams: number };
}

export function PortfolioCard({ wallet }: Props) {
  return (
    <div className="surface p-6">
      <p className="eyebrow mb-5">Your portfolio</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-sm text-[#66736E]">PKR balance</p>
          <p className="mt-2 text-2xl font-semibold text-[#1A1F1B]">
            {formatPKR(wallet.pkr)}
          </p>
        </div>
        <div className="border-t border-[#DFE8E4] pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="text-sm text-[#66736E]">Gold holdings</p>
          <p className="mt-2 text-2xl font-semibold text-[#0D4A46]">
            {formatGold(wallet.goldGrams)}
          </p>
        </div>
      </div>
    </div>
  );
}
