import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileUp, ShieldCheck, Sparkles, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatoCOP } from "@/lib/finanzas";
import { diagnosticar, extraerObligaciones, REPORTE_EJEMPLO, type Obligacion } from "@/lib/historial";

export const Route = createFileRoute("/consulta")({
  head: () => ({
    meta: [
      { title: "Mi historial — CUENTACLARA" },
      { name: "description", content: "Sube tu reporte gratuito de Midatacrédito o tu extracto y recibe tu diagnóstico financiero privado." },
      { property: "og:title", content: "Mi historial — CUENTACLARA" },
      { property: "og:description", content: "Entiende tu reporte de crédito en segundos, sin que tus datos salgan de tu celular." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MiHistorial,
});

async function leerPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const lineas: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    const porY = new Map<number, string[]>();
    for (const it of c.items as { str: string; transform: number[] }[]) {
      const y = Math.round(it.transform[5]);
      porY.set(y, [...(porY.get(y) ?? []), it.str]);
    }
    lineas.push(...[...porY.values()].map((p) => p.join(" ")));
  }
  return lineas.join("\n");
}

function MiHistorial() {
  const [obligaciones, setObligaciones] = useState<Obligacion[] | null>(null);
  const [ingreso, setIngreso] = useState(3_000_000);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [arrastrando, setArrastrando] = useState(false);

  const procesar = async (file: File) => {
    setCargando(true);
    setAviso("");
    try {
      const texto = file.type === "application/pdf" ? await leerPdf(file) : await file.text();
      const o = extraerObligaciones(texto);
      if (o.length === 0) setAviso("No encontramos deudas con montos en ese archivo. Prueba con el reporte de ejemplo.");
      setObligaciones(o);
    } catch {
      setAviso("No pudimos leer el archivo. Asegúrate de que sea un PDF con texto (no una foto).");
    } finally {
      setCargando(false);
    }
  };

  const d = obligaciones ? diagnosticar(obligaciones, ingreso) : null;
  const color = d?.nivel === "Excelente" ? "text-ok" : d?.nivel === "Aceptable" ? "text-warn" : "text-bad";
  const angulo = d ? ((d.puntaje - 300) / 550) * 180 : 0;

  return (
    <AppShell>
      <header className="relative overflow-hidden rounded-xl bg-ink p-6 text-paper sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider">
          <Sparkles className="size-3.5" /> Diagnóstico privado
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold sm:text-4xl">Entiende tu historial de crédito en segundos</h1>
        <p className="mt-3 max-w-2xl text-sm text-paper/75 sm:text-base">
          Descarga gratis tu reporte en Midatacrédito o el extracto de tu banco, súbelo aquí y te
          decimos cómo estás y qué hacer para mejorar.
        </p>
        <p className="mt-4 inline-flex items-center gap-2 font-mono text-xs text-paper/70">
          <Lock className="size-3.5" /> Tu archivo se lee solo en tu dispositivo. No lo guardamos.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <label
          onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => { e.preventDefault(); setArrastrando(false); const f = e.dataTransfer.files[0]; if (f) procesar(f); }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition ${
            arrastrando ? "border-accent bg-accent/5" : "border-line bg-card hover:border-accent"
          }`}
        >
          <FileUp className="size-9 text-accent" />
          <span className="font-display font-bold">{cargando ? "Leyendo tu archivo…" : "Arrastra tu PDF o toca para elegirlo"}</span>
          <span className="text-xs text-ink-soft">Reporte de Midatacrédito, TransUnion o extracto bancario</span>
          <input type="file" accept=".pdf,.txt" className="sr-only" onChange={(e) => e.target.files?.[0] && procesar(e.target.files[0])} />
        </label>
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-card p-5">
          <label className="text-xs font-semibold">
            ¿Cuánto te entra al mes?
            <input
              type="number"
              value={ingreso}
              onChange={(e) => setIngreso(Number(e.target.value))}
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 font-mono text-sm outline-none focus:border-accent"
            />
          </label>
          <button
            onClick={() => { setAviso(""); setObligaciones(extraerObligaciones(REPORTE_EJEMPLO)); }}
            className="h-11 rounded-md bg-accent font-bold text-accent-foreground"
          >
            Ver reporte de ejemplo
          </button>
        </div>
      </section>

      {aviso && <p className="rounded-lg border border-line bg-card p-4 text-sm">{aviso}</p>}

      {d && obligaciones && obligaciones.length > 0 && (
        <>
          <section className="grid gap-4 md:grid-cols-[300px_1fr]">
            <article className="settle-in rounded-xl border border-line bg-card p-6 text-center">
              <p className="font-mono text-xs uppercase text-ink-soft">Tu puntaje estimado</p>
              <svg viewBox="0 0 200 110" className="mx-auto mt-3 w-full max-w-[220px]">
                <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--line)" strokeWidth="14" strokeLinecap="round" />
                <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round"
                  className={`${color} transition-all duration-1000`} pathLength={180} strokeDasharray={`${angulo} 180`} />
              </svg>
              <p className={`-mt-10 font-display text-4xl font-bold ${color}`}>{d.puntaje}</p>
              <p className={`mt-1 font-bold ${color}`}>{d.nivel}</p>
              <p className="mt-2 text-[11px] text-ink-soft">Escala 300–850. Es una estimación, no tu puntaje oficial.</p>
            </article>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Lo que debes", formatoCOP(d.totalDeuda)],
                ["Pagas al mes", formatoCOP(d.totalCuotas)],
                ["De tu ingreso", `${Math.round(d.porcentajeIngreso * 100)}%`],
              ].map(([k, v]) => (
                <article key={k} className="rounded-xl border border-line bg-card p-5">
                  <p className="text-xs text-ink-soft">{k}</p>
                  <p className="mt-2 font-display text-xl font-bold">{v}</p>
                </article>
              ))}
              <article className="rounded-xl border border-line bg-card p-5 sm:col-span-3">
                <h2 className="font-display font-bold">Tus deudas</h2>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {obligaciones.map((o, i) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="min-w-0"><b>{o.entidad}</b> <span className="text-ink-soft">· {o.tipo}</span></span>
                      <span className="font-mono text-xs">{formatoCOP(o.cuota)}/mes</span>
                      <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${o.diasMora ? "bg-bad/15 text-bad" : "bg-ok/15 text-ok"}`}>
                        {o.diasMora ? `${o.diasMora} días en mora` : "Al día"}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-card p-6">
            <h2 className="font-display text-lg font-bold">Tu plan para mejorar</h2>
            <ol className="mt-4 space-y-3">
              {d.acciones.map((a, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-accent-foreground">{i + 1}</span>
                  <span className="pt-1">{a}</span>
                </li>
              ))}
            </ol>
            <Link to="/" className="mt-5 inline-block font-bold text-accent">Simular un crédito con estos datos →</Link>
          </section>
        </>
      )}

      <p className="flex gap-2 text-xs text-ink-soft">
        <ShieldCheck className="size-4 shrink-0" />
        Por la Ley de Hábeas Data (1266 de 2008), nadie puede consultar tu historial sin tu permiso.
        Por eso CUENTACLARA no busca datos de otras personas: solo analiza el reporte que tú mismo descargas gratis.
      </p>
    </AppShell>
  );
}
