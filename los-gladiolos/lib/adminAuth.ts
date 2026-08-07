import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const DURACION_MS = 12 * 60 * 60 * 1000; // 12 horas

function firmar(payload: string): string {
  const secret = process.env.ADMIN_PANEL_PASSWORD ?? "";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function crearToken(): string {
  const expira = Date.now() + DURACION_MS;
  const payload = `admin:${expira}`;
  const firma = firmar(payload);
  return `${payload}.${firma}`;
}

function tokenValido(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, firma] = token.split(".");
  if (!payload || !firma) return false;

  const firmaEsperada = firmar(payload);
  const firmaBuffer = Buffer.from(firma);
  const esperadaBuffer = Buffer.from(firmaEsperada);
  if (firmaBuffer.length !== esperadaBuffer.length) return false;
  if (!crypto.timingSafeEqual(firmaBuffer, esperadaBuffer)) return false;

  const expira = Number(payload.split(":")[1]);
  return Number.isFinite(expira) && Date.now() < expira;
}

export function passwordCorrecta(intento: string): boolean {
  const real = process.env.ADMIN_PANEL_PASSWORD ?? "";
  if (!real) return false;
  const intentoBuffer = Buffer.from(intento);
  const realBuffer = Buffer.from(real);
  if (intentoBuffer.length !== realBuffer.length) return false;
  return crypto.timingSafeEqual(intentoBuffer, realBuffer);
}

export async function crearSesionAdmin() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, crearToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_MS / 1000,
  });
}

export async function cerrarSesionAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function haySesionAdminValida(): Promise<boolean> {
  const cookieStore = await cookies();
  return tokenValido(cookieStore.get(COOKIE_NAME)?.value);
}
