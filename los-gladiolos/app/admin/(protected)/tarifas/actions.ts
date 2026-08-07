"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { haySesionAdminValida } from "@/lib/adminAuth";

export type GuardarTarifasState = { error: string | null; ok: boolean } | undefined;

export async function guardarTarifas(
  _prevState: GuardarTarifasState,
  formData: FormData
): Promise<GuardarTarifasState> {
  const autenticado = await haySesionAdminValida();
  if (!autenticado) redirect("/admin/login");

  const actualizaciones: { personas: number; noches: number; precio: number }[] = [];

  for (let personas = 1; personas <= 5; personas++) {
    for (let noches = 1; noches <= 7; noches++) {
      const raw = formData.get(`p${personas}n${noches}`);
      const precio = Number(raw);
      if (raw === null || Number.isNaN(precio) || precio < 0) {
        return { error: `Precio invalido para ${personas} personas / ${noches} noches.`, ok: false };
      }
      actualizaciones.push({ personas, noches, precio });
    }
  }

  await prisma.$transaction(
    actualizaciones.map((a) =>
      prisma.tarifaMatriz.upsert({
        where: { cantPersonas_cantNoches: { cantPersonas: a.personas, cantNoches: a.noches } },
        update: { precioTotal: a.precio },
        create: { cantPersonas: a.personas, cantNoches: a.noches, precioTotal: a.precio },
      })
    )
  );

  revalidatePath("/admin/tarifas");
  return { error: null, ok: true };
}
