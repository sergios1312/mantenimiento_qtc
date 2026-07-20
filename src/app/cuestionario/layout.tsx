import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solicitud de Mantenimiento | Grupo QTC",
  description:
    "Formulario para reportar fallas o necesidades de mantenimiento en tiendas y oficinas.",
  robots: { index: false, follow: false },
};

export default function CuestionarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Orbes decorativos — tamaño reducido en móvil para evitar overflow */}
      <div className="absolute -top-16 -right-16 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-96 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-96 sm:h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 text-center py-4 sm:py-6 pb-safe">
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Grupo QTC Perú · Uso interno
        </p>
      </footer>
    </div>
  );
}
