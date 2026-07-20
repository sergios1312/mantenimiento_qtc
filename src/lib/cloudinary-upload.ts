import "server-only";
import crypto from "crypto";

// ============================================================
// Subida de imágenes a Cloudinary (uso exclusivo en el servidor).
// Firma la petición con el api_secret; nunca exponer al cliente.
// Redimensiona al subir: máx 1920 px, calidad y formato automáticos.
// Devuelve la secure_url, o null si Cloudinary no está configurado
// o si la subida falla.
// ============================================================
export async function subirImagenCloudinary(
  base64: string,
  mimeType: string
): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  try {
    const timestamp = String(Math.round(Date.now() / 1000));
    const folder = "mantenimiento_qtc";
    const transformation = "w_1920,h_1920,c_limit,q_auto:good,f_auto";

    const paramsToSign = `folder=${folder}&timestamp=${timestamp}&transformation=${transformation}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    const form = new FormData();
    form.append("file", `data:${mimeType};base64,${base64}`);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp);
    form.append("folder", folder);
    form.append("transformation", transformation);
    form.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: form }
    );
    const data = await res.json();
    return (data.secure_url as string) ?? null;
  } catch {
    return null;
  }
}
