"use client";

import { useEffect, useState } from "react";
import { useTrading } from "./hooks/useTrading";
import { MarketPriceCard } from "./components/MarketPriceCard";
import { PortfolioCard } from "./components/PortfolioCard";
import { TradeForm } from "./components/TradeForm";
import { QuoteReview } from "./components/QuoteReview";
import { ReceiptCard } from "./components/ReceiptCard";
import { ActivityCard } from "./components/ActivityCard";
import { Toast } from "./components/Toast";

export default function Home() {
  const trading = useTrading();
  const [greeting, setGreeting] = useState("Welcome back");
  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening",
    );
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    const messages: Record<string, string> = {
      "Insufficient PKR wallet": "You don't have enough PKR for this purchase.",
      "Insufficient gold holdings": "You don't have enough gold for this sale.",
      "Insufficient platform inventory":
        "This purchase exceeds available platform inventory.",
      "Quote has expired":
        "This quote expired. No funds were charged. Get a new quote to continue.",
      "Quote already settled": "This quote has already been completed.",
    };
    setToast({ type: "error", message: messages[message] ?? message });
  };

  const handleGetQuote = async (
    side: "BUY" | "SELL",
    inputType: "PKR" | "GOLD",
    amount: number,
  ) => {
    try {
      await trading.createQuote(side, inputType, amount);
      setToast({
        type: "success",
        message: "Quote generated. Your price is secured for 75 seconds.",
      });
    } catch (error) {
      console.error("Failed to create quote:", error);
      showError(error);
    }
  };

  const handleConfirmTrade = async () => {
    try {
      if (trading.currentQuote) {
        await trading.confirmTrade(trading.currentQuote.quoteId);
        setToast({ type: "success", message: "Trade completed successfully." });
      }
    } catch (error) {
      console.error("Failed to confirm trade:", error);
      showError(error);
    }
  };

  const handleQuoteExpired = () => {
    trading.markQuoteExpired();
    setToast({
      type: "warning",
      message: "Your quote expired. No funds were charged.",
    });
  };

  const handleStartOver = () => {
    trading.reset();
    setToast(null);
  };

  const handleDone = () => {
    trading.reset();
  };

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-10 border-b border-[#DFE8E4] bg-[#F9FAFA]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a
            href="#trade"
            className="flex items-center gap-3"
            aria-label="ZarVault home"
          >
            <img
              src="/Logo.jpg"
              alt="ZarVault"
              className="h-10 w-10 rounded-xl object-cover"
            />
            <div>
              <p className="text-lg font-semibold tracking-tight text-[#0D4A46]">
                ZarVault
              </p>
              <p className="hidden text-xs text-[#66736E] sm:block">
                Pure Gold, Instant Trust
              </p>
            </div>
          </a>
          <nav
            className="flex items-center gap-5 text-sm font-medium text-[#66736E]"
            aria-label="Primary navigation"
          >
            <a href="#trade" className="hover:text-[#0D4A46]">
              Trade
            </a>
            <a href="#activity" className="hover:text-[#0D4A46]">
              Activity
            </a>
            <span
              className="hidden h-2 w-2 rounded-full bg-[#8CCB50] sm:block"
              title="System operational"
            />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="hero-section mb-8 max-w-2xl">
          <p className="eyebrow">{greeting}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0D4A46] sm:text-4xl">
            Trade with clarity.
          </h1>
          <p className="mt-3 text-base leading-7 text-[#66736E]">
            A calm, transparent way to buy and sell 24K gold at a server-locked
            price.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <MarketPriceCard
            price={trading.marketPrice}
            source={trading.priceSource}
            freshnessSeconds={trading.priceFreshnessSeconds}
            loading={trading.priceLoading}
            error={trading.priceError}
            onRetry={trading.fetchMarketPrice}
          />
          <div id="trade">
            <PortfolioCard wallet={trading.wallet} />
          </div>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            {!trading.currentQuote && !trading.lastTrade && (
              <TradeForm
                marketPrice={trading.marketPrice}
                onGetQuote={handleGetQuote}
                loading={trading.quoteLoading}
                disabled={!trading.canTrade}
              />
            )}
            {trading.currentQuote && !trading.lastTrade && (
              <QuoteReview
                quote={trading.currentQuote}
                onConfirm={handleConfirmTrade}
                onExpired={handleQuoteExpired}
                onStartOver={handleStartOver}
                loading={trading.settlementLoading}
                error={trading.settlementError || trading.quoteError}
              />
            )}
            {trading.lastTrade && (
              <ReceiptCard
                trade={trading.lastTrade}
                wallet={trading.wallet}
                onDone={handleDone}
              />
            )}
          </div>
          <div id="activity">
            <ActivityCard trades={trading.activity} />
          </div>
        </div>
      </main>
      <footer className="border-t border-[#DFE8E4] bg-white/70">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-5 text-sm text-[#66736E] sm:px-6">
          <span aria-hidden="true" className="text-base text-[#0D4A46]">
            🧠
          </span>
          <span>
            Made with thought by{" "}
            <strong className="font-semibold text-[#0D4A46]">Dev Hammad</strong>
          </span>
        </div>
      </footer>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
