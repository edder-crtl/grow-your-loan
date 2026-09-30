import { Link, useRouterState } from "@tanstack/react-router";
import { Calculator, CircleUserRound, Files, Lightbulb, LogIn, PanelLeftClose, PanelLeftOpen, WalletCards } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const tabs = [
  { to: "/", label: "Simulador", icon: Calculator },
  { to: "/cartera", label: "Cartera", icon: WalletCards },
  { to: "/solicitudes", label: "Solicitudes", icon: Files },
  { to: "/consejos", label: "Consejos", icon: Lightbulb },
  { to: "/perfil", label: "Perfil", icon: CircleUserRound },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [compacta, setCompacta] = useState(false);
  const iniciales = user?.email?.slice(0, 2).toUpperCase() ?? "MP";

  return (
    <div className="min-h-screen bg-paper font-body text-ink md:flex">
      <aside className={`hidden shrink-0 border-r border-line bg-card md:sticky md:top-0 md:flex md:h-screen md:flex-col ${compacta ? "w-20" : "w-64"}`}>
        <div className="flex h-20 items-center justify-between border-b border-line px-5">
          <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="CuentaClara, inicio">
            <div className="grid size-9 shrink-0 place-items-center rounded-md bg-ink font-display text-sm font-bold text-paper">$</div>
            {!compacta && <span className="truncate font-display text-sm font-bold">CUENTA<span className="text-accent">CLARA</span></span>}
          </Link>
          {!compacta && (
            <Button variant="ghost" size="icon" onClick={() => setCompacta(true)} title="Contraer menú" aria-label="Contraer menú">
              <PanelLeftClose />
            </Button>
          )}
        </div>

        {compacta && (
          <Button variant="ghost" size="icon" onClick={() => setCompacta(false)} title="Expandir menú" aria-label="Expandir menú" className="mx-auto mt-4">
            <PanelLeftOpen />
          </Button>
        )}

        <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Navegación principal">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const activa = pathname === tab.to;
            return (
              <Link key={tab.to} to={tab.to} title={compacta ? tab.label : undefined} className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors ${activa ? "bg-ink font-semibold text-paper" : "text-ink-soft hover:bg-muted hover:text-ink"}`}>
                <Icon className="size-4 shrink-0" />
                {!compacta && <span>{tab.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          {user ? (
            <Button variant="ghost" onClick={() => supabase.auth.signOut()} title="Cerrar sesión" className={`h-11 w-full ${compacta ? "px-0" : "justify-start"}`}>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent font-mono text-[10px] font-bold text-paper">{iniciales}</span>
              {!compacta && <span className="truncate">Cerrar sesión</span>}
            </Button>
          ) : (
            <Button asChild variant="ghost" className={`h-11 w-full ${compacta ? "px-0" : "justify-start"}`}>
              <Link to="/auth"><LogIn />{!compacta && <span>Entrar</span>}</Link>
            </Button>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 md:pb-10">
        <header className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center border-b border-line bg-card px-4 md:hidden">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <div className="grid size-8 shrink-0 place-items-center rounded-md bg-ink font-display text-xs font-bold text-paper">$</div>
            <span className="truncate font-display text-sm font-bold">CUENTA<span className="text-accent">CLARA</span></span>
          </Link>
          {user ? (
            <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut()} title="Cerrar sesión" aria-label="Cerrar sesión"><span className="font-mono text-xs">{iniciales}</span></Button>
          ) : (
            <Button asChild variant="outline" size="sm"><Link to="/auth">Entrar</Link></Button>
          )}
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:px-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-card/95 px-1 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden" aria-label="Navegación principal">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const activa = pathname === tab.to;
          return (
            <Link key={tab.to} to={tab.to} className={`flex min-w-0 flex-col items-center gap-1 py-1 text-[10px] ${activa ? "font-semibold text-accent" : "text-ink-soft"}`}>
              <Icon className="size-5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
