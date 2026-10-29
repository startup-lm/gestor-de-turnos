import AboutUs from "@/components/home/AboutUs";
import Hero from "@/components/home/Hero";
import HomeCarousel from "@/components/home/HomeCarousel";
import GoogleReviewsSection from "@/components/reviews/GoogleReviewsSection";
import { getProducts } from "@/lib/repository/products";
import { getServices } from "@/lib/repository/services";
import { getBusinessSettings } from "@/lib/repository/businessSettings";
import { isFeatureEnabled } from "@/lib/flags";

export const revalidate = 60;

export default async function HomePage() {
  const [rawServices, rawProducts, settings] = await Promise.all([
    getServices(),
    getProducts(),
    getBusinessSettings(),
  ]);

  const services = rawServices.map(({ id, name, image }) => ({ id, name, image }));
  const products = rawProducts.map(({ id, name, image }) => ({ id, name, image }));

  const isReviewsEnabled = isFeatureEnabled("google_reviews", settings?.features);
  const showHomeReviews =
    isReviewsEnabled &&
    settings?.google_reviews?.enabled !== false &&
    settings?.google_reviews?.show_in_home !== false;

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)] pb-20 relative overflow-hidden">
      {/* Ambient background glows across the wide layout */}
      <div className="absolute top-[10%] -left-40 w-[550px] h-[550px] bg-[var(--accent)]/5 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-[45%] -right-40 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute top-[80%] -left-40 w-[550px] h-[550px] bg-[var(--accent)]/5 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 space-y-8 sm:space-y-12 relative z-10 pt-4 sm:pt-6">
        {/* HERO: Impactful full-width banner within max-w-[1720px] */}
        <Hero />

        {/* CAROUSELS: Servicios & Productos side-by-side in 1 row on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          <HomeCarousel type="servicios" items={services} sideBySide />
          <HomeCarousel type="productos" items={products} sideBySide />
        </div>

        {/* LOCAL INFO: Storefront Photo (40%) & Google Maps (60%) */}
        <AboutUs address={settings?.location_address} photo={settings?.local_photo} />

        {/* REVIEWS: Opiniones de Google oficiales (si la feature flag y los settings están activos) */}
        {showHomeReviews && (
          <GoogleReviewsSection config={settings?.google_reviews} />
        )}
      </div>
    </main>
  );
}
