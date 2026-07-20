import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import type { UserRole } from "@/lib/permisos";

export interface SessionUser {
  usuario: string;
  ciudad: string;
  responsable: string;
  telefono: string;
  correo: string;
  pin: string;
  role: UserRole;
  maneja_stock: boolean;
  email: string;
  id_db?: number;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sede = cookieStore.get("sede_session")?.value;
  if (!sede) return null;

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("*")
    .eq("usuario", sede)
    .eq("activo", true)
    .single();

  if (error || !data) return null;

  return {
    usuario: data.usuario,
    ciudad: data.ciudad,
    responsable: data.responsable,
    telefono: data.telefono,
    correo: data.correo,
    pin: data.pin,
    role: data.role as UserRole,
    maneja_stock: data.maneja_stock,
    email: data.correo,
    id_db: data.id,
  };
}