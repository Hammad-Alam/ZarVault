import { NextResponse } from "next/server";
import { DEMO_USER_ID } from "@/app/config/constants";
import { pricingService } from "@/app/lib/services/pricingService";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function GET() {
  try {
    // Get wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .single();

    if (walletError) {
      console.error("Wallet fetch error:", walletError);
      throw new Error("Failed to fetch wallet");
    }

    // Get platform inventory
    const { data: inventory, error: inventoryError } = await supabaseAdmin
      .from("platform_inventory")
      .select("*")
      .single();

    if (inventoryError) {
      console.error("Inventory fetch error:", inventoryError);
      throw new Error("Failed to fetch platform inventory");
    }

    // Get market price
    const marketPrice = await pricingService.getTrustedPrice();

    return NextResponse.json({
      wallet: {
        pkr: parseFloat(wallet.pkr_balance || "0"),
        goldGrams: parseFloat(wallet.gold_grams || "0"),
        updatedAt: wallet.updated_at,
      },

      platformInventory: {
        pkr: parseFloat(inventory.pkr_balance || "0"),
        goldGrams: parseFloat(inventory.gold_grams || "0"),
        updatedAt: inventory.updated_at,
      },

      marketPrice: {
        pricePkrPerGram: marketPrice.pricePkrPerGram,
        source: marketPrice.source,
        fetchedAt: marketPrice.fetchedAt.toISOString(),
        freshnessSeconds: marketPrice.freshnessSeconds,
        canTrade: marketPrice.isTrusted,
      },
    });
  } catch (error: unknown) {
    console.error("Balances endpoint error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch balances",
      },
      { status: 500 },
    );
  }
}
