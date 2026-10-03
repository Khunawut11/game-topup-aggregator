"use client";

import { useLang, type Lang } from "@/lib/i18n";
import { useP3Sound } from "@/lib/sound";

function SoundToggle() {
  const { soundEnabled, toggleSound, playSelect, playHover } = useP3Sound();

  return (
    <button
      onClick={() => {
        toggleSound();
        if (!soundEnabled) playSelect();
      }}
      onMouseEnter={playHover}
      aria-label="Toggle Persona 3 Sound FX"
      title="Toggle Persona 3 Sound FX"
      className={
        "-skew-x-12 px-2.5 py-0.5 text-xs font-black transition-[transform,background-color] focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-90 " +
        (soundEnabled
          ? "border border-[#19e3ff] bg-[#19e3ff]/20 text-[#19e3ff] shadow-[0_0_8px_rgba(25,227,255,0.4)]"
          : "border border-white/20 text-white/40 hover:border-white/50")
      }
    >
      <span className="inline-block skew-x-12 text-[11px] font-mono font-bold">
        {soundEnabled ? "SFX: ON" : "SFX: OFF"}
      </span>
    </button>
  );
}

function LangToggle() {
  const { lang, setLang, t } = useLang();
  const { playSelect, playHover } = useP3Sound();
  const opts: Lang[] = ["th", "en"];

  return (
    <div role="group" aria-label={t("langAria")} className="flex gap-1">
      {opts.map((o) => {
        const active = lang === o;
        return (
          <button
            key={o}
            onClick={() => {
              setLang(o);
              playSelect();
            }}
            onMouseEnter={playHover}
            aria-pressed={active}
            className={
              "-skew-x-12 px-3 py-0.5 transition-[transform,background-color] focus:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-90 " +
              (active
                ? "bg-[#19e3ff] text-[#020a1c]"
                : "border border-[#19e3ff]/50 text-cyan-100 hover:bg-[#19e3ff]/15")
            }
          >
            <span className="inline-block skew-x-12 text-xs font-black">
              {o.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SiteHeader({ updatedIso }: { updatedIso: string | null }) {
  const { lang, t } = useLang();

  const formatted = updatedIso
    ? new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
      }).format(new Date(updatedIso))
    : null;

  return (
    <header className="relative border-b-2 border-[#19e3ff]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="p3-in-left shrink-0">
          <div className="-skew-x-12 bg-white px-4 py-1">
            <span className="p3-glitch inline-block skew-x-12 text-sm font-black italic tracking-tight text-[#020a1c]">
              {t("brand")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-cyan-100/80">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full bg-[#19e3ff] opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 bg-[#19e3ff]" />
            </span>
            {formatted && updatedIso ? (
              <span>
                {t("updatedAt")}{" "}
                <time
                  dateTime={updatedIso}
                  className="font-mono tabular-nums text-white"
                >
                  {formatted}
                </time>
              </span>
            ) : (
              <span>{t("noPriceData")}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SoundToggle />
            <LangToggle />
          </div>
        </div>
      </div>
    </header>
  );
}

/** แถบตัวอักษรวิ่งใต้หัวเว็บ */
export function Ticker() {
  const { t } = useLang();
  const text = t("ticker");

  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-b border-[#19e3ff]/30 bg-[#19e3ff]/10 py-1"
    >
      <div className="p3-marquee flex w-max whitespace-nowrap text-[11px] font-black italic tracking-widest text-[#19e3ff]/80">
        {[0, 1].map((n) => (
          <span key={n} className="flex shrink-0">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="px-4">
                {text}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const { t } = useLang();

  return (
    <div className="relative mb-10">
      <span
        aria-hidden
        className="p3-ghost pointer-events-none absolute right-0 top-0 hidden select-none font-black italic leading-none lg:block"
      >
        VALUE
      </span>

      <div className="relative max-w-2xl">
        <h1 className="text-3xl font-black italic leading-[1.4] tracking-tight sm:text-5xl">
          <span className="p3-clip-in inline-block py-1">
            <span className="inline-block -skew-x-12 bg-[#19e3ff] px-4 text-[#020a1c]">
              <span className="inline-block skew-x-12">{t("heroLine1")}</span>
            </span>
          </span>
          <br />
          <span
            className="p3-in-left inline-block text-white"
            style={{ animationDelay: "180ms" }}
          >
            {t("heroLine2")}
          </span>
        </h1>

        <div className="mt-5 flex items-center gap-3">
          <span className="p3-slash block h-1 w-32 -skew-x-12 bg-[#19e3ff]" />
          <span className="p3-blink block h-2 w-2 bg-white" />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-cyan-100/70 sm:text-base">
          {t("heroDesc")}
        </p>
      </div>
    </div>
  );
}