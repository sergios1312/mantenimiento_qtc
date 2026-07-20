import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import {
  AdminClientWrapper,
  type TecnicoAdmin,
  type TiendaAdmin,
} from "@/components/administrador/AdminClientWrapper";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administrador | Mantenimiento QTC",
};

export default async function AdministradorPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/casos");

  const [{ data: tecnicosData }, { data: tiendasData }] = await Promise.all([
    supabaseAdmin
      .from("tecnicos")
      .select("id, nombre, correo, telefono")
      .eq("activo", true)
      .order("nombre"),
    supabaseAdmin
      .from("tiendas")
      .select("id, nombre, zona, ubicacion, marca, tipo")
      .eq("activo", true)
      .order("zona")
      .order("ubicacion")
      .order("nombre"),
  ]);

  const tecnicos: TecnicoAdmin[] = (tecnicosData ?? []).map((t) => ({
    id: t.id,
    nombre: t.nombre,
    correo: t.correo ?? "",
    telefono: t.telefono ?? "",
  }));

  const tiendas: TiendaAdmin[] = (tiendasData ?? []).map((t) => ({
    id: t.id,
    nombre: t.nombre,
    zona: t.zona ?? "",
    ubicacion: t.ubicacion ?? "",
    marca: t.marca ?? "",
    tipo: t.tipo ?? "",
  }));

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Administrador</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestión de técnicos y tiendas / oficinas.
        </p>
      </div>

      <AdminClientWrapper tecnicos={tecnicos} tiendas={tiendas} />
    </div>
  );
}
