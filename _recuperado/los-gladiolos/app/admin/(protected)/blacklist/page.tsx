import { prisma } from "@/lib/prisma";
import { AgregarForm } from "./AgregarForm";
import { quitarDeBlacklist } from "./actions";

export default async function BlacklistPage() {
  const items = await prisma.listaNegra.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-carbon">Lista Negra</h1>
      <p className="mt-1 text-sm text-carbon/60">
        Los DNI cargados acá no pueden completar una reserva en la web pública.
      </p>

      <div className="mt-6 rounded-xl bg-blanco p-6 shadow-sm">
        <AgregarForm />
      </div>

      <div className="mt-6 space-y-2">
        {items.length === 0 && <p className="text-sm text-carbon/60">No hay DNI en la lista negra.</p>}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-blanco p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold text-carbon">
                {item.numeroDni} {item.nombre && `— ${item.nombre}`}
              </p>
              {item.motivo && <p className="text-sm text-carbon/60">{item.motivo}</p>}
            </div>
            <form action={quitarDeBlacklist.bind(null, item.id)}>
              <button type="submit" className="text-sm font-medium text-coral hover:underline">
                Quitar
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
