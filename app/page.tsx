import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ComparisonView } from "@/components/comparison/ComparisonView";
import { LangProvider } from "@/lib/i18n";
import { SoundProvider } from "@/lib/sound";
import { SiteHeader, Hero, Ticker } from "@/components/SiteChrome";
import { Backdrop, Curtain } from "@/components/Backdrop";
import type { GameView } from "@/types/comparison";
import "@/components/comparison/motion.css";

// ใช้ ISR (Incremental Static Regeneration) แคชข้อมูลไว้ 60 วินาที
// ทำให้เว็บโหลดเร็วทันที (Instant Load) และไม่ทำให้ Supabase Connection หลุดหรือ Timeout
export const revalidate = 60;

const gameInclude = {
  packages: {
    orderBy: { basePoints: "asc" },
    include: {
      listings: {
        orderBy: { effectivePpu: "asc" },
        include: { shop: true },
      },
    },
  },
} satisfies Prisma.GameInclude;

type GameWithRelations = Prisma.GameGetPayload<{ include: typeof gameInclude }>;

/**
 * Prisma Decimal / Date ส่งข้ามไป Client Component ไม่ได้
 * จึงแปลงเป็น number / string ที่นี่ และตัดสินเรื่อง "โปรหมดอายุ" ฝั่งเซิร์ฟเวอร์
 */
function toGameView(game: GameWithRelations, now: Date): GameView {
  return {
    id: game.id,
    name: game.name,
    slug: game.slug,
    iconUrl: game.iconUrl ?? null,
    packages: game.packages.map((pkg) => ({
      id: pkg.id,
      category: (pkg as { category?: string }).category ?? "ทั่วไป",
      packageName: pkg.packageName,
      basePoints: pkg.basePoints,
      listings: pkg.listings.map((l) => {
        const expired = l.promoExpiresAt !== null && l.promoExpiresAt < now;
        const promoActive = l.hasPromo && !expired && Boolean(l.promoLabel);

        return {
          id: l.id,
          shop: {
            id: l.shop.id,
            name: l.shop.name,
            baseUrl: l.shop.baseUrl,
            logoUrl: l.shop.logoUrl ?? null,
            sourceType: l.shop.sourceType,
          },
          originalPrice: Number(l.originalPrice),
          salePrice: Number(l.salePrice),
          bonusPoints: l.bonusPoints,
          effectivePpu: Number(l.effectivePpu),
          hasPromo: promoActive,
          promoLabel: promoActive ? l.promoLabel : null,
          promoExpiresAt:
            promoActive && l.promoExpiresAt ? l.promoExpiresAt.toISOString() : null,
          isFirstTimeOnly: l.isFirstTimeOnly,
          inStock: l.inStock,
        };
      }),
    })),
  };
}

/** ⚠️ ถ้า schema ใช้ชื่อฟิลด์อื่นแทน updatedAt ให้แก้ตรง `l.updatedAt` */
function latestUpdate(rows: GameWithRelations[]): Date | null {
  let latest: Date | null = null;
  for (const g of rows)
    for (const p of g.packages)
      for (const l of p.listings)
        if (!latest || l.updatedAt > latest) latest = l.updatedAt;
  return latest;
}

export default async function HomePage() {
  let rows: GameWithRelations[] = [];
  try {
    rows = await prisma.game.findMany({
      orderBy: { name: "asc" },
      include: gameInclude,
    });
  } catch (error) {
    console.error("Database connection issue (falling back to empty state):", error);
  }

  const now = new Date();
  const games = rows
    .map((g) => toGameView(g, now))
    .filter((g) => g.packages.length > 0);

  const updated = latestUpdate(rows);

  return (
    <LangProvider>
      <SoundProvider>
        <main className="relative min-h-screen overflow-x-hidden bg-[#020a1c] text-white antialiased">
          <Curtain />
          <Backdrop />

          <SiteHeader updatedIso={updated ? updated.toISOString() : null} />
          <Ticker />

          <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
            <Hero />
            <ComparisonView games={games} />
          </div>
        </main>
      </SoundProvider>
    </LangProvider>
  );
}