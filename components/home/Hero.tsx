import Image from "next/image";
import HeroActions from "./HeroActions";
import homeBg from "@/public/images/home.jpg";

export default function Hero() {
  return (
    <section className="relative h-80 sm:h-96 flex items-center justify-center text-center overflow-hidden">
      <Image
        src={homeBg}                // import estático
        alt="Barbería fondo"
        fill
        className="object-cover object-top sm:object-center filter brightness-30"
        priority
        sizes="(max-width:768px) 100vw, 1200px"
      />


      <div className="relative z-10 space-y-3 px-4">
        <h1 className="text-5xl sm:text-6xl font-bold">
          Barbería<br />
        </h1>
        <p className="text-xl sm:text-2xl sm:text-2xl text-[var(--secondary)]">
          barberia
        </p>

        <HeroActions />
      </div>
    </section>
  );
}
