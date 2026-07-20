import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./LoginForm";
import { ClipboardCheck, BarChart3, Shield } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

// La lista de usuarios sale de la BD; sin esto Next prerenderiza la
// página y no refleja altas/bajas de usuarios hasta un redeploy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Iniciar Sesión",
  description: "Accede al sistema de Mantenimiento QTC.",
};

export default async function LoginPage() {
  const { data: usuarios } = await supabaseAdmin
    .from("usuarios")
    .select("usuario, ciudad, responsable")
    .eq("activo", true)
    .order("ciudad");
  return (
    <main className="flex min-h-screen bg-white">

      {/* Panel izquierdo — Branding (60%) */}
      <div
        className="hidden lg:flex lg:w-3/5 relative flex-col justify-center items-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)" }}
      >
        <div className="relative z-10 max-w-xl text-center space-y-10 px-12">
          {/* Logo en card blanca */}
          <div className="inline-flex items-center justify-center bg-white rounded-2xl px-8 py-6 shadow-2xl">
            <Image src="/qtc-logo.png" alt="Grupo QTC Perú" width={200} height={100} priority className="h-20 w-auto" />
          </div>

          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Mantenimiento
            </h1>
            <p className="mt-3 text-blue-100 text-base font-medium max-w-md mx-auto">
              Plataforma para reportar fallas y solicitar mantenimiento en
              tiendas y oficinas del Grupo QTC.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: "Solicitudes", icon: ClipboardCheck },
              { label: "Estadísticas", icon: BarChart3 },
              { label: "Administración", icon: Shield },
            ].map(({ label, icon: Icon }, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 px-3 py-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-center"
              >
                <Icon className="w-5 h-5 text-white" />
                <p className="text-xs font-semibold text-white">{label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-blue-100/70 tracking-widest uppercase pt-4">
            Acceso restringido al personal autorizado
          </p>
        </div>
      </div>

      {/* Panel derecho — Formulario (40%) */}
      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-sm space-y-8">

          {/* Header móvil con logo */}
          <div className="flex lg:hidden flex-col items-center gap-3 mb-2">
            <Image src="/qtc-logo.png" alt="Grupo QTC" width={120} height={60} priority className="h-14 w-auto" />
            <span className="text-base font-semibold text-slate-700">Mantenimiento</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
            <p className="text-sm text-slate-500">
              Ingresa tu usuario y PIN para continuar.
            </p>
          </div>

          <LoginForm usuarios={usuarios ?? []} />

          <p className="text-center text-xs text-slate-400">
            © Grupo QTC Perú · Solo personal autorizado
          </p>
        </div>
      </div>

    </main>
  );
}
