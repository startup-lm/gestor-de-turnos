import Link from "next/link";
import GoogleMapsLocation from "@/components/nosotros/GoogleMapsLocation";

export default function AboutUsPage() {
  return (
    <section className="p-4 grey-container">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        ¿Dónde estamos? 📍
      </h2>
      <div className="w-full h-48 sm:h-64 mb-4 rounded-lg overflow-hidden border">
        <GoogleMapsLocation />
      </div>
      <div className="text-center">
        <Link href="/nosotros" className="underline" prefetch>
          Conoce más sobre nosotros
        </Link>
      </div>
    </section>
  );
}
