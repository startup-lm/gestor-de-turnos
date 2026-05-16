import { getBarbers } from "@/lib/repository/barbers";
import BarberCard from "@/components/nosotros/BarberCard";
import BarberSocialMedia from "@/components/nosotros/BarberSocialMedia";
import GoogleMapsLocation from "@/components/nosotros/GoogleMapsLocation";
import { getBusinessSettings } from "@/lib/repository/businessSettings";
import { FaInstagram, FaFacebook, FaTiktok, FaWhatsapp, FaLink } from "react-icons/fa";
import Image from "next/image";
import local from "@/public/images/local.png";

export const revalidate = 60;

export default async function NosotrosPage() {
  const [barbers, settings] = await Promise.all([getBarbers(), getBusinessSettings()]);
  
  const iconMap: Record<string, React.ReactNode> = {
    instagram: <FaInstagram size={30} className="inline-block" />,
    facebook: <FaFacebook size={30} className="inline-block" />,
    tiktok: <FaTiktok size={30} className="inline-block" />,
    whatsapp: <FaWhatsapp size={30} className="inline-block" />,
  };
  
  const ourStory = settings.our_story || [
    'Todo empezó en 2016, cuando armé una silla, un espejo y mi primera máquina en el garage de mi casa. Lo que arrancó como un hobby pronto se transformó en una pasión: brindar buenos cortes, charlas relajadas y un espacio donde todos se sintieran cómodos.',
    'Con el tiempo, esa pequeña idea creció y dio lugar a este lugar, pensado para que cada visita sea una experiencia. Acá no se trata solo de cortarte el pelo o arreglarte la barba: se trata de dedicarte tiempo, escucharte y cuidar cada detalle.',
    'Te esperamos para que disfrutes de un buen corte, un afeitado prolijo y un rato de desconexión de la rutina.'
  ];
  
  const activeSocials = (settings.social_media || []).filter(s => s.active);

  return (
    <div className="p-5 flex flex-col items-center text-center">
      <h1 className="text-3xl font-bold mb-5">Sobre Nosotros</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
        <section className="h-full flex flex-col bg-[var(--bg-carousel)] p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Nuestros Barberos</h2>
          <div className="flex flex-wrap gap-4 justify-center flex-1 overflow-auto">
            {barbers.map((barber) => (
              <BarberCard
                key={barber.id}
                name={barber.name}
                photo={barber.image}
                instagram={barber.instagram}
              />
            ))}
          </div>
        </section>

        <section className="h-full flex flex-col bg-[var(--bg-carousel)] p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Nuestra Historia</h2>
          <div className="flex-1 w-full px-4 text-left space-y-4">
            {ourStory.map((p, i) => (
              <p key={i} className={i === ourStory.length - 1 ? "font-semibold" : ""}>
                <span>{p}</span>
              </p>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl mt-10">
        <section className="h-full flex flex-col bg-[var(--bg-carousel)] p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold mb-4">¿Dónde Estamos?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            <div className="h-64 w-full rounded-xl overflow-hidden">
              <GoogleMapsLocation />
            </div>
            <div className="relative h-64 w-full rounded-xl overflow-hidden">
              <Image
                src={local}        // import estático recomendado
                alt="Local"
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 1200px"
              />

            </div>
          </div>
        </section>

        <section className="h-full flex flex-col bg-[var(--bg-carousel)] p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Nuestras Redes Sociales</h2>
          <div className="flex flex-col items-center space-y-10 mt-2 text-xl">
            {activeSocials.length > 0 ? activeSocials.map((social) => (
              <BarberSocialMedia 
                key={social.name} 
                url={social.url} 
                icon={iconMap[social.name] || <FaLink size={30} className="inline-block" />} 
                text={`Contactanos por ${social.name.charAt(0).toUpperCase() + social.name.slice(1)}`} 
              />
            )) : <p className="text-sm text-gray-500">No hay redes sociales configuradas.</p>}
          </div>
        </section>

      </div>
    </div>
  );
}
