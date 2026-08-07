import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.configuracionGeneral.findUnique({
    where: { id: "singleton" },
  });

  return NextResponse.json({
    textoReglas: config?.textoReglas ?? "",
    porcentajeSenia: config?.porcentajeSenia ?? 30,
    plazoVencimientoHoras: config?.plazoVencimientoHoras ?? 1,
  });
}
