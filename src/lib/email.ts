import "server-only";
import nodemailer from "nodemailer";
import { categoriaLabel } from "@/lib/cuestionario-catalogo";

// ============================================================
// Motor de notificaciones por correo — Fase de Pruebas
//
// EMAIL_TEST_TO: si está definida, TODOS los correos se
//   redirigen a esa dirección (modo pruebas).
// EMAIL_HOST / EMAIL_PORT / EMAIL_USER / EMAIL_PASS:
//   credenciales SMTP (Gmail, Outlook, SendGrid, etc.).
// EMAIL_FROM: dirección y nombre del remitente.
// ============================================================

const TEST_DESTINO =
  process.env.EMAIL_TEST_TO ?? "sergio.araujo@quetalcompra.com";

// ─── Transporte SMTP (creado lazily) ─────────────────────────
function crearTransporte() {
  const host = process.env.EMAIL_HOST;
  if (!host) {
    console.warn("[email] EMAIL_HOST no configurado — correos desactivados.");
    return null;
  }
  return nodemailer.createTransport({
    host,
    port: Number(process.env.EMAIL_PORT ?? "587"),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// ─── Tipos ───────────────────────────────────────────────────
export interface SolicitudEmail {
  id: number;
  numero: string;
  fecha: string;
  tienda: string;
  categoria: string;
  descripcion: string;
  nivelUrgencia: string | null;
  estatus: string;
  imagen_url?: string | null;
  solicitanteNombre?: string;
  solicitanteCorreo?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

/** Message-ID determinista: no requiere almacenamiento en DB. */
function msgId(solicitudId: number): string {
  return `<maint-${solicitudId}@mantenimiento-qtc>`;
}

/** Asunto compartido para que ambos correos queden en el mismo hilo. */
function asunto(s: SolicitudEmail): string {
  const cat = categoriaLabel(s.categoria);
  return `[Mantenimiento QTC] Solicitud N°${s.numero} – ${cat} · ${s.tienda}`;
}

/** En pruebas fuerza el destino; en producción usa el correo real. */
function destino(correoReal?: string | null): string {
  return TEST_DESTINO ?? correoReal ?? "sergio.araujo@quetalcompra.com";
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-PE", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "America/Lima",
    });
  } catch {
    return iso;
  }
}

// ─── Plantilla HTML compartida ────────────────────────────────
function htmlBase(titulo: string, subtitulo: string, cuerpo: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Cabecera -->
        <tr>
          <td style="background:#2563eb;padding:24px 28px;">
            <p style="margin:0;color:#ffffff;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;opacity:0.75;">Grupo QTC · Sistema de Mantenimiento</p>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;">${titulo}</h1>
            <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">${subtitulo}</p>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="padding:28px;">
            ${cuerpo}
          </td>
        </tr>

        <!-- Pie -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 28px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:11px;">
              Este correo fue generado automáticamente por el sistema de mantenimiento de Grupo QTC.
              Por favor no responda directamente a este mensaje.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function filaDetalle(label: string, valor: string, color?: string): string {
  return `
    <tr>
      <td style="padding:9px 12px;background:#f8fafc;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;white-space:nowrap;width:38%;">${label}</td>
      <td style="padding:9px 12px;color:${color ?? "#0f172a"};font-size:14px;border-bottom:1px solid #e2e8f0;">${valor || "—"}</td>
    </tr>`;
}

function tablaDetalles(s: SolicitudEmail): string {
  const urgenciaColor: Record<string, string> = {
    Alta: "#b91c1c",
    Media: "#b45309",
    Baja: "#065f46",
  };
  return `
    <table width="100%" cellpadding="0" cellspacing="0"
      style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      ${filaDetalle("N° Solicitud", `<strong>${s.numero}</strong>`)}
      ${filaDetalle("Fecha de envío", formatFecha(s.fecha))}
      ${
        s.solicitanteNombre
          ? filaDetalle(
              "Reportado por",
              `${s.solicitanteNombre}${
                s.solicitanteCorreo ? ` · ${s.solicitanteCorreo}` : ""
              }`
            )
          : ""
      }
      ${filaDetalle("Tienda", s.tienda)}
      ${filaDetalle("Categoría", categoriaLabel(s.categoria))}
      ${filaDetalle("Nivel de urgencia", s.nivelUrgencia ?? "Sin asignar",
        s.nivelUrgencia ? urgenciaColor[s.nivelUrgencia] ?? "#0f172a" : "#94a3b8")}
      ${filaDetalle("Estatus", s.estatus)}
    </table>`;
}

function descripcionBloque(texto: string): string {
  return `
    <div style="margin-bottom:20px;">
      <p style="margin:0 0 8px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Descripción del problema</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;color:#1e293b;font-size:14px;line-height:1.6;white-space:pre-wrap;">${texto || "Sin descripción."}</div>
    </div>`;
}

// ─── Correo 1: Nueva solicitud ────────────────────────────────
export async function enviarCorreoNuevaSolicitud(
  s: SolicitudEmail
): Promise<void> {
  const transport = crearTransporte();
  if (!transport) return;

  const cuerpo =
    `<p style="margin:0 0 20px;color:#475569;font-size:15px;">
      Se ha registrado una nueva solicitud de mantenimiento en el sistema.
     </p>` +
    tablaDetalles(s) +
    descripcionBloque(s.descripcion) +
    (s.imagen_url
      ? `<p style="margin:0 0 8px;color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Evidencia fotográfica</p>
         <a href="${s.imagen_url}" style="display:inline-block;margin-bottom:20px;color:#2563eb;font-size:13px;">Ver imagen adjunta →</a>`
      : "");

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? `"Mantenimiento QTC" <${process.env.EMAIL_USER}>`,
      to: destino(),
      subject: asunto(s),
      messageId: msgId(s.id),
      html: htmlBase(
        "Nueva solicitud de mantenimiento",
        `N°${s.numero} · ${s.tienda}`,
        cuerpo
      ),
    });
    console.log(`[email] Correo raíz enviado — solicitud ${s.id}`);
  } catch (err) {
    console.error("[email] Error enviando correo de nueva solicitud:", err);
  }
}

// ─── Correo 2: Asignación de técnico ─────────────────────────
export async function enviarCorreoAsignacion(
  s: SolicitudEmail,
  tecnicoNombre: string,
  tecnicoCorreo?: string | null
): Promise<void> {
  const transport = crearTransporte();
  if (!transport) return;

  const rootId = msgId(s.id);
  const tecnicoBloque = `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
      <div>
        <p style="margin:0;color:#1e40af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Técnico responsable asignado</p>
        <p style="margin:4px 0 0;color:#1e3a8a;font-size:18px;font-weight:700;">${tecnicoNombre}</p>
      </div>
    </div>`;

  const cuerpo =
    `<p style="margin:0 0 20px;color:#475569;font-size:15px;">
      Se ha asignado un técnico responsable para la siguiente solicitud de mantenimiento.
     </p>` +
    tecnicoBloque +
    tablaDetalles(s) +
    descripcionBloque(s.descripcion) +
    (s.imagen_url
      ? `<a href="${s.imagen_url}" style="display:inline-block;margin-bottom:20px;color:#2563eb;font-size:13px;">Ver imagen adjunta →</a>`
      : "");

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? `"Mantenimiento QTC" <${process.env.EMAIL_USER}>`,
      to: destino(tecnicoCorreo),
      subject: `Re: ${asunto(s)}`,
      inReplyTo: rootId,
      references: rootId,
      html: htmlBase(
        `Técnico asignado a solicitud N°${s.numero}`,
        `${tecnicoNombre} · ${s.tienda}`,
        cuerpo
      ),
    });
    console.log(
      `[email] Correo de asignación enviado — solicitud ${s.id} → ${tecnicoNombre}`
    );
  } catch (err) {
    console.error("[email] Error enviando correo de asignación:", err);
  }
}
