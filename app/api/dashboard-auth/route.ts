import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "Khunawut0938363177";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password === DASHBOARD_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set("dashboard_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // จำการล็อกอินไว้ 30 วัน
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
