import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { formatoCOP } from "@/lib/finanzas";

export const Route = createFileRoute("/consulta")({
  head: () => ({
    meta: [
      { title: "Consulta pública — CUENTACLARA" },
      {
        name: "description",
        content:
          "Consulta pública de personas: centrales de riesgo, reportes, score y testimonios. Datos informativos.",
      },
      { property: "og:title", content: "Consulta pública — CUENTACLARA" },
      {
        property: "og:description",
        content: "Busca el registro de una persona y revisa sus reportes y score.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Consulta,
});

interface PersonaPublica {
  id: string;
  nombre: string;
  documento: string | null;
  ciudad: string | null;
  ocupacion: string | null;
  edad: number | null;
  centrales_riesgo: string | null;
  tiene_reporte: boolean;
  reportes: string | null;
  score: number | null;
  deuda_reportada: number | null;
  testimonio: string | null;
}

function Consulta() {
  const [busqueda, setBusqueda] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["personas_publicas"],
    queryFn: async () => {
      // Tabla en la base personal del usuario; aún no está en los tipos generados.
      const { data, error } = await (
        supabase as unknown as {
          from: (t: string) => {
            select: (c: string) => {
              order: (
                c: string,
                o: { ascending: boolean },
              ) => PromiseLike<{ data: PersonaPublica[] | null; error: { message: string } | null }>;
            };
          };
        }
      )
        .from("personas_publicas")
        .select("*")
        .order("nombre", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const personas = data ?? [];
  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return personas;
    return personas.filter((p) =>
      [p.nombre, p.documento, p.ciudad, p.ocupacion]
        .filter(Boolean)
        .some((campo) => String(campo).toLowerCase().includes(q)),
    );
  }, [personas, busqueda]);

  return (
    <AppShell>
      <header>
        <p className="mb-2 text-sm text-ink-soft">Datos / Consulta pública</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Consulta pública</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Busca a una persona por nombre, documento o ciudad y revisa su información pública:
          centrales de riesgo, reportes, score y testimonios.
        </p>
      </header>

      <label className="block">
        <span className="text-xs font-semibold">Buscar persona</span>
        <div className="relative mt-1.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, documento o ciudad"
            className="h-11 w-full rounded-md border border-line bg-paper pl-9 pr-3 text-sm outline-none focus:border-accent"
          />
        </div>
      </label>

      {isLoading && <p className="text-sm text-ink-soft">Cargando registros…</p>}
      {isError && (
        <p className="border border-line bg-card p-5 text-sm">
          No se pudo consultar la base todavía. Asegúrate de haber ejecutado el archivo SQL en tu
          Supabase (SQL Editor → Run) y recarga esta página.
        </p>
      )}

      {!isLoading && !isError && filtradas.length === 0 && (
        <p className="border border-line bg-card p-5 text-sm">
          {personas.length === 0
            ? "Todavía no hay registros en la base pública."
            : "No hay personas que coincidan con esa búsqueda."}
        </p>
      )}

      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtradas.map((p) => (
          <article key={p.id} className="settle-in border border-line bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold">{p.nombre}</h2>
                <p className="mt-0.5 font-mono text-[11px] text-ink-soft">
                  {[p.documento, p.ciudad].filter(Boolean).join(" · ") || "Sin datos de ubicación"}
                </p>
              </div>
              <span
                className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold uppercase ${
                  p.tiene_reporte ? "bg-accent text-paper" : "bg-accent-2/15 text-accent-2"
                }`}
              >
                {p.tiene_reporte ? "Con reporte" : "Sin reportes"}
              </span>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              {[
                ["Ocupación", p.ocupacion],
                ["Edad", p.edad ? `${p.edad} años` : null],
                ["Centrales de riesgo", p.centrales_riesgo],
                ["Score", p.score ? String(p.score) : null],
                [
                  "Deuda reportada",
                  p.deuda_reportada && p.deuda_reportada > 0 ? formatoCOP(Number(p.deuda_reportada)) : "$0",
                ],
                ["Reportes", p.reportes],
              ]
                .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
                .map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0">
                    <dt className="shrink-0 text-xs text-ink-soft">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
            </dl>

            {p.testimonio && (
              <blockquote className="mt-4 border-l-2 border-accent-2 pl-3 text-sm text-ink-soft">
                “{p.testimonio}”
              </blockquote>
            )}
          </article>
        ))}
      </div>

      <p className="text-xs text-ink-soft">
        Estos registros son informativos y de ejemplo. Los datos reales de centrales de riesgo
        (Datacrédito, TransUnion) solo se pueden consultar con autorización de cada persona.{" "}
        <Link to="/" className="font-bold text-accent">
          Simular un crédito
        </Link>
      </p>
    </AppShell>
  );
}
