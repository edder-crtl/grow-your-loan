export interface Obligacion {
  entidad: string;
  tipo: string;
  saldo: number;
  cuota: number;
  diasMora: number;
}

export interface Diagnostico {
  totalDeuda: number;
  totalCuotas: number;
  porcentajeIngreso: number;
  enMora: number;
  puntaje: number;
  nivel: "Excelente" | "Aceptable" | "En alerta";
  acciones: string[];
}

const num = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

/** Lee texto de un reporte/extracto: líneas con entidad y montos en pesos. */
export function extraerObligaciones(texto: string): Obligacion[] {
  const res: Obligacion[] = [];
  for (const linea of texto.split(/\n+/)) {
    const montos = linea.match(/\$\s?[\d.,]{4,}/g);
    if (!montos || montos.length === 0) continue;
    const entidad = linea.split("$")[0].replace(/[|:;-]+$/, "").trim().slice(0, 40) || "Entidad";
    const mora = linea.match(/(\d{1,3})\s*d[ií]as/i);
    const tipo = /tarjeta/i.test(linea) ? "Tarjeta de crédito" : /micro/i.test(linea) ? "Microcrédito" : /veh/i.test(linea) ? "Vehículo" : "Consumo";
    res.push({
      entidad,
      tipo,
      saldo: num(montos[0]),
      cuota: montos[1] ? num(montos[1]) : Math.round(num(montos[0]) / 24),
      diasMora: mora ? Number(mora[1]) : 0,
    });
  }
  return res;
}

export function diagnosticar(obligaciones: Obligacion[], ingreso: number): Diagnostico {
  const totalDeuda = obligaciones.reduce((a, o) => a + o.saldo, 0);
  const totalCuotas = obligaciones.reduce((a, o) => a + o.cuota, 0);
  const porcentajeIngreso = ingreso > 0 ? totalCuotas / ingreso : 1;
  const enMora = obligaciones.filter((o) => o.diasMora > 0).length;
  const peorMora = Math.max(0, ...obligaciones.map((o) => o.diasMora));

  let puntaje = 850;
  puntaje -= Math.max(0, porcentajeIngreso - 0.3) * 400;
  puntaje -= enMora * 40 + Math.min(peorMora, 120) * 1.2;
  puntaje = Math.round(Math.max(300, Math.min(850, puntaje)));
  const nivel = puntaje >= 750 ? "Excelente" : puntaje >= 650 ? "Aceptable" : "En alerta";

  const acciones: string[] = [];
  if (enMora > 0) acciones.push(`Ponte al día primero con las ${enMora} deuda(s) en mora: cada día de atraso baja tu puntaje.`);
  if (peorMora >= 60) acciones.push("Llama a la entidad y pide un acuerdo de pago. Por la Ley de Borrón y Cuenta Nueva, al pagar el reporte negativo dura el doble de la mora (máximo 4 años).");
  if (porcentajeIngreso > 0.4) acciones.push("Más del 40% de tu ingreso se va en cuotas. Evita pedir crédito nuevo y considera unir deudas en una de menor tasa.");
  else if (porcentajeIngreso > 0.3) acciones.push("Estás cerca del límite sano (30%). Abona a la deuda más cara para liberar espacio.");
  if (obligaciones.some((o) => o.tipo === "Tarjeta de crédito")) acciones.push("Paga el total de la tarjeta cada mes; pagar solo el mínimo es la forma más cara de financiarte.");
  if (acciones.length === 0) acciones.push("Vas muy bien. Mantén tus pagos puntuales y guarda un fondo de emergencia de 3 meses de gastos.");

  return { totalDeuda, totalCuotas, porcentajeIngreso, enMora, puntaje, nivel, acciones };
}

export const REPORTE_EJEMPLO = `Bancolombia Tarjeta de crédito $ 3.200.000 $ 280.000 al día
Davivienda Crédito libre inversión $ 12.500.000 $ 620.000 al día
Bancamía Microcrédito $ 2.100.000 $ 190.000 mora 35 días`;
