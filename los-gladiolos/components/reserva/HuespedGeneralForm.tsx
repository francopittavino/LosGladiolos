"use client";

import { useEffect, useState } from "react";
import { formatCamas, minimoCamasSimples, normalizarCamas } from "@/lib/camas";
import { ReglasModal } from "./ReglasModal";

type PersonaForm = {
  nombre: string;
  numeroDni: string;
  fotoDniFrente: string | null;
  fotoDniDorso: string | null;
  subiendoFrente: boolean;
  subiendoDorso: boolean;
};

function personaVacia(): PersonaForm {
  return {
    nombre: "",
    numeroDni: "",
    fotoDniFrente: null,
    fotoDniDorso: null,
    subiendoFrente: false,
    subiendoDorso: false,
  };
}

function fechaMinimaHoy(): string {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function BotonesFoto({
  label,
  subiendo,
  subido,
  onFile,
}: {
  label: string;
  subiendo: boolean;
  subido: boolean;
  onFile: (file: File) => void;
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-1 text-xs text-carbon/70">
      <span>{label}</span>
      <div className="flex gap-2">
        <label className="cursor-pointer rounded-lg bg-celeste/10 px-2 py-1.5 text-center font-medium text-celeste">
          📷 Cámara
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleChange}
          />
        </label>
        <label className="cursor-pointer rounded-lg bg-carbon/10 px-2 py-1.5 text-center font-medium text-carbon/70">
          Archivo
          <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
        </label>
      </div>
      {subiendo && <span className="text-celeste">Subiendo...</span>}
      {subido && <span className="text-verde">Subida ✓</span>}
    </div>
  );
}

type DisponibilidadResultado =
  | { estado: "idle" }
  | { estado: "cargando" }
  | { estado: "ok"; precioTotal: number; noches: number }
  | { estado: "error"; mensaje: string };

export function HuespedGeneralForm() {
  const [nombreSolicitante, setNombreSolicitante] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [cantPersonas, setCantPersonas] = useState(1);
  const [movilidadReducida, setMovilidadReducida] = useState(false);
  // Arranca con cada persona en su cama simple; el matrimonial se tilda aparte.
  const [camaMatrimonial, setCamaMatrimonial] = useState(false);
  const [camasSimples, setCamasSimples] = useState(1);
  const [personas, setPersonas] = useState<PersonaForm[]>([personaVacia()]);
  const [aceptoReglas, setAceptoReglas] = useState(false);
  const [textoReglas, setTextoReglas] = useState("");
  const [mostrarReglas, setMostrarReglas] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadResultado>({
    estado: "idle",
  });
  const [enviando, setEnviando] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState<
    { tipo: "ok"; reservaId: string } | { tipo: "error"; mensaje: string } | null
  >(null);
  const [minFecha, setMinFecha] = useState("");

  useEffect(() => {
    setMinFecha(fechaMinimaHoy());
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setTextoReglas(data.textoReglas || ""));
  }, []);

  useEffect(() => {
    setPersonas((prev) => {
      const nuevas = [...prev];
      while (nuevas.length < cantPersonas) nuevas.push(personaVacia());
      while (nuevas.length > cantPersonas) nuevas.pop();
      return nuevas;
    });
  }, [cantPersonas]);

  useEffect(() => {
    if (!fechaInicio || !fechaFin) {
      setDisponibilidad({ estado: "idle" });
      return;
    }
    const timeout = setTimeout(() => {
      setDisponibilidad({ estado: "cargando" });
      fetch("/api/disponibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaInicio,
          fechaFin,
          cantPersonas,
          puedeSubirEscaleras: !movilidadReducida,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.disponible) {
            setDisponibilidad({
              estado: "ok",
              precioTotal: data.precioTotal,
              noches: data.noches,
            });
          } else {
            setDisponibilidad({ estado: "error", mensaje: data.mensaje });
          }
        })
        .catch(() => setDisponibilidad({ estado: "error", mensaje: "Error al consultar disponibilidad." }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [fechaInicio, fechaFin, cantPersonas, movilidadReducida]);

  async function subirFoto(index: number, lado: "fotoDniFrente" | "fotoDniDorso", file: File) {
    const campoSubiendo = lado === "fotoDniFrente" ? "subiendoFrente" : "subiendoDorso";
    setPersonas((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [campoSubiendo]: true } : p))
    );

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-dni", { method: "POST", body: formData });
      const data = await res.json();
      setPersonas((prev) =>
        prev.map((p, i) =>
          i === index ? { ...p, [lado]: data.url ?? null, [campoSubiendo]: false } : p
        )
      );
    } catch {
      setPersonas((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [campoSubiendo]: false } : p))
      );
    }
  }

  // Cambiar la cantidad de personas vuelve la distribucion al arranque: no
  // tiene sentido arrastrar "3 simples" a una reserva de 2.
  function cambiarCantPersonas(nueva: number) {
    setCantPersonas(nueva);
    setCamaMatrimonial(false);
    setCamasSimples(nueva);
  }

  function cambiarCamaMatrimonial(tildada: boolean) {
    setCamaMatrimonial(tildada);
    // Al destildarla las plazas dejan de alcanzar: se suben al nuevo minimo.
    setCamasSimples((prev) => Math.max(prev, minimoCamasSimples(tildada, cantPersonas)));
  }

  const minSimples = minimoCamasSimples(camaMatrimonial, cantPersonas);
  const opcionesSimples = Array.from(
    { length: cantPersonas - minSimples + 1 },
    (_, i) => minSimples + i
  );
  const camasElegidas = normalizarCamas(cantPersonas, camaMatrimonial, camasSimples);

  const personasCompletas = personas.every(
    (p) => p.numeroDni.trim() && p.fotoDniFrente && p.fotoDniDorso
  );
  const puedeEnviar =
    nombreSolicitante.trim() &&
    telefono.trim() &&
    disponibilidad.estado === "ok" &&
    personasCompletas &&
    aceptoReglas &&
    !enviando;

  async function enviarReserva() {
    setEnviando(true);
    setResultadoEnvio(null);
    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreSolicitante,
          telefono,
          fechaInicio,
          fechaFin,
          cantPersonas,
          puedeSubirEscaleras: !movilidadReducida,
          camaMatrimonial: camasElegidas.camaMatrimonial,
          camasSimples: camasElegidas.camasSimples,
          aceptoReglas,
          personas: personas.map((p) => ({
            nombre: p.nombre || undefined,
            numeroDni: p.numeroDni,
            fotoDniFrente: p.fotoDniFrente,
            fotoDniDorso: p.fotoDniDorso,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResultadoEnvio({ tipo: "ok", reservaId: data.reservaId });
      } else {
        setResultadoEnvio({ tipo: "error", mensaje: data.error ?? "No se pudo crear la reserva." });
      }
    } catch {
      setResultadoEnvio({ tipo: "error", mensaje: "Error de conexion. Intenta de nuevo." });
    } finally {
      setEnviando(false);
    }
  }

  if (resultadoEnvio?.tipo === "ok") {
    return (
      <div className="rounded-xl bg-verde/10 p-6 text-center">
        <p className="text-lg font-semibold text-verde">¡Reserva enviada!</p>
        <p className="mt-2 text-sm text-carbon">
          Tu reserva quedo pendiente de confirmacion. Te vamos a avisar por WhatsApp apenas el
          administrador la revise.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-carbon">Nombre y apellido</label>
          <input
            className="mt-1 w-full rounded-lg border border-carbon/20 px-3 py-2"
            value={nombreSolicitante}
            onChange={(e) => setNombreSolicitante(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-carbon">Telefono de contacto</label>
          <input
            className="mt-1 w-full rounded-lg border border-carbon/20 px-3 py-2"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+54 9 ..."
          />
        </div>
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
        <div>
          <label className="block text-sm font-medium text-carbon">Cantidad de personas</label>
          <select
            className="mt-1 w-full rounded-lg border border-carbon/20 px-3 py-2"
            value={cantPersonas}
            onChange={(e) => cambiarCantPersonas(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-carbon">
            <input
              type="checkbox"
              checked={movilidadReducida}
              onChange={(e) => setMovilidadReducida(e.target.checked)}
            />
            Alguna persona tiene movilidad reducida
          </label>
        </div>
        {cantPersonas >= 2 && cantPersonas <= 4 && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-carbon">
              ¿Cómo preferís las camas?
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-carbon">
                <input
                  type="checkbox"
                  checked={camaMatrimonial}
                  onChange={(e) => cambiarCamaMatrimonial(e.target.checked)}
                />
                Cama matrimonial
              </label>
              <label className="flex items-center gap-2 text-sm text-carbon">
                Camas simples
                <select
                  className="rounded-lg border border-carbon/20 px-3 py-2"
                  value={camasSimples}
                  onChange={(e) => setCamasSimples(Number(e.target.value))}
                >
                  {opcionesSimples.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-2 text-xs text-carbon/60">
              Te preparamos{" "}
              {formatCamas(camasElegidas.camaMatrimonial, camasElegidas.camasSimples)}. Las
              opciones que ves son las que alcanzan para {cantPersonas} personas.
            </p>
          </div>
        )}
        {cantPersonas === 5 && (
          <div className="sm:col-span-2">
            <p className="rounded-lg bg-celeste/10 px-4 py-2 text-sm text-carbon">
              Para 5 personas la distribución es fija:{" "}
              <strong>1 cama matrimonial y 3 camas simples</strong>.
            </p>
          </div>
        )}
      </div>

      {disponibilidad.estado === "cargando" && (
        <p className="text-sm text-carbon/60">Consultando disponibilidad...</p>
      )}
      {disponibilidad.estado === "error" && (
        <p className="rounded-lg bg-coral/10 px-4 py-2 text-sm text-coral">{disponibilidad.mensaje}</p>
      )}
      {disponibilidad.estado === "ok" && (
        <p className="rounded-lg bg-verde/10 px-4 py-2 text-sm text-verde">
          Disponible — {disponibilidad.noches} noche(s) — Total: ${disponibilidad.precioTotal.toLocaleString("es-AR")}
        </p>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-carbon">Datos de cada persona alojada</h3>
        {personas.map((persona, i) => (
          <div key={i} className="rounded-lg border border-carbon/15 p-4">
            <p className="mb-2 text-sm font-medium text-carbon">Persona {i + 1}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="rounded-lg border border-carbon/20 px-3 py-2 text-sm"
                placeholder="Numero de DNI"
                value={persona.numeroDni}
                onChange={(e) =>
                  setPersonas((prev) =>
                    prev.map((p, idx) => (idx === i ? { ...p, numeroDni: e.target.value } : p))
                  )
                }
              />
              <BotonesFoto
                label="Foto DNI frente"
                subiendo={persona.subiendoFrente}
                subido={Boolean(persona.fotoDniFrente)}
                onFile={(file) => subirFoto(i, "fotoDniFrente", file)}
              />
              <BotonesFoto
                label="Foto DNI dorso"
                subiendo={persona.subiendoDorso}
                subido={Boolean(persona.fotoDniDorso)}
                onFile={(file) => subirFoto(i, "fotoDniDorso", file)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-carbon/5 p-4">
        {aceptoReglas ? (
          <p className="flex items-center justify-between text-sm text-verde">
            <span>✓ Reglamento aceptado</span>
            <button
              type="button"
              onClick={() => setMostrarReglas(true)}
              className="text-xs font-medium text-carbon/50 underline hover:text-carbon"
            >
              Ver de nuevo
            </button>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setMostrarReglas(true)}
            disabled={!textoReglas}
            className="text-sm font-semibold text-bordo underline disabled:text-carbon/40"
          >
            Ver y aceptar el reglamento del alojamiento
          </button>
        )}
      </div>

      {mostrarReglas && (
        <ReglasModal
          texto={textoReglas}
          onAceptar={() => {
            setAceptoReglas(true);
            setMostrarReglas(false);
          }}
          onCerrar={() => setMostrarReglas(false)}
        />
      )}

      {resultadoEnvio?.tipo === "error" && (
        <p className="rounded-lg bg-coral/10 px-4 py-2 text-sm text-coral">{resultadoEnvio.mensaje}</p>
      )}

      <button
        type="button"
        disabled={!puedeEnviar}
        onClick={enviarReserva}
        className="w-full rounded-full bg-bordo px-6 py-3 font-semibold text-crema transition-colors hover:bg-bordo/90 disabled:cursor-not-allowed disabled:bg-carbon/20"
      >
        {enviando ? "Enviando..." : "Enviar reserva"}
      </button>
      {enviando && (
        <p className="text-center text-xs text-carbon/50">
          Esto puede tardar unos segundos si el sistema estuvo inactivo.
        </p>
      )}
    </div>
  );
}
