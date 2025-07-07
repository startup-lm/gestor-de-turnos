import {FaInstagram,FaWhatsapp,FaFacebook,FaEnvelope,} from "react-icons/fa";
import { buildWhatsAppUrl, DEFAULT_PHONE } from "@/utils/whatsapp";

export const socialMediaList = [
  {
    name: "instagram",
    Icon: FaInstagram,
    url: "https://instagram.com/hooligansbarberia_",
    text: "Contáctanos por Instagram",
  },
  {
    name: "whatsapp",
    Icon: FaWhatsapp,
    url: buildWhatsAppUrl(
      DEFAULT_PHONE,
      "Hola! Quiero reservar un turno."
    ),
    text: "Contáctanos por WhatsApp",
  },
  {
    name: "facebook",
    Icon: FaFacebook,
    url: "https://www.facebook.com/profile.php?id=61561324966379",
    text: "Contáctanos por Facebook",
  },
  {
    name: "gmail",
    Icon: FaEnvelope,
    url:
      "mailto:hooligansbarberia1@gmail.com?subject=Consulta%20de%20turno&body=Hola%2C%20quiero%20consultar%20por%20un%20turno%20en%20la%20barbería.",
    text: "Contáctanos por Gmail",
  },
];
