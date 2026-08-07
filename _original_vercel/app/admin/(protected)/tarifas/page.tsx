import { prisma } from "@/lib/prisma";
import { TarifasForm } from "./TarifasForm";

export default async function TarifasPage() {
  const tarifas = await prisma.tarifaMatriz.findMany();

  const valores: Record<string, number> = {};
  for (const t of tarifas) {
    valores[`p${t.cantPersonas}n${t.cantNoches}`] = Number(t.precioTotal);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-carbon">Matriz de Tarifas</h1>
      <p className="mt-1 text-sm text-carbon/60">
        Precio total por cantidad de personas y de noches (hasta 7 noches).
      </p>
      <div className="mt-6">
        <TarifasForm valores={valores} />
      </div>
    </div>
  );
}
