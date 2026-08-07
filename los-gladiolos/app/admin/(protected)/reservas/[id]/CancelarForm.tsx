"use client";

import { useActionState, useState } from "react";
import { cancelarReserva } from "./actions";

/**
 * Cancelar es irreversible (borra el evento del calendario y le avisa al
 * huesped), asi que el boton es de dos pasos: recien despues de confirmar se
 * ejecuta la accion.
 */
export function CancelarForm({
  reservaId,
  seniaPagada,
}: {
  reservaId: string;
  seniaPagada: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const action = cancelarReserva.bind(null, reservaId);
  const [state, formAction, pending] = useActionState(action, undefined);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-full bg-coral px-6 py-2.5 font-semibold text-crema"
      >
        Cancelar reserva
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full max-w-lg space-y-3 rounded-xl bg-blanco p-5 shadow-sm">
      <p className="text-sm font-semibold text-carbon">
        ¿Seguro que querés cancelar esta reserva?
      </p>
      <p className="text-xs text-carbon/60">
        Se libera el departamento, se borra el evento del calendario y le llega un WhatsApp
        al huésped avisándole.
        {seniaPagada && " Ojo: esta reserva ya tiene la seña pagada."}
      </p>
      <label className="block text-sm text-carbon">
        Motivo (opcional, se lo mandamos al huésped)
        <textarea
          name="motivo"
          rows={2}
          placeholder="Ej: no recibimos la transferencia"
          className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2"
        />
      </label>
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-coral px-6 py-2.5 font-semibold text-crema disabled:opacity-60"
        >
          {pending ? "Cancelando..." : "Sí, cancelar"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          disabled={pending}
          className="rounded-full bg-carbon/10 px-6 py-2.5 font-semibold text-carbon disabled:opacity-60"
        >
          Volver
        </button>
      </div>
    </form>
  );
}
