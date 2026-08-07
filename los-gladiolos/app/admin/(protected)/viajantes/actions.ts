"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { haySesionAdminValida } from "@/lib/adminAuth";

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
  if (!cantPersonasHabitual || cantPersonasHabitual < 1 || cantPersonasHabitual > 5) {
    return { error: "La cantidad de personas habitual debe ser entre 1 y 5." };
  }

  await prisma.viajanteFrecuente.upsert({
    where: { numeroDni },
    update: {
      nombre,
      telefono,
      cantPersonasHabitual,
      dominioVehiculo: dominioVehiculo || null,
      fotoDni: fotoDni || undefined,
      notas: notas || null,
    },
    create: {
      numeroDni,
      nombre,
      telefono,
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
