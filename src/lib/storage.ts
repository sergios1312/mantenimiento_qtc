// ============================================================
// src/lib/storage.ts
// Capa de persistencia local basada en archivos JSON.
// Reemplaza a Supabase mientras el proyecto está en desarrollo.
// SERVER ONLY — no importar desde Client Components.
// ============================================================
import "server-only";
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureFile(table: string): Promise<string> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, `${table}.json`);
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, "[]", "utf-8");
  }
  return file;
}

export async function readTable<T = any>(table: string): Promise<T[]> {
  const file = await ensureFile(table);
  const content = await fs.readFile(file, "utf-8");
  if (!content.trim()) return [];
  try {
    return JSON.parse(content) as T[];
  } catch (err) {
    console.error(`[storage] Error parseando ${table}.json:`, err);
    return [];
  }
}

export async function writeTable<T = any>(table: string, rows: T[]): Promise<void> {
  const file = await ensureFile(table);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(rows, null, 2), "utf-8");
  await fs.rename(tmp, file);
}

function nextId<T extends { id?: number }>(rows: T[]): number {
  return rows.reduce((max, r) => Math.max(max, r.id ?? 0), 0) + 1;
}

/**
 * Inserta una fila con id auto-incremental y created_at automático.
 * Si el row ya trae id explícito (ej. al sembrar datos), lo respeta.
 */
export async function insertRow<T extends Record<string, any>>(
  table: string,
  row: Omit<T, "id" | "created_at"> & { id?: number; created_at?: string }
): Promise<T> {
  const rows = await readTable<T & { id: number }>(table);
  const id = (row as any).id ?? nextId(rows);
  const created_at = (row as any).created_at ?? new Date().toISOString();
  const newRow = { ...row, id, created_at } as unknown as T & { id: number };
  rows.push(newRow);
  await writeTable(table, rows);
  return newRow;
}

export async function updateRow<T extends { id: number }>(
  table: string,
  id: number,
  patch: Partial<T>
): Promise<T | null> {
  const rows = await readTable<T>(table);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  rows[idx] = { ...rows[idx], ...patch };
  await writeTable(table, rows);
  return rows[idx];
}

export async function findRow<T extends { id: number }>(
  table: string,
  id: number
): Promise<T | null> {
  const rows = await readTable<T>(table);
  return rows.find((r) => r.id === id) ?? null;
}

export async function findOneBy<T>(
  table: string,
  predicate: (row: T) => boolean
): Promise<T | null> {
  const rows = await readTable<T>(table);
  return rows.find(predicate) ?? null;
}

export async function findManyBy<T>(
  table: string,
  predicate: (row: T) => boolean
): Promise<T[]> {
  const rows = await readTable<T>(table);
  return rows.filter(predicate);
}

export async function deleteRow(table: string, id: number): Promise<boolean> {
  const rows = await readTable<{ id: number }>(table);
  const filtered = rows.filter((r) => r.id !== id);
  if (filtered.length === rows.length) return false;
  await writeTable(table, filtered);
  return true;
}
