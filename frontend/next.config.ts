import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [new URL(process.env.NEXT_PUBLIC_SUPABASE_URL! + "/**")],
  },
};

export default nextConfig;