"use client";

import Image from "next/image";
import type { Tab } from "./SiteShell";

const TABS: { id: Tab; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "galeria", label: "Galería" },
  { id: "reservar", label: "Reservar" },
];

export function Header({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <header className="sticky top-0 z-20 bg-bordo shadow-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <button
          type="button"
          onClick={() => onTabChange("inicio")}
          className="shrink-0 overflow-hidden rounded-lg"
        >
          <Image
            src="/images/logo/logo.png"
            alt="Los Gladiolos"
            width={180}
            height={54}
            priority
            className="h-10 w-auto"
          />
        </button>

        <nav className="flex gap-1 rounded-full bg-crema/10 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-5 ${
                activeTab === tab.id ? "bg-crema text-bordo" : "text-crema/80 hover:text-crema"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
