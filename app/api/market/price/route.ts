import { NextResponse } from "next/server";
import { pricingService } from "@/app/lib/services/pricingService";

export async function GET() {
  try {
    const marketPrice = await pricingService.getTrustedPrice();

    if (!marketPrice.isTrusted) {
      return NextResponse.json(
        {
          pricePkrPerGram: null,
          source: null,
          error: "Unable to fetch price from any source",
          canTrade: false,
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      pricePkrPerGram: marketPrice.pricePkrPerGram,
      source: marketPrice.source,
      fetchedAt: marketPrice.fetchedAt.toISOString(),
      freshnessSeconds: marketPrice.freshnessSeconds,
      isTrusted: true,
      canTrade: true,
    });
  } catch (error) {
    console.error("Price endpoint error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        canTrade: false,
      },
      { status: 500 },
    );
  }
}
