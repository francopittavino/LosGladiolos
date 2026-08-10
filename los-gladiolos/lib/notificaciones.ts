import "server-only";
import { prisma } from "@/lib/prisma";
import { enviarPlantilla } from "@/lib/whatsapp";
import { formatFecha, formatFechaHora } from "@/lib/format";

/*
  Avisos por WhatsApp (Meta Cloud API).

  Todos usan plantillas aprobadas. Meta solo permite texto libre dentro de las
  24 horas posteriores a que la persona te haya escrito, y los huespedes de Los
  Gladiolos nunca escriben primero: llenan un formulario web. Asi que cada
  aviso cae fuera de esa ventana y necesita plantilla si o si.

  Los nombres y el orden de las variables tienen que coincidir exactamente con
  lo aprobado en Meta. Estan documentados en la Parte C de WHATSAPP.md.
*/

const IDIOMA = "es";

/**
 * Meta rechaza los parametros con saltos de linea, tabulaciones o mas de
 * cuatro espacios seguidos, y tambien los vacios. Los datos bancarios, que el
 * dueño carga a mano en el panel, son el caso tipico: vienen en varias lineas.
 */
function param(valor: string | null | undefined, alternativa: string): string {
  const limpio = (valor ?? "")
    .replace(/[\r\n]+/g, " · ")
    .replace(/\s+/g, " ")
    .trim();
  return limpio || alternativa;
}

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
  return param(
    config?.datosBancarios,
    "Te vamos a pasar los datos para la transferencia por este mismo medio."
  );
}

function adminPhone(): string | null {
  return process.env.WHATSAPP_ADMIN_PHONE || null;
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || "https://los-gladiolos.vercel.app";
}

function pesos(monto: unknown): string {
  return `$${Number(monto).toLocaleString("es-AR")}`;
}

async function traerReserva(reservaId: string) {
  return prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { departamento: true },
  });
}

function rangoFechas(desde: Date, hasta: Date): string {
  return `${formatFecha(desde)} al ${formatFecha(hasta)}`;
}

export async function notificarNuevaReservaAlAdmin(reservaId: string) {
  const admin = adminPhone();
  const reserva = await traerReserva(reservaId);
  if (!admin || !reserva) return;

  await enviarPlantilla(admin, "nueva_reserva_admin", IDIOMA, [
    param(reserva.nombreSolicitante, "Sin nombre"),
    rangoFechas(reserva.fechaInicio, reserva.fechaFin),
    `${reserva.cantPersonas} persona(s)` +
      (reserva.puedeSubirEscaleras ? "" : " (movilidad reducida)"),
    param(reserva.departamento?.nombre, "Sin departamento"),
    pesos(reserva.precioTotal),
    `${baseUrl()}/admin/reservas/${reserva.id}`,
  ]);
}

export async function notificarReservaConfirmada(reservaId: string) {
  const reserva = await traerReserva(reservaId);
  if (!reserva) return;

  // La plantilla tiene el monto y el vencimiento incrustados en la frase
  // ("la seña de {{4}} antes de las {{5}} hs"), asi que sin esos datos no se
  // puede armar un mensaje que se entienda. En la practica siempre estan: se
  // calculan justo antes de llamar acá, al confirmar desde el panel.
  if (!reserva.montoSenia || !reserva.vencimientoSenia) {
    console.error(
      `[notificaciones] Reserva ${reservaId} sin monto o vencimiento de seña. No se envia el aviso.`
    );
    return;
  }

  await enviarPlantilla(reserva.telefono, "reserva_aprobada", IDIOMA, [
    param(reserva.nombreSolicitante, "Sin nombre"),
    rangoFechas(reserva.fechaInicio, reserva.fechaFin),
    pesos(reserva.precioTotal),
    pesos(reserva.montoSenia),
    formatFechaHora(reserva.vencimientoSenia),
    await datosBancarios(),
  ]);
}

export async function notificarReservaRechazada(reservaId: string) {
  const reserva = await traerReserva(reservaId);
  if (!reserva) return;

  await enviarPlantilla(reserva.telefono, "reserva_rechazada", IDIOMA, [
    param(reserva.nombreSolicitante, "Sin nombre"),
    rangoFechas(reserva.fechaInicio, reserva.fechaFin),
  ]);
}

export async function notificarViajanteConfirmado(reservaId: string) {
  const reserva = await traerReserva(reservaId);
  if (!reserva) return;

  await enviarPlantilla(reserva.telefono, "viajante_confirmado", IDIOMA, [
    rangoFechas(reserva.fechaInicio, reserva.fechaFin),
    param(reserva.departamento?.nombre, "A confirmar"),
  ]);
}

export async function notificarReservaCanceladaSinSenia(reservaId: string) {
  const reserva = await traerReserva(reservaId);
  if (!reserva) return;

  await enviarPlantilla(reserva.telefono, "reserva_cancelada_sin_senia", IDIOMA, [
    param(reserva.nombreSolicitante, "Sin nombre"),
    rangoFechas(reserva.fechaInicio, reserva.fechaFin),
    baseUrl(),
  ]);
}

/**
 * Cancelacion hecha a mano por el admin desde el panel (no por vencimiento).
 *
 * Son dos plantillas y no una porque el motivo es opcional y Meta rechaza los
 * parametros vacios: no se puede mandar "" en el hueco del motivo.
 */
export async function notificarReservaCanceladaPorAdmin(reservaId: string, motivo?: string) {
  const reserva = await traerReserva(reservaId);
  if (!reserva) return;

  const cierre = reserva.seniaPagada
    ? "Nos vamos a comunicar con vos por la devolución de la seña."
    : "Cualquier consulta escribinos por acá.";

  const nombre = param(reserva.nombreSolicitante, "Sin nombre");
  const fechas = rangoFechas(reserva.fechaInicio, reserva.fechaFin);
  const motivoLimpio = motivo?.trim() ? param(motivo, "") : "";

  if (motivoLimpio) {
    await enviarPlantilla(reserva.telefono, "reserva_cancelada_admin_motivo", IDIOMA, [
      nombre,
      fechas,
      motivoLimpio,
      cierre,
    ]);
    return;
  }

  await enviarPlantilla(reserva.telefono, "reserva_cancelada_admin", IDIOMA, [
    nombre,
    fechas,
    cierre,
  ]);
}

export async function notificarPendientesAlAdmin(cantidad: number) {
  const admin = adminPhone();
  if (!admin) return;

  await enviarPlantilla(admin, "recordatorio_pendientes", IDIOMA, [
    String(cantidad),
    `${baseUrl()}/admin`,
  ]);
}
