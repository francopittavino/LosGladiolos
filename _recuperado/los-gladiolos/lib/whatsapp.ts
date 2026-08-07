import "server-only";

const API_VERSION = "v25.0";

function getConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return null;
  return { token, phoneNumberId };
}

export function whatsappConfigurado(): boolean {
  return getConfig() !== null;
}

/** Deja el numero como lo espera Meta: solo digitos, con codigo de pais. */
function normalizarNumero(numero: string): string {
  return numero.replace(/\D/g, "");
}

async function enviar(payload: Record<string, unknown>, destino: string) {
  const cfg = getConfig();
  if (!cfg) {
    console.log(`[whatsapp] Sin credenciales. No se envia a ${destino}.`);
    return false;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${cfg.phoneNumberId}/messages`,
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
