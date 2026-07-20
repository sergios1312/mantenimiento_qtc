import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  CasosClientWrapper,
  type SolicitudUI,
  type TecnicoUI,
  type NivelUrgencia,
  type Estatus,
} from "@/components/casos/CasosClientWrapper";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mantenimiento | Mantenimiento QTC",
  description: "Solicitudes de mantenimiento recibidas desde el formulario.",
};

export default async function CasosPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [{ data: respuestas }, { data: tecnicosData }] = await Promise.all([
    supabaseAdmin
      .from("respuestas_cuestionario")
      .select(
        "id, tienda, descripcion, categoria, created_at, metadata, nivel_urgencia, estatus, tecnico_id, solicitante_nombre, solicitante_correo, en_proceso_at, detalles_cierre, imagen_cierre_url"
      )
      .order("id", { ascending: false }),
    supabaseAdmin
      .from("tecnicos")
      .select("id, nombre, correo, telefono")
      .eq("activo", true)
      .order("nombre"),
  ]);

  const tecnicos: TecnicoUI[] = (tecnicosData ?? []).map((t) => ({
    id: t.id,
    nombre: t.nombre,
    correo: t.correo ?? "",
    telefono: t.telefono ?? "",
  }));
  const nombrePorTecnico = new Map(tecnicos.map((t) => [t.id, t.nombre]));

  // Solicitudes más recientes primero (id autoincremental).
  const solicitudes: SolicitudUI[] = (respuestas ?? []).map((r) => {
    const meta = (r.metadata ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      numero: String(r.id).padStart(4, "0"),
      fecha: r.created_at,
      tienda: r.tienda,
      categoria: r.categoria,
      solicitanteNombre: r.solicitante_nombre ?? "",
      solicitanteCorreo: r.solicitante_correo ?? "",
      descripcion: r.descripcion,
      imagen_url: typeof meta.imagen_url === "string" ? meta.imagen_url : null,
      nivelUrgencia: (r.nivel_urgencia ?? null) as NivelUrgencia | null,
      estatus: (r.estatus ?? "No iniciado") as Estatus,
      enProcesoAt: r.en_proceso_at ?? null,
      detallesCierre: r.detalles_cierre ?? "",
      imagenCierreUrl: r.imagen_cierre_url ?? null,
      tecnicoId: r.tecnico_id ?? null,
      tecnicoNombre: r.tecnico_id
        ? nombrePorTecnico.get(r.tecnico_id) ?? null
        : null,
    };
  });

  const categoriasDisponibles = [
    ...new Set(solicitudes.map((s) => s.categoria)),
  ].sort();

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Mantenimiento</h1>
        <p className="text-sm text-slate-500 mt-1">
          {solicitudes.length === 1
            ? "1 solicitud recibida."
            : `${solicitudes.length} solicitudes recibidas.`}
        </p>
      </div>

      <CasosClientWrapper
        solicitudes={solicitudes}
        tecnicos={tecnicos}
        isAdmin={user.role === "admin"}
        categoriasDisponibles={categoriasDisponibles}
      />
    </div>
  );
}
