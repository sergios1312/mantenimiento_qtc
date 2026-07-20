// ============================================================
// src/lib/cuestionario-catalogo.ts
// Catálogos compartidos entre el formulario público (client) y el
// endpoint /api/cuestionario (server). Mantenerlos aquí evita que el
// route handler importe módulos "use client" durante el build.
// ============================================================

export const CATEGORIAS = [
  "MUEBLES",
  "CCTV_CAMARA_SEGURIDAD",
  "LUMINARIAS",
  "PINTURA",
  "ELECTRICO",
  "AIRE_ACONDICIONADO",
  "PUERTA_ENROLLABLE",
  "MANTENIMIENTO",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

// Etiquetas legibles para el formulario, la tabla de casos y los correos.
// La clave es el valor que se almacena en la base de datos.
export const CATEGORIA_LABELS: Record<string, string> = {
  MUEBLES: "Muebles",
  CCTV_CAMARA_SEGURIDAD: "CCTV - Cámara de seguridad",
  LUMINARIAS: "Luminarias",
  PINTURA: "Pintura",
  ELECTRICO: "Eléctrico",
  AIRE_ACONDICIONADO: "Aire acondicionado",
  PUERTA_ENROLLABLE: "Puerta enrollable",
  MANTENIMIENTO: "Mantenimiento",
};

export function categoriaLabel(cat: string): string {
  return CATEGORIA_LABELS[cat] ?? cat.replace(/_/g, " ");
}

// ── Solicitante ─────────────────────────────────────────────
// El correo del solicitante debe pertenecer al dominio corporativo.
export const CORREO_DOMINIO_QTC = "@quetalcompra.com";
export function esCorreoQtc(correo: string): boolean {
  return /^[^\s@]+@quetalcompra\.com$/i.test(correo.trim());
}

// ── Tiendas / puntos de operación ───────────────────────────
// Zonas y tipos usados por el panel Administrador. La fuente de
// verdad real es la tabla `tiendas` en Supabase; estas constantes
// solo alimentan los selectores del formulario de administración.
export const ZONAS = ["Zona Norte", "Zona Centro", "Zona Sur"] as const;
export const TIPOS_TIENDA = [
  "Tienda",
  "Módulo",
  "Almacén",
  "Servicio",
] as const;

// Forma de una tienda tal como viaja del servidor al formulario
// público para construir el desplegable en cascada (zona → ubicación → tienda).
export interface TiendaOption {
  id: number;
  zona: string;
  ubicacion: string;
  marca: string;
  nombre: string;
  tipo: string;
}
