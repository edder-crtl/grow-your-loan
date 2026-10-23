import { describe, expect, it } from "vitest";
import { diagnosticar, extraerObligaciones, REPORTE_EJEMPLO } from "./historial";

describe("historial", () => {
  it("extrae saldo, cuota y mora del texto", () => {
    const o = extraerObligaciones(REPORTE_EJEMPLO);
    expect(o).toHaveLength(3);
    expect(o[2]).toMatchObject({ saldo: 2100000, cuota: 190000, diasMora: 35 });
  });
  it("sin deudas ni mora es Excelente", () => {
    expect(diagnosticar([], 3000000).nivel).toBe("Excelente");
  });
  it("cuotas por encima del ingreso es En alerta", () => {
    const d = diagnosticar([{ entidad: "X", tipo: "Consumo", saldo: 1e7, cuota: 2e6, diasMora: 90 }], 2e6);
    expect(d.nivel).toBe("En alerta");
  });
});
