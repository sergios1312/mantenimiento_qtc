// ============================================================
// src/types/database.types.ts
// Tipos compartidos del modelo de datos local (data/*.json).
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Tabla: sucursales ───────────────────────────────────────
export interface Sucursal {
  id: number;
  nombre_ciudad: string;
  nombre_tecnico?: string;
  numero_telefono?: string;
  correo?: string;
}

// ─── Tabla: respuestas_cuestionario ─────────────────────────
// Solicitud de mantenimiento enviada desde el formulario público.
export interface RespuestaCuestionario {
  id: number;
  marca: string;          // p. ej. "DJI Store"
  tienda: string;         // texto libre — tienda u oficina específica
  descripcion: string;
  categoria: string;      // MUEBLES, SEGURIDAD, LUMINARIAS, ...
  metadata?: Record<string, unknown>;
  created_at: string;
}
