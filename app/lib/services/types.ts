// Interface representing a market price entry
export interface MarketPrice {
  pricePkrPerGram: number;
  source: "PakGold" | "GoldPrice" | "Unknown";
  fetchedAt: Date;
  freshnesSeconds: number;
  isTrusted: boolean;
}

// Interface representing the quote configuration for the platform
export interface Quote {
  quoteId: string;
  side: "BUY" | "SELL";
  inputType: "PKR" | "GOLD";
  inputAmount: number;
  goldGrams: number;
  totalPKR: number;
  marketPrice: number;
  executionPrice: number;
  priceSource: string;
  createdAt: Date;
  expiresAt: Date;
  remainingSeconds: number;
  status: "ACTIVE" | "EXPIRED" | "SETTLED";
}

// Interface representing a trade executed on the platform
export interface Trade {
  tradeId: string;
  quoteId: string;
  side: "BUY" | "SELL";
  goldGrams: number;
  totalPKR: number;
  executionPrice: number;
  completedAt: Date;
}

// Interface representing a user's wallet
export interface Wallet {
  pkr: number;
  goldGrams: number;
  updatedAt: Date;
}

// Interface representing handling errors from the API
export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}
