import { NextResponse } from "next/server";

// Mock GoldPrice.org API returning current realistic Pakistan gold prices
// Format matches what pricingService.normalizeGoldPrice expects
export async function GET() {
  // Realistic Pakistan gold price as of Sep 5, 2026 (~39,538 PKR per gram)
  // Source: GoldPrice.org displayed values during research
  return NextResponse.json({
    PKR: {
      gram: 39538.72,
      ounce: 1229792.72,
    },
    timestamp: new Date().toISOString(),
    source: "goldprice.org",
  });
}
