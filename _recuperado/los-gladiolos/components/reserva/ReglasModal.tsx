"use client";

import { useRef, useState } from "react";

export function ReglasModal({
  texto,
  onAceptar,
  onCerrar,
}: {
  texto: string;
  onAceptar: () => void;
  onCerrar: () => void;
}) {
  const [llegoAlFinal, setLlegoAlFinal] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = bodyRef.current;
    if (!el) return;
    const yaLlego = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (yaLlego) setLlegoAlFinal(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/60 px-4 py-8"
      onClick={onCerrar}
    >
      <div
        className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-blanco shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-carbon/10 px-6 py-4">
          <h2 className="font-bold text-bordo">Reglamento del alojamiento</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="text-carbon/50 hover:text-carbon"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div
          ref={bodyRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto whitespace-pre-wrap px-6 py-4 text-sm text-carbon/90"
        >
          {texto}
        </div>

        <div className="border-t border-carbon/10 px-6 py-4">
          {!llegoAlFinal && (
            <p className="mb-2 text-center text-xs text-carbon/50">
              Desplazate hasta el final para poder aceptar.
            </p>
          )}
          <button
            type="button"
            disabled={!llegoAlFinal}
            onClick={onAceptar}
            className="w-full rounded-full bg-bordo px-6 py-2.5 font-semibold text-crema transition-colors hover:bg-bordo/90 disabled:cursor-not-allowed disabled:bg-carbon/20"
          >
            Acepto el reglamento
          </button>
        </div>
      </div>
    </div>
  );
}
