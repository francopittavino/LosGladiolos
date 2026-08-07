import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelarSeniasVencidas } from "@/lib/reservas";
import { notificarPendientesAlAdmin } from "@/lib/notificaciones";

const HORAS_ENTRE_RECORDATORIOS = 2;

/**
 * Tareas periodicas del sistema. Le pegan:
 *  - Vercel Cron, una vez por dia (unico permitido en el plan Hobby).
 *  - Un servicio externo gratuito, cada hora, que es el que hace el trabajo
 *    real de mantener todo al dia.
 *
 * Ambos deben mandar el header `Authorization: Bearer <CRON_SECRET>`.
 * Vercel lo agrega solo cuando existe la variable de entorno CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 1) Liberar los departamentos de las reservas cuya seña vencio sin pagarse.
  const canceladas = await cancelarSeniasVencidas();

  // 2) Recordarle al admin que tiene reservas esperando revision. Las
  //    PENDIENTES nunca se cancelan solas: solo se insiste con el aviso.
  const pendientes = await prisma.reserva.count({ where: { estado: "PENDIENTE" } });

  let recordatorioEnviado = false;
  if (pendientes > 0) {
    const config = await prisma.configuracionGeneral.findUnique({
      where: { id: "singleton" },
    });
    const ultimo = config?.ultimoRecordatorioPendientes;
    const limite = new Date(Date.now() - HORAS_ENTRE_RECORDATORIOS * 60 * 60 * 1000);

    if (!ultimo || ultimo < limite) {
      await notificarPendientesAlAdmin(pendientes);
      await prisma.configuracionGeneral.update({
        where: { id: "singleton" },
        data: { ultimoRecordatorioPendientes: new Date() },
      });
      recordatorioEnviado = true;
    }
  }

  return NextResponse.json({
    ok: true,
    reservasCanceladasPorSeniaVencida: canceladas,
    reservasPendientes: pendientes,
    recordatorioEnviado,
  });
}
