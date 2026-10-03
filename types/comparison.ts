/**
 * View-model types ที่ "serialize ได้" (ไม่มี Decimal / Date)
 * ใช้เป็นสัญญาระหว่าง Server Component (page.tsx) กับ Client Component (ComparisonView)
 */

export interface ShopView {
  id: string;
  name: string;
  baseUrl: string;
  logoUrl: string | null;
  sourceType: string;
}

export interface ListingView {
  id: string;
  shop: ShopView;
  originalPrice: number;
  salePrice: number;
  bonusPoints: number;
  effectivePpu: number;
  /** true เฉพาะโปรที่ยังไม่หมดอายุและมีป้ายข้อความ */
  hasPromo: boolean;
  promoLabel: string | null;
  /** ISO string */
  promoExpiresAt: string | null;
  isFirstTimeOnly: boolean;
  inStock: boolean;
}

export interface PackageView {
  id: string;
  packageName: string;
  basePoints: number;
  listings: ListingView[];
}

export interface GameView {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  packages: PackageView[];
}