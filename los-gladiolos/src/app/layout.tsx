import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Los Gladiolos — Alojamiento por Día",
  description:
    "4 departamentos totalmente equipados en Planta Baja y Planta Alta. Reservá online de forma inmediata.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
