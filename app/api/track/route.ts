import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameSlug, gameName, shopName, packageName, salePrice } = body;

    if (!gameSlug || !shopName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // บันทึกลง Supabase
    // @ts-expect-error ClickLog model generated on push
    await prisma.clickLog.create({
      data: {
        gameSlug: String(gameSlug),
        gameName: String(gameName || gameSlug),
        shopName: String(shopName),
        packageName: String(packageName || "Unknown"),
        salePrice: Number(salePrice || 0),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to track click:", err);
    // ตอบกลับ success เพื่อไม่ให้กระทบ UX ของผู้ใช้ที่กดไปร้านค้า
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
