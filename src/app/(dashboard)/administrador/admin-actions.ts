"use server";

import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// ============================================================
// Server actions — Módulo Administrador
// Solo accesibles por usuarios con rol "admin".
// ============================================================

function soloAdmin() {
  return { error: "Solo los administradores pueden realizar esta acción." };
}

// ─── TÉCNICOS ────────────────────────────────────────────────

export async function agregarTecnico(
  nombre: string,
  correo: string,
  telefono: string
) {
  const user = await getSession();
  if (!user || user.role !== "admin") return soloAdmin();

  const n = nombre.trim();
  if (!n) return { error: "El nombre es obligatorio." };

  const { data, error } = await supabaseAdmin
    .from("tecnicos")
    .insert({
      nombre: n,
      correo: correo.trim() || null,
      telefono: telefono.trim() || null,
      activo: true,
    })
    .select("id, nombre, correo, telefono")
    .single();

  if (error) return { error: "Error al agregar técnico." };

  revalidatePath("/administrador");
  revalidatePath("/casos");
  return { data: data as { id: number; nombre: string; correo: string | null; telefono: string | null } };
}

export async function editarTecnico(
  id: number,
  nombre: string,
  correo: string,
  telefono: string
) {
  const user = await getSession();
  if (!user || user.role !== "admin") return soloAdmin();

  const n = nombre.trim();
  if (!n) return { error: "El nombre es obligatorio." };

  const { error } = await supabaseAdmin
    .from("tecnicos")
    .update({
      nombre: n,
      correo: correo.trim() || null,
      telefono: telefono.trim() || null,
    })
    .eq("id", id);

  if (error) return { error: "Error al editar técnico." };

  revalidatePath("/administrador");
  revalidatePath("/casos");
  return { success: true };
}

export async function eliminarTecnico(id: number) {
  const user = await getSession();
  if (!user || user.role !== "admin") return soloAdmin();

  const { error } = await supabaseAdmin
    .from("tecnicos")
    .delete()
    .eq("id", id);

  if (error) return { error: "Error al eliminar técnico." };

  revalidatePath("/administrador");
  revalidatePath("/casos");
  return { success: true };
}

// ─── TIENDAS ─────────────────────────────────────────────────

interface TiendaInput {
  nombre: string;
  zona: string;
  ubicacion: string;
  marca: string;
  tipo: string;
}

type TiendaRow = TiendaInput & { id: number };

export async function agregarTienda(t: TiendaInput) {
  const user = await getSession();
  if (!user || user.role !== "admin") return soloAdmin();

  const n = t.nombre.trim();
  if (!n) return { error: "El nombre es obligatorio." };

  const { data, error } = await supabaseAdmin
    .from("tiendas")
    .insert({
      nombre: n,
      zona: t.zona.trim(),
      ubicacion: t.ubicacion.trim(),
      marca: t.marca.trim(),
      tipo: t.tipo.trim(),
    })
    .select("id, nombre, zona, ubicacion, marca, tipo")
    .single();

  if (error) return { error: "Error al agregar tienda." };

  revalidatePath("/administrador");
  revalidatePath("/cuestionario");
  return { data: data as TiendaRow };
}

export async function editarTienda(id: number, t: TiendaInput) {
  const user = await getSession();
  if (!user || user.role !== "admin") return soloAdmin();

  const n = t.nombre.trim();
  if (!n) return { error: "El nombre es obligatorio." };

  const { error } = await supabaseAdmin
    .from("tiendas")
    .update({
      nombre: n,
      zona: t.zona.trim(),
      ubicacion: t.ubicacion.trim(),
      marca: t.marca.trim(),
      tipo: t.tipo.trim(),
    })
    .eq("id", id);

  if (error) return { error: "Error al editar tienda." };

  revalidatePath("/administrador");
  revalidatePath("/cuestionario");
  return { success: true };
}

export async function eliminarTienda(id: number) {
  const user = await getSession();
  if (!user || user.role !== "admin") return soloAdmin();

  const { error } = await supabaseAdmin
    .from("tiendas")
    .delete()
    .eq("id", id);

  if (error) return { error: "Error al eliminar tienda." };

  revalidatePath("/administrador");
  revalidatePath("/cuestionario");
  return { success: true };
}
