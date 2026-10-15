// Cliente de la base personal del usuario (Supabase propio).
// La clave publicable no es secreta; la seguridad depende de las políticas RLS.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const URL = "https://umnuahpubabpakcdlfuv.supabase.co";
const KEY = "sb_publishable_3x5PBPQ_6MQPibSRlIi30Q_5XeH1juQ";

export const supabase = createClient<Database>(URL, KEY, {
  auth: {
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
