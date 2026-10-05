"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DashboardAuth() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/dashboard-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020a1c] p-4 text-white">
      <div
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
        }}
        className="w-full max-w-md border border-[#19e3ff]/40 bg-[#06173a] p-8 shadow-[0_0_30px_rgba(25,227,255,0.2)]"
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-4 w-1 -skew-x-12 bg-[#19e3ff]" />
              <span className="text-xs font-black italic tracking-widest text-[#19e3ff]">
                RESTRICTED // SECURITY GATE
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black italic tracking-wide text-white">
              ADMIN ACCESS
            </h1>
            <p className="mt-1 text-xs text-cyan-100/60 font-mono">
              กรุณาใส่รหัสผ่านเพื่อเข้าสู่ระบบแดชบอร์ดสถิติ
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ENTER PASSCODE..."
                autoFocus
                className="w-full border border-[#19e3ff]/40 bg-[#020a1c] px-4 py-3 font-mono text-sm tracking-wider text-white placeholder-cyan-100/30 transition-colors focus:border-[#19e3ff] focus:outline-none focus:ring-1 focus:ring-[#19e3ff]"
              />
              {error && (
                <p className="mt-2 text-xs font-bold text-red-400">
                  ⚠️ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
              }}
              className="w-full -skew-x-12 bg-[#19e3ff] py-3 text-center text-xs font-black italic tracking-wider text-[#020a1c] transition-all hover:bg-white active:scale-95 disabled:opacity-50"
            >
              <span className="inline-block skew-x-12 uppercase">
                {loading ? "AUTHENTICATING..." : "UNLOCK DASHBOARD ▶"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
