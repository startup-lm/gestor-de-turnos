"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { Service } from "@/lib/types/Services";
import logo from "@/public/images/logo.png";

interface Props {
  initialService: Service;
}

/** Detalle público de un servicio. La edición vive en /admin. */
export default function ServicioDetailClient({ initialService: service }: Readonly<Props>) {
  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 md:px-8 py-8 md:py-12">
      <Link
        href="/servicios"
        className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:underline mb-8 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a servicios
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
        <div className="lg:col-span-6">
          <div className="relative aspect-square w-full max-w-lg mx-auto rounded-3xl overflow-hidden border border-[var(--foreground)]/10 bg-gradient-to-b from-[var(--foreground)]/5 to-[var(--foreground)]/2 backdrop-blur-md shadow-2xl">
            <Image
              src={service.image || logo}
              alt={service.name}
              fill
              className={`transition-all duration-500 hover:scale-105 ${!service.image ? "object-contain p-12" : "object-cover"}`}
              priority
            />
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
              <Clock className="w-3.5 h-3.5" />
              {service.duration || 30} minutos
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Disponible
            </span>
          </div>

          <h2 className="text-4xl font-extrabold text-[var(--foreground)] tracking-tight">
            {service.name}
          </h2>

          <div className="text-3xl font-extrabold text-[var(--accent)]">
            ${service.price.toLocaleString("es-AR")}
          </div>

          <p className="text-base text-[var(--foreground)]/70 leading-relaxed">
            {service.description}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Link
              href={`/turnos?service=${service.id}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[var(--accent)] text-black font-bold text-base hover:opacity-90 transition-all shadow-xl shadow-[var(--accent)]/15"
            >
              Reservar turno con este servicio
            </Link>
            <Link
              href="/servicios"
              className="inline-flex items-center justify-center px-6 py-4 rounded-2xl border border-[var(--foreground)]/10 text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5 font-semibold text-base transition-colors"
            >
              Ver todos los servicios
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
