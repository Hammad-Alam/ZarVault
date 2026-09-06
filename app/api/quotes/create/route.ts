import { tradeService } from "@/app/lib/services/tradeService";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { side, inputType, inputAmount } = body;

    console.log("CREATE QUOTE BODY:", body);

    const quote = await tradeService.createQuote({
      side,
      inputType,
      inputAmount: parseFloat(inputAmount),
    });

    return NextResponse.json(quote, { status: 200 });
  } catch (error: unknown) {
    console.error("=== CREATE QUOTE ROUTE ERROR ===", error);
  
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
  
    console.error("ERROR MESSAGE:", errorMessage);

    if (errorMessage === "INSUFFICIENT_PKR") {
      return NextResponse.json(
        {
          error: "Insufficient PKR wallet",
          code: "INSUFFICIENT_PKR",
        },
        { status: 400 },
      );
    }

    if (errorMessage === "INSUFFICIENT_GOLD") {
      return NextResponse.json(
        {
          error: "Insufficient gold holdings",
          code: "INSUFFICIENT_GOLD",
        },
        { status: 400 },
      );
    }

    if (errorMessage === "INSUFFICIENT_INVENTORY") {
      return NextResponse.json(
        {
          error: "Insufficient platform inventory",
          code: "INSUFFICIENT_INVENTORY",
        },
        { status: 400 },
      );
    }

    if (errorMessage === "PRICE_UNAVAILABLE") {
      return NextResponse.json(
        {
          error: "Cannot create quote: price unavailable",
          code: "PRICE_UNAVAILABLE",
        },
        { status: 503 },
      );
    }

    if (
      errorMessage === "WALLET_LOOKUP_FAILED" ||
      errorMessage === "INVENTORY_LOOKUP_FAILED"
    ) {
      return NextResponse.json(
        { error: "Unable to load trading balances" },
        { status: 500 },
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
