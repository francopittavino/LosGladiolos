"use client";

import { useEffect, useState } from "react";

function fechaMinimaHoy(): string {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function ViajanteFrecuenteForm() {
  const [numeroDni, setNumeroDni] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [movilidadReducida, setMovilidadReducida] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [minFecha, setMinFecha] = useState("");
  const [resultado, setResultado] = useState<
    | { tipo: "ok"; departamento: string }
    | { tipo: "error"; mensaje: string }
    | null
  >(null);

  useEffect(() => {
    setMinFecha(fechaMinimaHoy());
  }, []);

  const puedeEnviar = numeroDni.trim() && fechaInicio && fechaFin && !enviando;

  async function enviar() {
    setEnviando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/viajantes/reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroDni,
          fechaInicio,
          fechaFin,
          puedeSubirEscaleras: !movilidadReducida,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResultado({ tipo: "ok", departamento: data.departamento });
      } else {
        setResultado({ tipo: "error", mensaje: data.error ?? "No se pudo crear la reserva." });
      }
    } catch {
      setResultado({ tipo: "error", mensaje: "Error de conexion. Intenta de nuevo." });
    } finally {
      setEnviando(false);
    }
  }

  if (resultado?.tipo === "ok") {
    return (
      <div className="rounded-xl bg-verde/10 p-6 text-center">
        <p className="text-lg font-semibold text-verde">¡Reserva confirmada!</p>
        <p className="mt-2 text-sm text-carbon">Te asignamos el {resultado.departamento}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-carbon">Tu numero de DNI</label>
        <input
          className="mt-1 w-full rounded-lg border border-carbon/20 px-3 py-2"
          value={numeroDni}
          onChange={(e) => setNumeroDni(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-carbon">Fecha de entrada</label>
          <input
            type="date"
            min={minFecha || undefined}
            className="mt-1 w-full rounded-lg border border-carbon/20 px-3 py-2"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-carbon">Fecha de salida</label>
          <input
            type="date"
            min={fechaInicio || minFecha || undefined}
            className="mt-1 w-full rounded-lg border border-carbon/20 px-3 py-2"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-carbon">
        <input
          type="checkbox"
          checked={movilidadReducida}
          onChange={(e) => setMovilidadReducida(e.target.checked)}
        />
        Alguna persona tiene movilidad reducida
      </label>

      {resultado?.tipo === "error" && (
        <p className="rounded-lg bg-coral/10 px-4 py-2 text-sm text-coral">{resultado.mensaje}</p>
      )}

      <button
        type="button"
        disabled={!puedeEnviar}
        onClick={enviar}
        className="w-full rounded-full bg-bordo px-6 py-3 font-semibold text-crema transition-colors hover:bg-bordo/90 disabled:cursor-not-allowed disabled:bg-carbon/20"
      >
        {enviando ? "Reservando..." : "Reservar directo"}
      </button>
      {enviando && (
        <p className="text-center text-xs text-carbon/50">
          Esto puede tardar unos segundos si el sistema estuvo inactivo.
        </p>
      )}
    </div>
  );
}
