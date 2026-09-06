import { DEMO_USER_ID } from "@/app/config/constants";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: trades, error } = await supabaseAdmin
    .from("trades")
    .select(
      "id, quote_id, side, gold_grams, price_per_gram, total_pkr, created_at",
    )
    .eq("user_id", DEMO_USER_ID)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    (trades ?? []).map((trade) => ({
      tradeId: trade.id,
      quoteId: trade.quote_id,
      side: trade.side,
      goldGrams: Number(trade.gold_grams),
      executionPrice: Number(trade.price_per_gram),
      totalPKR: Number(trade.total_pkr),
      completedAt: trade.created_at,
    })),
  );
}
