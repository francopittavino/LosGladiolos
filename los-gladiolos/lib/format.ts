// Las fechas de reserva se guardan como fecha "pura" (medianoche UTC), sin
// hora real asociada. Si se formatean con la zona horaria local (ej. UTC-3
// en Argentina), el dia mostrado retrocede uno. Por eso siempre se formatea
// forzando timeZone: "UTC".
export function formatFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", { timeZone: "UTC" });
}

const ZONA_HORARIA = "America/Argentina/Buenos_Aires";

/**
 * El vencimiento de la seña sí es un instante real, y ahí la hora importa:
 * con plazos cortos, mostrar el horario del servidor (Vercel corre en UTC)
 * le adelantaría 3 horas al huesped. Por eso se fuerza la zona de Argentina.
 */
export function formatFechaHora(fecha: Date): string {
  return fecha.toLocaleString("es-AR", {
    timeZone: ZONA_HORARIA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "1 hora" / "24 horas", para decirle al huesped cuanto tiempo le queda. */
export function formatPlazo(horas: number): string {
  return horas === 1 ? "1 hora" : `${horas} horas`;
}
