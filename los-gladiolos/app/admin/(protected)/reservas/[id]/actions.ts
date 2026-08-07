"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { haySesionAdminValida } from "@/lib/adminAuth";
import { departamentosDisponibles } from "@/lib/reservas";
import {
  notificarReservaConfirmada,
  notificarReservaRechazada,
} from "@/lib/notificaciones";
import {
  actualizarEventoReserva,
  crearEventoReserva,
  eliminarEventoReserva,
} from "@/lib/googleCalendar";

async function requireAdmin() {
  const autenticado = await haySesionAdminValida();
  if (!autenticado) {
    redirect("/admin/login");
  }
}

export async function confirmarReserva(reservaId: string) {
  await requireAdmin();

  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { departamento: true },
  });
  if (!reserva || reserva.estado !== "PENDIENTE") return;

  const config = await prisma.configuracionGeneral.findUnique({
    where: { id: "singleton" },
  });
  const porcentaje = config?.porcentajeSenia ?? 30;
  const plazoHoras = config?.plazoVencimientoHoras ?? 24;

  const montoSenia = (Number(reserva.precioTotal) * Number(porcentaje)) / 100;
  const vencimientoSenia = new Date(Date.now() + plazoHoras * 60 * 60 * 1000);

  const googleEventId = reserva.departamento
    ? await crearEventoReserva({
        nombreSolicitante: reserva.nombreSolicitante,
        telefono: reserva.telefono,
        fechaInicio: reserva.fechaInicio,
        fechaFin: reserva.fechaFin,
        cantPersonas: reserva.cantPersonas,
        departamentoNombre: reserva.departamento.nombre,
        colorCalendario: reserva.departamento.colorCalendario,
      })
    : null;

  await prisma.reserva.update({
    where: { id: reservaId },
    data: {
      estado: "CONFIRMADA",
      montoSenia,
      vencimientoSenia,
      googleEventId,
    },
  });

  await notificarReservaConfirmada(reservaId);
  revalidatePath("/admin");
  revalidatePath(`/admin/reservas/${reservaId}`);
}

export async function rechazarReserva(reservaId: string) {
  await requireAdmin();

  const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (!reserva || reserva.estado !== "PENDIENTE") return;

  // Una PENDIENTE normalmente todavia no tiene evento (se crea al confirmar),
  // pero si por algun motivo lo tuviera hay que limpiarlo del calendario.
  if (reserva.googleEventId) {
    await eliminarEventoReserva(reserva.googleEventId);
  }

  await prisma.reserva.update({
    where: { id: reservaId },
    data: { estado: "RECHAZADA", googleEventId: null },
  });

  await notificarReservaRechazada(reservaId);
  revalidatePath("/admin");
  revalidatePath(`/admin/reservas/${reservaId}`);
}

export async function marcarSeniaPagada(reservaId: string) {
  await requireAdmin();

  const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (!reserva || reserva.estado !== "CONFIRMADA") return;

  await prisma.reserva.update({
    where: { id: reservaId },
    data: { estado: "SENIA_PAGADA", seniaPagada: true },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/reservas/${reservaId}`);
}

export type ReasignarState = { error: string | null } | undefined;

export async function reasignarDepartamento(
  reservaId: string,
  _prevState: ReasignarState,
  formData: FormData
): Promise<ReasignarState> {
  await requireAdmin();

  const nuevoDepartamentoId = String(formData.get("departamentoId") ?? "");
  const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (!reserva) return { error: "Reserva no encontrada." };

  const disponibles = await departamentosDisponibles(
    reserva.fechaInicio,
    reserva.fechaFin,
    true,
    reservaId
  );

  const nuevoDepartamento = disponibles.find((d) => d.id === nuevoDepartamentoId);
  if (!nuevoDepartamento) {
    return { error: "Ese departamento no esta disponible para esas fechas." };
  }

  await prisma.reserva.update({
    where: { id: reservaId },
    data: { departamentoId: nuevoDepartamentoId },
  });

  // Si la reserva ya estaba confirmada tiene un evento creado: hay que
  // reflejar ahi el cambio de departamento (titulo y color).
  if (reserva.googleEventId) {
    await actualizarEventoReserva(reserva.googleEventId, {
      nombreSolicitante: reserva.nombreSolicitante,
      telefono: reserva.telefono,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
      cantPersonas: reserva.cantPersonas,
      departamentoNombre: nuevoDepartamento.nombre,
      colorCalendario: nuevoDepartamento.colorCalendario,
      esViajanteFrecuente: Boolean(reserva.viajanteFrecuenteId),
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/reservas/${reservaId}`);
  return { error: null };
}
