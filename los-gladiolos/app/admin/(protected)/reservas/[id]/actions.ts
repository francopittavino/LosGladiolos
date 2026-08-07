"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EstadoReserva } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { haySesionAdminValida } from "@/lib/adminAuth";
import { departamentosDisponibles } from "@/lib/reservas";
import {
  notificarReservaConfirmada,
  notificarReservaRechazada,
  notificarReservaCanceladaPorAdmin,
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
  const plazoHoras = config?.plazoVencimientoHoras ?? 1;

  const montoSenia = (Number(reserva.precioTotal) * Number(porcentaje)) / 100;
  const vencimientoSenia = new Date(Date.now() + plazoHoras * 60 * 60 * 1000);

  const googleEventId = reserva.departamento
    ? await crearEventoReserva({
        nombreSolicitante: reserva.nombreSolicitante,
        telefono: reserva.telefono,
        fechaInicio: reserva.fechaInicio,
        fechaFin: reserva.fechaFin,
        cantPersonas: reserva.cantPersonas,
        camaMatrimonial: reserva.camaMatrimonial,
        camasSimples: reserva.camasSimples,
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

/**
 * Estados que el admin todavia puede cancelar a mano. Una PENDIENTE no entra:
 * para esa esta el boton Rechazar, que es lo mismo pero antes de aprobar.
 */
const ESTADOS_CANCELABLES: EstadoReserva[] = ["CONFIRMADA", "SENIA_PAGADA"];

export type CancelarState = { error: string | null } | undefined;

/**
 * Cancelacion manual: libera el departamento, borra el evento del calendario
 * y le avisa al huesped por WhatsApp. Sirve tanto para cortar antes de tiempo
 * una reserva que no va a pagar como para dar de baja una ya señada.
 */
export async function cancelarReserva(
  reservaId: string,
  _prevState: CancelarState,
  formData: FormData
): Promise<CancelarState> {
  await requireAdmin();

  const motivo = String(formData.get("motivo") ?? "").trim();
  const reserva = await prisma.reserva.findUnique({ where: { id: reservaId } });
  if (!reserva) return { error: "Reserva no encontrada." };
  if (!ESTADOS_CANCELABLES.includes(reserva.estado)) {
    return { error: "Esta reserva ya no se puede cancelar." };
  }

  // updateMany condicional: si entre que se cargo la pagina y el click el cron
  // la cancelo por seña vencida, no se pisa ese estado.
  const { count } = await prisma.reserva.updateMany({
    where: { id: reservaId, estado: reserva.estado },
    data: {
      estado: "CANCELADA_MANUAL",
      motivoCancelacion: motivo || null,
      googleEventId: null,
    },
  });
  if (count === 0) {
    return { error: "La reserva cambió de estado mientras tanto. Recargá la página." };
  }

  if (reserva.googleEventId) {
    await eliminarEventoReserva(reserva.googleEventId);
  }
  await notificarReservaCanceladaPorAdmin(reservaId, motivo);

  revalidatePath("/admin");
  revalidatePath(`/admin/reservas/${reservaId}`);
  return { error: null };
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
      camaMatrimonial: reserva.camaMatrimonial,
      camasSimples: reserva.camasSimples,
      departamentoNombre: nuevoDepartamento.nombre,
      colorCalendario: nuevoDepartamento.colorCalendario,
      esViajanteFrecuente: Boolean(reserva.viajanteFrecuenteId),
    });
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/reservas/${reservaId}`);
  return { error: null };
}
