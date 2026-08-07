import { prisma } from "@/lib/prisma";
import { ViajanteForm } from "./ViajanteForm";
import { eliminarViajante } from "./actions";

export default async function ViajantesPage() {
  const viajantes = await prisma.viajanteFrecuente.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-carbon">Viajantes Frecuentes</h1>
      <p className="mt-1 text-sm text-carbon/60">
        Se identifican con su DNI en la web pública y reservan sin foto de DNI ni seña.
      </p>

      <div className="mt-6 rounded-xl bg-blanco p-6 shadow-sm">
        <ViajanteForm />
      </div>

      <div className="mt-6 space-y-2">
        {viajantes.length === 0 && (
          <p className="text-sm text-carbon/60">Todavía no hay viajantes frecuentes cargados.</p>
        )}
        {viajantes.map((v) => (
          <div
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-blanco p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              {v.fotoDni && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/admin/file?url=${encodeURIComponent(v.fotoDni)}`}
                  alt={`DNI de ${v.nombre}`}
                  className="h-12 w-12 rounded-lg border border-carbon/10 object-cover"
                />
              )}
              <div>
                <p className="font-semibold text-carbon">{v.nombre}</p>
                <p className="text-sm text-carbon/60">
                  DNI {v.numeroDni} — {v.telefono} — {v.cantPersonasHabitual} persona(s)
                  {v.dominioVehiculo && ` — dominio: ${v.dominioVehiculo}`}
                </p>
              </div>
            </div>
            <form action={eliminarViajante.bind(null, v.id)}>
              <button type="submit" className="text-sm font-medium text-coral hover:underline">
                Eliminar
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
