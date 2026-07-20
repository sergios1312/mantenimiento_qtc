"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/(auth)/login/actions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/permisos";
import {
  Wrench,
  BarChart3,
  Shield,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  userEmail: string | undefined;
  userRole: UserRole;
}

export function Sidebar({ userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { href: "/casos", label: "Mantenimiento", icon: <Wrench className="w-5 h-5 shrink-0" /> },
    { href: "/estadisticas", label: "Estadísticas", icon: <BarChart3 className="w-5 h-5 shrink-0" /> },
    { href: "/administrador", label: "Administrador", icon: <Shield className="w-5 h-5 shrink-0" /> },
    { href: "/usuario", label: "Usuario", icon: <UserCircle className="w-5 h-5 shrink-0" /> },
  ];

  const usuario = userEmail?.split("@")[0] ?? "Usuario";
  const esAdmin = userRole === "admin";

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-white border-r border-slate-200 shrink-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Botón de colapsar / expandir */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        className={cn(
          "absolute -right-3 top-7 z-10",
          "flex items-center justify-center w-6 h-6 rounded-full",
          "bg-white border border-slate-300 text-slate-500",
          "hover:text-slate-700 hover:border-slate-400 hover:shadow",
          "transition-all duration-200 shadow-sm"
        )}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-slate-200 overflow-hidden",
          collapsed && "justify-center px-2"
        )}
      >
        {!collapsed ? (
          <Image src="/qtc-logo.png" alt="Grupo QTC" width={140} height={70} priority className="h-12 w-auto" />
        ) : (
          <Image src="/qtc-logo.png" alt="QTC" width={36} height={36} priority className="h-9 w-9 object-contain" />
        )}
      </div>

      {/* Usuario actual */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Conectado como</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5 capitalize truncate">
            {usuario}
          </p>
          {esAdmin && (
            <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Administrador
            </span>
          )}
        </div>
      )}

      {collapsed && (
        <div className="flex justify-center mt-3 mb-1">
          <div
            title={usuario}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 uppercase"
          >
            {usuario.slice(0, 2)}
          </div>
        </div>
      )}

      {/* Navegación */}
      <nav className={cn("flex-1 px-2 py-4 space-y-1", collapsed && "px-2")}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
              )}
            >
              {item.icon}
              {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className={cn("p-2 border-t border-slate-200", collapsed && "p-2")}>
        <form action={signOut}>
          <button
            type="submit"
            title={collapsed ? "Cerrar sesión" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
              "text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && "Cerrar sesión"}
          </button>
        </form>
      </div>
    </aside>
  );
}
