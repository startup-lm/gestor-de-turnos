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

  const storefrontPhoto = settings.local_photo || local;

  return (
    <div className="p-5 flex flex-col items-center text-center max-w-6xl mx-auto pb-16">
      <h1 className="text-3xl font-bold mb-5">Sobre Nosotros</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Nuestros Barberos */}
        <section className="h-full flex flex-col bg-gradient-to-b from-[var(--foreground)]/6 to-[var(--foreground)]/2 backdrop-blur-md border border-[var(--foreground)]/10 p-6 md:p-8 rounded-2xl shadow-xl hover:border-[var(--accent)]/20 transition-all duration-300">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] text-center">Nuestros Barberos</h2>
          <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent mx-auto mt-2 mb-6" />
          
          <div className="flex flex-wrap gap-6 justify-center flex-1 items-center">
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

        {/* Nuestra Historia */}
        <section className="h-full flex flex-col bg-gradient-to-b from-[var(--foreground)]/6 to-[var(--foreground)]/2 backdrop-blur-md border border-[var(--foreground)]/10 p-6 md:p-8 rounded-2xl shadow-xl hover:border-[var(--accent)]/20 transition-all duration-300">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] text-center">Nuestra Historia</h2>
          <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent mx-auto mt-2 mb-6" />
          
          <div className="flex-1 w-full px-2 text-left space-y-5">
            {ourStory.map((p, i) => (
              <p
                key={i}
                className={
                  i === ourStory.length - 1
                    ? "font-bold text-[var(--accent)] text-center border-t border-[var(--accent)]/10 pt-4 mt-6 text-sm md:text-base leading-relaxed"
                    : `text-sm md:text-base text-[var(--foreground)]/80 leading-relaxed ${
                        i === 0
                          ? "first-letter:text-4xl first-letter:font-extrabold first-letter:text-[var(--accent)] first-letter:mr-2 first-letter:float-left first-letter:leading-none"
                          : ""
                      }`
                }
              >
                <span>{p}</span>
              </p>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-10">
        {/* ¿Dónde Estamos? */}
        <section className="h-full flex flex-col bg-gradient-to-b from-[var(--foreground)]/6 to-[var(--foreground)]/2 backdrop-blur-md border border-[var(--foreground)]/10 p-6 md:p-8 rounded-2xl shadow-xl hover:border-[var(--accent)]/20 transition-all duration-300">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] text-center">¿Dónde Estamos?</h2>
          <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent mx-auto mt-2 mb-4" />
          
          {settings.location_address && (
            <p className="text-xs md:text-sm text-[var(--foreground)]/60 text-center mb-6 flex items-center justify-center gap-1.5 mt-1 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent)]"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{settings.location_address}</span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2 flex-1">
            <div className="h-64 w-full rounded-xl overflow-hidden border border-[var(--foreground)]/10 shadow-inner group hover:border-[var(--accent)]/20 transition-all duration-300">
              <GoogleMapsLocation address={settings.location_address} />
            </div>
            <div className="relative h-64 w-full rounded-xl overflow-hidden border border-[var(--foreground)]/10 shadow-md group hover:border-[var(--accent)]/20 transition-all duration-300">
              <Image
                src={storefrontPhoto}
                alt="Local"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width:768px) 100vw, 400px"
              />
            </div>
          </div>
        </section>

        {/* Nuestras Redes Sociales */}
        <section className="h-full flex flex-col bg-gradient-to-b from-[var(--foreground)]/6 to-[var(--foreground)]/2 backdrop-blur-md border border-[var(--foreground)]/10 p-6 md:p-8 rounded-2xl shadow-xl hover:border-[var(--accent)]/20 transition-all duration-300">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] text-center">Nuestras Redes Sociales</h2>
          <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent mx-auto mt-2 mb-6" />
          
          <div className="flex flex-col items-center justify-center gap-4 flex-1 w-full px-2">
            {activeSocials.length > 0 ? activeSocials.map((social) => (
              <BarberSocialMedia
                key={social.name}
                url={social.url}
                icon={iconMap[social.name] || <FaLink size={20} className="inline-block" />}
                text={`Seguinos en ${social.name.charAt(0).toUpperCase() + social.name.slice(1)}`}
              />
            )) : (
              <p className="text-sm text-gray-500">No hay redes sociales configuradas.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
