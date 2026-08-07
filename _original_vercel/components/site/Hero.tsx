import Image from "next/image";
import type { Tab } from "./SiteShell";

export function Hero({ onReservarClick }: { onReservarClick: (tab: Tab) => void }) {
  return (
    <section className="relative h-[75vh] min-h-[460px] w-full overflow-hidden">
      <Image
        src="/images/hero.jpg"
        alt="Fachada del alojamiento Los Gladiolos"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-bordo/45 px-6 text-center backdrop-blur-[2px]">
        <h1 className="text-4xl font-bold tracking-tight text-crema drop-shadow-lg sm:text-6xl">
          Los Gladiolos
        </h1>
        <p className="mt-4 max-w-lg text-base text-crema/95 drop-shadow sm:text-lg">
          Alojamiento familiar en Crespo. 4 departamentos completamente equipados,
          pensados para pasarla bien en familia o con amigos.
        </p>
        <button
          type="button"
          onClick={() => onReservarClick("reservar")}
          className="mt-6 rounded-full bg-crema px-8 py-3 font-semibold text-bordo shadow-lg transition-colors hover:bg-white"
        >
          Reservar ahora
        </button>
      </div>
    </section>
  );
}
