import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  clasificarCartera,
  diasMora,
  formatoCOP,
  planRefinanciacion,
  type BucketCartera,
} from "@/lib/finanzas";

export const Route = createFileRoute("/cartera")({
  head: () => ({
    meta: [
      { title: "Cartera por edades y mora — CUENTACLARA" },
      {
        name: "description",
        content:
          "Clasifica tu cartera en corriente, 30, 60 y 90+ días, con intereses de mora calculados y plan de refinanciación.",
      },
      { property: "og:title", content: "Cartera por edades y mora — CUENTACLARA" },
      {
        property: "og:description",
        content: "Seguimiento de cuotas vencidas, recargos y reprogramación de compromisos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cartera,
});

const ESTILO_BUCKET: Record<BucketCartera, { chip: string; texto: string }> = {
  Corriente: { chip: "bg-ok/15 text-ok", texto: "OK" },
  "30 días": { chip: "bg-warn/15 text-warn", texto: "Mora" },
  "60 días": { chip: "bg-warn/15 text-warn", texto: "Mora" },
  "90+ días": { chip: "bg-bad/15 text-bad", texto: "Crítico" },
};

function Cartera() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["cartera", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: cuotas, error } = await supabase
        .from("amortizaciones")
        .select("cuota, fecha_vencimiento, pagada, saldo, solicitud_id")
        .eq("pagada", false)
        .order("fecha_vencimiento");
      if (error) throw error;
      return cuotas ?? [];
    },
  });

  const cuotas = data ?? [];
  const buckets = clasificarCartera(cuotas);
  const vencidas = cuotas
    .filter((c) => diasMora(c.fecha_vencimiento) > 0)
    .slice(0, 6);
  const saldoVencido = buckets
    .filter((b) => b.bucket !== "Corriente")
    .reduce((acc, b) => acc + b.saldo + b.mora, 0);
  const refi = planRefinanciacion(saldoVencido, 0.019, Math.max(saldoVencido / 12, 1));

  return (
    <AppShell>
      <header>
      <p className="mb-2 text-sm text-ink-soft">Gestión / Cartera</p>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Cartera por edades</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Clasificación automática de cuotas pendientes y cálculo de intereses de mora.
      </p>
      </header>

      {!user && (
        <div className="border border-line bg-card p-5 text-sm">
          Entra a tu cuenta para ver la cartera de tus créditos guardados.{" "}
          <Link to="/auth" className="font-bold text-accent">
            Entrar
          </Link>
        </div>
      )}

      {user && isLoading && <p className="font-mono text-xs text-ink-soft">Calculando…</p>}

      {user && !isLoading && (
        <>
           <section className="rise-in grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {buckets.map((b) => (
              <div key={b.bucket} className="border border-line bg-card p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-ink-soft">
                    {b.bucket}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${ESTILO_BUCKET[b.bucket].chip}`}
                  >
                    {ESTILO_BUCKET[b.bucket].texto}
                  </span>
                </div>
                <p className="mt-2 font-display text-2xl font-extrabold">
                  {formatoCOP(b.saldo, false)}
                </p>
                <p className="mt-1 font-mono text-[11px] text-ink-soft">
                  {b.cuentas} cuota{b.cuentas === 1 ? "" : "s"}
                  {b.mora > 0 ? ` · +${formatoCOP(b.mora, false)}` : ""}
                </p>
              </div>
            ))}
          </section>

          <section className="rise-in">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Cuotas vencidas
              </p>
              <span className="font-mono text-[10px] text-ink-soft">Recargos aplicados</span>
            </div>
            <div className="divide-y divide-line border border-line bg-card">
              {vencidas.length === 0 && (
                <p className="p-4 text-sm text-ink-soft">
                  No tienes cuotas vencidas. Tu cartera está corriente.
                </p>
              )}
              {vencidas.map((c, i) => {
                const dias = diasMora(c.fecha_vencimiento);
                return (
                  <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-md bg-ink">
                      <span className="font-mono text-xs font-bold text-paper">{dias}d</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        Cuota del{" "}
                        {new Date(`${c.fecha_vencimiento}T00:00:00`).toLocaleDateString("es-CO")}
                      </p>
                      <p className="font-mono text-[11px] text-ink-soft">
                        {formatoCOP(Number(c.cuota))} · mora {formatoCOP(
                          Number(c.cuota) * (0.028 / 30) * dias,
                          false,
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-bad/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-bad">
                      Vencida
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {saldoVencido > 0 && (
            <section className="rise-in border-l-4 border-accent bg-card p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Refinanciación de la cartera vencida
              </p>
              <p className="mt-2 text-sm">
                Saldo vencido con mora: <span className="font-mono font-bold">{formatoCOP(saldoVencido)}</span>.
                Reprogramable a <span className="font-mono font-bold">{refi.plazo} meses</span> por{" "}
                <span className="font-mono font-bold">{formatoCOP(refi.cuota)}</span> al mes.
              </p>
              <p className="mt-2 font-mono text-[11px] text-ink-soft">
                Notificación programada: recordatorio 3 días antes de cada vencimiento y aviso de
                mora al día 1, 15 y 30.
              </p>
            </section>
          )}
        </>
      )}
    </AppShell>
  );
}
