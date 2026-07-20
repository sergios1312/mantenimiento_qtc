// Helpers de transformación de URLs de Cloudinary.
// Solo funciona con recursos image/video — los PDFs (raw) no admiten transformaciones.

function cloudinaryTransform(url: string, transformation: string): string {
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  return url.slice(0, i + marker.length) + transformation + "/" + url.slice(i + marker.length);
}

// 200×200 recortada — para miniaturas en listas/tablas
export function thumbnailImagen(url: string): string {
  return cloudinaryTransform(url, "w_200,h_200,c_fill,q_auto,f_auto");
}

// Preview mediano para modales — respeta proporción, máx 800×500
export function previewImagen(url: string): string {
  return cloudinaryTransform(url, "w_800,h_500,c_limit,q_auto,f_auto");
}

// Frame del segundo 1 como JPG pequeño — para miniaturas de video
export function thumbnailVideo(url: string): string {
  const conTrans = cloudinaryTransform(url, "so_1,w_200,h_200,c_fill,q_auto,f_jpg");
  return conTrans.replace(/\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i, ".jpg$2");
}

// URL de descarga forzada con el nombre original
export function urlDescarga(url: string, nombre: string): string {
  const limpio = nombre.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cloudinaryTransform(url, `fl_attachment:${limpio}`);
}
