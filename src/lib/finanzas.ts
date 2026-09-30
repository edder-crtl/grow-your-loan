export type EstadoSolicitud = "Borrador" | "En Revisión" | "Aprobada" | "Rechazada";

export interface CuotaAmortizacion {
  numero: number;
  fecha: Date;
  cuota: number;
  capital: number;
  interes: number;
  saldo: number;
}

export interface ResultadoSimulacion {
  cuotaMensual: number;
  totalPagar: number;
  totalIntereses: number;
  comisionApertura: number;
  tasaEfectivaAnual: number;
  costoTotalAnual: number;
  capacidadPago: number;
  relacionCuotaIngreso: number;
  viable: boolean;
  tabla: CuotaAmortizacion[];
}

export type NivelConsejo = "positivo" | "precaucion" | "alerta";

export interface RecomendacionSimulacion {
  nivel: NivelConsejo;
  titulo: string;
  detalle: string;
}

export const formatoCOP = (valor: number, conSimbolo = true) =>
  new Intl.NumberFormat("es-CO", {
    style: conSimbolo ? "currency" : "decimal",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(valor || 0));

export const formatoPct = (valor: number, decimales = 1) =>
  `${(valor * 100).toLocaleString("es-CO", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}%`;

/** Cuota fija por sistema francés. */
export function cuotaFrancesa(monto: number, tasaMensual: number, plazo: number) {
  if (plazo <= 0) return 0;
  if (tasaMensual <= 0) return monto / plazo;
  const factor = Math.pow(1 + tasaMensual, plazo);
  return (monto * tasaMensual * factor) / (factor - 1);
}

export function generarTabla(
  monto: number,
  tasaMensual: number,
  plazo: number,
  desembolso: Date = new Date(),
): CuotaAmortizacion[] {
  const cuota = cuotaFrancesa(monto, tasaMensual, plazo);
  let saldo = monto;
  const filas: CuotaAmortizacion[] = [];
  for (let i = 1; i <= plazo; i++) {
    const interes = saldo * tasaMensual;
    const capital = Math.min(cuota - interes, saldo);
    saldo = Math.max(saldo - capital, 0);
    const fecha = new Date(desembolso);
    fecha.setMonth(fecha.getMonth() + i);
    filas.push({ numero: i, fecha, cuota: capital + interes, capital, interes, saldo });
  }
  return filas;
}

export interface EntradaSimulacion {
  monto: number;
  plazo: number;
  tasaMensual: number;
  comisionPct: number;
  ingresos: number;
  gastos: number;
  deudaActual: number;
}

export function simular(entrada: EntradaSimulacion): ResultadoSimulacion {
  const { monto, plazo, tasaMensual, comisionPct, ingresos, gastos, deudaActual } = entrada;
  const tabla = generarTabla(monto, tasaMensual, plazo);
  const cuotaMensual = tabla[0]?.cuota ?? 0;
  const totalPagar = tabla.reduce((acc, f) => acc + f.cuota, 0);
  const totalIntereses = tabla.reduce((acc, f) => acc + f.interes, 0);
  const comisionApertura = monto * comisionPct;
  const tasaEfectivaAnual = Math.pow(1 + tasaMensual, 12) - 1;
  const costoTotalAnual =
    monto > 0 && plazo > 0
      ? Math.pow(1 + (totalIntereses + comisionApertura) / monto, 12 / plazo) - 1
      : 0;
  const capacidadPago = Math.max(ingresos - gastos - deudaActual, 0);
  const relacionCuotaIngreso = ingresos > 0 ? cuotaMensual / ingresos : 1;

  return {
    cuotaMensual,
    totalPagar,
    totalIntereses,
    comisionApertura,
    tasaEfectivaAnual,
    costoTotalAnual,
    capacidadPago,
    relacionCuotaIngreso,
    viable: cuotaMensual > 0 && cuotaMensual <= capacidadPago && relacionCuotaIngreso <= 0.4,
    tabla,
  };
}

/** Orientación sencilla derivada de la simulación; no reemplaza asesoría financiera. */
export function recomendarSimulacion(
  entrada: EntradaSimulacion,
  resultado: ResultadoSimulacion,
): RecomendacionSimulacion[] {
  const recomendaciones: RecomendacionSimulacion[] = [];
  const dineroLibre = Math.max(entrada.ingresos - entrada.gastos - entrada.deudaActual, 0);
  const restanteDespuesCuota = dineroLibre - resultado.cuotaMensual;
  const proporcionIntereses = entrada.monto > 0 ? resultado.totalIntereses / entrada.monto : 0;

  if (resultado.relacionCuotaIngreso <= 0.25 && resultado.cuotaMensual <= dineroLibre) {
    recomendaciones.push({
      nivel: "positivo",
      titulo: "La cuota se ve manejable",
      detalle: "Usaría una parte moderada de tus ingresos. Aun así, deja espacio para imprevistos antes de solicitar.",
    });
  } else if (resultado.relacionCuotaIngreso <= 0.4 && resultado.cuotaMensual <= dineroLibre) {
    recomendaciones.push({
      nivel: "precaucion",
      titulo: "La cuota cabe, pero exige disciplina",
      detalle: "Separa el dinero de la cuota al recibir tus ingresos y evita asumir otra deuda durante este plazo.",
    });
  } else {
    recomendaciones.push({
      nivel: "alerta",
      titulo: "Esta cuota puede apretar tu presupuesto",
      detalle: "Prueba pedir menos dinero, ampliar el plazo o reducir gastos antes de asumir el compromiso.",
    });
  }

  if (restanteDespuesCuota < entrada.ingresos * 0.1) {
    recomendaciones.push({
      nivel: "alerta",
      titulo: "Te quedaría poco margen para emergencias",
      detalle: "Busca que después de pagar gastos, deudas y esta cuota todavía quede al menos 10% de tus ingresos.",
    });
  } else {
    recomendaciones.push({
      nivel: "positivo",
      titulo: "Conservas un margen mensual",
      detalle: `Después de tus compromisos te quedarían cerca de ${formatoCOP(restanteDespuesCuota)} al mes. Protege una parte como ahorro.`,
    });
  }

  if (proporcionIntereses >= 0.35) {
    recomendaciones.push({
      nivel: "precaucion",
      titulo: "El plazo aumenta bastante el costo",
      detalle: "Compara un plazo más corto: la cuota sube, pero podrías pagar mucho menos en intereses.",
    });
  } else {
    recomendaciones.push({
      nivel: "positivo",
      titulo: "El costo está relativamente contenido",
      detalle: "Compara esta opción con al menos dos entidades y pregunta siempre por seguros y cobros adicionales.",
    });
  }

  return recomendaciones;
}

/** Plan de refinanciación: alarga el plazo hasta que la cuota entre en la capacidad de pago. */
export function planRefinanciacion(
  saldo: number,
  tasaMensual: number,
  capacidadPago: number,
  plazoMaximo = 72,
) {
  const objetivo = capacidadPago * 0.85;
  for (let plazo = 6; plazo <= plazoMaximo; plazo += 6) {
    const cuota = cuotaFrancesa(saldo, tasaMensual, plazo);
    if (cuota <= objetivo) {
      return { plazo, cuota, viable: true };
    }
  }
  return { plazo: plazoMaximo, cuota: cuotaFrancesa(saldo, tasaMensual, plazoMaximo), viable: false };
}

export type BucketCartera = "Corriente" | "30 días" | "60 días" | "90+ días";

export interface CuotaVencida {
  cuota: number;
  fecha_vencimiento: string;
  pagada: boolean;
}

export function diasMora(fechaVencimiento: string, hoy = new Date()) {
  const venc = new Date(`${fechaVencimiento}T00:00:00`);
  return Math.floor((hoy.getTime() - venc.getTime()) / 86_400_000);
}

export function bucketPorDias(dias: number): BucketCartera {
  if (dias <= 0) return "Corriente";
  if (dias <= 30) return "30 días";
  if (dias <= 60) return "60 días";
  return "90+ días";
}

/** Interés de mora simple diario sobre el valor de la cuota vencida. */
export function interesMora(valorCuota: number, dias: number, tasaMoraMensual: number) {
  if (dias <= 0) return 0;
  return valorCuota * (tasaMoraMensual / 30) * dias;
}

export interface ResumenBucket {
  bucket: BucketCartera;
  saldo: number;
  mora: number;
  cuentas: number;
}

export function clasificarCartera(
  cuotas: CuotaVencida[],
  tasaMoraMensual = 0.028,
  hoy = new Date(),
): ResumenBucket[] {
  const base: Record<BucketCartera, ResumenBucket> = {
    Corriente: { bucket: "Corriente", saldo: 0, mora: 0, cuentas: 0 },
    "30 días": { bucket: "30 días", saldo: 0, mora: 0, cuentas: 0 },
    "60 días": { bucket: "60 días", saldo: 0, mora: 0, cuentas: 0 },
    "90+ días": { bucket: "90+ días", saldo: 0, mora: 0, cuentas: 0 },
  };

  for (const c of cuotas) {
    if (c.pagada) continue;
    const dias = diasMora(c.fecha_vencimiento, hoy);
    const bucket = bucketPorDias(dias);
    base[bucket].saldo += Number(c.cuota);
    base[bucket].mora += interesMora(Number(c.cuota), dias, tasaMoraMensual);
    base[bucket].cuentas += 1;
  }

  return Object.values(base);
}

export const ESTADO_CLASES: Record<EstadoSolicitud, string> = {
  Aprobada: "bg-ok/15 text-ok",
  "En Revisión": "bg-accent-2/15 text-accent-2",
  Rechazada: "bg-bad/15 text-bad",
  Borrador: "bg-ink/10 text-ink-soft",
};
