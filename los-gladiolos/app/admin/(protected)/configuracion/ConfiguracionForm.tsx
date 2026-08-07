"use client";

import { useActionState } from "react";
import { guardarConfiguracion } from "./actions";

export function ConfiguracionForm({
  porcentajeSenia,
  plazoVencimientoHoras,
  textoReglas,
  datosBancarios,
}: {
  porcentajeSenia: number;
  plazoVencimientoHoras: number;
  textoReglas: string;
  datosBancarios: string;
}) {
  const [state, formAction, pending] = useActionState(guardarConfiguracion, undefined);

  return (
    <form action={formAction} className="max-w-lg space-y-4 rounded-xl bg-blanco p-6 shadow-sm">
      <label className="block text-sm text-carbon">
        Porcentaje de seña (%)
        <input
          type="number"
          min={1}
          max={100}
          name="porcentajeSenia"
          defaultValue={porcentajeSenia}
          className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm text-carbon">
        Plazo de vencimiento de la seña (horas)
        <input
          type="number"
          min={1}
          name="plazoVencimientoHoras"
          defaultValue={plazoVencimientoHoras}
          className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm text-carbon">
        Texto de reglas del alojamiento
        <textarea
          name="textoReglas"
          defaultValue={textoReglas}
          rows={6}
          className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2"
        />
      </label>
      <label className="block text-sm text-carbon">
        Datos bancarios para la seña
        <span className="mt-0.5 block text-xs text-carbon/60">
          Se le mandan por WhatsApp al huésped cuando aprobás su reserva. Poné alias, CBU y
          titular de la cuenta.
        </span>
        <textarea
          name="datosBancarios"
          defaultValue={datosBancarios}
          rows={4}
          placeholder={"Alias: los.gladiolos\nCBU: 0000000000000000000000\nTitular: ..."}
          className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2"
        />
      </label>

      {state?.error && (
        <p className="rounded-lg bg-coral/10 px-4 py-2 text-sm text-coral">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-verde/10 px-4 py-2 text-sm text-verde">Configuración guardada.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-bordo px-6 py-2.5 font-semibold text-crema disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar configuración"}
      </button>
    </form>
  );
}
