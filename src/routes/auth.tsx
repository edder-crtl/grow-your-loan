import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — CuentaClara" },
      {
        name: "description",
        content:
          "Ingresa o crea tu cuenta para guardar simulaciones, solicitudes y tablas de amortización.",
      },
      { property: "og:title", content: "Entrar — CuentaClara" },
      {
        property: "og:description",
        content: "Accede a tus solicitudes de crédito y tu cartera guardada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modo, setModo] = useState<"entrar" | "registrar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setCargando(false);
      if (error) {
        toast.error("Correo o contraseña incorrectos");
        return;
      }
      toast.success("Bienvenido de vuelta");
      navigate({ to: "/" });
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
        emailRedirectTo: window.location.origin,
      },
    });
    setCargando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Cuenta creada. Revisa tu correo para confirmarla.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("No se pudo iniciar sesión con Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <AppShell>
      <section className="settle-in mx-auto max-w-md border border-line bg-card p-6 sm:p-8">
        <p className="mb-2 text-sm text-ink-soft">CuentaClara</p>
        <h1 className="font-display text-2xl font-bold">
          {modo === "entrar" ? "Entrar a tu cuenta" : "Crear cuenta"}
        </h1>
        <p className="mt-1 text-xs text-ink-soft">
          Guarda simulaciones, solicitudes y tablas de amortización.
        </p>

        <form onSubmit={enviar} className="mt-4 space-y-3">
          {modo === "registrar" && (
            <label className="block">
              <span className="text-xs font-semibold">Nombre o razón social</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                 className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
                placeholder="Panadería La Espiga"
              />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-semibold">Correo</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
             className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
              placeholder="tu@correo.com"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold">Contraseña</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
             className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
            />
          </label>
          <Button
            type="submit"
            disabled={cargando}
            className="h-11 w-full bg-accent text-paper hover:bg-accent/90"
          >
            {modo === "entrar" ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          onClick={google}
          className="mt-3 h-11 w-full bg-paper shadow-none"
        >
          Continuar con Google
        </Button>

        <Button
          type="button"
          variant="link"
          onClick={() => setModo(modo === "entrar" ? "registrar" : "entrar")}
          className="mt-4 w-full font-mono text-[11px] font-bold uppercase text-accent"
        >
          {modo === "entrar" ? "No tengo cuenta" : "Ya tengo cuenta"}
        </Button>
      </section>
    </AppShell>
  );
}
