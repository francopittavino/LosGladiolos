import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { normalizarTelefono } from "../lib/telefono";

config({ path: ".env.local", quiet: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Solo se muestran las puntas: no hace falta volcar telefonos enteros al log. */
function enmascarar(t: string): string {
  return t.length <= 6 ? t : `${t.slice(0, 3)}${"·".repeat(t.length - 6)}${t.slice(-3)}`;
}

async function main() {
  const reservas = await prisma.reserva.findMany({ select: { telefono: true } });
  const viajantes = await prisma.viajanteFrecuente.findMany({ select: { telefono: true } });

  for (const [etiqueta, filas] of [
    ["reservas", reservas],
    ["viajantes", viajantes],
  ] as const) {
    const yaOk: string[] = [];
    const seCorrigen: string[] = [];
    const sinArreglo: string[] = [];

    for (const fila of filas) {
      const normalizado = normalizarTelefono(fila.telefono);
      if (!normalizado) sinArreglo.push(enmascarar(fila.telefono));
      else if (normalizado === fila.telefono) yaOk.push(fila.telefono);
      else seCorrigen.push(`${enmascarar(fila.telefono)} -> ${enmascarar(normalizado)}`);
    }

    console.log(`\n${etiqueta}: ${filas.length} registro(s)`);
    console.log(`  ya normalizados: ${yaOk.length}`);
    console.log(`  se corregirian : ${seCorrigen.length}`);
    seCorrigen.forEach((l) => console.log(`      ${l}`));
    console.log(`  sin arreglo    : ${sinArreglo.length}`);
    sinArreglo.forEach((l) => console.log(`      ${l}`));
  }
}

main().finally(() => prisma.$disconnect());
