import { describe, expect, it } from "vitest";
import { getMonthDateRange } from "./date";

describe("getMonthDateRange", () => {
  it("cobre fevereiro inteiro sem invadir março", () => {
    const { gte, lte } = getMonthDateRange("02", 2026);

    expect(gte).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0));
    expect(lte).toEqual(new Date(2026, 1, 28, 23, 59, 59, 999));
    expect(lte < new Date(2026, 2, 1)).toBe(true);
  });

  it("inclui o dia 29 em ano bissexto", () => {
    const { lte } = getMonthDateRange("02", 2028);

    expect(lte.getDate()).toBe(29);
  });

  it("inclui o dia 31 em meses de 31 dias", () => {
    const { lte } = getMonthDateRange("01", 2026);

    expect(lte).toEqual(new Date(2026, 0, 31, 23, 59, 59, 999));
  });

  it("termina em 30 em meses de 30 dias", () => {
    const { lte } = getMonthDateRange(4, 2026);

    expect(lte.getMonth()).toBe(3);
    expect(lte.getDate()).toBe(30);
  });

  it("não vira o ano em dezembro", () => {
    const { gte, lte } = getMonthDateRange("12", 2026);

    expect(gte.getFullYear()).toBe(2026);
    expect(lte).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
  });
});
