import { DEMO_USER_ID } from "@/app/config/constants";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextResponse } from "next/server";

function parseDatabaseTimestamp(value: string) {
  return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}Z`);
}

export async function GET() {
  const { data: quote, error } = await supabaseAdmin
    .from("quotes")
    .select("*")
    .eq("user_id", DEMO_USER_ID)
    .in("status", ["ACTIVE", "EXPIRED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to restore quote" }, { status: 500 });
  }

  if (!quote) return NextResponse.json(null, { status: 200 });

  return NextResponse.json({
    quoteId: quote.id,
    side: quote.side,
    inputType: quote.input_type,
    inputAmount: Number(quote.input_amount),
    goldGrams: Number(quote.gold_grams),
    totalPKR: Number(quote.total_pkr),
    marketPrice: Number(quote.market_price),
    executionPrice: Number(quote.execution_price),
    priceSource: quote.price_source,
    createdAt: parseDatabaseTimestamp(quote.created_at).toISOString(),
    expiresAt: parseDatabaseTimestamp(quote.expires_at).toISOString(),
    remainingSeconds: Math.max(0, Math.floor((parseDatabaseTimestamp(quote.expires_at).getTime() - Date.now()) / 1000)),
    status: quote.status,
  });
}