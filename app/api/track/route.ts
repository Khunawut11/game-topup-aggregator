import { NextResponse } from "next/server";
import { trackOutboundClick } from "@/lib/services/tracking";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ดึง Client IP จาก header ของ Proxy / CDN
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown-ip";

    const result = await trackOutboundClick(body, ip);

    if (result.error === "Missing required fields") {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("API track route error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
