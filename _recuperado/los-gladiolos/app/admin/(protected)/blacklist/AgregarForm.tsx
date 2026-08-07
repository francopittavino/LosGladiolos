"use client";

import { useActionState, useRef, useEffect } from "react";
import { agregarABlacklist } from "./actions";

export function AgregarForm() {
  const [state, formAction, pending] = useActionState(agregarABlacklist, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && !state?.error) formRef.current?.reset();
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="text-sm text-carbon">
        DNI
        <input
          name="numeroDni"
          required
          className="mt-1 block rounded-lg border border-carbon/20 px-3 py-2"
        />
      </label>
      <label className="text-sm text-carbon">
        Nombre (opcional)
        <input name="nombre" className="mt-1 block rounded-lg border border-carbon/20 px-3 py-2" />
      </label>
      <label className="text-sm text-carbon">
        Motivo (opcional)
        <input name="motivo" className="mt-1 block rounded-lg border border-carbon/20 px-3 py-2" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-coral px-5 py-2 font-semibold text-crema disabled:opacity-60"
      >
        {pending ? "Agregando..." : "Agregar"}
      </button>
      {state?.error && <p className="w-full text-sm text-coral">{state.error}</p>}
    </form>
  );
}
