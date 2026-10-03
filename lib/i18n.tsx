"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "th" | "en";

const th = {
  brand: "TopupCompare",
  updatedAt: "อัปเดตล่าสุด",
  noPriceData: "ยังไม่มีข้อมูลราคา",
  heroLine1: "เติมเกมร้านไหน",
  heroLine2: "คุ้มที่สุด",
  heroDesc:
    "เทียบราคาจากหลายร้านด้วยราคาเฉลี่ยต่อหน่วย (PPU) ที่รวมแต้มแถมแล้ว เลือกเกมและแพ็กเกจ ระบบจะเรียงร้านที่คุ้มที่สุดไว้บนสุด",
  ticker: "เทียบราคา ◆ เติมเกม ◆ คุ้มที่สุด ◆",
  noGames: "ยังไม่มีข้อมูลเกม",
  gameMenuAria: "เลือกเกม",
  games: "เกม",
  packages: "แพ็กเกจ",
  pointsUnit: "แต้ม",
  colShop: "ร้านค้า",
  colPrice: "ราคา (฿)",
  colBonus: "แต้มแถม",
  colPpu: "PPU (฿/แต้ม)",
  noShops: "ยังไม่มีร้านที่ขายแพ็กเกจนี้",
  searchPackage: "ใส่แต้ม VP หรือ งบประมาณ (฿) เช่น 500 หรือ 1000...",
  budgetMode: "คำนวณจากงบ",
  ptsMode: "ค้นตามแต้ม",
  closestMatch: "ใกล้เคียงงบที่สุด",
  startingFrom: "เริ่มต้น",
  allPackages: "ทั้งหมด",
  popularPackages: "ยอดนิยม",
  firstTimeOnly: "ลูกค้าใหม่เท่านั้น",
  outOfStock: "สินค้าหมด",
  best: "คุ้มที่สุด",
  saveAmount: "ประหยัดกว่า",
  goToShop: "ไปที่ร้านค้า",
  goToShopAria: "ไปที่ร้าน",
  langAria: "เปลี่ยนภาษา",
};

export type Dict = typeof th;

const en: Dict = {
  brand: "TopupCompare",
  updatedAt: "Last updated",
  noPriceData: "No price data yet",
  heroLine1: "Where to top up",
  heroLine2: "for the best value?",
  heroDesc:
    "Compare prices across shops by effective price per unit (PPU), bonus points included. Pick a game and a package — the best-value shop is listed first.",
  ticker: "COMPARE ◆ TOP UP ◆ BEST VALUE ◆",
  noGames: "No games yet",
  gameMenuAria: "Select game",
  games: "GAMES",
  packages: "PACKAGES",
  pointsUnit: "pts",
  colShop: "Shop",
  colPrice: "Price (฿)",
  colBonus: "Bonus pts",
  colPpu: "PPU (฿/pt)",
  noShops: "No shops sell this package yet",
  searchPackage: "Enter VP points or budget (฿) e.g. 500 or 1000...",
  budgetMode: "By Budget",
  ptsMode: "By Points",
  closestMatch: "Best match for budget",
  startingFrom: "From",
  allPackages: "All",
  popularPackages: "Popular",
  firstTimeOnly: "New customers only",
  outOfStock: "Out of stock",
  best: "BEST VALUE",
  saveAmount: "Saves",
  goToShop: "Go to shop",
  goToShopAria: "Go to shop",
  langAria: "Change language",
};

const dicts: Record<Lang, Dict> = { th, en };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: keyof Dict) => string;
};

const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  // เริ่มที่ "th" เสมอ เพื่อให้ตรงกับ HTML จากเซิร์ฟเวอร์ (กัน hydration mismatch)
  const [lang, setLangState] = useState<Lang>("th");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved === "th" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  }, []);

  const t = useCallback((k: keyof Dict) => dicts[lang][k], [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}