"use server";

import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// ============================================================
// Cambio de PIN del usuario actualmente autenticado.
// El PIN debe ser numérico, de 4 a 12 dígitos.
// ============================================================

const PIN_RE = /^\d{4,12}$/;

export async function cambiarPin(pinActual: string, pinNuevo: string) {
  const user = await getSession();
  if (!user) return { error: "Sesión no válida. Vuelve a iniciar sesión." };

  // getSession lee el PIN vigente desde la base en cada request.
  if (pinActual !== user.pin) {
    return { error: "El PIN actual es incorrecto." };
  }
  if (!PIN_RE.test(pinNuevo)) {
    return { error: "El nuevo PIN debe tener entre 4 y 12 dígitos numéricos." };
  }
  if (pinNuevo === user.pin) {
    return { error: "El nuevo PIN debe ser distinto al actual." };
  }

  const { error } = await supabaseAdmin
    .from("usuarios")
    .update({ pin: pinNuevo })
    .eq("usuario", user.usuario);

  if (error) return { error: "No se pudo actualizar el PIN. Intenta de nuevo." };

  // La sesión se identifica por `usuario` (no por el PIN), así que el
  // cambio no cierra la sesión.
  return { success: true };
}
