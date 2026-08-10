/*
  Prueba de entrega real: manda la plantilla `hello_world` desde el numero de
  prueba al destinatario autorizado.

  Sirve para validar la cadena completa antes de que se aprueben las plantillas
  propias: token -> Phone Number ID -> lista de destinatarios -> WhatsApp.

  El numero pasa por el normalizarTelefono() real de lib/telefono.ts. El payload
  es el mismo que arma enviarPlantilla() en lib/whatsapp.ts, replicado aca
  porque ese modulo arranca con `import "server-only"`, que Next resuelve en
  build y no existe como paquete.

  Correr con:  npx tsx scripts/enviar-mensaje-prueba.ts
*/
import { config } from "dotenv";
import { normalizarTelefono } from "../lib/telefono";

config({ path: ".env.local", quiet: true });

const API_VERSION = "v25.0";
const PLANTILLA = "hello_world";
const IDIOMA = "en_US";

async function main() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const destino = process.env.WHATSAPP_ADMIN_PHONE;

  if (!token || !phoneNumberId || !destino) {
    console.log("Faltan credenciales en .env.local.");
    process.exitCode = 1;
    return;
  }

  const to = normalizarTelefono(destino);
  if (!to) {
    console.log(`El destino ${JSON.stringify(destino)} no se pudo normalizar.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Enviando "${PLANTILLA}" (${IDIOMA}) a ${to} ...`);

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: { name: PLANTILLA, language: { code: IDIOMA } },
    }),
  });

  const cuerpo = await res.json();
  console.log(`HTTP ${res.status}`);
  console.log(JSON.stringify(cuerpo, null, 2));

  if (!res.ok) process.exitCode = 1;
}

main();
