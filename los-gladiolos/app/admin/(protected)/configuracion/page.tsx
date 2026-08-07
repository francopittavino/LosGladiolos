import { prisma } from "@/lib/prisma";
import { ConfiguracionForm } from "./ConfiguracionForm";

export default async function ConfiguracionPage() {
  const config = await prisma.configuracionGeneral.findUnique({ where: { id: "singleton" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-carbon">Configuración General</h1>
      <div className="mt-6">
        <ConfiguracionForm
          porcentajeSenia={Number(config?.porcentajeSenia ?? 30)}
          plazoVencimientoHoras={config?.plazoVencimientoHoras ?? 24}
          textoReglas={config?.textoReglas ?? ""}
          datosBancarios={config?.datosBancarios ?? ""}
        />
      </div>
    </div>
  );
}
