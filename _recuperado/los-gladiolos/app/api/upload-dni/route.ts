import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibio ningun archivo." }, { status: 400 });
  }

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato de imagen no soportado. Usa JPG, PNG, WEBP o HEIC." },
      { status: 400 }
    );
  }

  if (file.size > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json({ error: "La imagen es demasiado grande (maximo 10MB)." }, { status: 400 });
  }

  const blob = await put(`dni/${crypto.randomUUID()}-${file.name}`, file, {
    access: "private",
    addRandomSuffix: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return NextResponse.json({ url: blob.url });
}
