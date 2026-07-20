// ============================================================
// src/lib/uploads.ts
// Reemplazo local de Cloudinary: guarda los archivos del
// cuestionario en data/uploads/<carpeta>/<filename>.
// Los archivos se sirven vía /api/files/[...path].
// ============================================================
import "server-only";
import { promises as fs } from "fs";
import path from "path";

export const UPLOAD_BASE = path.join(process.cwd(), "data", "uploads");
export const UPLOAD_URL_PREFIX = "/api/files";

export interface UploadResult {
  url: string;          // /api/files/<carpeta>/<filename>
  public_id: string;    // <carpeta>/<filename> — útil para borrar después
  tipo: "image" | "video" | "raw";
  nombre_original: string;
  tamaño_bytes: number;
  formato: string;
}

export interface UploadOptions {
  /** Aceptado por compatibilidad; ignorado en el backend local. */
  quality?: number | "auto";
  video_quality?: number | "auto";
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function tipoDeMime(mime: string): "image" | "video" | "raw" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "raw";
}

/**
 * Guarda un buffer en data/uploads/<carpeta>/<timestamp>-<sanitized>
 * y devuelve metadata compatible con la firma anterior de Cloudinary.
 */
export async function guardarArchivoLocal(
  buffer: Buffer,
  nombreOriginal: string,
  mimeType: string,
  carpeta: string,
  _opciones: UploadOptions = {}
): Promise<UploadResult> {
  const segments = carpeta.split("/").filter(Boolean);
  const folderPath = path.join(UPLOAD_BASE, ...segments);
  await fs.mkdir(folderPath, { recursive: true });

  const ts = Date.now();
  const safe = sanitize(nombreOriginal);
  const fileName = `${ts}-${safe}`;
  const filePath = path.join(folderPath, fileName);
  await fs.writeFile(filePath, buffer);

  const ext = path.extname(nombreOriginal).slice(1).toLowerCase() || "bin";
  const relPath = [...segments, fileName].join("/");

  return {
    url: `${UPLOAD_URL_PREFIX}/${relPath}`,
    public_id: relPath,
    tipo: tipoDeMime(mimeType),
    nombre_original: nombreOriginal,
    tamaño_bytes: buffer.byteLength,
    formato: ext,
  };
}
