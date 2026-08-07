import { Planta, type EstadoReserva } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { eliminarEventoReserva } from "@/lib/googleCalendar";
import { notificarReservaCanceladaSinSenia } from "@/lib/notificaciones";

export const ESTADOS_QUE_OCUPAN_DEPARTAMENTO: EstadoReserva[] = [
  "PENDIENTE",
  "CONFIRMADA",
  "SENIA_PAGADA",
];

export function calcularNoches(fechaInicio: Date, fechaFin: Date): number {
  const msPorNoche = 1000 * 60 * 60 * 24;
  return Math.round((fechaFin.getTime() - fechaInicio.getTime()) / msPorNoche);
}

export function validarRangoFechas(fechaInicio: Date, fechaFin: Date): string | null {
  if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
    return "Las fechas ingresadas no son validas.";
  }
  if (fechaFin <= fechaInicio) {
    return "La fecha de salida debe ser posterior a la fecha de entrada.";
  }
  const hoyUTC = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())
  );
  if (fechaInicio < hoyUTC) {
    return "La fecha de entrada no puede ser anterior a hoy.";
  }
  return null;
}

export async function calcularPrecio(cantPersonas: number, cantNoches: number) {
  const tarifa = await prisma.tarifaMatriz.findUnique({
    where: { cantPersonas_cantNoches: { cantPersonas, cantNoches } },
  });
  return tarifa?.precioTotal ?? null;
}

/**
 * Cancela las reservas CONFIRMADAS cuya seña vencio sin pagarse, liberando
 * el departamento. Se ejecuta desde el cron y tambien "al vuelo" cada vez
 * que se consulta disponibilidad, para que un cupo vencido quede libre en
 * el instante en que otro huesped lo necesita (el plan Hobby de Vercel solo
 * permite cron una vez por dia).
 *
 * Es idempotente: el updateMany condicional evita que dos ejecuciones
 * simultaneas procesen dos veces la misma reserva.
 */
export async function cancelarSeniasVencidas(): Promise<number> {
  const vencidas = await prisma.reserva.findMany({
    where: {
      estado: "CONFIRMADA",
      seniaPagada: false,
      vencimientoSenia: { lt: new Date() },
    },
    select: { id: true, googleEventId: true },
  });

  let canceladas = 0;

  for (const reserva of vencidas) {
    const { count } = await prisma.reserva.updateMany({
      where: { id: reserva.id, estado: "CONFIRMADA", seniaPagada: false },
      data: { estado: "CANCELADA_SIN_SENIA", googleEventId: null },
    });
    if (count === 0) continue; // otra ejecucion ya la proceso

    canceladas++;
    if (reserva.googleEventId) {
      await eliminarEventoReserva(reserva.googleEventId);
    }
    await notificarReservaCanceladaSinSenia(reserva.id);
  }

  return canceladas;
}

export async function departamentosDisponibles(
  fechaInicio: Date,
  fechaFin: Date,
  puedeSubirEscaleras: boolean,
  excludeReservaId?: string
) {
  const departamentos = await prisma.departamento.findMany({
    where: puedeSubirEscaleras ? {} : { planta: Planta.BAJA },
  });

  const departamentosOcupados = await prisma.reserva.findMany({
    where: {
      id: excludeReservaId ? { not: excludeReservaId } : undefined,
      estado: { in: ESTADOS_QUE_OCUPAN_DEPARTAMENTO },
      departamentoId: { not: null },
      fechaInicio: { lt: fechaFin },
      fechaFin: { gt: fechaInicio },
    },
    select: { departamentoId: true },
  });

  const idsOcupados = new Set(departamentosOcupados.map((r) => r.departamentoId));
  return departamentos.filter((d) => !idsOcupados.has(d.id));
}

type DonanteMovible = {
  reservaId: string;
  departamentoOrigenId: string;
  departamentoDestinoId: string;
};

/**
 * Busca una reserva PENDIENTE que hoy ocupa un departamento de planta baja
 * sin necesitarlo (puedeSubirEscaleras=true), y que se pueda mover a un
 * departamento de planta alta libre para todo su rango de fechas. Solo se
 * consideran reservas PENDIENTE porque todavia no se le comunico al huesped
 * que departamento le toca (eso recien pasa al confirmar), asi que mover su
 * asignacion no rompe ninguna promesa ya hecha.
 */
async function buscarDonanteMovible(
  fechaInicio: Date,
  fechaFin: Date
): Promise<DonanteMovible | null> {
  const deptosBaja = await prisma.departamento.findMany({ where: { planta: Planta.BAJA } });
  const idsBaja = deptosBaja.map((d) => d.id);

  const candidatos = await prisma.reserva.findMany({
    where: {
      estado: "PENDIENTE",
      puedeSubirEscaleras: true,
      departamentoId: { in: idsBaja },
      fechaInicio: { lt: fechaFin },
      fechaFin: { gt: fechaInicio },
    },
  });

  for (const candidato of candidatos) {
    const altaLibres = await departamentosDisponibles(
      candidato.fechaInicio,
      candidato.fechaFin,
      true,
      candidato.id
    );
    const destino = altaLibres.find((d) => d.planta === Planta.ALTA);
    if (destino) {
      return {
        reservaId: candidato.id,
        departamentoOrigenId: candidato.departamentoId!,
        departamentoDestinoId: destino.id,
      };
    }
  }

  return null;
}

export type AsignacionDepartamento = {
  departamentoId: string;
  swap?: DonanteMovible;
};

/**
 * Decide que departamento le corresponde a una reserva nueva. Si requiere
 * accesibilidad (planta baja) y ambas unidades de planta baja estan
 * ocupadas, intenta liberar una moviendo a otro huesped que no la necesite
 * hacia planta alta (ver buscarDonanteMovible). No escribe nada en la base
 * de datos: el llamador decide si solo quiere previsualizar (disponibilidad)
 * o efectivamente aplicar el swap (creacion de reserva).
 */
export async function asignarDepartamento(
  fechaInicio: Date,
  fechaFin: Date,
  requiereAccesibilidad: boolean,
  excludeReservaId?: string
): Promise<AsignacionDepartamento | null> {
  // Liberacion "al vuelo": antes de decidir, se sueltan los cupos cuya seña
  // vencio. Asi el departamento queda disponible al instante sin esperar al
  // cron diario.
  await cancelarSeniasVencidas();

  const libres = await departamentosDisponibles(
    fechaInicio,
    fechaFin,
    !requiereAccesibilidad,
    excludeReservaId
  );

  const directo = requiereAccesibilidad
    ? libres.find((d) => d.planta === Planta.BAJA)
    : libres[0];

  if (directo) {
    return { departamentoId: directo.id };
  }

  if (!requiereAccesibilidad) {
    return null;
  }

  const donante = await buscarDonanteMovible(fechaInicio, fechaFin);
  if (!donante) return null;

  return { departamentoId: donante.departamentoOrigenId, swap: donante };
}

/** Aplica en la base de datos el swap devuelto por asignarDepartamento. */
export async function aplicarSwap(swap: DonanteMovible) {
  await prisma.reserva.update({
    where: { id: swap.reservaId },
    data: { departamentoId: swap.departamentoDestinoId },
  });
}
