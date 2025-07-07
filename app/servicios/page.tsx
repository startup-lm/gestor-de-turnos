import { getServices } from "@/lib/repository/services";
import ServiciosClient from "./ServiciosClient";

export const revalidate = 60;

export default async function ServiciosPage() {
  const services = await getServices();

  return (
    <div className="p-5 flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-5">Nuestros Servicios</h1>
      <ServiciosClient services={services} />
    </div>
  );
}
