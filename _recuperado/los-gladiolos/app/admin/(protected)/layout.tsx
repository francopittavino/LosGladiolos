import { redirect } from "next/navigation";
import Link from "next/link";
import { haySesionAdminValida, cerrarSesionAdmin } from "@/lib/adminAuth";

const NAV = [
  { href: "/admin", label: "Reservas" },
  { href: "/admin/tarifas", label: "Tarifas" },
  { href: "/admin/blacklist", label: "Lista Negra" },
  { href: "/admin/viajantes", label: "Viajantes Frecuentes" },
  { href: "/admin/configuracion", label: "Configuración" },
];

async function logoutAction() {
  "use server";
  await cerrarSesionAdmin();
  redirect("/admin/login");
}

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const autenticado = await haySesionAdminValida();
  if (!autenticado) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-carbon/5">
      <header className="border-b border-carbon/10 bg-blanco">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <span className="font-bold text-bordo">Los Gladiolos — Admin</span>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-carbon/70 transition-colors hover:bg-bordo/10 hover:text-bordo"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm font-medium text-carbon/50 hover:text-coral"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
