/*
  Copia las plantillas de la WABA de prueba a la WABA real.

  Las plantillas son por WABA y no se heredan, asi que hay que recrearlas.
  Se hace por la Graph API y no por el formulario porque se elige la
  categoria explicitamente, el rechazo llega en el momento con su motivo, y
  una rechazada se puede editar y reenviar sin borrarla (borrarla bloquea el
  nombre 30 dias).

  Los cuerpos se leen de la WABA origen en vez de repetirlos aca, para que no
  puedan quedar desincronizados.

  Correr con:  npx tsx scripts/clonar-plantillas.ts [--confirmar]
*/
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const API = "https://graph.facebook.com/v25.0";
const WABA_ORIGEN = "1815277973155566"; // Test WhatsApp Business Account
const WABA_DESTINO = "403489972840929"; // Los Gladiolos Alojamiento

/** Los siete avisos del sistema son todos transaccionales. */
const CATEGORIA = "UTILITY";

type Componente = { type: string; text?: string; example?: unknown };
type Plantilla = { name: string; language: string; category: string; components: Componente[] };

async function traer(waba: string, token: string): Promise<Plantilla[]> {
  const res = await fetch(
    `${API}/${waba}/message_templates?limit=100&fields=name,language,category,components`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.data;
}

async function main() {
  const confirmado = process.argv.includes("--confirmar");
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    console.log("Falta WHATSAPP_ACCESS_TOKEN en .env.local.");
    process.exitCode = 1;
    return;
  }

  const origen = await traer(WABA_ORIGEN, token);
  const destino = await traer(WABA_DESTINO, token);
  const yaEstan = new Set(destino.map((t) => `${t.name}|${t.language}`));

  // Las plantillas de ejemplo que Meta regala con el numero de prueba no van.
  const propias = origen.filter((t) => !/^(jaspers_market_|hello_world)/.test(t.name));

  console.log(`${propias.length} plantilla(s) propias en la WABA de prueba.`);
  console.log(`${destino.length} en la WABA real.\n`);

  for (const t of propias) {
    const clave = `${t.name}|${t.language}`;
    if (yaEstan.has(clave)) {
      console.log(`omitida  ${t.name.padEnd(32)} ya existe en la WABA real`);
      continue;
    }
    if (!confirmado) {
      console.log(`crearia  ${t.name.padEnd(32)} ${t.language}  ${CATEGORIA}`);
      continue;
    }

    const res = await fetch(`${API}/${WABA_DESTINO}/message_templates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: t.name,
        language: t.language,
        category: CATEGORIA,
        components: t.components,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      console.log(`creada   ${t.name.padEnd(32)} ${json.status}  ${json.category}`);
    } else {
      console.log(`FALLA    ${t.name.padEnd(32)} ${json.error?.error_user_msg ?? json.error?.message}`);
    }
  }

  if (!confirmado) console.log("\nModo simulacion. Para crearlas de verdad: --confirmar");
}

main();
