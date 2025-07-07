import { getBarbers } from "@/lib/repository/barbers";
import BarberCard from "@/components/nosotros/BarberCard";
import BarberSocialMedia from "@/components/nosotros/BarberSocialMedia";
import { socialMediaList } from "@/utils/socialMedia";
import GoogleMapsLocation from "@/components/nosotros/GoogleMapsLocation";
import { nuestraHistoria } from "@/utils/nuestraHistoria";
import Image from "next/image";

export const revalidate = 60;

export default async function NosotrosPage() {
  const barbers = await getBarbers();

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
            {nuestraHistoria.map((p, i) => (
              <p key={i} className={i === nuestraHistoria.length - 1 ? "font-semibold" : ""}>
                <span dangerouslySetInnerHTML={{ __html: p }} />
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
              <Image src="/images/local_hooligans.png" alt="Local Hooligans" fill className="object-cover" />
            </div>
          </div>
        </section>

        <section className="h-full flex flex-col bg-[var(--bg-carousel)] p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Nuestras Redes Sociales</h2>
          <div className="flex flex-col items-center space-y-10 mt-2 text-xl">
            {socialMediaList.map(({ name, Icon, url, text }) => (
              <BarberSocialMedia key={name} url={url} icon={<Icon size={30} className="inline-block" />} text={text} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
