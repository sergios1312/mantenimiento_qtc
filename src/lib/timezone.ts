// ============================================================
// src/lib/timezone.ts — Utilidades de fecha/hora para Lima (UTC−5)
//
// Problema: el servidor (Vercel) corre en UTC. Usar new Date().toISOString()
// o .slice(0, 10) da la fecha UTC, que en Lima puede ser un día distinto
// después de las 7pm (19:00 Lima = 00:00 UTC del día siguiente).
//
// Regla: para campos de FECHA (YYYY-MM-DD) en el servidor,
//        usar siempre fechaHoyLima() en lugar de new Date().toISOString().slice(0, 10).
//
// Para TIMESTAMPS (timestamptz en Postgres) se puede seguir usando
// new Date().toISOString() porque Postgres almacena UTC y los clientes
// convierten con toLocaleString("es-PE", ...) en el navegador.
// ============================================================

/**
 * Devuelve la fecha de hoy como YYYY-MM-DD en la zona horaria de Lima (UTC−5).
 * Usar en cualquier acción del servidor que almacene una fecha-día, como
 * fecha_ingreso, fecha_salida, o nombres de archivos con la fecha actual.
 */
export function fechaHoyLima(): string {
  // "en-CA" produce el formato ISO YYYY-MM-DD directamente.
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
}
