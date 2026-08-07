"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-carbon/5 px-6 py-16">
      <form
        action={action}
        className="w-full max-w-sm rounded-2xl bg-blanco p-8 shadow-sm"
      >
        <h1 className="text-center text-xl font-bold text-bordo">Panel Admin</h1>
        <p className="mt-1 text-center text-sm text-carbon/60">Los Gladiolos</p>

        <label className="mt-6 block text-sm font-medium text-carbon">
          Contraseña
          <input
            type="password"
            name="password"
            autoFocus
            className="mt-1 w-full rounded-lg border border-carbon/20 px-3 py-2"
          />
        </label>

        {state?.error && (
          <p className="mt-3 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-full bg-bordo px-6 py-2.5 font-semibold text-crema transition-colors hover:bg-bordo/90 disabled:opacity-60"
        >
          {pending ? "Ingresando..." : "Ingresar"}
        </button>
        {pending && (
          <p className="mt-3 text-center text-xs text-carbon/50">
            Esto puede tardar unos segundos si el sistema estuvo inactivo.
          </p>
        )}
      </form>
    </div>
  );
}
