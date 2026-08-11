import "server-only";
import { normalizarTelefono } from "@/lib/telefono";

const API_VERSION = "v25.0";
const API_BASE_URL_DEFECTO = `https://graph.facebook.com/${API_VERSION}`;

/**
 * El host sale de una variable para poder cambiar de proveedor sin tocar
 * codigo. Coexistence —que el numero ande a la vez en el celular del dueno y
 * en la Cloud API— solo la habilita un proveedor autorizado, asi que el alta
 * del numero real pasa por uno.
 *
 * Con Dualhook la WABA queda en nuestro portafolio y Meta entrega directo, o
 * sea que el default sirve tal cual y solo cambian el token y el phoneNumberId.
 *
 * OJO si alguna vez se migra a 360dialog: ademas del host, ellos omiten el
 * phoneNumberId de la ruta y autentican con el header D360-API-KEY en lugar de
 * Bearer. Eso si obliga a tocar enviar().
 */
function getConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  const baseUrl = (process.env.WHATSAPP_API_BASE_URL || API_BASE_URL_DEFECTO).replace(/\/+$/, "");
  return { token, phoneNumberId, baseUrl };
}

export function whatsappConfigurado(): boolean {
  return getConfig() !== null;
}

/**
 * Ultima red de seguridad antes de llamar a Meta. Los numeros ya vienen
 * normalizados desde el formulario, pero los que se cargaron antes de esa
 * validacion —o WHATSAPP_ADMIN_PHONE, que se edita a mano en Vercel— pueden
 * estar mal. Preferimos un log explicito antes que un envio que falla solo.
 */
function normalizarNumero(numero: string): string | null {
  return normalizarTelefono(numero);
}

async function enviar(payload: Record<string, unknown>, destino: string) {
  const cfg = getConfig();
  if (!cfg) {
    console.log(`[whatsapp] Sin credenciales. No se envia a ${destino}.`);
    return false;
  }

  try {
    const res = await fetch(
      `${cfg.baseUrl}/${cfg.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const detalle = await res.text();
      console.error(`[whatsapp] Error ${res.status} enviando a ${destino}: ${detalle}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[whatsapp] Fallo de red enviando a ${destino}:`, error);
    return false;
  }
}

/**
 * Mensaje de texto libre. OJO: Meta solo lo permite dentro de las 24hs
 * posteriores a que el destinatario te haya escrito. Fuera de esa ventana
 * hay que usar una plantilla aprobada (ver enviarPlantilla).
 */
export async function enviarTexto(numero: string, texto: string): Promise<boolean> {
  const to = normalizarNumero(numero);
  if (!to) {
    console.error(`[whatsapp] Numero invalido, no se envia: ${JSON.stringify(numero)}`);
    return false;
  }
  return enviar(
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: texto },
    },
    to
  );
}

/**
 * Mensaje basado en una plantilla aprobada por Meta. Es la unica forma de
 * escribirle a alguien que no te contacto en las ultimas 24hs, que es el
 * caso de los avisos automaticos a los huespedes.
 */
export async function enviarPlantilla(
  numero: string,
  nombrePlantilla: string,
  idioma: string,
  parametros: string[] = []
): Promise<boolean> {
  const to = normalizarNumero(numero);
  if (!to) {
    console.error(`[whatsapp] Numero invalido, no se envia: ${JSON.stringify(numero)}`);
    return false;
  }
  const components = parametros.length
    ? [
        {
          type: "body",
          parameters: parametros.map((p) => ({ type: "text", text: p })),
        },
      ]
    : undefined;

  return enviar(
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: nombrePlantilla,
        language: { code: idioma },
        ...(components ? { components } : {}),
      },
    },
    to
  );
}
