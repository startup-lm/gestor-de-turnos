import AboutUs from "@/components/home/AboutUs";
import Hero from "@/components/home/Hero";
import HomeCarousel from "@/components/home/HomeCarousel";
import { getProducts } from "@/lib/repository/products";
import { getServices } from "@/lib/repository/services";

export const revalidate = 60;

export default async function HomePage() {
  const [rawServices, rawProducts] = await Promise.all([getServices(), getProducts(),]);
  const services = rawServices.map(({ id, name, image }) => ({ id, name, image, }));
  const products = rawProducts.map(({ id, name, image }) => ({ id, name, image, }));

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)] space-y-16 px-4 pb-16 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-[20%] -left-40 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[50%] -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[80%] -left-40 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-[130px] pointer-events-none z-0" />

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        <Hero />
        <HomeCarousel type="servicios" items={services} />
        <HomeCarousel type="productos" items={products} />
        <AboutUs />
      </div>
    </main>
  );
}
