import { NextResponse } from "next/server";
import {
  asignarDepartamento,
  calcularNoches,
  calcularPrecio,
  validarRangoFechas,
} from "@/lib/reservas";

export async function POST(request: Request) {
  const body = await request.json();
  const { fechaInicio, fechaFin, cantPersonas, puedeSubirEscaleras } = body as {
    fechaInicio: string;
    fechaFin: string;
    cantPersonas: number;
    puedeSubirEscaleras: boolean;
  };

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  const errorFechas = validarRangoFechas(inicio, fin);
  if (errorFechas) {
    return NextResponse.json({ disponible: false, mensaje: errorFechas }, { status: 400 });
  }

  if (!cantPersonas || cantPersonas < 1 || cantPersonas > 5) {
    return NextResponse.json(
      { disponible: false, mensaje: "La cantidad de personas debe ser entre 1 y 5." },
      { status: 400 }
    );
  }

  const noches = calcularNoches(inicio, fin);

  const precioTotal = await calcularPrecio(cantPersonas, noches);
  if (precioTotal === null) {
    return NextResponse.json({
      disponible: false,
      mensaje:
        noches > 7
          ? "No aceptamos reservas de mas de 7 noches por este medio. Contactanos directamente."
          : "No hay tarifa cargada para esa combinacion de personas y noches. Contactanos para consultar.",
    });
  }

  const asignacion = await asignarDepartamento(inicio, fin, !puedeSubirEscaleras);

  if (!asignacion) {
    return NextResponse.json({
      disponible: false,
      mensaje: "No hay departamentos disponibles para esas fechas.",
    });
  }

  return NextResponse.json({
    disponible: true,
    noches,
    precioTotal,
  });
}
