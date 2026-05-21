import Link from "next/link";
import GoogleMapsLocation from "@/components/nosotros/GoogleMapsLocation";
import { MapPin, ArrowRight } from "lucide-react";

export default function AboutUsPage() {
  return (
    <section className="py-8 px-6 sm:px-10 bg-[#0a0f1d]/75 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-[var(--accent)]/30">
      <div className="flex items-center justify-center gap-2 mb-6">
        <MapPin className="w-5 h-5 text-[var(--accent)] animate-bounce" />
        <h2 className="text-2xl font-bold text-white tracking-wide">
          ¿Dónde estamos?
        </h2>
      </div>

      <div className="w-full h-56 sm:h-72 mb-6 rounded-2xl overflow-hidden border border-slate-800 shadow-inner relative z-10">
        <GoogleMapsLocation />
      </div>

      <div className="text-center">
        <Link 
          href="/nosotros" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider hover:text-white transition-colors duration-200 group" 
          prefetch
        >
          Conoce más sobre nosotros
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
