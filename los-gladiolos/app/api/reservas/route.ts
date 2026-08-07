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
import { notificarNuevaReservaAlAdmin } from "@/lib/notificaciones";

type PersonaInput = {
  nombre?: string;
  numeroDni: string;
  fotoDniFrente: string;
  fotoDniDorso: string;
};

export async function POST(request: Request) {
  const body = await request.json();
  const {
    nombreSolicitante,
    telefono,
    fechaInicio,
    fechaFin,
    cantPersonas,
    puedeSubirEscaleras,
    camaMatrimonial,
    camasSimples,
    aceptoReglas,
    personas,
  } = body as {
    nombreSolicitante: string;
    telefono: string;
    fechaInicio: string;
    fechaFin: string;
    cantPersonas: number;
    puedeSubirEscaleras: boolean;
    camaMatrimonial?: boolean | null;
    camasSimples?: number | null;
    aceptoReglas: boolean;
    personas: PersonaInput[];
  };

  if (!nombreSolicitante?.trim() || !telefono?.trim()) {
    return NextResponse.json({ error: "Falta el nombre o telefono de contacto." }, { status: 400 });
  }

  if (!aceptoReglas) {
    return NextResponse.json(
      { error: "Debes aceptar las reglas del alojamiento para reservar." },
      { status: 400 }
    );
  }

  if (!Array.isArray(personas) || personas.length !== cantPersonas) {
    return NextResponse.json(
      { error: "La cantidad de personas cargadas no coincide con cantPersonas." },
      { status: 400 }
    );
  }

  for (const persona of personas) {
    if (!persona.numeroDni?.trim() || !persona.fotoDniFrente || !persona.fotoDniDorso) {
      return NextResponse.json(
        { error: "Cada persona debe tener DNI y fotos de frente y dorso." },
        { status: 400 }
      );
    }
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const errorFechas = validarRangoFechas(inicio, fin);
  if (errorFechas) {
    return NextResponse.json({ error: errorFechas }, { status: 400 });
  }

  // Validacion contra Lista Negra: si algun DNI esta blacklisteado, se
  // rechaza la reserva completa sin avisar al admin.
  const dnis = personas.map((p) => p.numeroDni.trim());
  const enListaNegra = await prisma.listaNegra.findFirst({
    where: { numeroDni: { in: dnis } },
  });
  if (enListaNegra) {
    return NextResponse.json(
      { error: "El alojamiento no cuenta con disponibilidad para esa fecha." },
      { status: 403 }
    );
  }

  const noches = calcularNoches(inicio, fin);
  const precioTotal = await calcularPrecio(cantPersonas, noches);
  if (precioTotal === null) {
    return NextResponse.json(
      { error: "No hay tarifa cargada para esa combinacion de personas y noches." },
      { status: 400 }
    );
  }

  // Re-chequeo de disponibilidad al momento de confirmar el envio (puede
  // haber cambiado desde que el huesped vio el precio en pantalla).
  const asignacion = await asignarDepartamento(inicio, fin, !puedeSubirEscaleras);
  if (!asignacion) {
    return NextResponse.json(
      { error: "Ya no hay departamentos disponibles para esas fechas." },
      { status: 409 }
    );
  }

  if (asignacion.swap) {
    await aplicarSwap(asignacion.swap);
  }

  const reserva = await prisma.reserva.create({
    data: {
      nombreSolicitante: nombreSolicitante.trim(),
      telefono: telefono.trim(),
      fechaInicio: inicio,
      fechaFin: fin,
      cantPersonas,
      puedeSubirEscaleras: Boolean(puedeSubirEscaleras),
      // No se confia en lo que mande el cliente: las reglas de distribucion se
      // reaplican en el servidor (limites, y el caso fijo de 5 personas).
      ...normalizarCamas(cantPersonas, camaMatrimonial, camasSimples),
      precioTotal,
      aceptoReglas: true,
      estado: "PENDIENTE",
      departamentoId: asignacion.departamentoId,
      personas: {
        create: personas.map((p) => ({
          nombre: p.nombre?.trim() || null,
          numeroDni: p.numeroDni.trim(),
          fotoDniFrente: p.fotoDniFrente,
          fotoDniDorso: p.fotoDniDorso,
        })),
      },
    },
    include: { personas: true, departamento: true },
  });

  await notificarNuevaReservaAlAdmin(reserva.id);

  return NextResponse.json({ reservaId: reserva.id, estado: reserva.estado }, { status: 201 });
}
