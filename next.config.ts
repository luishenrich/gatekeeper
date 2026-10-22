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
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/node-fetch\/lib\/index\.js/ },
      { module: /node_modules\/punycode/ },
    ];
    return config;
  },
};

export default nextConfig;
