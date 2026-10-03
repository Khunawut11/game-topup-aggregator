import { PrismaClient, ShopSourceType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.priceListing.deleteMany();
  await prisma.gamePackage.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.game.deleteMany();

  const rov = await prisma.game.create({
    data: {
      name: "RoV (Arena of Valor)",
      slug: "rov",
      iconUrl: "https://placehold.co/120x120/1e293b/38bdf8?text=RoV",
    },
  });

  const rovPkg = await prisma.gamePackage.create({
    data: {
      gameId: rov.id,
      packageName: "540 คูปอง",
      basePoints: 540,
    },
  });

  const officialShop = await prisma.shop.create({
    data: {
      name: "Garena Official Store",
      baseUrl: "https://termgame.com",
      logoUrl: "https://placehold.co/60x60/dc2626/ffffff?text=Official",
      sourceType: ShopSourceType.MANUAL,
    },
  });

  const partnerShop = await prisma.shop.create({
    data: {
      name: "FastTopup Shop",
      baseUrl: "https://fasttopup.example.com",
      logoUrl: "https://placehold.co/60x60/2563eb/ffffff?text=Fast",
      sourceType: ShopSourceType.PARTNER_SHEET,
    },
  });

  await prisma.priceListing.create({
    data: {
      packageId: rovPkg.id,
      shopId: officialShop.id,
      originalPrice: 500.0,
      salePrice: 500.0,
      bonusPoints: 0,
      effectivePpu: 500.0 / 540,
      hasPromo: false,
      inStock: true,
    },
  });

  await prisma.priceListing.create({
    data: {
      packageId: rovPkg.id,
      shopId: partnerShop.id,
      originalPrice: 500.0,
      salePrice: 469.0,
      bonusPoints: 30,
      effectivePpu: 469.0 / 570,
      hasPromo: true,
      promoLabel: "ลดพิเศษ + แถม 30 คูปอง",
      inStock: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });