import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { haySesionAdminValida } from "@/lib/adminAuth";

export async function GET(request: NextRequest) {
  const autenticado = await haySesionAdminValida();
  if (!autenticado) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url || !url.includes(".private.blob.vercel-storage.com/")) {
    return NextResponse.json({ error: "Parametro url invalido." }, { status: 400 });
  }

  const resultado = await get(url, {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  if (!resultado || resultado.statusCode !== 200) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  return new NextResponse(resultado.stream, {
    headers: {
      "Content-Type": resultado.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-cache",
    },
  });
}
