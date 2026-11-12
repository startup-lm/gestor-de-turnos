import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs/config";
import packageJson from "./package.json";
import { buildCspReportOnly } from "./lib/security/csp";

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: buildCspReportOnly({
              supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
              sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
            }),
          },
        ],
      },
    ];
  },
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
