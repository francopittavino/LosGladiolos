"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { guardarViajante } from "./actions";

export function ViajanteForm() {
  const [state, formAction, pending] = useActionState(guardarViajante, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [fotoDni, setFotoDni] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  useEffect(() => {
    if (!pending && !state?.error) {
      formRef.current?.reset();
      setFotoDni(null);
    }
  }, [pending, state]);

  async function subirFoto(file: File) {
    setSubiendoFoto(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload-dni", { method: "POST", body: formData });
      const data = await res.json();
      setFotoDni(data.url ?? null);
    } finally {
      setSubiendoFoto(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="fotoDni" value={fotoDni ?? ""} />
      <label className="text-sm text-carbon">
        Nombre
        <input name="nombre" required className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2" />
      </label>
      <label className="text-sm text-carbon">
        Teléfono
        <input name="telefono" required className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2" />
      </label>
      <label className="text-sm text-carbon">
        DNI
        <input name="numeroDni" required className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2" />
      </label>
      <label className="text-sm text-carbon">
        Cantidad de personas habitual
        <input
          type="number"
          min={1}
          max={5}
          name="cantPersonasHabitual"
          required
          className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2"
        />
      </label>
      <label className="text-sm text-carbon">
        Dominio del vehículo (opcional)
        <input name="dominioVehiculo" className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2" />
      </label>
      <label className="text-sm text-carbon">
        Notas (opcional)
        <input name="notas" className="mt-1 block w-full rounded-lg border border-carbon/20 px-3 py-2" />
      </label>
      <div className="text-sm text-carbon sm:col-span-2">
        Foto de DNI (opcional, para tenerla cargada una sola vez)
        <div className="mt-1 flex items-center gap-3">
          <label className="cursor-pointer rounded-lg bg-carbon/10 px-3 py-2 text-sm font-medium text-carbon/70">
            {fotoDni ? "Cambiar foto" : "Subir foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) subirFoto(file);
              }}
            />
          </label>
          {subiendoFoto && <span className="text-sm text-celeste">Subiendo...</span>}
          {fotoDni && !subiendoFoto && <span className="text-sm text-verde">Subida ✓</span>}
        </div>
      </div>

      {state?.error && (
        <p className="sm:col-span-2 text-sm text-coral">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || subiendoFoto}
        className="sm:col-span-2 w-fit rounded-full bg-bordo px-6 py-2.5 font-semibold text-crema disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar viajante"}
      </button>
    </form>
  );
}
