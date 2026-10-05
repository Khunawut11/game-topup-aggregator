import { NextResponse } from "next/server";
import { syncPricesFromCsv } from "@/lib/services/ingest";

const DEFAULT_CSV_URL =
  process.env.GOOGLE_SHEET_CSV_URL ||
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2FpVthO9AT7A2YgCwgk14P3fuffjcXYFI7DFp0SsaeL6Pezc0KGMp1oWSw_5kX9lbbwdRnIni4ZNO/pub?output=csv";

const SYNC_SECRET = process.env.SYNC_SECRET;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providedSecret =
      searchParams.get("secret") || request.headers.get("x-sync-secret");

    // ถ้ามีการตั้ง SYNC_SECRET ไว้ ต้องตรวจสอบรหัสลับให้ถูกต้อง
    if (SYNC_SECRET && providedSecret !== SYNC_SECRET) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing sync secret" },
        { status: 401 }
      );
    }

    // ป้องกัน SSRF: ไม่อนุญาตให้รับ URL จากภายนอก ใช้เฉพาะ CSV URL ที่ปลอดภัยจากระบบเท่านั้น
    const result = await syncPricesFromCsv(DEFAULT_CSV_URL);

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
