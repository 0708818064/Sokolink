import net from "node:net";
if (net.setDefaultAutoSelectFamily) {
  net.setDefaultAutoSelectFamily(false);
}
import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "10.202.146.182:3000",
        "0.0.0.0:3000",
        "*.vercel.app",
      ],
    },
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) return [];
    const normalized = backendUrl.replace(/\/+$/, "");
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${normalized}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
