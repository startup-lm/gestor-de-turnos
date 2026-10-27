import { getServices } from "@/lib/repository/services";
import ServiciosClient from "./ServiciosClient";

export const revalidate = 60;

export default async function ServiciosPage() {
  const services = await getServices();

  return (
    <div className="min-h-screen py-8 md:py-12 px-4 md:px-8 w-full max-w-[1720px] mx-auto flex flex-col items-center">
      <ServiciosClient services={services} />
    </div>
  );
}
