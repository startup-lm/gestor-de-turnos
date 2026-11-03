import type { MetadataRoute } from "next";
import { getCalendarConfig } from "@/lib/repository/calendar";
import { PRODUCT_NAME } from "@/lib/brand";

export const revalidate = 60;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { businessSettings } = await getCalendarConfig();
  const name = businessSettings?.business_name?.trim() || PRODUCT_NAME;
  return {
    name,
    short_name: name,
    description: `Reservá tu turno en ${name}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
