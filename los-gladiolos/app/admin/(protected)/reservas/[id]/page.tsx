import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cancelarSeniasVencidas, departamentosDisponibles } from "@/lib/reservas";
import { formatFecha, formatFechaHora } from "@/lib/format";
import { confirmarReserva, rechazarReserva, marcarSeniaPagada } from "./actions";
import { ReasignarForm } from "./ReasignarForm";
import { CancelarForm } from "./CancelarForm";

function fotoUrl(url: string) {
  return `/api/admin/file?url=${encodeURIComponent(url)}`;
}

export default async function ReservaDetallePage(
  props: PageProps<"/admin/reservas/[id]">
) {
  const { id } = await props.params;

  // Barrido "al vuelo" antes de mostrar: con plazos de pocas horas el cron
  // puede quedar corto, y el admin no tiene que ver como CONFIRMADA una
  // reserva cuya seña ya vencio.
  await cancelarSeniasVencidas();

  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: { personas: true, departamento: true, viajanteFrecuente: true },
  });

  if (!reserva) notFound();

  const opcionesDepto = await departamentosDisponibles(
    reserva.fechaInicio,
    reserva.fechaFin,
    true,
    reserva.id
  );
  const opciones = reserva.departamento
    ? [reserva.departamento, ...opcionesDepto.filter((d) => d.id !== reserva.departamentoId)]
    : opcionesDepto;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-carbon">{reserva.nombreSolicitante}</h1>
        <p className="text-sm text-carbon/60">Reserva #{reserva.id}</p>
      </div>

      <div className="grid gap-4 rounded-xl bg-blanco p-6 shadow-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-carbon/50">Estado</p>
          <p className="font-semibold text-carbon">{reserva.estado}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-carbon/50">Teléfono</p>
          <p className="font-semibold text-carbon">{reserva.telefono}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-carbon/50">Fechas</p>
          <p className="font-semibold text-carbon">
            {formatFecha(reserva.fechaInicio)} → {formatFecha(reserva.fechaFin)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-carbon/50">Personas</p>
          <p className="font-semibold text-carbon">
            {reserva.cantPersonas}{" "}
            {!reserva.puedeSubirEscaleras && "— movilidad reducida"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-carbon/50">Precio total</p>
          <p className="font-semibold text-carbon">
            ${Number(reserva.precioTotal).toLocaleString("es-AR")}
          </p>
        </div>
        {reserva.montoSenia !== null && (
          <div>
            <p className="text-xs uppercase text-carbon/50">Seña</p>
            <p className="font-semibold text-carbon">
              ${Number(reserva.montoSenia).toLocaleString("es-AR")} —{" "}
              {reserva.seniaPagada ? "Pagada" : "Pendiente de pago"}
              {reserva.vencimientoSenia &&
                !reserva.seniaPagada &&
                ` (vence ${formatFechaHora(reserva.vencimientoSenia)} hs)`}
            </p>
          </div>
        )}
        {reserva.motivoCancelacion && (
          <div>
            <p className="text-xs uppercase text-carbon/50">Motivo de cancelación</p>
            <p className="font-semibold text-carbon">{reserva.motivoCancelacion}</p>
          </div>
        )}
        {reserva.viajanteFrecuente && (
          <div>
            <p className="text-xs uppercase text-carbon/50">Viajante Frecuente</p>
            <p className="font-semibold text-carbon">{reserva.viajanteFrecuente.nombre}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-blanco p-6 shadow-sm">
        <p className="mb-3 text-xs uppercase text-carbon/50">Departamento asignado</p>
        <ReasignarForm
          reservaId={reserva.id}
          departamentoActualId={reserva.departamentoId}
          opciones={opciones}
        />
      </div>

      {reserva.personas.length > 0 && (
        <div className="rounded-xl bg-blanco p-6 shadow-sm">
          <p className="mb-3 text-xs uppercase text-carbon/50">Personas alojadas</p>
          <div className="space-y-4">
            {reserva.personas.map((p) => (
              <div key={p.id} className="rounded-lg border border-carbon/10 p-4">
                <p className="font-semibold text-carbon">DNI: {p.numeroDni}</p>
                <div className="mt-2 flex flex-wrap gap-3">
                  {p.fotoDniFrente && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fotoUrl(p.fotoDniFrente)}
                      alt="DNI frente"
                      className="h-32 rounded-lg border border-carbon/10 object-cover"
                    />
                  )}
                  {p.fotoDniDorso && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fotoUrl(p.fotoDniDorso)}
                      alt="DNI dorso"
                      className="h-32 rounded-lg border border-carbon/10 object-cover"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {reserva.estado === "PENDIENTE" && (
          <>
            <form action={confirmarReserva.bind(null, reserva.id)}>
              <button
                type="submit"
                className="rounded-full bg-verde px-6 py-2.5 font-semibold text-crema"
              >
                Confirmar
              </button>
            </form>
            <form action={rechazarReserva.bind(null, reserva.id)}>
              <button
                type="submit"
                className="rounded-full bg-coral px-6 py-2.5 font-semibold text-crema"
              >
                Rechazar
              </button>
            </form>
          </>
        )}
        {reserva.estado === "CONFIRMADA" && (
          <form action={marcarSeniaPagada.bind(null, reserva.id)}>
            <button
              type="submit"
              className="rounded-full bg-verde px-6 py-2.5 font-semibold text-crema"
            >
              Marcar seña pagada
            </button>
          </form>
        )}
        {(reserva.estado === "CONFIRMADA" || reserva.estado === "SENIA_PAGADA") && (
          <CancelarForm reservaId={reserva.id} seniaPagada={reserva.seniaPagada} />
        )}
      </div>
    </div>
  );
}
