import Link from "next/link";
import Image from "next/image";
import GoogleMapsLocation from "@/components/nosotros/GoogleMapsLocation";
import { MapPin, ArrowRight, ExternalLink } from "lucide-react";
import localFallback from "@/public/images/local.webp";

interface Props {
  address?: string;
  photo?: string;
}

export default function AboutUsPage({ address, photo }: Readonly<Props>) {
  const displayAddress = address?.trim() || "Obelisco, Buenos Aires, Argentina";
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`;
  const storefrontPhoto = photo || localFallback;

  return (
    <section className="py-8 px-5 sm:px-10 bg-[#0a0f1d]/75 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-[var(--accent)]/30">
      {/* Ambient corner glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[var(--accent)]/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Header section with title and direct actions */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800/60 relative z-10">
        <div className="text-center md:text-left space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <MapPin className="w-5 h-5 text-[var(--accent)] animate-bounce" />
            <h2 className="text-2xl font-bold text-white tracking-wide">
              ¿Dónde estamos?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-md">
            {displayAddress}
          </p>
        </div>

        <a
          href={mapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/30 hover:bg-[var(--accent)] hover:text-slate-950 transition-all duration-300 shadow-sm hover:shadow-[var(--accent)]/20 active:scale-95 group"
        >
          <span>Abrir en Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </div>

      {/* Main Content: 60% Maps / 40% Photo on Desktop. On mobile: Map first, then Photo */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 items-stretch mb-8 relative z-10">
        {/* Google Maps: 60% on desktop (col-span-3), 1st on mobile (order-1) */}
        <div className="order-1 lg:order-2 lg:col-span-3 h-72 sm:h-80 lg:h-96 w-full rounded-2xl overflow-hidden border border-slate-800/90 shadow-inner group hover:border-[var(--accent)]/40 transition-all duration-300 relative">
          <GoogleMapsLocation address={displayAddress} className="w-full h-full" />
        </div>

        {/* Storefront Photo: 40% on desktop (col-span-2), 2nd on mobile (order-2) */}
        <div className="order-2 lg:order-1 lg:col-span-2 relative h-72 sm:h-80 lg:h-96 w-full rounded-2xl overflow-hidden border border-slate-800/90 shadow-xl group hover:border-[var(--accent)]/40 transition-all duration-300 bg-slate-950">
          <Image
            src={storefrontPhoto}
            alt="Nuestro local"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-100"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <span className="px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider uppercase text-white bg-slate-950/70 backdrop-blur-md border border-white/10">
              Nuestro Espacio
            </span>
          </div>
        </div>
      </div>

      {/* Bottom link to Nosotros */}
      <div className="text-center relative z-10">
        <Link
          href="/nosotros"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider hover:text-white transition-colors duration-200 group"
          prefetch
        >
          <span>Conocé más sobre nosotros</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
