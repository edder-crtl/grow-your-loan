import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
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

  const anguloDial = Math.min(Math.max(resultado.relacionCuotaIngreso / 0.6, 0), 1) * 300;

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
      <h1 className="sr-only">Simulador de crédito para pequeños negocios en Colombia</h1>

      {/* Resultado */}
      <section className="settle-in rounded-2xl bg-ink p-5 text-paper">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">
            Resultado en tiempo real
          </p>
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide ${
              resultado.viable ? "bg-ok/20 text-ok" : "bg-bad/20 text-bad"
            }`}
          >
            {resultado.viable ? "Viable" : "Riesgo alto"}
          </span>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50">
              Cuota mensual
            </p>
            <p className="mt-1 font-display text-4xl font-black leading-none tracking-tight">
              <span className="text-accent">$</span>
              {formatoCOP(resultado.cuotaMensual, false)}
            </p>
          </div>
          <div className="relative size-24 shrink-0">
            <div
              className="dial absolute inset-0 rounded-full"
              style={{ "--dial-angle": `${anguloDial}deg` } as React.CSSProperties}
            />
            <div className="absolute inset-[10px] grid place-items-center rounded-full bg-ink">
              <div className="text-center">
                <p className="font-mono text-[8px] uppercase tracking-widest text-paper/50">
                  Tasa Efectiva
                </p>
                <p className="font-display text-lg font-bold leading-none">
                  {formatoPct(resultado.tasaEfectivaAnual)}
                </p>
              </div>
            </div>
            <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-paper/10 p-3">
            <p className="font-mono text-[9px] uppercase tracking-wide text-paper/50">CAT</p>
            <p className="mt-0.5 font-display text-[15px] font-bold leading-tight break-all">
              {formatoPct(resultado.costoTotalAnual)}
            </p>
          </div>
          <div className="rounded-xl bg-paper/10 p-3">
            <p className="font-mono text-[9px] uppercase tracking-wide text-paper/50">
              Total a pagar
            </p>
            <p className="mt-0.5 font-display text-[15px] font-bold leading-tight break-all">
              {formatoCOP(resultado.totalPagar)}
            </p>
          </div>
          <div className="rounded-xl bg-accent p-3">
            <p className="font-mono text-[9px] uppercase tracking-wide text-paper/70">Intereses</p>
            <p className="mt-0.5 font-display text-[15px] font-bold leading-tight break-all">
              {formatoCOP(resultado.totalIntereses)}
            </p>
          </div>
        </div>
      </section>

      {/* Producto */}
      <section className="rise-in rounded-2xl border border-line bg-card p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
          Producto financiero
        </p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {productos.map((p) => {
            const activo = p.id === producto?.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setProductoId(p.id);
                  setPlazo(Math.min(Math.max(plazo, p.plazo_min), p.plazo_max));
                  setMonto(Math.min(Math.max(monto, Number(p.monto_min)), Number(p.monto_max)));
                }}
                className={`shrink-0 rounded-xl border px-3 py-2 text-left ${
                  activo ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink"
                }`}
              >
                <span className="block text-xs font-semibold">{p.nombre}</span>
                <span className="block font-mono text-[10px] opacity-70">
                  {formatoPct(Number(p.tasa_mensual), 2)} m. · {p.plazo_min}-{p.plazo_max} meses
                </span>
              </button>
            );
          })}
        </div>
        {producto && (
          <p className="mt-2 text-xs text-ink-soft">
            {producto.descripcion} Comisión de apertura{" "}
            {formatoPct(Number(producto.comision_apertura_pct), 1)} · tasa {producto.tipo_tasa}.
          </p>
        )}
      </section>

      {/* Split: entradas + resumen */}
      <section className="rise-in grid grid-cols-2 items-start gap-3">
        <div className="space-y-3">
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Simulación
          </p>
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

        <div className="space-y-3 rounded-2xl border border-line bg-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">Resumen</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">Capacidad de pago</span>
            <span className="font-mono text-sm font-bold">
              {formatoCOP(resultado.capacidadPago, false)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full bg-accent"
              style={{
                width: `${Math.min(
                  (resultado.cuotaMensual / Math.max(resultado.capacidadPago, 1)) * 100,
                  100,
                )}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">Cuota / ingreso</span>
            <span
              className={`font-mono text-sm font-bold ${
                resultado.relacionCuotaIngreso <= 0.4 ? "text-ok" : "text-bad"
              }`}
            >
              {formatoPct(resultado.relacionCuotaIngreso)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full ${resultado.relacionCuotaIngreso <= 0.4 ? "bg-ok" : "bg-bad"}`}
              style={{ width: `${Math.min(resultado.relacionCuotaIngreso * 100, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between border-t border-line pt-1">
            <span className="text-xs font-semibold">Comisión apertura</span>
            <span className="font-mono text-sm font-bold">
              {formatoCOP(resultado.comisionApertura, false)}
            </span>
          </div>
          <button
            disabled={guardando}
            onClick={() => guardar("En Revisión")}
            className="mt-1 w-full rounded-xl bg-accent py-3 text-sm font-bold text-paper disabled:opacity-60"
          >
            Solicitar crédito
          </button>
          <button
            disabled={guardando}
            onClick={() => guardar("Borrador")}
            className="w-full rounded-xl border border-line py-2 text-xs font-semibold text-ink-soft disabled:opacity-60"
          >
            Guardar borrador
          </button>
        </div>
      </section>

      {/* Refinanciación */}
      {!resultado.viable && (
        <section className="rise-in rounded-2xl border border-accent/40 bg-accent/8 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Plan de refinanciación sugerido
          </p>
          <p className="mt-2 text-sm">
            Con tu capacidad de pago actual, la cuota cabe a{" "}
            <span className="font-mono font-bold">{refi.plazo} meses</span> por{" "}
            <span className="font-mono font-bold">{formatoCOP(refi.cuota)}</span> al mes.
          </p>
          <button
            onClick={() => setPlazo(Math.min(refi.plazo, producto?.plazo_max ?? 72))}
            className="mt-3 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-paper"
          >
            Aplicar plan
          </button>
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
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          <div className="grid grid-cols-4 bg-ink font-mono text-[10px] uppercase tracking-wide text-paper">
            <div className="px-3 py-2 text-left">Cuota</div>
            <div className="px-2 py-2 text-right">Cuota</div>
            <div className="px-2 py-2 text-right">Capit.</div>
            <div className="px-3 py-2 text-right">Int.</div>
          </div>
          <div className="max-h-72 overflow-y-auto">
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
    </AppShell>
  );
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
      <div className="mt-1 flex items-center rounded-xl border border-line bg-card px-3 py-2">
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
