import { getServices } from "@/lib/repository/services";
import ServiciosClient from "./ServiciosClient";

export const revalidate = 60;

export default async function ServiciosPage() {
  const services = await getServices();

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-8 w-full max-w-[1720px] mx-auto flex flex-col items-center">
      <div className="text-center mb-10 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
          Nuestros Servicios
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2">
          Cortes clásicos, perfilado de barba con toalla caliente y tratamientos exclusivos
        </p>
      </div>
      <ServiciosClient services={services} />
    </div>
  );
}
