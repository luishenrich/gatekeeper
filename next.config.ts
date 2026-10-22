import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js treats `_folder` as private (not routable). Keep contract URLs
  // `/api/_mock/*` via rewrite onto `/api/mock/*`.
  async rewrites() {
    return [
      {
        source: "/api/_mock/:path*",
        destination: "/api/mock/:path*",
      },
    ];
  },
};

export default nextConfig;
