import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
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
      const { data, error } = await supabase
        .from("profiles")
        .select("nombre, ocupacion, ingresos_mensuales, gastos_fijos, deuda_actual, antiguedad_laboral_meses")
        .eq("id", user!.id)
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
    if (error) return toast.error("No se pudo guardar el perfil");
    toast.success("Perfil financiero actualizado");
  }

  const capacidad = Math.max(
    Number(form.ingresos_mensuales) - Number(form.gastos_fijos) - Number(form.deuda_actual),
    0,
  );

  if (!user) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-line bg-card p-5 text-sm">
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
      <h1 className="font-display text-xl font-extrabold tracking-tight">Perfil financiero</h1>
      <p className="-mt-3 text-xs text-ink-soft">
        Estos datos alimentan la evaluación de capacidad de pago.
      </p>

      <section className="settle-in rounded-2xl bg-ink p-5 text-paper">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">
          Capacidad de pago mensual
        </p>
        <p className="mt-1 font-display text-3xl font-black tracking-tight">
          <span className="text-accent">$</span>
          {formatoCOP(capacidad, false)}
        </p>
      </section>

      <form onSubmit={guardar} className="rise-in space-y-3 rounded-2xl border border-line bg-card p-4">
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
        <div className="grid grid-cols-2 gap-3">
          <Numero
            etiqueta="Ingresos mensuales"
            valor={form.ingresos_mensuales}
            onChange={(v) => setForm({ ...form, ingresos_mensuales: v })}
          />
          <Numero
            etiqueta="Gastos fijos"
            valor={form.gastos_fijos}
            onChange={(v) => setForm({ ...form, gastos_fijos: v })}
          />
          <Numero
            etiqueta="Cuotas de deuda"
            valor={form.deuda_actual}
            onChange={(v) => setForm({ ...form, deuda_actual: v })}
          />
          <Numero
            etiqueta="Antigüedad (meses)"
            valor={form.antiguedad_laboral_meses}
            onChange={(v) => setForm({ ...form, antiguedad_laboral_meses: v })}
          />
        </div>
        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-paper disabled:opacity-60"
        >
          Guardar perfil
        </button>
      </form>
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
        className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
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
        className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 font-mono text-sm font-bold outline-none focus:border-accent"
      />
    </label>
  );
}
