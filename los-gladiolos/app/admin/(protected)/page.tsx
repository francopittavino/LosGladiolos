import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cancelarSeniasVencidas } from "@/lib/reservas";
import { formatFecha } from "@/lib/format";
import type { EstadoReserva } from "@prisma/client";

const FILTROS: { label: string; value: EstadoReserva | "TODAS" }[] = [
  { label: "Pendientes", value: "PENDIENTE" },
  { label: "Confirmadas", value: "CONFIRMADA" },
  { label: "Seña pagada", value: "SENIA_PAGADA" },
  { label: "Rechazadas", value: "RECHAZADA" },
  { label: "Vencidas sin seña", value: "CANCELADA_SIN_SENIA" },
  { label: "Canceladas a mano", value: "CANCELADA_MANUAL" },
  { label: "Todas", value: "TODAS" },
];

const ESTADO_COLOR: Record<EstadoReserva, string> = {
  PENDIENTE: "bg-amarillo/20 text-amarillo",
  CONFIRMADA: "bg-verde/20 text-verde",
  SENIA_PAGADA: "bg-celeste/20 text-celeste",
  RECHAZADA: "bg-coral/20 text-coral",
  CANCELADA_SIN_SENIA: "bg-carbon/10 text-carbon/60",
  CANCELADA_MANUAL: "bg-carbon/10 text-carbon/60",
};

export default async function AdminReservasPage(
  props: PageProps<"/admin">
) {
  const searchParams = await props.searchParams;
  const estadoParam = (searchParams?.estado as string) || "PENDIENTE";
  const filtro = FILTROS.some((f) => f.value === estadoParam) ? estadoParam : "PENDIENTE";

  // Antes de listar se sueltan las señas vencidas, asi el listado nunca muestra
  // como CONFIRMADA una reserva que ya se paso del plazo.
  await cancelarSeniasVencidas();

  const reservas = await prisma.reserva.findMany({
    where: filtro === "TODAS" ? {} : { estado: filtro as EstadoReserva },
    include: { departamento: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-carbon">Reservas</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Link
            key={f.value}
            href={`/admin?estado=${f.value}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filtro === f.value ? "bg-bordo text-crema" : "bg-blanco text-carbon/70"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {reservas.length === 0 && (
          <p className="text-sm text-carbon/60">No hay reservas en este estado.</p>
        )}
        {reservas.map((r) => (
          <Link
            key={r.id}
            href={`/admin/reservas/${r.id}`}
            className="block rounded-xl bg-blanco p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-carbon">{r.nombreSolicitante}</p>
                <p className="text-sm text-carbon/60">
                  {formatFecha(r.fechaInicio)} → {formatFecha(r.fechaFin)} — {r.cantPersonas} persona(s)
                  {r.departamento && ` — ${r.departamento.nombre}`}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_COLOR[r.estado]}`}
              >
                {r.estado}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
