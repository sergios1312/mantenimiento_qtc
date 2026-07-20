// ============================================================
// src/lib/search.ts — Motor de búsqueda fuzzy por scoring
//
// Plantilla reutilizable. Originalmente diseñada para buscar
// repuestos; los nombres de campos (codigo, nombre, codigo_sap,
// modelos_compatibles) son específicos del dominio anterior.
//
// TODO: adapta `Item` y `calcularScore()` a los campos de tu dominio.
//
// Jerarquía de prioridad (score menor = mayor prioridad visual):
//   1 → codigo            (máxima prioridad)
//   2 → nombre
//   3 → nombre_traducido
//   4 → codigo_sap / modelos_compatibles
//
// Comportamiento:
//   - Vacío → head(100) sin filtrar
//   - < 2 chars → [] (anti-spam)
//   - ≥ 2 chars → scoring completo, sort ascendente
// ============================================================

// ─── Tipos placeholder — reemplazar al adaptar al dominio ───
export interface Item {
  codigo?: string | null;
  nombre?: string | null;
  nombre_traducido?: string | null;
  codigo_sap?: string | null;
  modelos_compatibles?: string | null;
  [key: string]: unknown;
}

export type ItemConScore = Item & { _score: number };

// ─── Diccionario de modelos oficiales (ejemplo del dominio anterior) ─
// Reemplaza por los términos "fuertes" de tu dominio o vacía el array.
const MODELOS_OFICIALES: string[] = [];

/**
 * Fase 1 — Normalización del término (Fuzzy Match de Tildes).
 * Elimina acentos/diacríticos, aplica lowercase, trim y la RegEx de sub-versiones.
 * Ej: "bátéríá" → "bateria", "ABC.01" → "abc."
 */
export function eliminarTildes(texto: string): string {
  if (!texto) return "";
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizarTermino(termino: string): string {
  return eliminarTildes(termino)
    .toLowerCase()
    .trim()
    .replace(/\.\d{1,2}$/, ".");
}

/**
 * Fase 2 — Sistema de calificación de relevancia (Scoring System).
 *
 * La asignación es de SOBREESCRITURA sobre la marcha usando if secuenciales.
 * La última coincidencia exitosa (de menor a mayor prioridad) es la que
 * prevalece, garantizando que el score 1 (código exacto) siempre gane.
 */
function calcularScore(item: Item, cleanTerm: string): number {
  if (!cleanTerm) return 4;

  let _score = 0;

  // Nivel 4 — SAP & Compatibilidades
  const strSapMod = eliminarTildes(
    String(item.codigo_sap ?? "") + " " + String(item.modelos_compatibles ?? "")
  ).toLowerCase();
  if (strSapMod.includes(cleanTerm)) _score = 4;

  // Nivel 3 — Traducciones / Nombres alternativos
  const strTrad = eliminarTildes(String(item.nombre_traducido ?? "")).toLowerCase();
  if (strTrad.includes(cleanTerm)) _score = 3;

  // Nivel 2 — Nombre core
  const strNombre = eliminarTildes(String(item.nombre ?? "")).toLowerCase();
  if (strNombre.includes(cleanTerm)) _score = 2;

  // Nivel 1 — Código matriz (máxima prioridad)
  const strCodigo = eliminarTildes(String(item.codigo ?? "")).toLowerCase();
  if (strCodigo.includes(cleanTerm)) _score = 1;

  return _score;
}

/**
 * Motor principal de búsqueda.
 *
 * @param catalogo  - Lista completa de items.
 * @param termino   - Texto ingresado por el usuario (sin normalizar).
 * @returns         - Lista filtrada y ordenada ascendentemente por _score.
 */
export function buscarFuzzy<T extends Item>(
  catalogo: T[],
  termino: string
): (T & { _score: number })[] {
  // Sin término → primeros 100 sin filtrar
  if (!termino || termino.trim() === "") {
    return catalogo.slice(0, 100).map((r) => ({ ...r, _score: 0 }));
  }

  const trimmed = termino.trim();

  // Validación anti-spam: 1 solo carácter → 0 resultados
  if (trimmed.length < 2) return [];

  const queryNormalized = normalizarTermino(trimmed);

  // Aislamiento de Modelos (Smart Filtering)
  const rawTokens = queryNormalized.split(/\s+/).filter(Boolean);
  const textTokens: string[] = [];
  const modelTokens: string[] = [];

  for (const token of rawTokens) {
    if (token.length >= 3 && MODELOS_OFICIALES.some((m) => m.includes(token))) {
      modelTokens.push(token);
    } else {
      textTokens.push(token);
    }
  }

  const mainSearchTerm = textTokens.join(" ");

  if (mainSearchTerm.length < 2 && modelTokens.length === 0) return [];

  return catalogo
    .map((r) => {
      let _score = 0;

      if (modelTokens.length > 0) {
        const strCompat = eliminarTildes(String(r.modelos_compatibles ?? "")).toLowerCase();
        const strSap = eliminarTildes(String(r.codigo_sap ?? "")).toLowerCase();
        const cumpleModelos = modelTokens.some(
          (mt) => strCompat.includes(mt) || strSap.includes(mt)
        );
        if (!cumpleModelos) return { ...r, _score: 0 };
      }

      _score = calcularScore(r, mainSearchTerm);

      return { ...r, _score };
    })
    .filter((r) => r._score > 0)
    .sort((a, b) => a._score - b._score);
}
