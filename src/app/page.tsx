import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

/**
 * Raíz del sitio: redirige automáticamente según la sesión activa.
 */
export default async function Home() {
  const user = await getSession();

  if (user) {
    redirect("/casos");
  }

  redirect("/login");
}
