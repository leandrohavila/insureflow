import type { NextConfig } from "next";

import { LEGACY_PORTAL_HOSTS, OFFICIAL_PORTAL_ORIGIN } from "./lib/site";

const apiBase = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"
).replace(/\/$/, "");

const redirectHosts = ["www.grupoavilaimoveis.com.br", ...LEGACY_PORTAL_HOSTS];

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return redirectHosts.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${OFFICIAL_PORTAL_ORIGIN}/:path*`,
      permanent: true,
    }));
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBase}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
