// Las fechas de reserva se guardan como fecha "pura" (medianoche UTC), sin
// hora real asociada. Si se formatean con la zona horaria local (ej. UTC-3
// en Argentina), el dia mostrado retrocede uno. Por eso siempre se formatea
// forzando timeZone: "UTC".
export function formatFecha(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", { timeZone: "UTC" });
}
