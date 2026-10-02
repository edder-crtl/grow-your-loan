import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, BadgeDollarSign, CalendarCheck, Landmark, PiggyBank, ReceiptText, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/consejos")({
  head: () => ({
    meta: [
      { title: "Consejos para cuidar tu dinero — CUENTACLARA" },
      {
        name: "description",
        content: "Consejos sencillos para organizar tus gastos, ahorrar, comparar créditos y evitar el sobreendeudamiento en Colombia.",
      },
      { property: "og:title", content: "Consejos para cuidar tu dinero — CUENTACLARA" },
      {
        property: "og:description",
        content: "Hábitos prácticos para tomar mejores decisiones con tu dinero y tus créditos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Consejos,
});

const consejos = [
  {
    icon: ReceiptText,
    numero: "01",
    titulo: "Anota lo que entra y lo que sale",
    detalle: "Durante un mes registra ingresos, arriendo, mercado, transporte, servicios y cuotas. Lo pequeño también cuenta.",
    accion: "Al final del mes identifica un gasto que puedas reducir sin afectar tu bienestar.",
  },
  {
    icon: PiggyBank,
    numero: "02",
    titulo: "Ahorra antes de gastar",
    detalle: "Separa una parte apenas recibas dinero. Empezar con 5% de tus ingresos es mejor que esperar a que sobre.",
    accion: "Usa una cuenta o bolsillo separado para no mezclar el ahorro con los gastos diarios.",
  },
  {
    icon: ShieldCheck,
    numero: "03",
    titulo: "Construye un fondo para emergencias",
    detalle: "Tu primera meta puede ser cubrir un mes de gastos básicos. Con el tiempo busca llegar a tres meses.",
    accion: "Úsalo solo para situaciones inesperadas, no para compras planeadas.",
  },
  {
    icon: BadgeDollarSign,
    numero: "04",
    titulo: "Mira el costo completo del crédito",
    detalle: "Una cuota baja no siempre significa un crédito barato. Revisa intereses, seguros, comisiones y cuánto pagarás en total.",
    accion: "Compara al menos dos opciones con el mismo monto y el mismo plazo.",
  },
  {
    icon: CalendarCheck,
    numero: "05",
    titulo: "Paga antes de la fecha límite",
    detalle: "La mora trae cobros adicionales y puede afectar tu historial. Programa recordatorios o pagos automáticos.",
    accion: "Si prevés que no podrás pagar, habla con la entidad antes de atrasarte.",
  },
  {
    icon: Landmark,
    numero: "06",
    titulo: "No uses una deuda para tapar otra",
    detalle: "Solo vale la pena reunir deudas si la nueva opción cuesta menos y la cuota realmente cabe en tu presupuesto.",
    accion: "Evita aumentar nuevamente el cupo de las deudas que acabas de pagar.",
  },
] as const;

function Consejos() {
  return (
    <AppShell>
      <header>
        <p className="mb-2 text-sm text-ink-soft">Aprende / Consejos</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Pequeñas decisiones, finanzas más tranquilas</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">No necesitas ser experto. Estos hábitos te ayudan a tener más control sobre tu dinero y a usar el crédito con cuidado.</p>
      </header>

      <section className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 xl:grid-cols-3" aria-label="Consejos financieros">
        {consejos.map(({ icon: Icon, numero, titulo, detalle, accion }) => (
          <article key={numero} className="min-w-0 bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="grid size-10 place-items-center rounded-md bg-muted text-accent-2"><Icon className="size-5" aria-hidden="true" /></span>
              <span className="font-mono text-xs font-semibold text-ink-soft">{numero}</span>
            </div>
            <h2 className="mt-6 font-display text-lg font-bold">{titulo}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{detalle}</p>
            <p className="mt-5 border-l-2 border-accent pl-3 text-sm font-medium leading-relaxed">{accion}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 bg-ink p-6 text-paper sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-accent"><AlertTriangle className="size-5" aria-hidden="true" /><span className="font-mono text-xs font-semibold uppercase">Antes de endeudarte</span></div>
          <h2 className="mt-3 font-display text-xl font-bold sm:text-2xl">Haz la prueba con tus números reales</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-paper/65">Una simulación te permite anticipar la cuota y ver cuánto dinero quedaría para vivir y afrontar imprevistos.</p>
        </div>
        <Button asChild className="h-11 bg-paper text-ink hover:bg-paper/90">
          <Link to="/">Simular ahora <ArrowRight aria-hidden="true" /></Link>
        </Button>
      </section>

      <p className="text-xs leading-relaxed text-ink-soft">Contenido educativo general. No reemplaza la asesoría personalizada de una entidad vigilada o un profesional financiero.</p>
    </AppShell>
  );
}