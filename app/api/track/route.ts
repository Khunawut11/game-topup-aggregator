import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// เก็บประวัติการคลิกล่าสุดในหน่วยความจำ: `${ip}_${gameSlug}_${shopName}` -> timestamp
// เพื่อตัดคลิกซ้ำซ้อนจาก IP เดียวกันภายใน 60 วินาที
const recentClicks = new Map<string, number>();

// ล้างแคชที่เก่าเกิน 5 นาทีเป็นระยะ
function cleanMemory() {
  const now = Date.now();
  for (const [key, time] of recentClicks.entries()) {
    if (now - time > 5 * 60 * 1000) {
      recentClicks.delete(key);
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gameSlug, gameName, shopName, packageName, salePrice } = body;

    if (!gameSlug || !shopName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ดึง IP ของผู้ใช้จาก headers
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown-ip";

    // Rate Limit / Anti-spam: ถ้า IP เดียวกัน คลิกไปที่ [เกมเดียวกัน + ร้านเดียวกัน] ภายใน 60 วินาที จะไม่บันทึกซ้ำ
    const spamKey = `${ip}_${gameSlug}_${shopName}`;
    const now = Date.now();
    const lastClickTime = recentClicks.get(spamKey);

    if (lastClickTime && now - lastClickTime < 60 * 1000) {
      // เพิ่งกดไปไม่ถึง 1 นาที ถือเป็น Duplicate click
      return NextResponse.json({ success: true, duplicate: true });
    }

    recentClicks.set(spamKey, now);
    if (recentClicks.size > 1000) cleanMemory();

    // บันทึกลง Supabase
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
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
