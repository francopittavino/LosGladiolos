"use server";

import { redirect } from "next/navigation";
import { passwordCorrecta, crearSesionAdmin } from "@/lib/adminAuth";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!passwordCorrecta(password)) {
    return { error: "Contraseña incorrecta." };
  }

  await crearSesionAdmin();
  redirect("/admin");
}
