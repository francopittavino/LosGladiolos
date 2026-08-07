import "server-only";
import { prisma } from "@/lib/prisma";
import { enviarTexto } from "@/lib/whatsapp";
import { formatFecha, formatFechaHora, formatPlazo } from "@/lib/format";

/*
  Avisos por WhatsApp (Meta Cloud API).

  IMPORTANTE sobre las plantillas: Meta solo permite mensajes de texto libre
  dentro de las 24hs posteriores a que la persona te haya escrito. Para el
  entorno de prueba alcanza (el destinatario le escribe primero al numero de
  prueba y se abre la ventana). Para produccion real hay que crear plantillas
  aprobadas por Meta y usar enviarPlantilla() en lugar de enviarTexto().
*/

/**
 * Los datos bancarios los edita el dueño desde /admin/configuracion. Mientras
 * no los haya cargado, se manda un texto neutro en vez de dejar el mensaje a
 * medias: el huesped tiene que entender que la seña existe pero que le van a
 * pasar los datos aparte.
 */
async function datosBancarios(): Promise<string> {
  const config = await prisma.configuracionGeneral.findUnique({
    where: { id: "singleton" },
    select: { datosBancarios: true },
  });
  const cargados = config?.datosBancarios?.trim();
  return cargados || "Te vamos a pasar los datos para la transferencia por este mismo medio.";
}

function adminPhone(): string | null {
  return process.env.WHATSAPP_ADMIN_PHONE || null;
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://los-gladiolos.vercel.app";
}

async function traerReserva(reservaId: string) {
  return prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { departamento: true },
  });
}

export async function notificarNuevaReservaAlAdmin(reservaId: string) {
  const admin = adminPhone();
  const reserva = await traerReserva(reservaId);
  if (!admin || !reserva) return;

  await enviarTexto(
    admin,
    `🔔 NUEVA RESERVA PENDIENTE\n\n` +
      `${reserva.nombreSolicitante}\n` +
      `${formatFecha(reserva.fechaInicio)} al ${formatFecha(reserva.fechaFin)}\n` +
      `${reserva.cantPersonas} persona(s)` +
      (reserva.puedeSubirEscaleras ? "" : " — movilidad reducida") +
      `\n${reserva.departamento?.nombre ?? "Sin departamento"}\n` +
      `Total: $${Number(reserva.precioTotal).toLocaleString("es-AR")}\n\n` +
      `Revisala acá:\n${baseUrl()}/admin/reservas/${reserva.id}`
  );
}

export async function notificarReservaConfirmada(reservaId: string) {
  const reserva = await traerReserva(reservaId);
  if (!reserva) return;

  const monto = reserva.montoSenia
    ? `$${Number(reserva.montoSenia).toLocaleString("es-AR")}`
    : "la seña";

  // El plazo se dice de las dos formas: cuanto tiempo tiene ("1 hora") y hasta
  // que hora exacta. Con plazos cortos, solo la fecha no alcanza para que el
  // huesped entienda la urgencia.
  const plazo = reserva.vencimientoSenia
    ? `Tenés ${formatPlazo(
        Math.max(
          1,
          Math.round((reserva.vencimientoSenia.getTime() - Date.now()) / (60 * 60 * 1000))
        )
      )} para transferir la seña de ${monto}, hasta las ${formatFechaHora(
        reserva.vencimientoSenia
      )} hs.`
    : `Para confirmarla, transferí la seña de ${monto} dentro del plazo indicado.`;

  await enviarTexto(
    reserva.telefono,
    `✅ ¡Tu reserva en Los Gladiolos fue aprobada!\n\n` +
      `${formatFecha(reserva.fechaInicio)} al ${formatFecha(reserva.fechaFin)}\n` +
      `${reserva.cantPersonas} persona(s)\n` +
      `Total: $${Number(reserva.precioTotal).toLocaleString("es-AR")}\n\n` +
      `⏰ ${plazo}\n\n` +
      `${await datosBancarios()}\n\n` +
      `Si no recibimos la seña en ese plazo, la reserva se cancela automáticamente y el ` +
      `departamento queda libre para otro huésped.\n\n` +
      `Cuando transfieras, mandanos el comprobante por acá.`
  );
}

export async function notificarReservaRechazada(reservaId: string) {
  const reserva = await traerReserva(reservaId);
  if (!reserva) return;

  await enviarTexto(
    reserva.telefono,
    `Hola ${reserva.nombreSolicitante}, lamentablemente no podemos confirmar tu ` +
      `reserva en Los Gladiolos para el ${formatFecha(reserva.fechaInicio)} al ` +
      `${formatFecha(reserva.fechaFin)}.\n\n` +
      `Cualquier consulta escribinos. ¡Gracias por contactarnos!`
  );
}

export async function notificarViajanteConfirmado(reservaId: string) {
  const reserva = await traerReserva(reservaId);
  if (!reserva) return;

  await enviarTexto(
    reserva.telefono,
    `✅ ¡Reserva confirmada en Los Gladiolos!\n\n` +
      `${formatFecha(reserva.fechaInicio)} al ${formatFecha(reserva.fechaFin)}\n` +
      `${reserva.departamento?.nombre ?? ""}\n\n` +
      `Te esperamos. Check-in desde las 12:00 hs.`
  );
}

export async function notificarReservaCanceladaSinSenia(reservaId: string) {
  const reserva = await traerReserva(reservaId);
  if (!reserva) return;

  await enviarTexto(
    reserva.telefono,
    `Hola ${reserva.nombreSolicitante}, tu reserva en Los Gladiolos para el ` +
      `${formatFecha(reserva.fechaInicio)} al ${formatFecha(reserva.fechaFin)} ` +
      `fue cancelada porque no recibimos la seña dentro del plazo.\n\n` +
      `Si querés reservar de nuevo, escribinos o entrá a ${baseUrl()}`
  );
}

/**
 * Cancelacion hecha a mano por el admin desde el panel (no por vencimiento).
 * El motivo es opcional: si no lo cargo, no se inventa nada.
 */
export async function notificarReservaCanceladaPorAdmin(reservaId: string, motivo?: string) {
  const reserva = await traerReserva(reservaId);
  if (!reserva) return;

  const explicacion = motivo?.trim() ? `\n\nMotivo: ${motivo.trim()}` : "";

  await enviarTexto(
    reserva.telefono,
    `Hola ${reserva.nombreSolicitante}, tu reserva en Los Gladiolos para el ` +
      `${formatFecha(reserva.fechaInicio)} al ${formatFecha(reserva.fechaFin)} ` +
      `fue cancelada.${explicacion}\n\n` +
      (reserva.seniaPagada
        ? `Nos vamos a comunicar con vos por la devolución de la seña.\n\n`
        : "") +
      `Cualquier consulta escribinos por acá.`
  );
}

export async function notificarPendientesAlAdmin(cantidad: number) {
  const admin = adminPhone();
  if (!admin) return;

  await enviarTexto(
    admin,
    `⏰ Tenés ${cantidad} reserva(s) pendiente(s) de revisar.\n\n` +
      `${baseUrl()}/admin`
  );
}
