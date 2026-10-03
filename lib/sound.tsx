"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type SoundContextType = {
  soundEnabled: boolean;
  toggleSound: () => void;
  playHover: () => void;
  playSelect: () => void;
  playWipe: () => void;
};

const SoundContext = createContext<SoundContextType | null>(null);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("p3_sound_enabled");
      if (saved !== null) {
        setSoundEnabled(saved === "true");
      }
    } catch {}
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioCtx) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioCtx(ctx);
      return ctx;
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }, [audioCtx]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("p3_sound_enabled", String(next));
      } catch {}
      return next;
    });
  }, []);

  /** เสียงติ๊กคมๆ สไตล์ Persona 3 ตอนชี้เมนู (High-frequency Tick) */
  const playHover = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.035);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  }, [soundEnabled, getAudioContext]);

  /** เสียงกดเลือกยืนยัน (Confirmation Chime / Blip) */
  const playSelect = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Pulse 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08); // D6
      gain1.gain.setValueAtTime(0.09, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.09);

      // Pulse 2: Accent chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1760, now + 0.03); // A6
      gain2.gain.setValueAtTime(0.06, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.03);
      osc2.stop(now + 0.12);
    } catch {}
  }, [soundEnabled, getAudioContext]);

  /** เสียงกวาดฉาก (Wipe Swish) */
  const playWipe = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.12);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }, [soundEnabled, getAudioContext]);

  return (
    <SoundContext.Provider
      value={{ soundEnabled, toggleSound, playHover, playSelect, playWipe }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useP3Sound() {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    return {
      soundEnabled: false,
      toggleSound: () => {},
      playHover: () => {},
      playSelect: () => {},
      playWipe: () => {},
    };
  }
  return ctx;
}
