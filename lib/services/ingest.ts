import { prisma } from "../prisma";
import { ShopSourceType } from "@prisma/client";

export interface CsvPriceRow {
  game_slug: string;
  game_name: string;
  category: string;
  unit: string;
  package_name: string;
  points: number;
  bonus_points: number;
  shop_name: string;
  shop_url: string;
  original_price: number;
  sale_price: number;
  promo_label: string | null;
  promo_expires_at: Date | null;
  first_time_only: boolean;
  in_stock: boolean;
}

const DEFAULT_CATEGORY = "ทั่วไป";
const DEFAULT_UNIT = "แต้ม";

function toNumber(raw: string | undefined): number {
  return parseFloat((raw ?? "").replace(/,/g, "").trim());
}

function toBool(raw: string | undefined, fallback: boolean): boolean {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "") return fallback;
  return v === "true" || v === "1" || v === "yes";
}

function toDate(raw: string | undefined): Date | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  // วันที่ในชีตเป็นปี-เดือน-วัน ให้โปรหมดตอนสิ้นวันตามเวลาไทย
  const d = new Date(`${v}T23:59:59+07:00`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * แยกบรรทัด CSV และจัดการกับเครื่องหมายคำพูด (Quotes) อย่างปลอดภัย
 */
export function parseCsv(text: string): CsvPriceRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const idx = {
    gameSlug: col("game_slug"),
    gameName: col("game_name"),
    category: col("category", "currency_type", "type"),
    unit: col("unit"),
    packageName: col("package_name", "package"),
    points: col("points", "vp_points", "base_points"),
    bonusPoints: col("bonus_points"),
    shopName: col("shop_name"),
    shopUrl: col("shop_url"),
    originalPrice: col("original_price"),
    salePrice: col("sale_price"),
    promoLabel: col("promo_label"),
    promoExpiresAt: col("promo_expires_at"),
    firstTimeOnly: col("first_time_only"),
    inStock: col("in_stock"),
  };

  const get = (cols: string[], i: number) => (i === -1 ? undefined : cols[i]?.trim());

  const rows: CsvPriceRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const gameSlug = get(cols, idx.gameSlug)?.toLowerCase();
    const shopName = get(cols, idx.shopName);
    const points = toNumber(get(cols, idx.points));
    const salePrice = toNumber(get(cols, idx.salePrice));

    if (!gameSlug || !shopName || !(points > 0) || !(salePrice > 0)) continue;

    const unit = get(cols, idx.unit) || DEFAULT_UNIT;
    const originalPrice = toNumber(get(cols, idx.originalPrice));
    const bonus = toNumber(get(cols, idx.bonusPoints));

    rows.push({
      game_slug: gameSlug,
      game_name: get(cols, idx.gameName) || gameSlug,
      category: get(cols, idx.category) || DEFAULT_CATEGORY,
      unit,
      package_name: get(cols, idx.packageName) || `${points.toLocaleString("en-US")} ${unit}`,
      points: Math.round(points),
      bonus_points: bonus > 0 ? Math.round(bonus) : 0,
      shop_name: shopName,
      shop_url: get(cols, idx.shopUrl) || "",
      original_price: originalPrice > 0 ? originalPrice : salePrice,
      sale_price: salePrice,
      promo_label: get(cols, idx.promoLabel) || null,
      promo_expires_at: toDate(get(cols, idx.promoExpiresAt)),
      first_time_only: toBool(get(cols, idx.firstTimeOnly), false),
      in_stock: toBool(get(cols, idx.inStock), true),
    });
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

/**
 * ดึงข้อมูลจาก Google Sheet CSV URL และ Upsert ลง Supabase
 * แถวที่ถูกลบออกจากชีต จะถูกลบออกจากฐานข้อมูลด้วย (เฉพาะเกมที่อยู่ในชีตรอบนี้)
 */
export async function syncPricesFromCsv(csvUrl: string) {
  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
  }

  const rows = parseCsv(await res.text());
  if (rows.length === 0) {
    // กันชีตว่าง/หัวคอลัมน์ผิด แล้วไปลบข้อมูลทั้งหมดทิ้ง
    throw new Error("No valid rows found in sheet. Check the header row.");
  }

  // ร้านเดียวกันขายแพ็กเดียวกันหลายแถว: เก็บแถวที่ถูกที่สุด (ราคาเท่ากันให้เลือกแถวที่มีโปร)
  const deduped = new Map<string, CsvPriceRow>();
  for (const r of rows) {
    const key = `${r.game_slug}|${r.package_name}|${r.shop_name}`;
    const existing = deduped.get(key);
    if (
      !existing ||
      r.sale_price < existing.sale_price ||
      (r.sale_price === existing.sale_price && r.promo_label && !existing.promo_label)
    ) {
      deduped.set(key, r);
    }
  }
  const finalRows = Array.from(deduped.values());

  // 1. Games
  const gameMap = new Map<string, string>(); // slug -> id
  for (const slug of new Set(finalRows.map((r) => r.game_slug))) {
    const row = finalRows.find((r) => r.game_slug === slug)!;
    const game = await prisma.game.upsert({
      where: { slug },
      update: { name: row.game_name },
      create: { slug, name: row.game_name, iconUrl: "" },
    });
    gameMap.set(slug, game.id);
  }

  // 2. Shops
  const shopMap = new Map<string, string>(); // name -> id
  for (const s of await prisma.shop.findMany()) shopMap.set(s.name, s.id);
  for (const name of new Set(finalRows.map((r) => r.shop_name))) {
    if (shopMap.has(name)) continue;
    const row = finalRows.find((r) => r.shop_name === name)!;
    const created = await prisma.shop.create({
      data: {
        name,
        baseUrl: row.shop_url,
        logoUrl: "",
        sourceType: ShopSourceType.PARTNER_SHEET,
      },
    });
    shopMap.set(name, created.id);
  }

  // 3. Packages
  const packageMap = new Map<string, string>(); // `${gameId}|${packageName}` -> id
  const packageRows = new Map<string, CsvPriceRow>();
  for (const r of finalRows) packageRows.set(`${r.game_slug}|${r.package_name}`, r);

  for (const r of packageRows.values()) {
    const gameId = gameMap.get(r.game_slug)!;
    const pkg = await prisma.gamePackage.upsert({
      where: { gameId_packageName: { gameId, packageName: r.package_name } },
      update: { basePoints: r.points, category: r.category, unit: r.unit },
      create: {
        gameId,
        packageName: r.package_name,
        basePoints: r.points,
        category: r.category,
        unit: r.unit,
      },
    });
    packageMap.set(`${gameId}|${r.package_name}`, pkg.id);
  }

  // 4. Listings
  const keptListingIds: string[] = [];
  for (const r of finalRows) {
    const gameId = gameMap.get(r.game_slug)!;
    const packageId = packageMap.get(`${gameId}|${r.package_name}`)!;
    const shopId = shopMap.get(r.shop_name)!;

    const totalPoints = r.points + r.bonus_points;
    const data = {
      originalPrice: r.original_price,
      salePrice: r.sale_price,
      bonusPoints: r.bonus_points,
      effectivePpu: r.sale_price / totalPoints,
      hasPromo: Boolean(r.promo_label),
      promoLabel: r.promo_label,
      promoExpiresAt: r.promo_expires_at,
      isFirstTimeOnly: r.first_time_only,
      inStock: r.in_stock,
    };

    const listing = await prisma.priceListing.upsert({
      where: { packageId_shopId: { packageId, shopId } },
      update: data,
      create: { packageId, shopId, ...data },
    });
    keptListingIds.push(listing.id);
  }

  // 5. ลบของที่ไม่มีในชีตแล้ว (เฉพาะเกมที่อยู่ในชีตรอบนี้)
  const syncedGameIds = Array.from(gameMap.values());
  const removedListings = await prisma.priceListing.deleteMany({
    where: {
      id: { notIn: keptListingIds },
      package: { gameId: { in: syncedGameIds } },
    },
  });
  const removedPackages = await prisma.gamePackage.deleteMany({
    where: {
      id: { notIn: Array.from(packageMap.values()) },
      gameId: { in: syncedGameIds },
    },
  });

  return {
    totalRows: rows.length,
    syncedRows: keptListingIds.length,
    removedListings: removedListings.count,
    removedPackages: removedPackages.count,
  };
}
