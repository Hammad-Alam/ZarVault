import { tradeService } from "@/app/lib/services/tradeService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quoteId } = body;

    if (!quoteId || typeof quoteId !== "string") {
      return NextResponse.json(
        { error: "quoteId is required" },
        { status: 400 },
      );
    }

    const trade = await tradeService.confirmTrade(quoteId);

    return NextResponse.json(trade, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Settlement failed";

    if (errorMessage === "QUOTE_NOT_FOUND") {
      return NextResponse.json(
        {
          error: "Quote not found",
          code: "QUOTE_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (errorMessage === "QUOTE_EXPIRED") {
      return NextResponse.json(
        {
          error: "Quote has expired",
          code: "QUOTE_EXPIRED",
        },
        { status: 400 },
      );
    }

    if (errorMessage === "ALREADY_SETTLED") {
      return NextResponse.json(
        {
          error: "Quote already settled",
          code: "ALREADY_SETTLED",
        },
        { status: 409 },
      );
    }

    if (errorMessage === "INSUFFICIENT_PKR_AT_SETTLEMENT") {
      return NextResponse.json(
        {
          error: "Insufficient PKR at settlement time",
          code: "INSUFFICIENT_PKR",
        },
        { status: 400 },
      );
    }

    if (errorMessage === "INSUFFICIENT_GOLD_AT_SETTLEMENT") {
      return NextResponse.json(
        {
          error: "Insufficient gold at settlement time",
          code: "INSUFFICIENT_GOLD",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 400 },
    );
  }
}
