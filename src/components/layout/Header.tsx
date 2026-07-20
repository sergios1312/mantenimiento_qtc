"use client";

import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  "/casos": "Mantenimiento",
  "/estadisticas": "Estadísticas",
  "/administrador": "Administrador",
};

export function Header() {
  const pathname = usePathname();

  const title =
    Object.entries(ROUTE_LABELS).find(([key]) => pathname.startsWith(key))?.[1] ??
    "Mantenimiento QTC";

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-blue-600 text-white shrink-0 shadow-sm">
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="text-xs font-medium text-blue-100 tracking-wide uppercase hidden sm:block">
        Grupo QTC Perú
      </div>
    </header>
  );
}
