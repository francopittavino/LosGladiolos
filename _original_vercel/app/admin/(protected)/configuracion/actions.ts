"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { haySesionAdminValida } from "@/lib/adminAuth";

export type GuardarConfigState = { error: string | null; ok: boolean } | undefined;

export async function guardarConfiguracion(
  _prevState: GuardarConfigState,
  formData: FormData
): Promise<GuardarConfigState> {
  const autenticado = await haySesionAdminValida();
  if (!autenticado) redirect("/admin/login");

  const porcentajeSenia = Number(formData.get("porcentajeSenia"));
  const plazoVencimientoHoras = Number(formData.get("plazoVencimientoHoras"));
  const textoReglas = String(formData.get("textoReglas") ?? "").trim();

  if (!Number.isFinite(porcentajeSenia) || porcentajeSenia <= 0 || porcentajeSenia > 100) {
    return { error: "El porcentaje de seña debe ser entre 1 y 100.", ok: false };
  }
  if (!Number.isFinite(plazoVencimientoHoras) || plazoVencimientoHoras <= 0) {
    return { error: "El plazo de vencimiento debe ser mayor a 0.", ok: false };
  }

  await prisma.configuracionGeneral.upsert({
    where: { id: "singleton" },
    update: { porcentajeSenia, plazoVencimientoHoras, textoReglas },
    create: { id: "singleton", porcentajeSenia, plazoVencimientoHoras, textoReglas },
  });

  revalidatePath("/admin/configuracion");
  return { error: null, ok: true };
}
