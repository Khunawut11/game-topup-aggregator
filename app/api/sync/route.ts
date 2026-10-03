import { NextResponse } from "next/server";
import { syncPricesFromCsv } from "@/lib/services/ingest";

const DEFAULT_CSV_URL =
  process.env.GOOGLE_SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2FpVthO9AT7A2YgCwgk14P3fuffjcXYFI7DFp0SsaeL6Pezc0KGMp1oWSw_5kX9lbbwdRnIni4ZNO/pub?output=csv";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url") || DEFAULT_CSV_URL;

    const result = await syncPricesFromCsv(url);

    return NextResponse.json({
      success: true,
      message: "Sync prices successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sync prices",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
