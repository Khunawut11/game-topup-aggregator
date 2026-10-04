import { prisma } from "../prisma";
import { ShopSourceType } from "@prisma/client";

export interface CsvPriceRow {
  game_slug: string;
  game_name: string;
  category: string;
  package_name?: string | null;
  vp_points: number;
  shop_name: string;
  shop_url: string;
  original_price: number;
  sale_price: number;
  bonus_points: number;
  promo_label?: string | null;
  in_stock: boolean;
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

  // Parse header
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const idx = {
    gameSlug: header.indexOf("game_slug"),
    gameName: header.indexOf("game_name"),
    category: header.findIndex((h) => h === "category" || h === "currency_type" || h === "type"),
    packageName: header.findIndex((h) => h === "package_name" || h === "package"),
    vpPoints: header.findIndex((h) => h === "vp_points" || h === "points" || h === "base_points"),
    shopName: header.indexOf("shop_name"),
    shopUrl: header.indexOf("shop_url"),
    originalPrice: header.indexOf("original_price"),
    salePrice: header.indexOf("sale_price"),
    bonusPoints: header.indexOf("bonus_points"),
    promoLabel: header.indexOf("promo_label"),
    inStock: header.indexOf("in_stock"),
  };

  const rows: CsvPriceRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const gameSlug = cols[idx.gameSlug]?.trim();
    const gameName = cols[idx.gameName]?.trim() || gameSlug;
    const category = (idx.category !== -1 ? cols[idx.category]?.trim() : "") || "ทั่วไป";
    const customPkgName = idx.packageName !== -1 ? cols[idx.packageName]?.trim() : null;
    const vpPoints = parseInt(cols[idx.vpPoints]?.replace(/,/g, "") || "0", 10);
    const shopName = cols[idx.shopName]?.trim();
    const shopUrl = cols[idx.shopUrl]?.trim() || "";
    const salePrice = parseFloat(cols[idx.salePrice]?.replace(/,/g, "") || "0");
    const origPriceParsed = idx.originalPrice !== -1 ? parseFloat(cols[idx.originalPrice]?.replace(/,/g, "") || "0") : 0;
    const originalPrice = !isNaN(origPriceParsed) && origPriceParsed > 0 ? origPriceParsed : salePrice;
    const bonusPoints = parseInt(cols[idx.bonusPoints]?.replace(/,/g, "") || "0", 10);
    const promoLabel = cols[idx.promoLabel]?.trim() || null;
    const inStockRaw = cols[idx.inStock]?.trim().toLowerCase();
    const inStock = inStockRaw === "true" || inStockRaw === "1" || inStockRaw === "yes" || inStockRaw === undefined || inStockRaw === "";

    if (!gameSlug || isNaN(vpPoints) || vpPoints <= 0 || !shopName || isNaN(salePrice) || salePrice <= 0) {
      continue;
    }

    rows.push({
      game_slug: gameSlug,
      game_name: gameName,
      category,
      package_name: customPkgName,
      vp_points: vpPoints,
      shop_name: shopName,
      shop_url: shopUrl,
      original_price: originalPrice,
      sale_price: salePrice,
      bonus_points: isNaN(bonusPoints) ? 0 : bonusPoints,
      promo_label: promoLabel,
      in_stock: inStock,
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
 */
export async function syncPricesFromCsv(csvUrl: string) {
  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const rows = parseCsv(text);

  let updatedCount = 0;

  // สำหรับกรณีที่ร้านค้าเดียวกันมีหลายตัวเลือกสำหรับ package เดียวกัน
  const dedupedMap = new Map<string, CsvPriceRow>();
  for (const r of rows) {
    const pkgLabel = r.package_name || `${r.vp_points.toLocaleString()} แต้ม`;
    const key = `${r.game_slug}_${r.category}_${pkgLabel}_${r.shop_name}`;
    const existing = dedupedMap.get(key);
    if (!existing) {
      dedupedMap.set(key, r);
    } else {
      if (r.sale_price < existing.sale_price || (r.sale_price === existing.sale_price && r.promo_label && !existing.promo_label)) {
        dedupedMap.set(key, r);
      }
    }
  }

  const finalRows = Array.from(dedupedMap.values());

  // 1. แคช Games ใน Memory (ดึงหรือสร้างครั้งเดียว)
  const gameMap = new Map<string, string>(); // slug -> id
  const uniqueGames = Array.from(new Set(finalRows.map((r) => r.game_slug)));
  for (const slug of uniqueGames) {
    const row = finalRows.find((r) => r.game_slug === slug)!;
    const game = await prisma.game.upsert({
      where: { slug },
      update: { name: row.game_name },
      create: {
        slug,
        name: row.game_name,
        iconUrl: `https://placehold.co/120x120/1e293b/38bdf8?text=${encodeURIComponent(row.game_name)}`,
      },
    });
    gameMap.set(slug, game.id);
  }

  // 2. แคช Shops ใน Memory
  const shopMap = new Map<string, string>(); // shop_name -> id
  const existingShops = await prisma.shop.findMany();
  for (const s of existingShops) {
    shopMap.set(s.name, s.id);
  }

  const uniqueShopNames = Array.from(new Set(finalRows.map((r) => r.shop_name)));
  for (const sName of uniqueShopNames) {
    if (!shopMap.has(sName)) {
      const row = finalRows.find((r) => r.shop_name === sName)!;
      const created = await prisma.shop.create({
        data: {
          name: sName,
          baseUrl: row.shop_url,
          logoUrl: `https://placehold.co/60x60/2563eb/ffffff?text=${encodeURIComponent(sName.slice(0, 4))}`,
          sourceType: ShopSourceType.PARTNER_SHEET,
        },
      });
      shopMap.set(sName, created.id);
    }
  }

  // 3. แคช Packages ใน Memory (สร้างหรือดึงเท่าที่จำเป็น)
  const packageMap = new Map<string, string>(); // `${gameId}_${packageName}` -> id
  const uniquePackages = Array.from(
    new Set(
      finalRows.map((r) => {
        const pkgName = r.package_name || (r.game_slug === "valorant" ? `${r.vp_points.toLocaleString()} VP` : `${r.vp_points.toLocaleString()} แต้ม`);
        return `${r.game_slug}:::${r.category}:::${r.vp_points}:::${pkgName}`;
      })
    )
  );

  for (const item of uniquePackages) {
    const [slug, category, vpStr, packageName] = item.split(":::");
    const vp = parseInt(vpStr, 10);
    const gameId = gameMap.get(slug)!;

    const pkg = await prisma.gamePackage.upsert({
      where: {
        gameId_packageName: {
          gameId,
          packageName,
        },
      },
      update: {
        basePoints: vp,
        category: category || "ทั่วไป",
      },
      create: {
        gameId,
        category: category || "ทั่วไป",
        packageName,
        basePoints: vp,
      },
    });
    packageMap.set(`${gameId}_${packageName}`, pkg.id);
  }

  // 4. Upsert PriceListing โดยใช้ ID จาก Memory ทั้งหมด
  for (const r of finalRows) {
    const gameId = gameMap.get(r.game_slug)!;
    const unit = r.game_slug === "valorant" ? "VP" : r.game_slug === "rov" ? "คูปอง" : "แต้ม";
    const packageName = r.package_name || `${r.vp_points.toLocaleString()} ${unit}`;
    const packageId = packageMap.get(`${gameId}_${packageName}`)!;
    const shopId = shopMap.get(r.shop_name)!;

    const totalPoints = r.vp_points + r.bonus_points;
    const effectivePpu = totalPoints > 0 ? r.sale_price / totalPoints : r.sale_price;

    await prisma.priceListing.upsert({
      where: {
        packageId_shopId: {
          packageId,
          shopId,
        },
      },
      update: {
        originalPrice: r.original_price,
        salePrice: r.sale_price,
        bonusPoints: r.bonus_points,
        effectivePpu,
        hasPromo: Boolean(r.promo_label),
        promoLabel: r.promo_label,
        inStock: r.in_stock,
      },
      create: {
        packageId,
        shopId,
        originalPrice: r.original_price,
        salePrice: r.sale_price,
        bonusPoints: r.bonus_points,
        effectivePpu,
        hasPromo: Boolean(r.promo_label),
        promoLabel: r.promo_label,
        inStock: r.in_stock,
      },
    });

    updatedCount++;
  }

  return {
    totalRows: rows.length,
    syncedRows: updatedCount,
  };
}
