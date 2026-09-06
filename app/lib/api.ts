import { API_BASE } from "../config/constants";

export async function fetchMarketPrice() {
  const res = await fetch(`${API_BASE}/market/price`);
  if (!res.ok) throw new Error("Failed to fetch price");
  return res.json();
}

export async function createQuote(
  side: "BUY" | "SELL",
  inputType: "PKR" | "GOLD",
  inputAmount: number,
) {
  console.log("CREATE QUOTE REQUEST:", {
    side,
    inputType,
    inputAmount,
  });
  const res = await fetch(`${API_BASE}/quotes/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ side, inputType, inputAmount }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create quote");
  }

  return res.json();
}

export async function confirmTrade(quoteId: string) {
  const res = await fetch(`${API_BASE}/trades/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quoteId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to confirm trade");
  }

  return res.json();
}

export async function fetchBalances() {
  const res = await fetch(`${API_BASE}/balances`);
  if (!res.ok) throw new Error("Failed to fetch balances");
  return res.json();
}
