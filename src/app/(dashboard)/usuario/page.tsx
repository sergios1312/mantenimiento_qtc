import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";
import { UserCircle, Shield, User as UserIcon, MapPin, Mail } from "lucide-react";
import { CambiarPinForm } from "@/components/usuario/CambiarPinForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usuario",
};

export default async function UsuarioPage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const esAdmin = user.role === "admin";
  const rango = esAdmin ? "Administrador" : "Usuario";

  const datos = [
    { icon: UserIcon, label: "Nombre de usuario", valor: user.usuario },
    { icon: UserCircle, label: "Responsable", valor: user.responsable },
    { icon: MapPin, label: "Ciudad", valor: user.ciudad },
    { icon: Mail, label: "Correo", valor: user.correo },
  ].filter((d) => d.valor);

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Mi usuario</h1>
        <p className="text-sm text-slate-500 mt-1">
          Datos de tu cuenta y cambio de PIN de acceso.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos de la cuenta */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Datos de la cuenta</h2>
          </div>

          <div className="p-5 space-y-3">
            {/* Rango destacado */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Rango
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                  esAdmin
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-slate-100 text-slate-600 border-slate-300"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {rango}
              </span>
            </div>

            {datos.map(({ icon: Icon, label, valor }) => (
              <div
                key={label}
                className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
              >
                <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-sm text-slate-800 mt-0.5 break-words">
                    {valor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cambio de PIN */}
        <CambiarPinForm />
      </div>
    </div>
  );
}
