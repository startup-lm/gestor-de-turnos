import { redirect } from "next/navigation";

export default function OperacionesFacturacionPage() {
  redirect("/admin?tab=facturas");
}
