import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Planta } from "@prisma/client";

config({ path: ".env.local", quiet: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const departamentos = [
    { nombre: "Departamento 1", planta: Planta.BAJA, colorCalendario: "1" },
    { nombre: "Departamento 2", planta: Planta.BAJA, colorCalendario: "2" },
    { nombre: "Departamento 3", planta: Planta.ALTA, colorCalendario: "3" },
    { nombre: "Departamento 4", planta: Planta.ALTA, colorCalendario: "4" },
  ];

  for (const depto of departamentos) {
    await prisma.departamento.upsert({
      where: { id: depto.nombre },
      update: {},
      create: { id: depto.nombre, ...depto, capacidad: 5 },
    });
  }

  // Matriz de tarifas de PRUEBA (valores ficticios) para poder testear el
  // calculo de precio. Formula de prueba: (base + extra por persona) x noches.
  const PRECIO_BASE_NOCHE = 15000;
  const PRECIO_POR_PERSONA_EXTRA = 4000;

  for (let personas = 1; personas <= 5; personas++) {
    for (let noches = 1; noches <= 7; noches++) {
      const precioPorNoche =
        PRECIO_BASE_NOCHE + (personas - 1) * PRECIO_POR_PERSONA_EXTRA;
      const precioTotal = precioPorNoche * noches;

      await prisma.tarifaMatriz.upsert({
        where: { cantPersonas_cantNoches: { cantPersonas: personas, cantNoches: noches } },
        update: { precioTotal },
        create: { cantPersonas: personas, cantNoches: noches, precioTotal },
      });
    }
  }

  await prisma.configuracionGeneral.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      porcentajeSenia: 30,
      plazoVencimientoHoras: 1,
      textoReglas:
        "Texto de reglas del alojamiento pendiente de definir por el administrador.",
    },
  });

  console.log(
    "Seed completado: 4 departamentos + configuracion general + 35 tarifas de prueba."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
