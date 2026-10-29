import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs/config";
import packageJson from "./package.json";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const host = supabaseUrl ? new URL(supabaseUrl).hostname : "localhost";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: host,
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
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
  experimental: {
    optimizePackageImports: ["lucide-react", "react-icons", "date-fns"],
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

const analyzedConfig = withBundleAnalyzer(withPWA(nextConfig));

export default withSentryConfig(analyzedConfig, {
  org: "lm2",
  project: "gestor-de-turnos",
  silent: true,
  widenClientFileUpload: true,
});
