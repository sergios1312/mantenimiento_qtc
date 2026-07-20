import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // soporte de safe-area en iPhone con muesca
};

export const metadata: Metadata = {
  title: {
    default: "Mantenimiento QTC",
    template: "%s | Mantenimiento QTC",
  },
  description:
    "Plataforma para reportar fallas y solicitar mantenimiento en tiendas y oficinas del Grupo QTC.",
};

/**
 * RootLayout: contenedor principal de la aplicación.
 * Aplica la fuente Inter globalmente y establece el idioma en español.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900 min-h-screen`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

