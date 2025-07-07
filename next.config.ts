import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "efhmsbsxdsyiydcxbuid.supabase.co",
      "ptiogpplnhwootvybfsi.supabase.co",
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack(config, { dev }) {
    if (!dev) {
      config.devtool = false;
    }
    return config;
  },
};

export default nextConfig;
