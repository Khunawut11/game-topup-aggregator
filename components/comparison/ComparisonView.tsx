"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { GameView } from "@/types/comparison";
import { useLang } from "@/lib/i18n";
import { useP3Sound } from "@/lib/sound";
import "./motion.css";

type Listing = GameView["packages"][number]["listings"][number];

const NAVY = "#020a1c";
const CYAN = "#19e3ff";

const num = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const ppuFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});
const int = new Intl.NumberFormat("en-US");

export function ComparisonView({ games }: { games: GameView[] }) {
  const { t } = useLang();
  const { playHover, playSelect, playWipe } = useP3Sound();
  const [gameId, setGameId] = useState(games[0]?.id);
  const game = games.find((g) => g.id === gameId) ?? games[0];
  const [pkgId, setPkgId] = useState<string | number | undefined>(
    game?.packages[0]?.id,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  if (!game) {
    return (
      <div className="border-l-4 border-[#19e3ff] bg-[#06173a] p-8 text-sm text-cyan-100/70">
        {t("noGames")}
      </div>
    );
  }

  const pkg = game.packages.find((p) => p.id === pkgId) ?? game.packages[0];
  const bestId = pkg.listings.find((l) => l.inStock)?.id;
  // เปลี่ยนค่านี้ = เล่นแอนิเมชันกวาด + แถวไล่เข้าใหม่
  const viewKey = `${game.id}-${pkg.id}`;

  // Smart Search & Budget Match Logic
  const trimmedQuery = searchQuery.trim();
  const numericInput = parseFloat(trimmedQuery.replace(/,/g, ""));
  const isNumericSearch = !isNaN(numericInput) && numericInput > 0;

  const filteredPackages = (() => {
    if (!trimmedQuery) return game.packages;

    if (isNumericSearch) {
      // ผู้ใช้กรอกตัวเลขงบประมาณ (เช่น 500, 1000) หรือจำนวนแต้ม
      // คัดเลือกและเรียงลำดับแพ็กเกจที่ราคาใกล้เคียงงบ หรือแต้มใกล้เคียงที่สุด
      return [...game.packages]
        .map((p) => {
          const minPrice = p.listings.length > 0
            ? Math.min(...p.listings.map((l) => l.salePrice))
            : p.basePoints;
          // ความต่างระหว่างงบกับราคา หรือความต่างของแต้ม
          const priceDiff = Math.abs(minPrice - numericInput);
          const ptsDiff = Math.abs(p.basePoints - numericInput);
          const score = Math.min(priceDiff, ptsDiff);
          return { p, score, minPrice };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, 10) // ดึง 10 อันดับที่ตรงกับงบที่สุด
        .map((item) => item.p);
    }

    // กรณีพิมพ์ข้อความ เช่น "Battle Pass", "VP"
    return game.packages.filter(
      (p) =>
        p.packageName.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
        String(p.basePoints).includes(trimmedQuery)
    );
  })();

  function selectGame(id: typeof gameId) {
    setGameId(id);
    setPkgId(games.find((g) => g.id === id)?.packages[0]?.id);
    setSearchQuery("");
    playWipe();
  }

  // ลูกศรขึ้น/ลง เลื่อนเมนูเกมได้เหมือนเมนูในเกม
  function onMenuKey(e: KeyboardEvent<HTMLElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const i = games.findIndex((g) => g.id === game.id);
    const step = e.key === "ArrowDown" ? 1 : -1;
    const next = (i + step + games.length) % games.length;
    selectGame(games[next].id);
    itemRefs.current[next]?.focus();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      {/* เมนูเลือกเกม: สไตล์ Persona 3 Reload คม ชัด ไม่โดนตัดขอบ */}
      <nav
        aria-label={t("gameMenuAria")}
        className="flex gap-3 overflow-x-auto px-2 py-3 scrollbar-none lg:block lg:space-y-2 lg:overflow-visible lg:px-0 lg:py-0"
        onKeyDown={onMenuKey}
      >
        <div className="hidden text-xs font-black italic tracking-widest text-[#19e3ff] lg:mb-3 lg:flex lg:items-center lg:gap-2">
          <span className="h-3 w-1 -skew-x-12 bg-[#19e3ff]" />
          <span>{t("games")}</span>
        </div>
        {games.map((g, i) => {
          const active = g.id === game.id;
          return (
            <div
              key={g.id}
              className="p3-menu-in shrink-0 py-1"
              style={{ "--i": i } as CSSProperties}
            >
              <button
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onClick={() => selectGame(g.id)}
                onMouseEnter={playHover}
                aria-current={active}
                style={{
                  clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)",
                }}
                className={
                  "relative block -skew-x-12 px-5 py-2.5 text-left transition-[transform,background-color,color,box-shadow] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19e3ff] active:scale-[0.96] lg:w-full lg:px-6 lg:py-3 " +
                  (active
                    ? "p3-ping bg-white text-[#020a1c] shadow-[0_0_20px_rgba(25,227,255,0.6)] ring-1 ring-[#19e3ff] lg:translate-x-3"
                    : "border border-[#19e3ff]/30 bg-[#06173a]/90 text-cyan-100 hover:border-[#19e3ff] hover:bg-[#0b2a5e] hover:text-white lg:hover:translate-x-1.5")
                }
              >
                {/* Persona 3 Pointer Icon */}
                {active && (
                  <span
                    aria-hidden
                    className="p3-cursor absolute -left-2 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[6px] border-l-[9px] border-y-transparent border-l-[#19e3ff]"
                  />
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-block skew-x-12 whitespace-nowrap text-xs font-black italic tracking-wide sm:text-sm">
                    {g.name}
                  </span>
                  {active && (
                    <span className="inline-block skew-x-12 text-xs font-black text-[#020a1c]">
                      ▶
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </nav>

      <section className="min-w-0 space-y-6">
        {/* แพ็กเกจแบบ Persona 3 Reload */}
        <div className="space-y-4">
          {/* Header & Budget / Points Smart Search Box */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-1 -skew-x-12 bg-[#19e3ff]" />
              <span className="text-xs font-black italic tracking-wider text-[#19e3ff]">
                {t("packages")} ({game.packages.length})
              </span>
            </div>

            {/* Persona 3 Angled Search & Budget Finder */}
            <div className="relative w-full sm:w-80">
              <div className="flex items-center border border-[#19e3ff]/50 bg-[#06173a]/90 shadow-[0_0_15px_rgba(25,227,255,0.15)] transition-[border-color,box-shadow] focus-within:border-[#19e3ff] focus-within:shadow-[0_0_20px_rgba(25,227,255,0.3)]">
                <span className="pl-3 text-xs font-black italic text-[#19e3ff]">
                  FIND:
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPackage")}
                  className="w-full bg-transparent px-2.5 py-1.5 font-mono text-xs text-white placeholder-cyan-100/40 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="pr-3 text-xs text-cyan-100/60 hover:text-[#19e3ff]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* ป้ายแนะนำสำหรับผลลัพธ์ใกล้เคียงงบ */}
              {isNumericSearch && filteredPackages.length > 0 && (
                <div className="absolute right-0 top-full z-20 mt-1 flex items-center gap-1.5 rounded-none bg-[#19e3ff] px-2 py-0.5 text-[10px] font-black italic text-[#020a1c] shadow-md">
                  <span>◆ {t("closestMatch")}</span>
                </div>
              )}
            </div>
          </div>

          {/* รายการแพ็กเกจ: Persona 3 Cut-Corner & Skew Grid */}
          <div className="p3-scroll max-h-64 overflow-y-auto overflow-x-hidden p-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredPackages.map((p) => {
                const active = p.id === pkg.id;
                // หาช่วงราคาต่ำสุดของแพ็กเกจนี้
                const minPrice = p.listings.length > 0
                  ? Math.min(...p.listings.map((l) => l.salePrice))
                  : null;

                return (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setPkgId(p.id);
                      playSelect();
                    }}
                    onMouseEnter={playHover}
                    style={{
                      clipPath:
                        "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)",
                    }}
                    className={
                      "group relative flex flex-col justify-between p-2.5 text-left transition-[transform,background-color,border-color,box-shadow] duration-150 focus:outline-none active:scale-95 " +
                      (active
                        ? "bg-[#19e3ff] text-[#020a1c] shadow-[0_0_20px_rgba(25,227,255,0.6)] ring-2 ring-white"
                        : "border border-[#19e3ff]/30 bg-[#06173a]/70 text-white hover:-translate-y-1 hover:border-[#19e3ff] hover:bg-[#0b2555]")
                    }
                  >
                    {/* Persona 3 Cursor Triangle on Active */}
                    {active && (
                      <span
                        aria-hidden
                        className="p3-cursor absolute -left-1 top-2 h-0 w-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white"
                      />
                    )}

                    {/* จุดและจำนวนแต้ม */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={
                          "text-xs font-black italic tracking-wide sm:text-sm " +
                          (active ? "text-[#020a1c]" : "text-white group-hover:text-[#19e3ff]")
                        }
                      >
                        {p.packageName}
                      </span>
                      {active && (
                        <span className="text-[10px] font-black italic text-[#020a1c]">
                          ▶
                        </span>
                      )}
                    </div>

                    {/* ราคาเริ่มต้น */}
                    {minPrice !== null && (
                      <div className="mt-1 flex items-baseline justify-between font-mono text-[11px] tabular-nums">
                        <span
                          className={
                            "text-[9px] font-sans font-bold uppercase " +
                            (active ? "text-[#020a1c]/70" : "text-cyan-100/50")
                          }
                        >
                          {t("startingFrom")}
                        </span>
                        <span
                          className={
                            "font-bold " +
                            (active ? "text-[#020a1c]" : "text-[#19e3ff]")
                          }
                        >
                          ฿{num.format(minPrice)}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredPackages.length === 0 && (
              <div className="py-8 text-center text-xs font-bold italic text-cyan-100/60">
                {t("noShops")}
              </div>
            )}
          </div>
        </div>

        {/* ตาราง */}
        <div
          className="relative overflow-hidden border-l-4 border-[#19e3ff] bg-[#06173a]"
          style={{
            clipPath:
              "polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%)",
          }}
        >
          {/* แผ่นฟ้ากวาดผ่านตอนเปลี่ยนมุมมอง */}
          <div key={`wipe-${viewKey}`} aria-hidden className="p3-wipe" />

          <div className="flex flex-wrap items-end justify-between gap-2 px-4 pb-3 pt-4">
            <h2
              key={`title-${viewKey}`}
              className="p3-clip-in py-1 text-xl font-black italic leading-[1.4] sm:text-2xl"
              style={{ animationDelay: "120ms" }}
            >
              {game.name}
              <span className="ml-3 text-[#19e3ff]">{pkg.packageName}</span>
            </h2>
            <span className="font-mono text-xs tabular-nums text-cyan-100/60">
              {int.format(pkg.basePoints)} {t("pointsUnit")}
            </span>
          </div>

          {/* สำหรับจอคอมและแท็บเล็ต: แสดงเป็นตาราง Table */}
          <div className="hidden overflow-x-auto pb-6 sm:block">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr className="border-y border-[#19e3ff]/40 text-xs font-bold italic text-[#19e3ff]">
                  <th className="px-4 py-2 text-left">{t("colShop")}</th>
                  <th className="px-4 py-2 text-right">{t("colPrice")}</th>
                  <th className="px-4 py-2 text-right">{t("colBonus")}</th>
                  <th className="px-4 py-2 text-right">{t("colPpu")}</th>
                  <th className="w-px px-4 py-2" />
                </tr>
              </thead>
              <tbody key={`desktop-${viewKey}`}>
                {pkg.listings.map((l, i) => {
                  const otherPrices = pkg.listings.filter((item) => item.id !== l.id && item.inStock);
                  const secondBestPrice = otherPrices.length > 0 ? Math.min(...otherPrices.map((o) => o.salePrice)) : null;
                  const savings = l.id === bestId && secondBestPrice && secondBestPrice > l.salePrice ? secondBestPrice - l.salePrice : 0;

                  return (
                    <Row
                      key={l.id}
                      l={l}
                      i={i}
                      best={l.id === bestId}
                      savings={savings}
                    />
                  );
                })}
              </tbody>
            </table>

            {pkg.listings.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-cyan-100/60">
                {t("noShops")}
              </div>
            )}
          </div>

          {/* สำหรับจอมือถือ (Smartphones): แสดงเป็น P3R Battle Cards เรียงลงมาตามแนวตั้ง ไม่ต้องเลื่อนซ้ายขวา */}
          <div key={`mobile-${viewKey}`} className="space-y-3 p-4 sm:hidden">
            {pkg.listings.map((l, i) => {
              const best = l.id === bestId;
              const otherPrices = pkg.listings.filter((item) => item.id !== l.id && item.inStock);
              const secondBestPrice = otherPrices.length > 0 ? Math.min(...otherPrices.map((o) => o.salePrice)) : null;
              const savings = best && secondBestPrice && secondBestPrice > l.salePrice ? secondBestPrice - l.salePrice : 0;

              return (
                <div
                  key={l.id}
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)",
                  }}
                  className={
                    "relative p-3.5 transition-all " +
                    (best
                      ? "p3-shine border border-[#19e3ff] bg-[#19e3ff]/15 shadow-[0_0_16px_rgba(25,227,255,0.3)]"
                      : "border border-[#19e3ff]/20 bg-[#06173a]/80")
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{l.shop.name}</span>
                        {best && (
                          <span className="-skew-x-12 bg-[#19e3ff] px-2 py-0.5 text-[10px] font-black italic text-[#020a1c]">
                            {t("best")}
                          </span>
                        )}
                      </div>
                      {l.promoLabel && (
                        <div className="mt-1 text-xs text-cyan-100/70">{l.promoLabel}</div>
                      )}
                    </div>

                    <div className="text-right font-mono tabular-nums">
                      <div className="text-lg font-black text-white">฿{num.format(l.salePrice)}</div>
                      {l.originalPrice > l.salePrice && (
                        <div className="text-xs text-cyan-100/50 line-through">฿{num.format(l.originalPrice)}</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#19e3ff]/20 pt-2.5 text-xs">
                    <div className="font-mono text-cyan-100/80">
                      PPU: <span className="font-bold text-[#19e3ff]">{ppuFmt.format(l.effectivePpu)}</span> ฿/แต้ม
                    </div>

                    {savings > 0 && (
                      <span className="text-[11px] font-bold text-emerald-400">
                        {t("saveAmount")} ฿{num.format(savings)}!
                      </span>
                    )}
                  </div>

                  <a
                    href={l.shop.baseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      "mt-3 block w-full -skew-x-12 py-2 text-center text-xs font-black italic transition-transform active:scale-95 " +
                      (best ? "bg-[#19e3ff] text-[#020a1c]" : "bg-white text-[#020a1c]")
                    }
                  >
                    <span className="inline-block skew-x-12 uppercase">{t("goToShop")}</span>
                  </a>
                </div>
              );
            })}

            {pkg.listings.length === 0 && (
              <div className="py-8 text-center text-xs font-bold text-cyan-100/60">
                {t("noShops")}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/** ตัวเลขนับขึ้นจาก 0 ไปค่าจริง (ข้ามถ้าผู้ใช้ตั้งค่าลดการเคลื่อนไหว) */
function CountUp({
  value,
  format,
  delay = 0,
}: {
  value: number;
  format: (n: number) => string;
  delay?: number;
}) {
  const [v, setV] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(value);
      return;
    }
    let raf = 0;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / 650, 1);
        setV(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, delay]);

  return <>{format(v)}</>;
}

function Row({
  l,
  i,
  best,
  savings = 0,
}: {
  l: Listing;
  i: number;
  best: boolean;
  savings?: number;
}) {
  const { t } = useLang();
  const discounted = l.originalPrice > l.salePrice;
  const sub = [
    l.promoLabel, // ข้อความโปรมาจากฐานข้อมูล จึงไม่แปล
    l.isFirstTimeOnly ? t("firstTimeOnly") : null,
    !l.inStock ? t("outOfStock") : null,
  ].filter(Boolean);

  const rowCls = best
    ? "p3-shine bg-[#19e3ff] text-[#020a1c]"
    : "border-b border-[#19e3ff]/15 hover:bg-[#19e3ff]/5 " +
      (l.inStock ? "" : "opacity-45");
  const muted = best ? "text-[#020a1c]/70" : "text-cyan-100/60";

  return (
    <tr
      className={`p3-row p3-row-in ${rowCls}`}
      style={{ "--i": i } as CSSProperties}
    >
      {/* ร้านค้า — ชิดซ้าย */}
      <td className="px-4 py-3 text-left align-middle">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-bold">{l.shop.name}</span>
        </div>
        {sub.length > 0 && (
          <div className={"mt-0.5 text-xs leading-relaxed " + muted}>
            {sub.join(" · ")}
          </div>
        )}
      </td>

      {/* ราคา — ชิดขวา พร้อมป้ายเซฟไปเท่าไหร่ */}
      <td className="px-4 py-3 text-right align-middle font-mono tabular-nums">
        <div className="flex flex-col items-end">
          <div className="font-bold text-base">
            <CountUp value={l.salePrice} format={num.format} delay={i * 55 + 180} />
          </div>
          {savings > 0 && (
            <span className="mt-0.5 -skew-x-12 bg-[#020a1c] px-1.5 py-0.5 text-[10px] font-sans font-black italic text-emerald-400">
              <span className="inline-block skew-x-12">
                {t("saveAmount")} ฿{num.format(savings)}!
              </span>
            </span>
          )}
          {discounted && (
            <div className={"text-xs line-through " + muted}>
              {num.format(l.originalPrice)}
            </div>
          )}
        </div>
      </td>

      {/* แต้มแถม — ชิดขวา */}
      <td className="px-4 py-3 text-right align-middle font-mono tabular-nums">
        {l.bonusPoints > 0 ? `+${int.format(l.bonusPoints)}` : "—"}
      </td>

      {/* PPU — ชิดขวา */}
      <td className="px-4 py-3 text-right align-middle font-mono tabular-nums">
        <div className="flex items-center justify-end gap-2">
          {best && (
            <span
              className="p3-stamp inline-block"
              style={{ "--i": i } as CSSProperties}
            >
              <span
                className="inline-block -skew-x-12 px-3 py-0.5"
                style={{ background: NAVY }}
              >
                <span
                  className="inline-block skew-x-12 whitespace-nowrap font-sans text-[11px] font-bold italic leading-snug"
                  style={{ color: CYAN }}
                >
                  {t("best")}
                </span>
              </span>
            </span>
          )}
          <span className="text-base font-bold">
            <CountUp
              value={l.effectivePpu}
              format={ppuFmt.format}
              delay={i * 55 + 180}
            />
          </span>
        </div>
      </td>

      {/* ปุ่ม — hover แล้วมีแผ่นสีกวาดเข้ามาจากซ้าย */}
      <td className="px-4 py-3 text-right align-middle">
        <a
          href={l.shop.baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t("goToShopAria")} ${l.shop.name}`}
          className={
            "group relative inline-block -skew-x-12 overflow-hidden px-5 py-2 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-90 " +
            (best ? "bg-[#020a1c] text-white" : "bg-white text-[#020a1c]")
          }
        >
          <span
            aria-hidden
            className={
              "absolute inset-0 -translate-x-full transition-transform duration-200 ease-out group-hover:translate-x-0 group-focus-visible:translate-x-0 " +
              (best ? "bg-white" : "bg-[#19e3ff]")
            }
          />
          <span
            className={
              "relative inline-block skew-x-12 whitespace-nowrap text-sm font-bold italic leading-snug transition-colors " +
              (best ? "group-hover:text-[#020a1c]" : "")
            }
          >
            {t("goToShop")}
          </span>
        </a>
      </td>
    </tr>
  );
}