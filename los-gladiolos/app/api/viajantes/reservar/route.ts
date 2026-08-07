import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  aplicarSwap,
  asignarDepartamento,
  calcularNoches,
  calcularPrecio,
  validarRangoFechas,
} from "@/lib/reservas";
import { normalizarCamas } from "@/lib/camas";
import { notificarViajanteConfirmado } from "@/lib/notificaciones";
import { crearEventoReserva } from "@/lib/googleCalendar";

export async function POST(request: Request) {
  const body = await request.json();
  const { numeroDni, fechaInicio, fechaFin, puedeSubirEscaleras } = body as {
    numeroDni: string;
    fechaInicio: string;
    fechaFin: string;
    puedeSubirEscaleras?: boolean;
  };

  if (!numeroDni?.trim()) {
    return NextResponse.json({ error: "Ingresa tu numero de DNI." }, { status: 400 });
  }

  const viajante = await prisma.viajanteFrecuente.findUnique({
    where: { numeroDni: numeroDni.trim() },
  });

  if (!viajante) {
    return NextResponse.json(
      { error: "No encontramos ese DNI en la lista de viajantes frecuentes." },
      { status: 404 }
    );
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const errorFechas = validarRangoFechas(inicio, fin);
  if (errorFechas) {
    return NextResponse.json({ error: errorFechas }, { status: 400 });
  }

  const cantPersonas = viajante.cantPersonasHabitual;
  const noches = calcularNoches(inicio, fin);
  const precioTotal = await calcularPrecio(cantPersonas, noches);
  if (precioTotal === null) {
    return NextResponse.json(
      { error: "No hay tarifa cargada para esa combinacion de personas y noches." },
      { status: 400 }
    );
  }

  const asignacion = await asignarDepartamento(inicio, fin, !(puedeSubirEscaleras ?? true));
  if (!asignacion) {
    return NextResponse.json(
      { error: "No hay departamentos disponibles para esas fechas." },
      { status: 409 }
    );
  }

  if (asignacion.swap) {
    await aplicarSwap(asignacion.swap);
  }

  const reserva = await prisma.reserva.create({
    data: {
      nombreSolicitante: viajante.nombre,
      telefono: viajante.telefono,
      fechaInicio: inicio,
      fechaFin: fin,
      cantPersonas,
      puedeSubirEscaleras: puedeSubirEscaleras ?? true,
      // Al viajante frecuente no se le pregunta nada (reserva de un solo paso):
      // queda el arranque, una cama simple por persona, salvo el caso fijo de 5.
      ...normalizarCamas(cantPersonas, false, cantPersonas),
      precioTotal,
      aceptoReglas: true,
      estado: "CONFIRMADA",
      departamentoId: asignacion.departamentoId,
      viajanteFrecuenteId: viajante.id,
    },
    include: { departamento: true },
  });

  // La reserva de un viajante frecuente nace CONFIRMADA, asi que el evento
  // se crea en el momento (no espera aprobacion del admin).
  if (reserva.departamento) {
    const googleEventId = await crearEventoReserva({
      nombreSolicitante: reserva.nombreSolicitante,
      telefono: reserva.telefono,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
      cantPersonas: reserva.cantPersonas,
      camaMatrimonial: reserva.camaMatrimonial,
      camasSimples: reserva.camasSimples,
      departamentoNombre: reserva.departamento.nombre,
      colorCalendario: reserva.departamento.colorCalendario,
      esViajanteFrecuente: true,
    });
    if (googleEventId) {
      await prisma.reserva.update({
        where: { id: reserva.id },
        data: { googleEventId },
      });
    }
  }

  await notificarViajanteConfirmado(reserva.id);

  return NextResponse.json(
    {
      reservaId: reserva.id,
      estado: reserva.estado,
      departamento: reserva.departamento?.nombre,
    },
    { status: 201 }
  );
}
