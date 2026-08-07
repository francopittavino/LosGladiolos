// Envio de WhatsApp via Meta Cloud API. Todavia no esta configurado
// (queda para el final del proyecto), asi que por ahora solo logueamos
// en consola para poder ver el flujo funcionando durante las pruebas.

export async function notificarNuevaReservaAlAdmin(reservaId: string) {
  console.log(`[whatsapp-stub] Nueva reserva pendiente: ${reservaId}`);
}

export async function notificarReservaConfirmada(reservaId: string) {
  console.log(`[whatsapp-stub] Reserva confirmada, avisar sena al huesped: ${reservaId}`);
}

export async function notificarReservaRechazada(reservaId: string) {
  console.log(`[whatsapp-stub] Reserva rechazada, avisar al huesped: ${reservaId}`);
}

export async function notificarViajanteConfirmado(reservaId: string) {
  console.log(`[whatsapp-stub] Reserva de viajante frecuente confirmada: ${reservaId}`);
}

export async function notificarReservaCanceladaSinSenia(reservaId: string) {
  console.log(
    `[whatsapp-stub] Reserva cancelada por vencimiento de sena, avisar al huesped: ${reservaId}`
  );
}

export async function notificarPendientesAlAdmin(cantidad: number) {
  console.log(
    `[whatsapp-stub] Recordatorio al admin: tenes ${cantidad} reserva(s) pendiente(s) de revisar.`
  );
}
