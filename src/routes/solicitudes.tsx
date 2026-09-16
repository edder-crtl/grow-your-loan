import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ESTADO_CLASES, formatoCOP, formatoPct, type EstadoSolicitud } from "@/lib/finanzas";

export const Route = createFileRoute("/solicitudes")({
  head: () => ({
    meta: [
      { title: "Expedientes de solicitudes — CuentaClara" },
      {
        name: "description",
        content:
          "Historial de simulaciones y solicitudes con estados Borrador, En Revisión, Aprobada y Rechazada, y su tabla de amortización.",
      },
      { property: "og:title", content: "Expedientes de solicitudes — CuentaClara" },
      {
        property: "og:description",
        content: "Consulta, cambia el estado y revisa las cuotas de cada solicitud guardada.",
      },
    ],
  }),
  component: Solicitudes,
});

interface Solicitud {
  id: string;
  producto_nombre: string;
  monto: number;
  plazo_meses: number;
  tasa_mensual: number;
  cuota_mensual: number;
  total_pagar: number;
  total_intereses: number;
  estado: EstadoSolicitud;
  created_at: string;
}

const ESTADOS: EstadoSolicitud[] = ["Borrador", "En Revisión", "Aprobada", "Rechazada"];

function Solicitudes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [abierta, setAbierta] = useState<string | null>(null);

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ["solicitudes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitudes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Solicitud[];
    },
  });

  const { data: cuotas = [] } = useQuery({
    queryKey: ["amortizacion", abierta],
    enabled: !!abierta,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("amortizaciones")
        .select("numero_cuota, fecha_vencimiento, cuota, capital, interes, saldo")
        .eq("solicitud_id", abierta!)
        .order("numero_cuota");
      if (error) throw error;
      return data ?? [];
    },
  });

  const cambiarEstado = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoSolicitud }) => {
      const { error } = await supabase.from("solicitudes").update({ estado }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["solicitudes"] });
    },
    onError: () => toast.error("No se pudo actualizar el estado"),
  });

  const eliminar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("solicitudes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitud eliminada");
      qc.invalidateQueries({ queryKey: ["solicitudes"] });
    },
  });

  return (
    <AppShell>
      <h1 className="font-display text-xl font-extrabold tracking-tight">Solicitudes</h1>
      <p className="-mt-3 text-xs text-ink-soft">
        Expediente de cada simulación con su estado y su tabla de cuotas.
      </p>

      {!user && (
        <div className="rounded-2xl border border-line bg-card p-5 text-sm">
          Entra a tu cuenta para ver tus solicitudes guardadas.{" "}
          <Link to="/auth" className="font-bold text-accent">
            Entrar
          </Link>
        </div>
      )}

      {user && isLoading && <p className="font-mono text-xs text-ink-soft">Cargando…</p>}

      {user && !isLoading && solicitudes.length === 0 && (
        <div className="rounded-2xl border border-line bg-card p-5 text-sm">
          Todavía no guardas ninguna simulación.{" "}
          <Link to="/" className="font-bold text-accent">
            Simular un crédito
          </Link>
        </div>
      )}

      {solicitudes.map((s) => (
        <section key={s.id} className="rise-in rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-3 p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink">
              <span className="font-mono text-xs font-bold text-paper">
                {s.producto_nombre.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{s.producto_nombre}</p>
              <p className="font-mono text-[11px] text-ink-soft">
                {new Date(s.created_at).toLocaleDateString("es-CO")} ·{" "}
                {formatoCOP(Number(s.monto))} · {s.plazo_meses} meses
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${ESTADO_CLASES[s.estado]}`}
            >
              {s.estado}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-line px-4 py-3 font-mono text-xs">
            <div>
              <p className="text-[9px] uppercase text-ink-soft">Cuota</p>
              <p className="font-bold">{formatoCOP(Number(s.cuota_mensual), false)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-ink-soft">Total</p>
              <p className="font-bold">{formatoCOP(Number(s.total_pagar), false)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-ink-soft">Tasa m.</p>
              <p className="font-bold text-accent">{formatoPct(Number(s.tasa_mensual), 2)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 border-t border-line px-4 py-3">
            {ESTADOS.map((e) => (
              <button
                key={e}
                onClick={() => cambiarEstado.mutate({ id: s.id, estado: e })}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  s.estado === e ? "bg-ink text-paper" : "border border-line text-ink-soft"
                }`}
              >
                {e}
              </button>
            ))}
            <button
              onClick={() => setAbierta(abierta === s.id ? null : s.id)}
              className="ml-auto font-mono text-[11px] font-bold text-accent"
            >
              {abierta === s.id ? "Ocultar cuotas" : "Ver cuotas"}
            </button>
            <button
              onClick={() => eliminar.mutate(s.id)}
              className="font-mono text-[11px] font-bold text-bad"
            >
              Eliminar
            </button>
          </div>

          {abierta === s.id && (
            <div className="border-t border-line">
              <div className="grid grid-cols-4 bg-ink font-mono text-[10px] uppercase tracking-wide text-paper">
                <div className="px-3 py-2">Cuota</div>
                <div className="px-2 py-2 text-right">Valor</div>
                <div className="px-2 py-2 text-right">Capit.</div>
                <div className="px-3 py-2 text-right">Saldo</div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {cuotas.map((c) => (
                  <div
                    key={c.numero_cuota}
                    className="grid grid-cols-4 border-b border-line py-2 font-mono text-xs"
                  >
                    <div className="px-3">{c.numero_cuota}</div>
                    <div className="px-2 text-right font-bold">
                      {formatoCOP(Number(c.cuota), false)}
                    </div>
                    <div className="px-2 text-right text-ink-soft">
                      {formatoCOP(Number(c.capital), false)}
                    </div>
                    <div className="px-3 text-right text-accent">
                      {formatoCOP(Number(c.saldo), false)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}
    </AppShell>
  );
}
