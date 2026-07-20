import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  safeString,
  MAX_DESCRIPCION_LEN,
  MAX_NOMBRE_LEN,
  MAX_EMAIL_LEN,
} from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";
import { CATEGORIAS, esCorreoQtc } from "@/lib/cuestionario-catalogo";
import { subirImagenCloudinary } from "@/lib/cloudinary-upload";
import { enviarCorreoNuevaSolicitud } from "@/lib/email";

// POST /api/cuestionario
// Capas: rate-limit → honeypot → validación → Cloudinary (opcional) → Supabase

const MAX_TIENDA_LEN = 200;
const MAX_B64_LEN = 14_000_000; // ~10 MB en base64

const CATEGORIAS_VALIDAS = new Set<string>(CATEGORIAS);

export async function POST(request: NextRequest) {
  // ── 1. Rate-limit por IP ───────────────────────────
  const ip = getClientIp(request);
  const rl = await checkRateLimit({
    endpoint: "cuestionario",
    ip,
    limits: [
      { max: 3, windowSec: 600 },
      { max: 15, windowSec: 86400 },
    ],
    record: false,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.message },
      {
        status: 429,
        headers: rl.retryAfterSec
          ? { "Retry-After": String(rl.retryAfterSec) }
          : undefined,
      }
    );
  }

  try {
    const body = await request.json();

    // ── 2. Honeypot ───────────────────────────────────
    if (typeof body?.website === "string" && body.website.trim()) {
      return NextResponse.json({ success: true, id: null });
    }

    // ── 3. Validar campos de texto ────────────────────
    const solicitanteNombre = safeString(body?.solicitante_nombre, MAX_NOMBRE_LEN);
    const solicitanteCorreo = safeString(body?.solicitante_correo, MAX_EMAIL_LEN);
    let tienda = safeString(body?.tienda, MAX_TIENDA_LEN);
    const descripcion = safeString(body?.descripcion, MAX_DESCRIPCION_LEN);
    const categoria = safeString(body?.categoria, 60);

    const tiendaIdRaw = body?.tienda_id;
    const tiendaId =
      typeof tiendaIdRaw === "number" &&
      Number.isInteger(tiendaIdRaw) &&
      tiendaIdRaw > 0
        ? tiendaIdRaw
        : null;

    if (!solicitanteNombre) {
      return NextResponse.json(
        { error: "El nombre de quien reporta es obligatorio." },
        { status: 400 }
      );
    }
    if (!solicitanteCorreo || !esCorreoQtc(solicitanteCorreo)) {
      return NextResponse.json(
        { error: "El correo ingresado no es válido." },
        { status: 400 }
      );
    }
    if (!descripcion || !categoria) {
      return NextResponse.json(
        { error: "Descripción y categoría son obligatorios." },
        { status: 400 }
      );
    }
    if (!CATEGORIAS_VALIDAS.has(categoria)) {
      return NextResponse.json({ error: "Categoría no reconocida." }, { status: 400 });
    }

    // ── 3b. Resolver tienda ───────────────────────────
    // Si llega tienda_id, el nombre autoritativo se toma de la base de
    // datos (no se confía en el texto del cliente). La marca ya no se
    // almacena: es derivable desde tienda_id si alguna vez se necesita.
    let tiendaIdFinal: number | null = null;
    if (tiendaId !== null) {
      const { data: tiendaRow } = await supabaseAdmin
        .from("tiendas")
        .select("id, nombre, activo")
        .eq("id", tiendaId)
        .single();
      if (!tiendaRow || tiendaRow.activo === false) {
        return NextResponse.json(
          { error: "La tienda seleccionada no es válida." },
          { status: 400 }
        );
      }
      tienda = safeString(tiendaRow.nombre, MAX_TIENDA_LEN);
      tiendaIdFinal = tiendaRow.id;
    }

    if (!tienda) {
      return NextResponse.json(
        { error: "Debe seleccionar una tienda." },
        { status: 400 }
      );
    }

    // ── 4. Subir imagen a Cloudinary (opcional) ───────
    let imagen_url: string | null = null;
    const b64 = body?.imagen_base64;
    const mime = typeof body?.imagen_tipo === "string" ? body.imagen_tipo : "image/jpeg";
    if (typeof b64 === "string" && b64.length > 0 && b64.length <= MAX_B64_LEN) {
      imagen_url = await subirImagenCloudinary(b64, mime);
    }

    // ── 5. Insertar en Supabase ───────────────────────
    let solicitudId: number | null = null;
    try {
      const { data, error: insertError } = await supabaseAdmin
        .from("respuestas_cuestionario")
        .insert({
          tienda,
          solicitante_nombre: solicitanteNombre,
          solicitante_correo: solicitanteCorreo,
          // Solo se envía si hay vínculo real, así el insert sigue
          // funcionando aunque la columna aún no exista en la BD.
          ...(tiendaIdFinal !== null && { tienda_id: tiendaIdFinal }),
          descripcion,
          categoria,
          metadata: {
            user_agent: request.headers.get("user-agent") || "unknown",
            ip,
            timestamp: new Date().toISOString(),
            ...(imagen_url && { imagen_url }),
          },
        })
        .select("id")
        .single();

      if (insertError) throw insertError;
      solicitudId = data.id;
    } catch (error) {
      console.error("Error al insertar solicitud:", error);
      return NextResponse.json(
        { error: "Error al guardar la solicitud. Intente nuevamente." },
        { status: 500 }
      );
    }

    // ── 6. Registrar hit en rate-limit ────────────────
    await checkRateLimit({
      endpoint: "cuestionario",
      ip,
      limits: [{ max: 99999, windowSec: 86400 }],
      record: true,
    });

    // ── 7. Notificación por correo (no bloquea respuesta) ──
    if (solicitudId) {
      await enviarCorreoNuevaSolicitud({
        id: solicitudId,
        numero: String(solicitudId).padStart(4, "0"),
        fecha: new Date().toISOString(),
        tienda,
        categoria,
        descripcion,
        solicitanteNombre,
        solicitanteCorreo,
        nivelUrgencia: null,
        estatus: "No iniciado",
        imagen_url: imagen_url ?? null,
      });
    }

    return NextResponse.json({
      success: true,
      mensaje: "Solicitud enviada exitosamente.",
      id: solicitudId,
    });
  } catch (error) {
    console.error("Error en API cuestionario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
