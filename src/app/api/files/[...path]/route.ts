import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { UPLOAD_BASE } from "@/lib/uploads";

// ============================================================
// /api/files/<...path>
// Sirve los archivos guardados localmente en data/uploads/.
// Reemplazo del CDN de Cloudinary mientras corremos en local.
// ============================================================

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await params;

  // Path-traversal: bloquear cualquier segmento sospechoso
  if (!parts || parts.length === 0 || parts.some((p) => p.includes("..") || p.includes("/") || p.includes("\\"))) {
    return new NextResponse("Bad path", { status: 400 });
  }

  const filePath = path.join(UPLOAD_BASE, ...parts);
  const resolved = path.resolve(filePath);
  const base = path.resolve(UPLOAD_BASE);

  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const file = await fs.readFile(resolved);
    const ext = path.extname(resolved).slice(1).toLowerCase();
    const mime = MIME_TYPES[ext] ?? "application/octet-stream";

    // fl_attachment:<name> simulado vía query ?download=<name>
    const url = new URL(_req.url);
    const downloadName = url.searchParams.get("download");
    const headers: Record<string, string> = {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=3600",
    };
    if (downloadName) {
      headers["Content-Disposition"] = `attachment; filename="${downloadName}"`;
    }

    return new NextResponse(new Uint8Array(file), { headers });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
