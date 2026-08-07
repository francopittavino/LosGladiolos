"use client";

import { useState } from "react";
import { Header } from "./Header";
import { InicioSection } from "./InicioSection";
import { Gallery } from "./Gallery";
import { ReservarSection } from "./ReservarSection";

export type Tab = "inicio" | "galeria" | "reservar";

export function SiteShell() {
  const [tab, setTab] = useState<Tab>("inicio");

  return (
    <div className="flex flex-1 flex-col">
      <Header activeTab={tab} onTabChange={setTab} />
      <main className="flex-1">
        {tab === "inicio" && <InicioSection onReservarClick={setTab} />}
        {tab === "galeria" && <Gallery />}
        {tab === "reservar" && <ReservarSection />}
      </main>
      <footer className="border-t border-carbon/10 px-6 py-6 text-center text-sm text-carbon/60">
        Los Gladiolos — Alojamiento
      </footer>
    </div>
  );
}
