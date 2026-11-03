import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "@/styles/globals.css";
import ClientProviders from "@/components/providers/ClientProviders";
import { getCalendarConfig } from "@/lib/repository/calendar";
import { PRODUCT_NAME } from "@/lib/brand";

export const revalidate = 60;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export async function generateMetadata(): Promise<Metadata> {
  const { businessSettings } = await getCalendarConfig();
  const name = businessSettings?.business_name?.trim() || PRODUCT_NAME;
  return {
    title: name,
    description: "Sistema de gestión y reserva de turnos",
    icons: {
      icon: "/icon-192x192.png",
      apple: "/icon-192x192.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialConfig = await getCalendarConfig();
  const colors = initialConfig.businessSettings?.theme_colors;

  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        {colors && (
          <style
            dangerouslySetInnerHTML={{
              __html: `
                :root {
                  ${colors.background ? `--background: ${colors.background} !important;` : ""}
                  ${colors.foreground ? `--foreground: ${colors.foreground} !important;` : ""}
                  ${colors.primary ? `--primary: ${colors.primary} !important;` : ""}
                  ${colors.secondary ? `--secondary: ${colors.secondary} !important;` : ""}
                  ${colors.accent ? `--accent: ${colors.accent} !important;` : ""}
                }
              `,
            }}
          />
        )}
      </head>
      <body className="flex flex-col min-h-screen">
        <ClientProviders initialConfig={initialConfig}>{children}</ClientProviders>
      </body>
    </html>
  );
}