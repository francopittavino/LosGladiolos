/*
  Borra TODAS las reservas y sus eventos de Google Calendar.

  Es de un solo uso, para dejar la base limpia antes de las pruebas de
  WhatsApp. Las personas huesped se van solas por el onDelete: Cascade del
  schema, pero el evento del calendario no: hay que borrarlo por API o queda
  huerfano en "Los Gladiolos PRUEBAS".

  Correr con:  npx tsx prisma/limpiar-reservas-prueba.ts --confirmar
*/
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";

config({ path: ".env.local", quiet: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Se repite la conexion en vez de importar lib/googleCalendar.ts porque ese
 * modulo arranca con `import "server-only"`, que no resuelve fuera de Next.
 */
function getCalendar() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!email || !rawKey || !calendarId) return null;

  const auth = new google.auth.JWT({
    email,
    key: rawKey.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return { calendar: google.calendar({ version: "v3", auth }), calendarId };
}

async function main() {
  const confirmado = process.argv.includes("--confirmar");

  const reservas = await prisma.reserva.findMany({
    select: {
      id: true,
      nombreSolicitante: true,
      telefono: true,
      estado: true,
      googleEventId: true,
      _count: { select: { personas: true } },
    },
    orderBy: { fechaInicio: "asc" },
  });

  console.log(`${reservas.length} reserva(s):\n`);
  for (const r of reservas) {
    console.log(
      `  ${r.nombreSolicitante} · tel ${JSON.stringify(r.telefono)} · ${r.estado} · ` +
        `${r._count.personas} persona(s) · calendario: ${r.googleEventId ?? "sin evento"}`
    );
  }

  if (!confirmado) {
    console.log("\nModo simulacion. Para borrar de verdad: --confirmar");
    return;
  }

  const cfg = getCalendar();
  let eventosBorrados = 0;
  for (const r of reservas) {
    if (!r.googleEventId || !cfg) continue;
    try {
      await cfg.calendar.events.delete({ calendarId: cfg.calendarId, eventId: r.googleEventId });
      eventosBorrados++;
    } catch (error) {
      console.error(`  No se pudo borrar el evento ${r.googleEventId}:`, error);
    }
  }

  const { count } = await prisma.reserva.deleteMany({});
  console.log(`\nBorradas ${count} reserva(s) y ${eventosBorrados} evento(s) de calendario.`);
}

main().finally(() => prisma.$disconnect());
