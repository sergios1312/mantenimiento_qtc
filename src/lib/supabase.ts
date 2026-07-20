import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente con service_role — solo para uso en el servidor.
// Bypasea RLS; nunca exponer al cliente.
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
