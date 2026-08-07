import { Hero } from "./Hero";
import type { Tab } from "./SiteShell";

const CARTELES = [
  { titulo: "4 Departamentos", detalle: "2 en planta baja, 2 en planta alta" },
  { titulo: "Hasta 5 personas", detalle: "por departamento" },
  { titulo: "Reserva 100% online", detalle: "confirmación por WhatsApp" },
];

export function InicioSection({ onReservarClick }: { onReservarClick: (tab: Tab) => void }) {
  return (
    <div>
      <Hero onReservarClick={onReservarClick} />

      <section className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <div className="grid gap-4 sm:grid-cols-3">
          {CARTELES.map((c) => (
            <div
              key={c.titulo}
              className="rounded-2xl bg-bordo px-5 py-6 text-center text-crema shadow-sm"
            >
              <p className="text-lg font-bold">{c.titulo}</p>
              <p className="mt-1 text-sm text-crema/80">{c.detalle}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
