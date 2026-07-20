import { NextResponse, type NextRequest } from "next/server";

// ============================================================
// src/middleware.ts
// Middleware raíz: añade headers de seguridad a todas las
// respuestas. La autenticación del dashboard se valida a nivel
// de layout (via getSession), así que aquí solo aplicamos
// hardening de transporte.
// ============================================================

const SECURITY_HEADERS: Record<string, string> = {
  // Bloquea sniffing de MIME type
  "X-Content-Type-Options": "nosniff",
  // Bloquea embeds en iframes externos (mitiga clickjacking)
  "X-Frame-Options": "DENY",
  // Limita info filtrada en el Referer al saltar dominios
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Bloquea APIs sensibles del navegador que la app no usa
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(k, v);
  }
  return response;
}

export const config = {
  // Aplica a todas las rutas excepto assets estáticos y _next.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|css|js|map)$).*)",
  ],
};
