/*
  Verificacion de credenciales de WhatsApp SIN enviar mensajes (Parte A.6 de
  WHATSAPP.md). Es una consulta de lectura: no gasta cupo ni cuenta para
  ningun limite.

  Si devuelve los datos del numero, quedan probadas las tres cosas que de
  verdad pueden estar mal: el token sirve, tiene los permisos, y el
  WHATSAPP_PHONE_NUMBER_ID es el correcto.

  El token nunca se imprime.

  Correr con:  npx tsx scripts/verificar-whatsapp.ts
*/
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const API_VERSION = "v25.0";

async function main() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE;

  console.log("Variables:");
  console.log(`  WHATSAPP_ACCESS_TOKEN    ${token ? `cargado (${token.length} caracteres)` : "FALTA"}`);
  console.log(`  WHATSAPP_PHONE_NUMBER_ID ${phoneNumberId ?? "FALTA"}`);
  console.log(`  WHATSAPP_ADMIN_PHONE     ${adminPhone ?? "FALTA"}`);

  if (!token || !phoneNumberId) {
    console.log("\nFaltan credenciales, no se puede consultar.");
    process.exitCode = 1;
    return;
  }

  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${phoneNumberId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const cuerpo = await res.json();

  console.log(`\nGET /${phoneNumberId} -> HTTP ${res.status}`);
  console.log(JSON.stringify(cuerpo, null, 2));

  if (res.ok) {
    console.log("\nOK: el token sirve, tiene permisos y el identificador del numero es correcto.");
  } else {
    console.log("\nFALLA: revisar el codigo de error de arriba contra la tabla de WHATSAPP.md.");
    process.exitCode = 1;
  }
}

main();
