import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const tabs = [
  { to: "/", label: "Simulador" },
  { to: "/cartera", label: "Cartera" },
  { to: "/solicitudes", label: "Solicitudes" },
  { to: "/perfil", label: "Perfil" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const iniciales = user?.email?.slice(0, 2).toUpperCase() ?? "MP";

  return (
    <div className="min-h-screen bg-paper pb-12 font-body text-ink">
      <nav className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-ink">
              <span className="font-display text-sm font-black leading-none text-paper">$</span>
            </div>
            <div className="leading-tight">
              <p className="font-display text-[15px] font-extrabold tracking-tight">
                CUENTA<span className="text-accent">CLARA</span>
              </p>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">
                Simulador · pyme
              </p>
            </div>
          </Link>
          {user ? (
            <button
              onClick={() => supabase.auth.signOut()}
              title="Cerrar sesión"
              className="grid size-9 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-paper"
            >
              {iniciales}
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full border border-line px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-ink-soft"
            >
              Entrar
            </Link>
          )}
        </div>
        <div className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 pb-2">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.to === "/" }}
              className="shrink-0 rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink-soft"
              activeProps={{
                className:
                  "shrink-0 rounded-full bg-ink border border-ink px-4 py-1.5 text-xs font-semibold text-paper",
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="mx-auto mt-5 max-w-3xl space-y-5 px-4">{children}</main>
    </div>
  );
}
