import { NextResponse } from "next/server";

// Mock PakGold API returning current realistic Pakistan gold prices
// Format matches what pricingService.normalizePakGold expects
export async function GET() {
  // Realistic Pakistan gold price as of Sep 5, 2026 (~39,532 PKR per gram)
  // Source: PakGold.pk displayed values during research
  return NextResponse.json({
    "24K": "39,532 PKR",
    timestamp: new Date().toISOString(),
    unit: "per gram",
  });
}
