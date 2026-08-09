"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { haySesionAdminValida } from "@/lib/adminAuth";
import { normalizarTelefono } from "@/lib/telefono";

export type GuardarViajanteState = { error: string | null } | undefined;

export async function guardarViajante(
  _prevState: GuardarViajanteState,
  formData: FormData
): Promise<GuardarViajanteState> {
  const autenticado = await haySesionAdminValida();
  if (!autenticado) redirect("/admin/login");

  const numeroDni = String(formData.get("numeroDni") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const cantPersonasHabitual = Number(formData.get("cantPersonasHabitual"));
  const dominioVehiculo = String(formData.get("dominioVehiculo") ?? "").trim();
  const fotoDni = String(formData.get("fotoDni") ?? "").trim();
  const notas = String(formData.get("notas") ?? "").trim();

  if (!numeroDni || !nombre || !telefono) {
    return { error: "Nombre, telefono y DNI son obligatorios." };
  }

  // El viajante hereda este telefono en cada reserva, asi que tambien tiene
  // que quedar guardado en el formato que espera WhatsApp.
  const telefonoNormalizado = normalizarTelefono(telefono);
  if (!telefonoNormalizado) {
    return {
      error:
        "No se pudo interpretar el telefono. Escribilo con la caracteristica, por ejemplo 343 451-2995.",
    };
  }
  if (!cantPersonasHabitual || cantPersonasHabitual < 1 || cantPersonasHabitual > 5) {
    return { error: "La cantidad de personas habitual debe ser entre 1 y 5." };
  }

  await prisma.viajanteFrecuente.upsert({
    where: { numeroDni },
    update: {
      nombre,
      telefono: telefonoNormalizado,
      cantPersonasHabitual,
      dominioVehiculo: dominioVehiculo || null,
      fotoDni: fotoDni || undefined,
      notas: notas || null,
    },
    create: {
      numeroDni,
      nombre,
      telefono: telefonoNormalizado,
      cantPersonasHabitual,
      dominioVehiculo: dominioVehiculo || null,
      fotoDni: fotoDni || null,
      notas: notas || null,
    },
  });

  revalidatePath("/admin/viajantes");
  return { error: null };
}

export async function eliminarViajante(id: string) {
  const autenticado = await haySesionAdminValida();
  if (!autenticado) redirect("/admin/login");

  await prisma.viajanteFrecuente.delete({ where: { id } });
  revalidatePath("/admin/viajantes");
}
