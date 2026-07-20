"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export interface AuthState {
  error: string | null;
}

export async function signIn(
  prevState: any,
  formData: FormData
): Promise<AuthState> {
  const usuario = formData.get("usuario") as string;
  const pin = formData.get("pin") as string;

  if (!usuario || !pin) {
    return { error: "Por favor selecciona un usuario e ingresa el PIN." };
  }

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("usuario, pin, activo")
    .eq("usuario", usuario)
    .single();

  if (error || !data) {
    return { error: "Usuario no reconocido." };
  }

  if (!data.activo) {
    return { error: "Usuario desactivado." };
  }

  if (data.pin !== pin) {
    return { error: "PIN incorrecto." };
  }

  const cookieStore = await cookies();
  cookieStore.set("sede_session", data.usuario, {
    maxAge: 60 * 60 * 24 * 365 * 10,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  redirect("/casos");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("sede_session");
  revalidatePath("/", "layout");
  redirect("/login");
}
