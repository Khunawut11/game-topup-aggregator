const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

const SHARDS = [
  { l: "6%", s: 14, d: 0, t: 11 },
  { l: "19%", s: 8, d: 3, t: 14 },
  { l: "37%", s: 18, d: 6, t: 12 },
  { l: "55%", s: 10, d: 1.5, t: 16 },
  { l: "72%", s: 16, d: 4, t: 13 },
  { l: "88%", s: 9, d: 8, t: 15 },
];

/** ฉากหลัง: ดวงจันทร์ + นาฬิกา Dark Hour + เศษคริสตัลลอยขึ้น */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="p3-vignette absolute inset-0" />
      <div className="p3-moon absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full" />

      {/* นาฬิกาโรมัน มุมซ้ายล่าง */}
      <div className="absolute -bottom-40 -left-40 h-[40rem] w-[40rem] text-[#19e3ff] opacity-30">
        <svg viewBox="-200 -200 400 400" className="p3-spin-slow absolute inset-0 h-full w-full">
          <circle r="190" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle r="145" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 6" />
          {ROMAN.map((r, i) => (
            <text
              key={r}
              transform={`rotate(${i * 30}) translate(0 -163)`}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="18"
              fontWeight="900"
              fontStyle="italic"
              fill="currentColor"
            >
              {r}
            </text>
          ))}
        </svg>
        <svg viewBox="-200 -200 400 400" className="p3-spin-rev absolute inset-0 h-full w-full">
          {Array.from({ length: 60 }, (_, i) => (
            <line
              key={i}
              x1="0"
              y1="-125"
              x2="0"
              y2={i % 5 === 0 ? -108 : -116}
              stroke="currentColor"
              strokeWidth={i % 5 === 0 ? 2 : 1}
              transform={`rotate(${i * 6})`}
            />
          ))}
        </svg>
        <svg viewBox="-200 -200 400 400" className="p3-tick absolute inset-0 h-full w-full">
          <line x1="0" y1="14" x2="0" y2="-120" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>

      {SHARDS.map((s, i) => (
        <span
          key={i}
          className="p3-shard absolute bg-[#19e3ff]/40"
          style={{
            left: s.l,
            width: s.s,
            height: s.s,
            animationDuration: `${s.t}s`,
            animationDelay: `-${s.d}s`,
          }}
        />
      ))}
    </div>
  );
}

/** ม่านสามชั้น (ฟ้า/ขาว/กรมท่า) กวาดผ่านจอตอนโหลดหน้า */
export function Curtain() {
  return (
    <div aria-hidden className="p3-curtain pointer-events-none fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#19e3ff]" />
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 flex items-center justify-center bg-[#020a1c]">
        <span className="-skew-x-12 text-4xl font-black italic tracking-tight text-[#19e3ff] sm:text-6xl">
          TOPUP COMPARE
        </span>
      </div>
    </div>
  );
}