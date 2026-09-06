import { supabaseAdmin } from "../supabaseAdmin";
import { pricingService } from "./pricingService";
import { DEMO_USER_ID } from "@/app/config/constants";

function parseDatabaseTimestamp(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  // Legacy timestamp columns were timezone-less, so interpret those values as UTC.
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

interface QuoteCreateParams {
  side: "BUY" | "SELL";
  inputType: "PKR" | "GOLD";
  inputAmount: number;
}

class TradeService {
  //Create a locked quote (75 seconds)
  async createQuote(params: QuoteCreateParams) {
    const { side, inputType, inputAmount } = params;

    // Validate input
    if (!["BUY", "SELL"].includes(side)) {
      throw new Error("Invalid side");
    }
    if (!["PKR", "GOLD"].includes(inputType)) {
      throw new Error("Invalid inputType");
    }
    if (inputAmount <= 0) {
      throw new Error("Amount must be positive");
    }

    // Get trusted market price
    const marketPrice = await pricingService.getTrustedPrice();
    if (!marketPrice.isTrusted) {
      throw new Error("PRICE_UNAVAILABLE");
    }

    // Determine execution price
    let executionPrice: number;
    if (side === "BUY") {
      executionPrice = await pricingService.getBuyPrice(
        marketPrice.pricePkrPerGram,
      );
    } else {
      executionPrice = await pricingService.getSellPrice(
        marketPrice.pricePkrPerGram,
      );
    }

    // Calculate gold grams and total PKR
    let goldGrams: number;
    let totalPKR: number;

    if (inputType === "PKR") {
      totalPKR = inputAmount;
      goldGrams = inputAmount / executionPrice;
    } else {
      goldGrams = inputAmount;
      totalPKR = inputAmount * executionPrice;
    }

    // Round to proper decimals
    goldGrams = Math.round(goldGrams * 10000) / 10000;
    totalPKR = Math.round(totalPKR * 100) / 100;

    // Get wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .single();

    if (walletError) throw new Error("WALLET_LOOKUP_FAILED");

    // Get platform inventory
    const { data: inventory, error: inventoryError } = await supabaseAdmin
      .from("platform_inventory")
      .select("*")
      .single();

    if (inventoryError) throw new Error("INVENTORY_LOOKUP_FAILED");

    // Validate balances
    if (side === "BUY") {
      if (!wallet || wallet.pkr_balance < totalPKR) {
        throw new Error("INSUFFICIENT_PKR");
      }
      if (!inventory || inventory.gold_grams < goldGrams) {
        throw new Error("INSUFFICIENT_INVENTORY");
      }
    } else {
      if (!wallet || wallet.gold_grams < goldGrams) {
        throw new Error("INSUFFICIENT_GOLD");
      }
    }

    // Create quote
    const expiresAt = new Date(Date.now() + 75 * 1000);

    const { data: quote, error: quoteError } = await supabaseAdmin
  .from("quotes")
  .insert({
    user_id: DEMO_USER_ID,
    side,
    input_type: inputType,
    input_amount: inputAmount,
    gold_grams: goldGrams,
    total_pkr: totalPKR,
    market_price: marketPrice.pricePkrPerGram,
    execution_price: executionPrice,
    price_source: marketPrice.source,
    price_fetched_at: marketPrice.fetchedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    status: "ACTIVE",
  })
  .select()
  .single();

console.log("=== QUOTE INSERT RESULT ===");
console.log("QUOTE:", quote);
console.log("QUOTE ERROR:", quoteError);


      console.log("TRADE SERVICE PARAMS:", {
        side,
        inputType,
        inputAmount,
      });

      if (quoteError) {
        console.error("QUOTE INSERT FAILED:", quoteError);
        throw new Error(`QUOTE_INSERT_FAILED: ${quoteError.message}`);
      }
      
      if (!quote) {
        throw new Error("QUOTE_NOT_CREATED");
      }

    return {
      quoteId: quote.id,
      side,
      inputType,
      inputAmount,
      goldGrams,
      totalPKR,
      marketPrice: marketPrice.pricePkrPerGram,
      executionPrice,
      priceSource: marketPrice.source,
      createdAt: new Date(),
      expiresAt,
      remainingSeconds: 75,
      status: "ACTIVE",
    };
  }

  //Confirm and settle a trade
  async confirmTrade(quoteId: string) {
    // Fetch quote
    const { data: quote } = await supabaseAdmin
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (!quote) {
      throw new Error("QUOTE_NOT_FOUND");
    }

    // Check status
    if (quote.status !== "ACTIVE") {
      if (quote.status === "SETTLED") {
        // Return existing trade (idempotent)
        const { data: existingTrade } = await supabaseAdmin
          .from("trades")
          .select("*")
          .eq("quote_id", quoteId)
          .single();

        if (existingTrade) {
          return {
            tradeId: existingTrade.id,
            quoteId: existingTrade.quote_id,
            side: existingTrade.side,
            goldGrams: parseFloat(existingTrade.gold_grams),
            totalPKR: parseFloat(existingTrade.total_pkr),
            executionPrice: parseFloat(existingTrade.price_per_gram),
            completedAt: parseDatabaseTimestamp(existingTrade.created_at),
          };
        }
      }
      throw new Error("ALREADY_SETTLED");
    }

    // Check expiry
    const now = new Date();
    const expiresAt = parseDatabaseTimestamp(quote.expires_at);
    if (now > expiresAt) {
      // Mark as expired
      await supabaseAdmin
        .from("quotes")
        .update({ status: "EXPIRED" })
        .eq("id", quoteId);

      throw new Error("QUOTE_EXPIRED");
    }

    // Re-validate balances (critical!)
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .single();

    const { data: inventory } = await supabaseAdmin
      .from("platform_inventory")
      .select("*")
      .single();

    if (quote.side === "BUY") {
      if (wallet && wallet.pkr_balance < quote.total_pkr) {
        throw new Error("INSUFFICIENT_PKR_AT_SETTLEMENT");
      }
      if (inventory && inventory.gold_grams < quote.gold_grams) {
        throw new Error("INSUFFICIENT_INVENTORY_AT_SETTLEMENT");
      }
    } else {
      if (wallet && wallet.gold_grams < quote.gold_grams) {
        throw new Error("INSUFFICIENT_GOLD_AT_SETTLEMENT");
      }
    }

    // Execute settlement (in transaction context via Supabase)
    // Update wallet
    if (quote.side === "BUY") {
      await supabaseAdmin
        .from("wallets")
        .update({
          pkr_balance: wallet!.pkr_balance - quote.total_pkr,
          gold_grams: wallet!.gold_grams + quote.gold_grams,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", DEMO_USER_ID);

      await supabaseAdmin.from("platform_inventory").update({
        pkr_balance: inventory!.pkr_balance + quote.total_pkr,
        gold_grams: inventory!.gold_grams - quote.gold_grams,
        updated_at: new Date().toISOString(),
      });
    } else {
      await supabaseAdmin
        .from("wallets")
        .update({
          pkr_balance: wallet!.pkr_balance + quote.total_pkr,
          gold_grams: wallet!.gold_grams - quote.gold_grams,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", DEMO_USER_ID);

      await supabaseAdmin.from("platform_inventory").update({
        pkr_balance: inventory!.pkr_balance - quote.total_pkr,
        gold_grams: inventory!.gold_grams + quote.gold_grams,
        updated_at: new Date().toISOString(),
      });
    }

    // Create trade record
    const { data: trade } = await supabaseAdmin
      .from("trades")
      .insert({
        user_id: DEMO_USER_ID,
        quote_id: quoteId,
        side: quote.side,
        gold_grams: quote.gold_grams,
        price_per_gram: quote.execution_price,
        total_pkr: quote.total_pkr,
      })
      .select()
      .single();

    // Mark quote as settled
    await supabaseAdmin
      .from("quotes")
      .update({
        status: "SETTLED",
        settled_trade_id: trade!.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    return {
      tradeId: trade!.id,
      quoteId: trade!.quote_id,
      side: trade!.side,
      goldGrams: parseFloat(trade!.gold_grams),
      totalPKR: parseFloat(trade!.total_pkr),
      executionPrice: parseFloat(trade!.price_per_gram),
      completedAt: new Date(trade!.created_at),
    };
  }
}

export const tradeService = new TradeService();
