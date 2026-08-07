"use client";

import { useState } from "react";
import { HuespedGeneralForm } from "./HuespedGeneralForm";
import { ViajanteFrecuenteForm } from "./ViajanteFrecuenteForm";

type Tab = "general" | "viajante";

export function ReservaForm() {
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-blanco p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex gap-2 rounded-full bg-carbon/5 p-1">
        <button
          type="button"
          onClick={() => setTab("general")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "general" ? "bg-bordo text-crema" : "text-carbon/70"
          }`}
        >
          Huésped General
        </button>
        <button
          type="button"
          onClick={() => setTab("viajante")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            tab === "viajante" ? "bg-bordo text-crema" : "text-carbon/70"
          }`}
        >
          Viajante Frecuente
        </button>
      </div>

      {tab === "general" ? <HuespedGeneralForm /> : <ViajanteFrecuenteForm />}
    </div>
  );
}
