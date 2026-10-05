import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const revalidate = 0; // หน้า Dashboard ดึงข้อมูลสดทุกครั้งที่เปิดดู

export default async function DashboardPage() {
  type ClickItem = {
    id: string;
    gameSlug: string;
    gameName: string;
    shopName: string;
    packageName: string;
    salePrice: number;
    createdAt: Date;
  };

  let clicks: ClickItem[] = [];
  try {
    // 1. ดึงข้อมูลคลิกทั้งหมด
    clicks = (await prisma.clickLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // แสดง 100 คลิกประวัติล่าสุด
    })) as unknown as ClickItem[];
  } catch (error) {
    console.error("Dashboard DB fetch error:", error);
  }

  const totalClicks = clicks.length;

  // 2. สรุปยอดคลิกแยกตามร้านค้า
  const shopStatsMap: Record<string, number> = {};
  // 3. สรุปยอดคลิกแยกตามเกม
  const gameStatsMap: Record<string, number> = {};

  for (const c of clicks) {
    shopStatsMap[c.shopName] = (shopStatsMap[c.shopName] || 0) + 1;
    gameStatsMap[c.gameName] = (gameStatsMap[c.gameName] || 0) + 1;
  }

  const topShops = Object.entries(shopStatsMap).sort((a, b) => b[1] - a[1]);
  const topGames = Object.entries(gameStatsMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-[#020a1c] text-white p-4 sm:p-8 font-sans antialiased">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#19e3ff]/30 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-4 w-1 -skew-x-12 bg-[#19e3ff]" />
              <h1 className="text-2xl font-black italic tracking-wide text-white">
                ANALYTICS DASHBOARD <span className="text-[#19e3ff] text-sm font-normal">// LIVE TRAFFIC</span>
              </h1>
            </div>
            <p className="mt-1 text-xs text-cyan-100/60 font-mono">
              สถิติการคลิกไปร้านค้า & ความสนใจในแต่ละเกมจากผู้ใช้งานจริง
            </p>
          </div>

          <Link
            href="/"
            className="-skew-x-12 border border-[#19e3ff]/40 bg-[#06173a] px-4 py-2 text-xs font-black italic text-[#19e3ff] hover:bg-[#19e3ff] hover:text-[#020a1c] transition-colors"
          >
            ◀ กลับหน้าหลัก
          </Link>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-[#19e3ff]/20 bg-[#06173a]/80 p-5 shadow-[0_0_15px_rgba(25,227,255,0.05)]">
            <span className="text-xs font-mono text-cyan-100/60 uppercase">ยอดคลิกไปร้านค้าทั้งหมด</span>
            <div className="mt-2 text-3xl font-black text-[#19e3ff] font-mono">{totalClicks.toLocaleString()}</div>
            <div className="mt-1 text-[11px] text-cyan-100/40">Total Outbound Clicks</div>
          </div>

          <div className="border border-[#19e3ff]/20 bg-[#06173a]/80 p-5 shadow-[0_0_15px_rgba(25,227,255,0.05)]">
            <span className="text-xs font-mono text-cyan-100/60 uppercase">ร้านค้าที่ถูกคลิกมากที่สุด</span>
            <div className="mt-2 text-2xl font-black text-white truncate">
              {topShops[0] ? topShops[0][0] : "—"}
            </div>
            <div className="mt-1 text-[11px] text-emerald-400 font-bold">
              {topShops[0] ? `${topShops[0][1]} ครั้ง (${Math.round((topShops[0][1] / totalClicks) * 100)}%)` : "ยังไม่มีข้อมูล"}
            </div>
          </div>

          <div className="border border-[#19e3ff]/20 bg-[#06173a]/80 p-5 shadow-[0_0_15px_rgba(25,227,255,0.05)]">
            <span className="text-xs font-mono text-cyan-100/60 uppercase">เกมยอดนิยม</span>
            <div className="mt-2 text-2xl font-black text-white truncate">
              {topGames[0] ? topGames[0][0] : "—"}
            </div>
            <div className="mt-1 text-[11px] text-[#19e3ff] font-bold">
              {topGames[0] ? `${topGames[0][1]} ครั้ง` : "ยังไม่มีข้อมูล"}
            </div>
          </div>
        </div>

        {/* Breakdown Sections: Top Shops & Top Games */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Shops Breakdown */}
          <div className="border border-[#19e3ff]/30 bg-[#06173a]/60 p-5">
            <div className="flex items-center gap-2 border-b border-[#19e3ff]/20 pb-3 mb-4">
              <span className="h-3 w-1 bg-[#19e3ff]" />
              <h2 className="text-sm font-black italic text-[#19e3ff] tracking-wide">
                TOP SHOPS // สรุปตามร้านค้า
              </h2>
            </div>

            {topShops.length === 0 ? (
              <p className="text-xs text-cyan-100/40 py-6 text-center">ยังไม่มีข้อมูลการคลิก</p>
            ) : (
              <div className="space-y-3">
                {topShops.map(([shop, count], idx) => {
                  const pct = Math.round((count / totalClicks) * 100);
                  return (
                    <div key={shop} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold flex items-center gap-2">
                          <span className="font-mono text-[#19e3ff]">#{idx + 1}</span>
                          {shop}
                        </span>
                        <span className="font-mono text-cyan-100/70">
                          {count} ครั้ง ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#020a1c] overflow-hidden">
                        <div
                          className="h-full bg-[#19e3ff] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Games Breakdown */}
          <div className="border border-[#19e3ff]/30 bg-[#06173a]/60 p-5">
            <div className="flex items-center gap-2 border-b border-[#19e3ff]/20 pb-3 mb-4">
              <span className="h-3 w-1 bg-[#19e3ff]" />
              <h2 className="text-sm font-black italic text-[#19e3ff] tracking-wide">
                GAMES INTEREST // สรุปตามเกม
              </h2>
            </div>

            {topGames.length === 0 ? (
              <p className="text-xs text-cyan-100/40 py-6 text-center">ยังไม่มีข้อมูลการคลิก</p>
            ) : (
              <div className="space-y-3">
                {topGames.map(([gName, count], idx) => {
                  const pct = Math.round((count / totalClicks) * 100);
                  return (
                    <div key={gName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold flex items-center gap-2">
                          <span className="font-mono text-[#19e3ff]">#{idx + 1}</span>
                          {gName}
                        </span>
                        <span className="font-mono text-cyan-100/70">
                          {count} ครั้ง ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#020a1c] overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Click Logs Table */}
        <div className="border border-[#19e3ff]/30 bg-[#06173a]/60 p-5">
          <div className="flex items-center gap-2 border-b border-[#19e3ff]/20 pb-3 mb-4">
            <span className="h-3 w-1 bg-[#19e3ff]" />
            <h2 className="text-sm font-black italic text-[#19e3ff] tracking-wide">
              RECENT LOGS // ประวัติการคลิกล่าสุด
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#19e3ff]/20 text-[#19e3ff]">
                  <th className="py-2.5 px-3">เวลา (Timestamp)</th>
                  <th className="py-2.5 px-3">เกม (Game)</th>
                  <th className="py-2.5 px-3">แพ็กเกจ (Package)</th>
                  <th className="py-2.5 px-3">ร้านค้า (Shop)</th>
                  <th className="py-2.5 px-3 text-right">ราคา (Price)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#19e3ff]/10">
                {clicks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-cyan-100/40">
                      ยังไม่มีประวัติการคลิก
                    </td>
                  </tr>
                ) : (
                  clicks.map((c) => {
                    const time = new Date(c.createdAt).toLocaleString("th-TH", {
                      timeZone: "Asia/Bangkok",
                    });
                    return (
                      <tr key={c.id} className="hover:bg-[#19e3ff]/5">
                        <td className="py-2.5 px-3 text-cyan-100/60">{time}</td>
                        <td className="py-2.5 px-3 font-bold text-white font-sans">{c.gameName}</td>
                        <td className="py-2.5 px-3 text-[#19e3ff]">{c.packageName}</td>
                        <td className="py-2.5 px-3 font-bold text-white font-sans">{c.shopName}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                          ฿{Number(c.salePrice).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
