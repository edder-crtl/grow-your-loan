import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion);
      setCargando(false);
    });

    supabase.auth.getSession().then(({ data: { session: actual } }) => {
      setSession(actual);
      setCargando(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return { session, user: (session?.user ?? null) as User | null, cargando };
}
