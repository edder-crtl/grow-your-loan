import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  formatoCOP,
  formatoPct,
  planRefinanciacion,
  simular,
} from "@/lib/finanzas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CuentaClara — Simulador de crédito para pymes en Colombia" },
      {
        name: "description",
        content:
          "Simula tu crédito en pesos: cuota mensual, tasa efectiva, tabla de amortización y capacidad de pago real para negocios colombianos.",
      },
      { property: "og:title", content: "CuentaClara — Simulador de crédito para pymes" },
      {
        property: "og:description",
        content:
          "Motor de cálculo con amortización cuota a cuota, cartera por edades y planes de refinanciación.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Simulador,
});

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_tasa: string;
  tasa_mensual: number;
  tasa_mora_mensual: number;
  plazo_min: number;
  plazo_max: number;
  monto_min: number;
  monto_max: number;
  comision_apertura_pct: number;
}

function Simulador() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [productoId, setProductoId] = useState<string | null>(null);
  const [monto, setMonto] = useState(8000000);
  const [plazo, setPlazo] = useState(24);
  const [ingresos, setIngresos] = useState(4200000);
  const [gastos, setGastos] = useState(1850000);
  const [deuda, setDeuda] = useState(350000);
  const [guardando, setGuardando] = useState(false);

  const { data: productos = [] } = useQuery({
    queryKey: ["productos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos_financieros")
        .select("*")
        .order("tasa_mensual");
      if (error) throw error;
      return data as Producto[];
    },
  });

  const producto = productos.find((p) => p.id === productoId) ?? productos[0];

  const resultado = useMemo(
    () =>
      simular({
        monto,
        plazo,
        tasaMensual: Number(producto?.tasa_mensual ?? 0.0215),
        comisionPct: Number(producto?.comision_apertura_pct ?? 0.02),
        ingresos,
        gastos,
        deudaActual: deuda,
      }),
    [monto, plazo, producto, ingresos, gastos, deuda],
  );

  const refi = planRefinanciacion(
    monto,
    Number(producto?.tasa_mensual ?? 0.0215),
    resultado.capacidadPago,
    producto?.plazo_max ?? 72,
  );

  async function guardar(estado: "Borrador" | "En Revisión") {
    if (!user) {
      toast.error("Inicia sesión para guardar tu simulación");
      navigate({ to: "/auth" });
      return;
    }
    setGuardando(true);
    const { data, error } = await supabase
      .from("solicitudes")
      .insert({
        user_id: user.id,
        producto_id: producto?.id ?? null,
        producto_nombre: producto?.nombre ?? "Crédito",
        monto,
        plazo_meses: plazo,
        tasa_mensual: Number(producto?.tasa_mensual ?? 0.0215),
        cuota_mensual: Math.round(resultado.cuotaMensual),
        total_pagar: Math.round(resultado.totalPagar),
        total_intereses: Math.round(resultado.totalIntereses),
        comision_apertura: Math.round(resultado.comisionApertura),
        estado,
      })
      .select("id")
      .single();

    if (error || !data) {
      setGuardando(false);
      toast.error("No se pudo guardar la solicitud");
      return;
    }

    const filas = resultado.tabla.map((f) => ({
      solicitud_id: data.id,
      user_id: user.id,
      numero_cuota: f.numero,
      fecha_vencimiento: f.fecha.toISOString().slice(0, 10),
      cuota: Math.round(f.cuota),
      capital: Math.round(f.capital),
      interes: Math.round(f.interes),
      saldo: Math.round(f.saldo),
    }));
    const { error: errorTabla } = await supabase.from("amortizaciones").insert(filas);
    setGuardando(false);

    if (errorTabla) {
      toast.error("La solicitud se guardó, pero la tabla de cuotas falló");
      return;
    }
    toast.success(`Solicitud registrada como ${estado}`);
    navigate({ to: "/solicitudes" });
  }

  return (
    <AppShell>
      <header>
        <p className="mb-2 text-sm text-ink-soft">Herramientas / Simulador</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Simula tu crédito</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">Compara el valor de la cuota con la capacidad real de pago de tu negocio.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(19rem,0.78fr)_minmax(0,1.35fr)]">
        <div className="space-y-5 lg:sticky lg:top-10">
          <section className="border border-line bg-card p-5 sm:p-6">
            <p className="font-mono text-[11px] font-semibold uppercase text-ink-soft">Producto financiero</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {productos.map((p) => {
            const activo = p.id === producto?.id;
            return (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                onClick={() => {
                  setProductoId(p.id);
                  setPlazo(Math.min(Math.max(plazo, p.plazo_min), p.plazo_max));
                  setMonto(Math.min(Math.max(monto, Number(p.monto_min)), Number(p.monto_max)));
                }}
                className={`h-auto w-full justify-start whitespace-normal rounded-md px-3 py-3 text-left shadow-none ${activo ? "border-ink bg-ink text-paper hover:bg-ink/90 hover:text-paper" : "border-line bg-card text-ink hover:bg-muted"}`}
              >
                <span className="min-w-0"><span className="block text-sm font-semibold">{p.nombre}</span>
                <span className="mt-1 block font-mono text-[10px] opacity-70">
                  {formatoPct(Number(p.tasa_mensual), 2)} m. · {p.plazo_min}-{p.plazo_max} meses
                </span></span>
              </Button>
            );
          })}
            </div>
          {producto && <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-ink-soft">
            {producto.descripcion} Comisión de apertura{" "}
            {formatoPct(Number(producto.comision_apertura_pct), 1)} · tasa {producto.tipo_tasa}.
          </p>}
          </section>

          <section className="border border-line bg-card p-5 sm:p-6">
            <p className="mb-5 font-mono text-[11px] font-semibold uppercase text-ink-soft">Datos de la simulación</p>
            <div className="space-y-4">
          <Campo
            etiqueta="Monto solicitado"
            valor={monto}
            onChange={setMonto}
            min={Number(producto?.monto_min ?? 300000)}
            max={Number(producto?.monto_max ?? 150000000)}
            prefijo="$"
          />
          <Campo
            etiqueta="Plazo"
            valor={plazo}
            onChange={setPlazo}
            min={producto?.plazo_min ?? 6}
            max={producto?.plazo_max ?? 72}
            sufijo="meses"
          />
          <Campo etiqueta="Ingresos / mes" valor={ingresos} onChange={setIngresos} prefijo="$" />
          <Campo etiqueta="Gastos / mes" valor={gastos} onChange={setGastos} prefijo="$" />
          <Campo etiqueta="Deudas / mes" valor={deuda} onChange={setDeuda} prefijo="$" />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="settle-in bg-ink p-6 text-paper sm:p-8">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <p className="font-mono text-[11px] font-semibold uppercase text-paper/55">Resultado estimado</p>
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${resultado.viable ? "bg-ok/20 text-ok" : "bg-bad/20 text-bad"}`}>{resultado.viable ? "Viable" : "Riesgo alto"}</span>
            </div>
            <div className="mt-10">
              <p className="text-sm text-paper/55">Cuota mensual</p>
              <p className="mt-2 break-words font-display text-3xl font-bold sm:text-5xl">{formatoCOP(resultado.cuotaMensual)}</p>
              <p className="mt-3 text-sm text-paper/65">Tasa efectiva anual {formatoPct(resultado.tasaEfectivaAnual)}</p>
            </div>
            <dl className="mt-10 divide-y divide-paper/10 border-y border-paper/10">
              <ResultadoFila etiqueta="Total a pagar" valor={formatoCOP(resultado.totalPagar)} />
              <ResultadoFila etiqueta="Intereses" valor={formatoCOP(resultado.totalIntereses)} acento />
              <ResultadoFila etiqueta="Costo total anual" valor={formatoPct(resultado.costoTotalAnual)} />
              <ResultadoFila etiqueta="Comisión de apertura" valor={formatoCOP(resultado.comisionApertura)} />
            </dl>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button disabled={guardando} onClick={() => guardar("En Revisión")} className="h-12 bg-paper font-semibold text-ink hover:bg-paper/90">Solicitar crédito</Button>
              <Button disabled={guardando} onClick={() => guardar("Borrador")} variant="outline" className="h-12 border-paper/25 bg-transparent text-paper hover:bg-paper/10 hover:text-paper">Guardar borrador</Button>
            </div>
          </section>

          <section className="grid gap-4 border border-line bg-card p-5 sm:grid-cols-2 sm:p-6">
            <div><p className="text-sm text-ink-soft">Capacidad de pago</p><p className="mt-1 font-mono text-xl font-bold">{formatoCOP(resultado.capacidadPago)}</p></div>
            <div><p className="text-sm text-ink-soft">Cuota sobre ingresos</p><p className={`mt-1 font-mono text-xl font-bold ${resultado.relacionCuotaIngreso <= 0.4 ? "text-ok" : "text-bad"}`}>{formatoPct(resultado.relacionCuotaIngreso)}</p></div>
          </section>

      {/* Refinanciación */}
      {!resultado.viable && (
        <section className="rise-in border-l-4 border-accent bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Plan de refinanciación sugerido
          </p>
          <p className="mt-2 text-sm">
            Con tu capacidad de pago actual, la cuota cabe a{" "}
            <span className="font-mono font-bold">{refi.plazo} meses</span> por{" "}
            <span className="font-mono font-bold">{formatoCOP(refi.cuota)}</span> al mes.
          </p>
          <Button
            onClick={() => setPlazo(Math.min(refi.plazo, producto?.plazo_max ?? 72))}
            className="mt-4"
          >
            Aplicar plan
          </Button>
          {!refi.viable && (
            <p className="mt-2 text-xs text-bad">
              Ni con el plazo máximo la cuota entra en tu capacidad: reduce el monto.
            </p>
          )}
        </section>
      )}

      {/* Amortización */}
          <section className="rise-in">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Amortización
          </p>
          <span className="font-mono text-[10px] text-ink-soft">{plazo} cuotas</span>
        </div>
        <div className="overflow-x-auto border border-line bg-card">
          <div className="grid min-w-[34rem] grid-cols-4 bg-muted font-mono text-[10px] font-semibold uppercase text-ink-soft">
            <div className="px-3 py-2 text-left">Cuota</div>
            <div className="px-2 py-2 text-right">Cuota</div>
            <div className="px-2 py-2 text-right">Capit.</div>
            <div className="px-3 py-2 text-right">Int.</div>
          </div>
          <div className="max-h-80 min-w-[34rem] overflow-y-auto">
            {resultado.tabla.map((f) => (
              <div
                key={f.numero}
                className="grid grid-cols-4 border-b border-line py-2.5 font-mono text-xs"
              >
                <div className="px-3 text-left">{f.numero}</div>
                <div className="px-2 text-right font-bold">{formatoCOP(f.cuota, false)}</div>
                <div className="px-2 text-right text-ink-soft">{formatoCOP(f.capital, false)}</div>
                <div className="px-3 text-right text-accent">{formatoCOP(f.interes, false)}</div>
              </div>
            ))}
          </div>
        </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function ResultadoFila({ etiqueta, valor, acento = false }: { etiqueta: string; valor: string; acento?: boolean }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4"><dt className="text-sm text-paper/55">{etiqueta}</dt><dd className={`text-right font-mono text-sm font-semibold ${acento ? "text-ok" : "text-paper"}`}>{valor}</dd></div>;
}

function Campo({
  etiqueta,
  valor,
  onChange,
  min,
  max,
  prefijo,
  sufijo,
}: {
  etiqueta: string;
  valor: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  prefijo?: string;
  sufijo?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold">{etiqueta}</span>
      <div className="mt-1.5 flex h-11 items-center rounded-md border border-line bg-paper px-3 focus-within:border-accent">
        {prefijo && <span className="font-mono text-sm text-ink-soft">{prefijo}</span>}
        <input
          type="number"
          value={valor}
          min={min}
          max={max}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange(Number.isFinite(v) ? v : 0);
          }}
          onBlur={(e) => {
            let v = Number(e.target.value) || 0;
            if (min !== undefined) v = Math.max(v, min);
            if (max !== undefined) v = Math.min(v, max);
            onChange(v);
          }}
          className="ml-1 w-full min-w-0 bg-transparent font-mono text-base font-bold outline-none"
        />
        {sufijo && <span className="text-[10px] text-ink-soft">{sufijo}</span>}
      </div>
    </label>
  );
}
