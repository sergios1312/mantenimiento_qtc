import Image from "next/image";
import { FormularioCuestionario } from "@/components/cuestionario/FormularioCuestionario";
import { supabaseAdmin } from "@/lib/supabase";
import type { TiendaOption } from "@/lib/cuestionario-catalogo";

// Las tiendas se gestionan en el panel Administrador; refrescamos
// siempre para que los cambios se reflejen de inmediato en el formulario.
export const dynamic = "force-dynamic";

async function getTiendas(): Promise<TiendaOption[]> {
  const { data } = await supabaseAdmin
    .from("tiendas")
    .select("id, zona, ubicacion, marca, nombre, tipo")
    .eq("activo", true)
    .order("zona")
    .order("ubicacion")
    .order("nombre");

  return (data ?? []).map((t) => ({
    id: t.id,
    zona: t.zona ?? "",
    ubicacion: t.ubicacion ?? "",
    marca: t.marca ?? "",
    nombre: t.nombre ?? "",
    tipo: t.tipo ?? "",
  }));
}

export default async function CuestionarioPage() {
  const tiendas = await getTiendas();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header sticky — compacto en móvil */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 sm:py-4 flex items-center gap-3 sm:gap-4">
          <Image
            src="/qtc-logo.png"
            alt="Grupo QTC"
            width={120}
            height={60}
            priority
            className="h-8 sm:h-11 w-auto"
          />
          <div className="border-l border-slate-200 pl-3 sm:pl-4">
            <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider font-semibold leading-none">
              Mantenimiento
            </p>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">
              Solicitud de servicio
            </p>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Título — visible en todos los tamaños pero compacto en móvil */}
        <div className="text-center mb-5 sm:mb-8 max-w-2xl mx-auto">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1.5 sm:mb-3 tracking-tight">
            Solicitud de Mantenimiento
          </h1>
          <p className="text-slate-500 sm:text-slate-600 text-xs sm:text-base leading-relaxed">
            Reporta una falla, daño o necesidad de mantenimiento en tu tienda u
            oficina.
          </p>
        </div>

        <FormularioCuestionario tiendas={tiendas} />

        <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-6 sm:mt-10 pb-safe">
          © Grupo QTC Perú — Plataforma interna de mantenimiento
        </p>
      </div>
    </div>
  );
}
