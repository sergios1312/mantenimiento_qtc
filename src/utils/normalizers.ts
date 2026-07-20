export function normalizarTexto(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u0302\u0304-\u036f]/g, "") // Remueve tildes pero mantiene la Ñ (\u0303)
    .replace(/\uFFFD/g, "") // Remueve caracteres de reemplazo si existían
    .trim();
}

export function normalizarDocumento(doc: string | null | undefined): string {
  if (!doc) return "";
  let d = doc.trim();
  if (d.length > 11) {
    return d.substring(0, 11);
  }
  if (d.length > 0 && d.length < 8) {
    return d.padStart(8, "0");
  }
  return d;
}
