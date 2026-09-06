import {
  API_TIMEOUT_MS,
  CACHE_DURATION_MS,
  GOLDPRICE_API_URL,
  PAKGOLD_GOLD_SPOT_URL,
  PAKGOLD_GOLD_SPOT_HTTP_URL,
  PAKGOLD_PAGE_URL,
  PAKGOLD_USD_PKR_URL,
  PRICE_PROVIDER_VERSION,
} from "@/app/config/constants";
import { load } from "cheerio";
import { supabase } from "../supabase";
import { MarketPrice } from "./types";

class PricingService {
  // Get trusted market price with caching and fallback
  async getTrustedPrice(): Promise<MarketPrice> {
    // 1. Try to get valid cached price
    const cached = await this.getCachedPrice();
    if (cached?.isTrusted) {
      return cached;
    }

    // 2. Try primary source (PakGold)
    try {
      const html = await this.fetchPakGoldPage();
      const marketPrice = await this.normalizePakGold(html);
      await this.cachePrice(marketPrice);
      return marketPrice;
    } catch (e) {
      console.warn("PakGold fetch failed:", e);
    }

    // 3. Try fallback source (GoldPrice.org)
    try {
      const fallbackResponse = await this.fetchWithTimeout(
        GOLDPRICE_API_URL,
        API_TIMEOUT_MS,
      );
      const fallback = await fallbackResponse.json();
      const marketPrice = this.normalizeGoldPrice(fallback);
      await this.cachePrice(marketPrice);
      return marketPrice;
    } catch (e) {
      console.error("All pricing sources failed:", e);
    }

    // 4. Both failed - return untrusted
    return {
      pricePkrPerGram: 0,
      source: "Unknown",
      fetchedAt: new Date(),
      freshnessSeconds: 0,
      isTrusted: false,
    };
  }

  // Calculate buy price with markup and optional guardrail
  async getBuyPrice(marketPrice: number): Promise<number> {
    const markup = marketPrice * 1.1;

    // Get guardrail from config
    const { data } = await supabase
      .from("guardrail_config")
      .select("buy_price_guardrail_pkr")
      .single();

    const guardrailValue = data?.buy_price_guardrail_pkr;

    return guardrailValue ? Math.max(markup, guardrailValue) : markup;
  }

  // Calculate sell price with discount
  async getSellPrice(marketPrice: number): Promise<number> {
    return marketPrice * 0.9;
  }

  // Private helpers

  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "text/html,application/json" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchPakGoldPage(): Promise<string> {
    const response = await this.fetchWithTimeout(
      PAKGOLD_PAGE_URL,
      API_TIMEOUT_MS,
    );
    const html = await response.text();
    if (!html.trim()) throw new Error("Empty PakGold response");
    return html;
  }

  private async normalizePakGold(html: string): Promise<MarketPrice> {
    const document = load(html);
    const livePrice = document("#livePerGram");
    const goldType = livePrice.closest("form").find(
      '#goldType option[value="24"]',
    );

    const sourceScript = document("script")
      .toArray()
      .map((script) => document(script).html() || "")
      .join("\n");

    if (
      !livePrice.length ||
      !goldType.length ||
      !sourceScript.includes(PAKGOLD_GOLD_SPOT_URL) ||
      !sourceScript.includes(PAKGOLD_USD_PKR_URL)
    ) {
      throw new Error("Invalid PakGold 24K markup");
    }

    const [goldResponse, exchangeResponse] = await Promise.all([
      this.fetchPakGoldGoldSpot(),
      this.fetchWithTimeout(PAKGOLD_USD_PKR_URL, API_TIMEOUT_MS),
    ]);
    const goldData = await goldResponse.json();
    const exchangeData = await exchangeResponse.json();
    const goldUsd = Number(goldData?.price);
    const usdToPkr = Number(exchangeData?.rates?.PKR);
    const price = (goldUsd * usdToPkr) / 31.1035;

    if (
      !Number.isFinite(goldUsd) ||
      goldUsd <= 0 ||
      !Number.isFinite(usdToPkr) ||
      usdToPkr <= 0 ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      throw new Error("Invalid PakGold live price value");
    }

    return {
      pricePkrPerGram: price,
      source: "PakGold",
      fetchedAt: new Date(),
      freshnessSeconds: 0,
      isTrusted: true,
    };
  }

  private async fetchPakGoldGoldSpot(): Promise<Response> {
    try {
      return await this.fetchWithTimeout(PAKGOLD_GOLD_SPOT_URL, API_TIMEOUT_MS);
    } catch (error) {
      console.warn("PakGold HTTPS gold spot request failed; retrying HTTP:", error);
      return this.fetchWithTimeout(PAKGOLD_GOLD_SPOT_HTTP_URL, API_TIMEOUT_MS);
    }
  }

  private normalizeGoldPrice(data: any): MarketPrice {
    const price = parseFloat(data.PKR?.gram);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error("Invalid GoldPrice format");
    }

    return {
      pricePkrPerGram: price,
      source: "GoldPrice.org",
      fetchedAt: new Date(),
      freshnessSeconds: 0,
      isTrusted: true,
    };
  }

  private async getCachedPrice(): Promise<MarketPrice | null> {
    const { data } = await supabase
      .from("price_cache")
      .select("*")
      .eq("provider_version", PRICE_PROVIDER_VERSION)
      .gt("expires_at", new Date().toISOString())
      .order("fetched_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    const freshnessSeconds = Math.floor(
      (Date.now() - new Date(data.fetched_at).getTime()) / 1000,
    );

    return {
      pricePkrPerGram: parseFloat(data.price_pkr_per_gram),
      source: data.source,
      fetchedAt: new Date(data.fetched_at),
      freshnessSeconds,
      isTrusted: true,
    };
  }

  private async cachePrice(price: MarketPrice): Promise<void> {
    const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);

    await supabase.from("price_cache").insert({
      price_pkr_per_gram: price.pricePkrPerGram,
      source: price.source,
      provider_version: PRICE_PROVIDER_VERSION,
      fetched_at: price.fetchedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    });
  }
}

export const pricingService = new PricingService();
