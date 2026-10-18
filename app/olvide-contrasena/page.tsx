import { Metadata } from "next";
import OlvideContrasenaClient from "./OlvideContrasenaClient";

export const metadata: Metadata = {
  title: "Recuperar Contraseña | Barbería",
  description: "Restablece tu contraseña de acceso a la barbería.",
};

export default function OlvideContrasenaPage() {
  return <OlvideContrasenaClient />;
}
