import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    // หากไม่มีการตั้งค่า DASHBOARD_PASSWORD ในระบบ ไม่อนุญาตให้ล็อกอินเพื่อความปลอดภัย
    if (!DASHBOARD_PASSWORD) {
      console.error("DASHBOARD_PASSWORD is not configured in environment variables.");
      return NextResponse.json(
        { error: "Server authentication is not configured" },
        { status: 500 }
      );
    }

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
