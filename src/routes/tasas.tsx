import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Landmark, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/tasas")({
  head: () => ({
    meta: [
      { title: "Tasas reales por banco — CUENTACLARA" },
      { name: "description", content: "Compara las tasas de interés reales que cobran los bancos en Colombia, con datos abiertos de la Superintendencia Financiera." },
      { property: "og:title", content: "Tasas reales por banco — CUENTACLARA" },
      { property: "og:description", content: "Mira qué banco te presta más barato según datos oficiales de la Superfinanciera." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tasas,
});

const TIPOS = [
  { valor: "Consumo", etiqueta: "Consumo (libre inversión, tarjetas)" },
  { valor: "Crédito productivo", etiqueta: "Productivo / emprendimiento" },
  { valor: "Comercial ordinario", etiqueta: "Para negocios" },
  { valor: "Vivienda", etiqueta: "Vivienda" },
] as const;

const API = "https://www.datos.gov.co/resource/qzsc-9esp.json";

interface FilaBanco { banco: string; tasa: number; creditos: number }

async function cargarTasas(tipo: string): Promise<{ filas: FilaBanco[]; corte: string | null }> {
  const params = new URLSearchParams({
    $select: "nombre_entidad,sum(montos_desembolsados*tasa_efectiva_promedio)/sum(montos_desembolsados) as tasa,sum(numero_de_creditos) as creditos",
    $where: `tipo_de_cr_dito='${tipo.replace(/'/g, "''")}' AND tipo_de_persona='Natural'`,
    $group: "nombre_entidad",
    $order: "creditos DESC",
    $limit: "60",
  });
  const [r, c] = await Promise.all([
    fetch(`${API}?${params}`),
    fetch(`${API}?$select=max(fecha_corte) as corte`),
  ]);
  if (!r.ok) throw new Error("No se pudo consultar la Superfinanciera");
  const datos = (await r.json()) as { nombre_entidad: string; tasa: string; creditos: string }[];
  const corte = c.ok ? ((await c.json()) as { corte?: string }[])[0]?.corte ?? null : null;
  const filas = datos
    .map((d) => ({ banco: d.nombre_entidad, tasa: Number(d.tasa), creditos: Number(d.creditos) }))
    .filter((d) => Number.isFinite(d.tasa) && d.tasa > 0 && d.creditos >= 50)
    .sort((a, b) => a.tasa - b.tasa);
  return { filas, corte };
}

function Tasas() {
  const [tipo, setTipo] = useState<string>(TIPOS[0].valor);
  const [busqueda, setBusqueda] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tasas-sfc", tipo],
    queryFn: () => cargarTasas(tipo),
    staleTime: 1000 * 60 * 60,
  });

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (data?.filas ?? []).filter((f) => !q || f.banco.toLowerCase().includes(q));
  }, [data, busqueda]);

  const promedio = data?.filas.length ? data.filas.reduce((s, f) => s + f.tasa, 0) / data.filas.length : 0;
  const corte = data?.corte ? new Date(data.corte).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <AppShell>
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Datos oficiales</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">¿Qué banco te presta más barato?</h1>
        <p className="max-w-2xl text-ink-soft">
          Estas son las tasas que de verdad cobraron los bancos a personas en las últimas semanas, según la Superintendencia Financiera. Úsalas para saber si la tasa que te ofrecen es justa.
        </p>
      </header>

      <section className="space-y-4 rounded-lg border border-line bg-card p-4 md:p-6">
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <button key={t.valor} onClick={() => setTipo(t.valor)} className={`rounded-md border px-3 py-2 text-sm ${tipo === t.valor ? "border-ink bg-ink text-paper" : "border-line text-ink-soft hover:text-ink"}`}>
              {t.etiqueta}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-md border border-line px-3">
          <Search className="size-4 text-ink-soft" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar banco" className="h-10 w-full bg-transparent outline-none" />
        </label>
        {!!promedio && (
          <p className="text-sm text-ink-soft">
            Tasa promedio entre bancos: <strong className="font-mono text-ink">{promedio.toFixed(2)}% E.A.</strong> Si te ofrecen mucho más que esto, sigue buscando.
            {corte && <> Datos con corte al {corte}.</>}
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-line bg-card">
        {isLoading && <p className="p-6 text-ink-soft">Consultando la Superfinanciera…</p>}
        {isError && <p className="p-6 text-accent">No pudimos traer las tasas ahora. Intenta de nuevo en un rato.</p>}
        {!isLoading && !isError && filas.length === 0 && <p className="p-6 text-ink-soft">No hay bancos que coincidan.</p>}
        <ul className="divide-y divide-line">
          {filas.map((f, i) => (
            <li key={f.banco} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:px-6">
              <span className="grid size-8 place-items-center rounded-md bg-muted font-mono text-xs">{i + 1}</span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-semibold"><Landmark className="size-4 shrink-0 text-ink-soft" />{f.banco}</p>
                <p className="text-xs text-ink-soft">{f.creditos.toLocaleString("es-CO")} créditos desembolsados</p>
              </div>
              <span className={`font-mono font-bold ${f.tasa <= promedio ? "text-positive" : "text-accent"}`}>{f.tasa.toFixed(2)}%</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-ink-soft">
        Fuente: Superintendencia Financiera de Colombia, “Tasas de interés activas por tipo de crédito”, datos.gov.co. Tasa efectiva anual promedio ponderada por monto prestado. Es una referencia: la tasa final depende de tu perfil.
      </p>
    </AppShell>
  );
}
