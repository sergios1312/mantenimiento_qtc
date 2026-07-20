// ============================================================
// src/lib/utils.ts — Utilidades genéricas compartidas
// ============================================================
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusiona clases de Tailwind de forma segura (elimina conflictos). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
