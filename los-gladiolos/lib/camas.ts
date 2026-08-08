/*
  Distribucion de camas de una reserva.

  Vive aparte de lib/reservas.ts a proposito: eso importa Google Calendar y
  las notificaciones, que son `server-only`, y estas reglas las necesita
  tambien el formulario publico, que corre en el cliente. Tenerlas en un solo
  lugar es lo que evita que la pantalla y el servidor calculen distinto.
*/

export type DistribucionCamas = {
  camaMatrimonial: boolean | null;
  camasSimples: number | null;
};

/** Con 5 personas la distribucion no se elige: entran justo asi. */
export const CAMAS_FIJAS_CINCO: DistribucionCamas = {
  camaMatrimonial: true,
  camasSimples: 3,
};

/** La matrimonial cuenta como 2 plazas; cada simple, como 1. */
export function plazas(camaMatrimonial: boolean, camasSimples: number): number {
  return (camaMatrimonial ? 2 : 0) + camasSimples;
}

/**
 * Minimo de camas simples. Se juntan dos condiciones:
 *
 *  - Las plazas tienen que alcanzar para todos: lo que no cubre la matrimonial
 *    va en simples. Sin matrimonial esto obliga a una cama por persona.
 *  - Sin matrimonial, ademas, nunca menos de 1 (aunque con la regla anterior
 *    ya se cumple solo).
 *
 * Con matrimonial el piso puede ser 0: una pareja de 2 no necesita ninguna
 * simple, y pedirle 1 seria hacer preparar una cama que no usa nadie.
 */
export function minimoCamasSimples(camaMatrimonial: boolean, cantPersonas: number): number {
  const sinCubrir = cantPersonas - (camaMatrimonial ? 2 : 0);
  return Math.max(camaMatrimonial ? 0 : 1, sinCubrir);
}

/**
 * Maximo de camas simples. Con matrimonial baja uno: si ya hay una cama que
 * duerme a dos, ofrecer ademas una simple por cabeza es hacer preparar camas
 * que no usa nadie.
 */
export function maximoCamasSimples(camaMatrimonial: boolean, cantPersonas: number): number {
  return camaMatrimonial ? cantPersonas - 1 : cantPersonas;
}

/**
 * Reglas completas, aplicadas tanto al armar el formulario como al guardar:
 *
 *  - 1 persona: no se pregunta nada, queda sin dato.
 *  - 2 a 4: el huesped elige. Arranca sin matrimonial y con una cama simple
 *    por persona.
 *  - 5: fija en 1 matrimonial + 3 simples.
 *
 * Lo que mande el cliente se corrige contra los limites, nunca se rechaza:
 * una combinacion invalida se sube al minimo que alcanza para todos.
 */
export function normalizarCamas(
  cantPersonas: number,
  camaMatrimonial: unknown,
  camasSimples: unknown
): DistribucionCamas {
  if (cantPersonas >= 5) return CAMAS_FIJAS_CINCO;
  if (cantPersonas < 2) return { camaMatrimonial: null, camasSimples: null };

  const matrimonial = camaMatrimonial === true;
  const pedidas = Number(camasSimples);
  const minimo = minimoCamasSimples(matrimonial, cantPersonas);
  const maximo = maximoCamasSimples(matrimonial, cantPersonas);
  const simples = Number.isInteger(pedidas)
    ? Math.min(Math.max(pedidas, minimo), maximo)
    : maximo;

  return { camaMatrimonial: matrimonial, camasSimples: simples };
}

/**
 * "1 matrimonial + 2 simples", tal como lo leen el calendario y el panel.
 * Devuelve null cuando la reserva no tiene distribucion cargada (1 persona).
 */
export function formatCamas(
  camaMatrimonial: boolean | null,
  camasSimples: number | null
): string | null {
  const partes: string[] = [];
  if (camaMatrimonial) partes.push("1 matrimonial");
  if (camasSimples && camasSimples > 0) {
    partes.push(`${camasSimples} ${camasSimples === 1 ? "simple" : "simples"}`);
  }
  return partes.length > 0 ? partes.join(" + ") : null;
}
