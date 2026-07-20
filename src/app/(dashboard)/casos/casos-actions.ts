"use server";

import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { subirImagenCloudinary } from "@/lib/cloudinary-upload";
import { enviarCorreoAsignacion, type SolicitudEmail } from "@/lib/email";

// ============================================================
// Server actions de solicitudes de mantenimiento.
// ============================================================

const URGENCIAS_VALIDAS = ["Alta", "Media", "Baja"] as const;
const ESTATUS_VALIDOS = [
  "No iniciado",
  "Solicitud de permiso de tienda",
  "Adquisición y compras",
  "En proceso",
  "Terminado",
] as const;

type Urgencia = (typeof URGENCIAS_VALIDAS)[number];
type Estatus = (typeof ESTATUS_VALIDOS)[number];

export async function eliminarSolicitud(id: number) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return { error: "Solo los administradores pueden eliminar solicitudes." };
  }

  const { error } = await supabaseAdmin
    .from("respuestas_cuestionario")
    .delete()
    .eq("id", id);

  if (error) return { error: "Error al eliminar la solicitud." };

  revalidatePath("/casos");
  return { success: true };
}

export async function actualizarUrgencia(id: number, nivel: Urgencia) {
  const user = await getSession();
  if (!user) return { error: "No autorizado." };
  if (!URGENCIAS_VALIDAS.includes(nivel)) {
    return { error: "Nivel de urgencia no válido." };
  }

  const { error } = await supabaseAdmin
    .from("respuestas_cuestionario")
    .update({ nivel_urgencia: nivel })
    .eq("id", id);

  if (error) return { error: "Error al actualizar la urgencia." };

  revalidatePath("/casos");
  return { success: true };
}

export async function actualizarEstatus(id: number, estatus: Estatus) {
  const user = await getSession();
  if (!user) return { error: "No autorizado." };
  if (!ESTATUS_VALIDOS.includes(estatus)) {
    return { error: "Estatus no válido." };
  }

  // Al entrar a "En proceso" se sella el momento para reiniciar el contador.
  const enProcesoAt =
    estatus === "En proceso" ? new Date().toISOString() : null;
  // Al entrar a "Terminado" se sella el cierre (estadísticas de tiempos).
  const terminadoAt =
    estatus === "Terminado" ? new Date().toISOString() : null;

  const { error } = await supabaseAdmin
    .from("respuestas_cuestionario")
    .update({
      estatus,
      ...(enProcesoAt && { en_proceso_at: enProcesoAt }),
      ...(terminadoAt && { terminado_at: terminadoAt }),
    })
    .eq("id", id);

  if (error) return { error: "Error al actualizar el estatus." };

  revalidatePath("/casos");
  return { success: true, enProcesoAt };
}

export async function actualizarTecnico(id: number, tecnicoId: number | null) {
  const user = await getSession();
  if (!user) return { error: "No autorizado." };

  const { error } = await supabaseAdmin
    .from("respuestas_cuestionario")
    .update({ tecnico_id: tecnicoId })
    .eq("id", id);

  if (error) return { error: "Error al actualizar el técnico." };

  revalidatePath("/casos");
  return { success: true };
}

/**
 * Asigna un técnico a una solicitud y envía notificación por correo.
 * Usar este action desde el botón "Asignar" del modal de detalle.
 */
export async function asignarTecnico(
  id: number,
  tecnicoId: number | null,
  tecnicoNombre: string | null,
  tecnicoCorreo: string | null,
  solicitud: Omit<SolicitudEmail, "id">
) {
  const user = await getSession();
  if (!user) return { error: "No autorizado." };

  const { error } = await supabaseAdmin
    .from("respuestas_cuestionario")
    .update({ tecnico_id: tecnicoId })
    .eq("id", id);

  if (error) return { error: "Error al asignar el técnico." };

  revalidatePath("/casos");

  // Notificación por correo — no bloquea ni falla la acción.
  if (tecnicoId && tecnicoNombre) {
    await enviarCorreoAsignacion(
      { id, ...solicitud },
      tecnicoNombre,
      tecnicoCorreo
    );
  }

  return { success: true };
}

const MAX_B64_LEN = 14_000_000; // ~10 MB en base64

/**
 * Guarda el cierre del caso: detalles de cómo se solucionó y, opcionalmente,
 * la fotografía del problema resuelto (subida a Cloudinary).
 */
export async function actualizarCierre(
  id: number,
  detallesCierre: string,
  imagenBase64?: string,
  imagenTipo?: string
) {
  const user = await getSession();
  if (!user) return { error: "No autorizado." };

  const detalles = (detallesCierre ?? "").trim().slice(0, 2000);

  let imagenCierreUrl: string | null = null;
  if (typeof imagenBase64 === "string" && imagenBase64.length > 0) {
    if (imagenBase64.length > MAX_B64_LEN) {
      return { error: "La imagen supera el tamaño máximo (10 MB)." };
    }
    imagenCierreUrl = await subirImagenCloudinary(
      imagenBase64,
      imagenTipo ?? "image/jpeg"
    );
    if (!imagenCierreUrl) {
      return { error: "No se pudo subir la imagen de cierre." };
    }
  }

  const { error } = await supabaseAdmin
    .from("respuestas_cuestionario")
    .update({
      detalles_cierre: detalles,
      ...(imagenCierreUrl && { imagen_cierre_url: imagenCierreUrl }),
    })
    .eq("id", id);

  if (error) return { error: "Error al guardar el cierre del caso." };

  revalidatePath("/casos");
  return { success: true, imagenCierreUrl };
}
