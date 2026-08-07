"use client";

import { useActionState } from "react";
import { guardarTarifas } from "./actions";

export function TarifasForm({ valores }: { valores: Record<string, number> }) {
  const [state, formAction, pending] = useActionState(guardarTarifas, undefined);

  return (
    <form action={formAction}>
      <div className="overflow-x-auto rounded-xl bg-blanco p-4 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-carbon/50">Personas \ Noches</th>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <th key={n} className="p-2 text-center text-carbon/50">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((personas) => (
              <tr key={personas}>
                <td className="p-2 font-medium text-carbon">{personas} persona(s)</td>
                {[1, 2, 3, 4, 5, 6, 7].map((noches) => {
                  const key = `p${personas}n${noches}`;
                  return (
                    <td key={noches} className="p-1">
                      <input
                        type="number"
                        min={0}
                        name={key}
                        defaultValue={valores[key] ?? 0}
                        className="w-24 rounded-lg border border-carbon/20 px-2 py-1.5 text-right"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state?.error && (
        <p className="mt-3 rounded-lg bg-coral/10 px-4 py-2 text-sm text-coral">{state.error}</p>
      )}
      {state?.ok && (
        <p className="mt-3 rounded-lg bg-verde/10 px-4 py-2 text-sm text-verde">
          Tarifas guardadas.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-full bg-bordo px-6 py-2.5 font-semibold text-crema disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar tarifas"}
      </button>
    </form>
  );
}
