import { useState, useEffect } from "react";
import * as api from "../lib/api";

export function useTrading() {
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [priceSource, setPriceSource] = useState<string>("");
  const [priceFreshnessSeconds, setPriceFreshnessSeconds] = useState(0);
  const [canTrade, setCanTrade] = useState(true);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const [wallet, setWallet] = useState({ pkr: 0, goldGrams: 0 });
  const [inventory, setInventory] = useState({ pkr: 0, goldGrams: 0 });
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [currentQuote, setCurrentQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [lastTrade, setLastTrade] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);

  // Fetch market price on load
  useEffect(() => {
    fetchMarketPrice();
    fetchBalances();
    restoreQuote();
    fetchActivity();
  }, []);

  const fetchMarketPrice = async () => {
    setPriceLoading(true);
    setPriceError(null);
    try {
      const data = await api.fetchMarketPrice();
      setMarketPrice(data.pricePkrPerGram);
      setPriceSource(data.source);
      setPriceFreshnessSeconds(data.freshnessSeconds ?? 0);
      setCanTrade(data.canTrade ?? true);
      if (!data.canTrade) {
        setPriceError("Price unavailable - Trading paused");
      }
    } catch (e: any) {
      setPriceError(e.message);
      setCanTrade(false);
    } finally {
      setPriceLoading(false);
    }
  };

  const fetchBalances = async () => {
    setBalanceLoading(true);
    try {
      const data = await api.fetchBalances();
      setWallet({
        pkr: data.wallet.pkr,
        goldGrams: data.wallet.goldGrams,
      });
      setInventory({
        pkr: data.platformInventory.pkr,
        goldGrams: data.platformInventory.goldGrams,
      });
    } catch (e: any) {
      console.error("Failed to fetch balances:", e);
    } finally {
      setBalanceLoading(false);
    }
  };

  const restoreQuote = async () => {
    try {
      const quote = await api.fetchLatestQuote();
      if (quote) setCurrentQuote(quote);
    } catch (e) {
      console.error("Failed to restore quote:", e);
    }
  };

  const fetchActivity = async () => {
    setActivityLoading(true);
    try {
      setActivity(await api.fetchTradeHistory());
    } catch (e) {
      console.error("Failed to fetch activity:", e);
    } finally {
      setActivityLoading(false);
    }
  };

  const createQuote = async (
    side: "BUY" | "SELL",
    inputType: "PKR" | "GOLD",
    inputAmount: number,
  ) => {
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const quote = await api.createQuote(side, inputType, inputAmount);
      setCurrentQuote(quote);
      return quote;
    } catch (e: any) {
      setQuoteError(e.message);
      throw e;
    } finally {
      setQuoteLoading(false);
    }
  };

  const confirmTrade = async (quoteId: string) => {
    setSettlementLoading(true);
    setSettlementError(null);
    try {
      const trade = await api.confirmTrade(quoteId);
      setLastTrade(trade);
      setCurrentQuote(null);
      await fetchBalances();
      await fetchActivity();
      return trade;
    } catch (e: any) {
      setSettlementError(e.message);
      throw e;
    } finally {
      setSettlementLoading(false);
    }
  };

  const reset = () => {
    setCurrentQuote(null);
    setLastTrade(null);
    setQuoteError(null);
    setSettlementError(null);
  };

  const markQuoteExpired = () => {
    setCurrentQuote((quote: any) => (quote ? { ...quote, status: "EXPIRED" } : quote));
    setSettlementError(null);
  };

  return {
    marketPrice,
    priceSource,
    priceFreshnessSeconds,
    canTrade,
    priceLoading,
    priceError,
    wallet,
    inventory,
    balanceLoading,
    currentQuote,
    quoteLoading,
    quoteError,
    lastTrade,
    activity,
    activityLoading,
    settlementLoading,
    settlementError,
    fetchMarketPrice,
    fetchBalances,
    createQuote,
    confirmTrade,
    reset,
    markQuoteExpired,
    restoreQuote,
  };
}
