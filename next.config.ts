import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false, // ปิด Header X-Powered-By เพื่อไม่ให้เปิดเผยเทคโนโลยีที่ใช้
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // ป้องกัน Clickjacking จากการถูกฝังใน <iframe> เว็บอื่น
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // ป้องกัน MIME-type sniffing
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
