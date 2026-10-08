import { prisma } from "@/lib/prisma";

export interface ClickTrackInput {
  gameSlug?: string;
  gameName?: string;
  shopName?: string;
  packageName?: string;
  salePrice?: number;
}

// In-memory rate limiting map: `${ip}_${gameSlug}_${shopName}` -> timestamp
const recentClicks = new Map<string, number>();

/**
 * ล้างข้อมูล IP เก่าที่เกิน 5 นาทีออกจากหน่วยความจำ
 */
function cleanStaleClicks(): void {
  const now = Date.now();
  for (const [key, time] of recentClicks.entries()) {
    if (now - time > 5 * 60 * 1000) {
      recentClicks.delete(key);
    }
  }
}

/**
 * ตรวจสอบและบันทึกประวัติการคลิกไปยังร้านค้าภายนอก พร้อมระบบป้องกันสแปม (Rate Limit 60 วินาที)
 */
export async function trackOutboundClick(
  input: ClickTrackInput,
  clientIp: string = "unknown-ip"
): Promise<{ success: boolean; duplicate?: boolean; error?: string }> {
  const { gameSlug, gameName, shopName, packageName, salePrice } = input;

  if (!gameSlug || !shopName) {
    return { success: false, error: "Missing required fields" };
  }

  // Rate Limit / Anti-spam: หาก IP เดียวกันคลิกไปที่ร้านเดิมของเกมเดิมภายใน 60 วินาที จะไม่บันทึกซ้ำ
  const spamKey = `${clientIp}_${gameSlug}_${shopName}`;
  const now = Date.now();
  const lastClickTime = recentClicks.get(spamKey);

  if (lastClickTime && now - lastClickTime < 60 * 1000) {
    return { success: true, duplicate: true };
  }

  recentClicks.set(spamKey, now);
  if (recentClicks.size > 1000) {
    cleanStaleClicks();
  }

  try {
    await prisma.clickLog.create({
      data: {
        gameSlug: String(gameSlug),
        gameName: String(gameName || gameSlug),
        shopName: String(shopName),
        packageName: String(packageName || "Unknown"),
        salePrice: Number(salePrice || 0),
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Failed to record click in database:", err);
    return { success: false, error: "Database error" };
  }
}
