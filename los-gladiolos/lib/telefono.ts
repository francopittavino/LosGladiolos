/*
  Normalizacion de telefonos para WhatsApp.

  La gente carga el telefono como lo usa todos los dias ("0343 15 451-2995",
  "343 451 2995"), no en formato internacional. Meta necesita el numero
  completo: codigo de pais + 9 + caracteristica sin el 0 + numero sin el 15.

  Si el numero queda mal, el aviso no llega y no se entera nadie: el envio
  falla del lado del servidor y la reserva sigue su curso normal. Por eso el
  numero se normaliza al guardarlo y se rechaza en el formulario si no se
  puede interpretar, en vez de descubrirlo cuando el huesped nunca contesta.
*/

/** Cuantos digitos tiene un numero nacional argentino: caracteristica + abonado. */
const LARGO_NACIONAL = 10;

/** La caracteristica tiene 2 digitos (11), 3 (343) o 4 (2954). */
const LARGOS_CARACTERISTICA = [2, 3, 4];

/**
 * Devuelve el numero listo para la API de WhatsApp (solo digitos, con codigo
 * de pais), o `null` si no se puede interpretar.
 *
 * Un numero de otro pais escrito con `+` se respeta tal cual: no podemos
 * adivinar sus reglas y forzarle las argentinas lo romperia.
 */
export function normalizarTelefono(entrada: string): string | null {
  const crudo = entrada.trim();
  if (!crudo) return null;

  let digitos = crudo.replace(/\D/g, "");
  if (!digitos) return null;

  // Prefijo de discado internacional: 00 54 343...
  if (digitos.startsWith("00")) digitos = digitos.slice(2);

  const esExtranjero = crudo.startsWith("+") && !digitos.startsWith("54");
  if (esExtranjero) {
    return digitos.length >= 8 && digitos.length <= 15 ? digitos : null;
  }

  // El 54 solo se saca si lo que queda alcanza para un numero nacional: una
  // caracteristica argentina nunca empieza con 54, pero mas vale no suponerlo.
  if (digitos.startsWith("54") && digitos.length >= LARGO_NACIONAL + 2) {
    digitos = digitos.slice(2);
    if (digitos.startsWith("9")) digitos = digitos.slice(1);
  }

  // Prefijo de larga distancia nacional.
  digitos = digitos.replace(/^0+/, "");

  // El 15 va pegado despues de la caracteristica.
  if (digitos.length === LARGO_NACIONAL + 2) {
    for (const largo of LARGOS_CARACTERISTICA) {
      if (digitos.slice(largo, largo + 2) === "15") {
        digitos = digitos.slice(0, largo) + digitos.slice(largo + 2);
        break;
      }
    }
  }

  if (digitos.length !== LARGO_NACIONAL) return null;
  return `549${digitos}`;
}

/** Para mostrarlo en el panel: +54 9 343 451-2995. */
export function formatTelefono(normalizado: string): string {
  if (!normalizado.startsWith("549") || normalizado.length !== 13) return normalizado;
  const nacional = normalizado.slice(3);
  return `+54 9 ${nacional.slice(0, 3)} ${nacional.slice(3, 6)}-${nacional.slice(6)}`;
}
