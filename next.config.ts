import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

const nextConfig: NextConfig = {
  images: {
    // 1) Limita exactamente qué URLs se optimizan (solo Storage)
    remotePatterns: [
      {
        protocol: "https",
        hostname: host,
        pathname: "/storage/v1/object/**",
      },
    ],
    // 2) Un solo formato (evita duplicar trabajo)
    formats: ["image/webp"],
    // 3) Reduce los posibles anchos a los que realmente usa tu UI
    deviceSizes: [360, 768, 1200], // ajustá a tus breakpoints reales
    imageSizes: [64, 128, 256],    // thumbs/iconos reales
    // 4) Sube el TTL para disminuir revalidaciones/escrituras
    minimumCacheTTL: 2678400, // 31 días
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack(config, { dev }) {
    if (!dev) config.devtool = false;
    return config;
  },
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

export default withPWA(nextConfig);
