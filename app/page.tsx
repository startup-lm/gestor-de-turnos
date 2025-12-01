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
    <main className="bg-[var(--background)] text-[var(--foreground)] space-y-12 px-4">
      <Hero />
      <div className="max-w-4xl mx-auto space-y-12">
        <HomeCarousel type="servicios" items={services} />
        <HomeCarousel type="productos" items={products} />
        <AboutUs />
      </div>
    </main>
  );
}
