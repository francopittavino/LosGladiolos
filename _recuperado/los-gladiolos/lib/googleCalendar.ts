import "server-only";
import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export type DatosEventoReserva = {
  nombreSolicitante: string;
  telefono: string;
  fechaInicio: Date;
  fechaFin: Date;
  cantPersonas: number;
  departamentoNombre: string;
  colorCalendario: string;
  esViajanteFrecuente?: boolean;
};

/**
 * Devuelve el cliente de Calendar, o null si todavia no estan cargadas las
 * credenciales. Toda la integracion es "best effort": si Google no esta
 * configurado o falla, la reserva igual se guarda en la base de datos, que
 * es la fuente de verdad de la disponibilidad. Solo se pierde el reflejo
 * visual en el calendario del dueño.
 */
function getCalendar() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!email || !rawKey || !calendarId) return null;

  // En las variables de entorno los saltos de linea de la clave privada
  // viajan escapados como \n literales.
  const key = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({ email, key, scopes: SCOPES });
  return { calendar: google.calendar({ version: "v3", auth }), calendarId };
}

export function calendarConfigurado(): boolean {
  return getCalendar() !== null;
}

function aFechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Arma el cuerpo del evento. Se usa un evento de dia completo cuyo `end.date`
 * es la fecha de salida: en Google Calendar ese campo es EXCLUSIVO, asi que
 * el bloque pintado representa exactamente las noches ocupadas (una reserva
 * 10->12 pinta 10 y 11). Esto coincide con como el sistema calcula la
 * disponibilidad y evita que dos reservas consecutivas se vean superpuestas.
 */
function armarEvento(datos: DatosEventoReserva) {
  const tipo = datos.esViajanteFrecuente ? "Viajante frecuente" : "Huésped";
  return {
    summary: `${datos.departamentoNombre} — ${datos.nombreSolicitante}`,
    description: [
      `${tipo}: ${datos.nombreSolicitante}`,
      `Teléfono: ${datos.telefono}`,
      `Personas: ${datos.cantPersonas}`,
      `Check-in: ${aFechaISO(datos.fechaInicio)} desde 12:00`,
      `Check-out: ${aFechaISO(datos.fechaFin)} hasta 22:00`,
    ].join("\n"),
    colorId: datos.colorCalendario,
    start: { date: aFechaISO(datos.fechaInicio) },
    end: { date: aFechaISO(datos.fechaFin) },
  };
}

/** Crea el evento y devuelve su id, o null si Calendar no esta disponible. */
export async function crearEventoReserva(
  datos: DatosEventoReserva
): Promise<string | null> {
  const cliente = getCalendar();
  if (!cliente) {
    console.log("[calendar] Sin credenciales, no se crea el evento.");
    return null;
  }

  try {
    const res = await cliente.calendar.events.insert({
      calendarId: cliente.calendarId,
      requestBody: armarEvento(datos),
    });
    return res.data.id ?? null;
  } catch (error) {
    console.error("[calendar] Error al crear el evento:", error);
    return null;
  }
}

/** Actualiza un evento existente (por ejemplo al reasignar departamento). */
export async function actualizarEventoReserva(
  googleEventId: string,
  datos: DatosEventoReserva
): Promise<boolean> {
  const cliente = getCalendar();
  if (!cliente) return false;

  try {
    await cliente.calendar.events.update({
      calendarId: cliente.calendarId,
      eventId: googleEventId,
      requestBody: armarEvento(datos),
    });
    return true;
  } catch (error) {
    console.error("[calendar] Error al actualizar el evento:", error);
    return false;
  }
}

/** Elimina el evento (reserva rechazada o cancelada por seña vencida). */
export async function eliminarEventoReserva(googleEventId: string): Promise<boolean> {
  const cliente = getCalendar();
  if (!cliente) return false;

  try {
    await cliente.calendar.events.delete({
      calendarId: cliente.calendarId,
      eventId: googleEventId,
    });
    return true;
  } catch (error) {
    console.error("[calendar] Error al eliminar el evento:", error);
    return false;
  }
}
