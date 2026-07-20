import type { NextRequest } from "next/server";

// ============================================================
// src/lib/security.ts
// Utilidades de seguridad para endpoints públicos:
//   - Extracción confiable de IP de cliente
//   - Validaciones y sanitización de strings
//   - Constantes de límites compartidas
// ============================================================

// ─── Límites globales para el cuestionario ────────────────
export const MAX_DESCRIPCION_LEN = 2000;
export const MAX_ADICIONALES_LEN = 1000;
export const MAX_NOMBRE_LEN = 150;
export const MAX_DOCUMENTO_LEN = 20;
export const MAX_TELEFONO_LEN = 20;
export const MAX_EMAIL_LEN = 100;
export const MAX_SERIE_LEN = 60;
export const MAX_MODELO_LEN = 60;
export const MAX_TIPO_LEN = 60;

export const MAX_REQUEST_BYTES = 200 * 1024 * 1024; // 200 MB total por request

// ─── IP del cliente ───────────────────────────────────────
/**
 * Obtiene la IP real del cliente, considerando proxies (Vercel, Cloudflare).
 * Prefiere el header `x-real-ip` si está, sino el primer valor de
 * `x-forwarded-for`. Devuelve "unknown" si no se puede determinar.
 */
export function getClientIp(req: NextRequest | Request): string {
  const headers = "headers" in req ? req.headers : (req as Request).headers;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = headers.get("x-real-ip");
  if (xri) return xri.trim();
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "unknown";
}

// ─── Validaciones ─────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d\s\-()]{6,20}$/;
const DOCUMENTO_RE = /^[A-Za-z0-9\-]{6,20}$/;

export function isValidEmail(s: string | null | undefined): boolean {
  if (!s) return false;
  return s.length <= MAX_EMAIL_LEN && EMAIL_RE.test(s);
}

export function isValidPhone(s: string | null | undefined): boolean {
  if (!s) return false;
  return PHONE_RE.test(s.trim());
}

export function isValidDocumento(s: string | null | undefined): boolean {
  if (!s) return false;
  return DOCUMENTO_RE.test(s.trim());
}

/**
 * Recorta y normaliza un string. Reemplaza caracteres de control
 * y limita la longitud máxima.
 */
export function safeString(
  s: unknown,
  maxLen: number,
  fallback: string | null = null
): string | null {
  if (typeof s !== "string") return fallback;
  // Strip control chars excepto saltos de línea y tabs
  const cleaned = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (!cleaned) return fallback;
  return cleaned.slice(0, maxLen);
}

/**
 * Verifica el tamaño total del Content-Length antes de procesar.
 * Devuelve null si está OK, o un mensaje de error si excede.
 */
export function checkRequestSize(
  req: NextRequest | Request,
  maxBytes: number = MAX_REQUEST_BYTES
): string | null {
  const headers = "headers" in req ? req.headers : (req as Request).headers;
  const cl = headers.get("content-length");
  if (!cl) return null; // permitimos requests sin content-length explícito
  const size = parseInt(cl, 10);
  if (Number.isNaN(size)) return null;
  if (size > maxBytes) {
    const mb = (maxBytes / 1024 / 1024).toFixed(0);
    return `El tamaño total del envío excede ${mb} MB.`;
  }
  return null;
}
