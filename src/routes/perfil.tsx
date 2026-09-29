import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatoCOP } from "@/lib/finanzas";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil financiero — CuentaClara" },
      {
        name: "description",
        content:
          "Registra ingresos, gastos fijos, deudas y antigüedad laboral para evaluar tu capacidad de endeudamiento.",
      },
      { property: "og:title", content: "Perfil financiero — CuentaClara" },
      {
        property: "og:description",
        content: "Tus datos financieros alimentan el motor de decisión del simulador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Perfil,
});

interface PerfilRow {
  nombre: string;
  ocupacion: string;
  ingresos_mensuales: number;
  gastos_fijos: number;
  deuda_actual: number;
  antiguedad_laboral_meses: number;
}

const VACIO: PerfilRow = {
  nombre: "",
  ocupacion: "",
  ingresos_mensuales: 0,
  gastos_fijos: 0,
  deuda_actual: 0,
  antiguedad_laboral_meses: 0,
};

function Perfil() {
  const { user } = useAuth();
  const [form, setForm] = useState<PerfilRow>(VACIO);
  const [guardando, setGuardando] = useState(false);

  const { data } = useQuery({
    queryKey: ["perfil", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return VACIO;
      const { data, error } = await supabase
        .from("profiles")
        .select("nombre, ocupacion, ingresos_mensuales, gastos_fijos, deuda_actual, antiguedad_laboral_meses")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? VACIO) as PerfilRow;
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setGuardando(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...form, updated_at: new Date().toISOString() });
    setGuardando(false);
    if (error) {
      toast.error("No se pudo guardar el perfil");
      return;
    }
    toast.success("Perfil financiero actualizado");
  }

  const capacidad = Math.max(
    Number(form.ingresos_mensuales) - Number(form.gastos_fijos) - Number(form.deuda_actual),
    0,
  );

  if (!user) {
    return (
      <AppShell>
        <div className="border border-line bg-card p-5 text-sm">
          Entra a tu cuenta para guardar tu perfil financiero.{" "}
          <Link to="/auth" className="font-bold text-accent">
            Entrar
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header>
      <p className="mb-2 text-sm text-ink-soft">Cuenta / Perfil financiero</p>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Perfil financiero</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Estos datos alimentan la evaluación de capacidad de pago.
      </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
      <form onSubmit={guardar} className="rise-in space-y-4 border border-line bg-card p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
        <Texto
          etiqueta="Nombre o razón social"
          valor={form.nombre}
          onChange={(v) => setForm({ ...form, nombre: v })}
        />
        <Texto
          etiqueta="Ocupación / actividad"
          valor={form.ocupacion}
          onChange={(v) => setForm({ ...form, ocupacion: v })}
        />
          <Numero etiqueta="Ingresos mensuales" valor={form.ingresos_mensuales} onChange={(v) => setForm({ ...form, ingresos_mensuales: v })} />
          <Numero etiqueta="Gastos fijos" valor={form.gastos_fijos} onChange={(v) => setForm({ ...form, gastos_fijos: v })} />
          <Numero etiqueta="Cuotas de deuda" valor={form.deuda_actual} onChange={(v) => setForm({ ...form, deuda_actual: v })} />
          <Numero etiqueta="Antigüedad (meses)" valor={form.antiguedad_laboral_meses} onChange={(v) => setForm({ ...form, antiguedad_laboral_meses: v })} />
        </div>
        <Button type="submit" disabled={guardando} className="h-11 w-full sm:w-auto">Guardar perfil</Button>
      </form>

      <section className="settle-in bg-ink p-6 text-paper lg:sticky lg:top-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">
          Capacidad de pago mensual
        </p>
        <p className="mt-4 break-words font-display text-3xl font-bold">
          {formatoCOP(capacidad)}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-paper/55">Disponible después de gastos fijos y cuotas de deuda registradas.</p>
      </section>
      </div>
    </AppShell>
  );
}

function Texto({
  etiqueta,
  valor,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold">{etiqueta}</span>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}

function Numero({
  etiqueta,
  valor,
  onChange,
}: {
  etiqueta: string;
  valor: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold">{etiqueta}</span>
      <input
        type="number"
        value={valor}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 font-mono text-sm font-bold outline-none focus:border-accent"
      />
    </label>
  );
}
