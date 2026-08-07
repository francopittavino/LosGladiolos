"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { haySesionAdminValida } from "@/lib/adminAuth";

export type AgregarBlacklistState = { error: string | null } | undefined;

export async function agregarABlacklist(
  _prevState: AgregarBlacklistState,
  formData: FormData
): Promise<AgregarBlacklistState> {
  const autenticado = await haySesionAdminValida();
  if (!autenticado) redirect("/admin/login");

  const numeroDni = String(formData.get("numeroDni") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!numeroDni) {
    return { error: "Ingresa un numero de DNI." };
  }

  const existente = await prisma.listaNegra.findUnique({ where: { numeroDni } });
  if (existente) {
    return { error: "Ese DNI ya esta en la lista negra." };
  }

  await prisma.listaNegra.create({
    data: { numeroDni, nombre: nombre || null, motivo: motivo || null },
  });

  revalidatePath("/admin/blacklist");
  return { error: null };
}

export async function quitarDeBlacklist(id: string) {
  const autenticado = await haySesionAdminValida();
  if (!autenticado) redirect("/admin/login");

  await prisma.listaNegra.delete({ where: { id } });
  revalidatePath("/admin/blacklist");
}
