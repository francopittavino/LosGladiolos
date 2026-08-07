"use client";

import { useActionState } from "react";
import { reasignarDepartamento } from "./actions";

export function ReasignarForm({
  reservaId,
  departamentoActualId,
  opciones,
}: {
  reservaId: string;
  departamentoActualId: string | null;
  opciones: { id: string; nombre: string }[];
}) {
  const action = reasignarDepartamento.bind(null, reservaId);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <select
        name="departamentoId"
        defaultValue={departamentoActualId ?? ""}
        className="rounded-lg border border-carbon/20 px-3 py-2 text-sm"
      >
        <option value="" disabled>
          Elegir departamento
        </option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-celeste px-4 py-2 text-sm font-semibold text-crema disabled:opacity-60"
      >
        {pending ? "Reasignando..." : "Reasignar"}
      </button>
      {state?.error && <p className="w-full text-sm text-coral">{state.error}</p>}
    </form>
  );
}
