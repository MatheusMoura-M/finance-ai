import { describe, expect, it } from "vitest";
import { BudgetRow, getBudgetStatus, resolveMonthBudgets } from "./resolve";

const row = (
  category: BudgetRow["category"],
  amount: number | null,
  month: number,
  year: number,
  onlyThisMonth = false,
): BudgetRow => ({ category, amount, month, year, onlyThisMonth });

describe("resolveMonthBudgets", () => {
  it("um valor 'a partir de' vale nos meses seguintes, mas não nos anteriores", () => {
    const rows = [row("FOOD", 800, 3, 2026)];

    expect(resolveMonthBudgets(rows, 2, 2026).effective).toEqual({});
    expect(resolveMonthBudgets(rows, 3, 2026).effective).toEqual({ FOOD: 800 });
    expect(resolveMonthBudgets(rows, 1, 2027).effective).toEqual({ FOOD: 800 });
  });

  it("o registro 'a partir de' mais recente substitui o anterior", () => {
    const rows = [row("FOOD", 800, 1, 2026), row("FOOD", 1000, 6, 2026)];

    expect(resolveMonthBudgets(rows, 5, 2026).effective.FOOD).toBe(800);
    expect(resolveMonthBudgets(rows, 6, 2026).effective.FOOD).toBe(1000);
    expect(resolveMonthBudgets(rows, 2, 2027).effective.FOOD).toBe(1000);
  });

  it("'só neste mês' vale apenas naquele mês", () => {
    const rows = [row("FOOD", 800, 1, 2026), row("FOOD", 1200, 12, 2026, true)];

    expect(resolveMonthBudgets(rows, 11, 2026).effective.FOOD).toBe(800);
    expect(resolveMonthBudgets(rows, 12, 2026)).toEqual({
      effective: { FOOD: 1200 },
      base: { FOOD: 800 },
    });
    expect(resolveMonthBudgets(rows, 1, 2027).effective.FOOD).toBe(800);
  });

  it("valor nulo remove o orçamento (a partir do mês ou só no mês)", () => {
    const rows = [
      row("FOOD", 800, 1, 2026),
      row("FOOD", null, 5, 2026),
      row("TRAVEL", 500, 1, 2026),
      row("TRAVEL", null, 7, 2026, true),
    ];

    expect(resolveMonthBudgets(rows, 4, 2026).effective.FOOD).toBe(800);
    expect(resolveMonthBudgets(rows, 5, 2026).effective.FOOD).toBeUndefined();
    expect(resolveMonthBudgets(rows, 7, 2026).effective.TRAVEL).toBeUndefined();
    expect(resolveMonthBudgets(rows, 8, 2026).effective.TRAVEL).toBe(500);
  });

  it("cada categoria é independente", () => {
    const rows = [row("FOOD", 800, 1, 2026), row("HOUSING", 2000, 3, 2026)];

    expect(resolveMonthBudgets(rows, 2, 2026).effective).toEqual({ FOOD: 800 });
    expect(resolveMonthBudgets(rows, 3, 2026).effective).toEqual({
      FOOD: 800,
      HOUSING: 2000,
    });
  });
});

describe("getBudgetStatus", () => {
  it("fica 'ok' abaixo de 80%", () => {
    expect(getBudgetStatus(120, 300)).toEqual({
      percent: 40,
      level: "ok",
      remaining: 180,
    });
  });

  it("fica em alerta de 80% até o limite", () => {
    expect(getBudgetStatus(650, 800).level).toBe("warning");
    expect(getBudgetStatus(800, 800).level).toBe("warning");
  });

  it("passa para 'over' acima do limite, com o excedente negativo", () => {
    expect(getBudgetStatus(380, 300)).toEqual({
      percent: 127,
      level: "over",
      remaining: -80,
    });
  });
});
