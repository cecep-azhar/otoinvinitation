import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // allow production build even if ESLint warnings exist
    ignoreDuringBuilds: true,
  },
  typescript: {
    // allow production build even if TS errors (remove after fixing all types)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
