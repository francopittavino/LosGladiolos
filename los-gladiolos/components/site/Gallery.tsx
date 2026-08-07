"use client";

import { useEffect, useRef, useState } from "react";

const ACENTOS = ["bg-verde", "bg-celeste", "bg-amarillo", "bg-coral", "bg-bordo", "bg-carbon"];
const TOTAL = ACENTOS.length;

/*
  TODO: reemplazar estos placeholders por las fotos reales del complejo
  (<Image src="/images/galeria/foto-1.jpg" fill .../> dentro de cada card)
  cuando esten disponibles.
*/
export function Gallery() {
  const [activo, setActivo] = useState(0);
  const dragInicioX = useRef<number | null>(null);

  function ir(index: number) {
    setActivo(((index % TOTAL) + TOTAL) % TOTAL);
  }
  const siguiente = () => ir(activo + 1);
  const anterior = () => ir(activo - 1);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") siguiente();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function onPointerDown(e: React.PointerEvent) {
    dragInicioX.current = e.clientX;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (dragInicioX.current === null) return;
    const delta = e.clientX - dragInicioX.current;
    if (delta > 50) anterior();
    else if (delta < -50) siguiente();
    dragInicioX.current = null;
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-center text-2xl font-bold text-carbon">Conocé el complejo</h2>

      <div
        className="relative mt-10 h-72 touch-pan-y select-none sm:h-96"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {ACENTOS.map((color, i) => {
          let offset = i - activo;
          if (offset > TOTAL / 2) offset -= TOTAL;
          if (offset < -TOTAL / 2) offset += TOTAL;
          const abs = Math.abs(offset);
          const visible = abs <= 2;

          const scale = offset === 0 ? 1 : abs === 1 ? 0.78 : 0.62;
          const opacity = !visible ? 0 : offset === 0 ? 1 : abs === 1 ? 0.65 : 0.35;
          const zIndex = 10 - abs;

          return (
            <button
              key={i}
              type="button"
              aria-label={`Ver foto ${i + 1}`}
              onClick={() => ir(i)}
              style={{
                transform: `translate(-50%, -50%) translateX(${offset * 62}%) scale(${scale})`,
                opacity,
                zIndex,
                pointerEvents: visible ? "auto" : "none",
              }}
              className={`absolute left-1/2 top-1/2 flex h-60 w-48 items-center justify-center rounded-2xl shadow-xl transition-all duration-500 ease-out sm:h-80 sm:w-64 ${color} ${
                offset === 0 ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span className="text-sm font-medium text-crema/80">Foto {i + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={anterior}
          aria-label="Foto anterior"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-bordo text-crema shadow-sm transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex gap-2">
          {ACENTOS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Ir a la foto ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === activo ? "w-6 bg-bordo" : "w-2 bg-carbon/20"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={siguiente}
          aria-label="Foto siguiente"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-bordo text-crema shadow-sm transition-transform hover:scale-105"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
