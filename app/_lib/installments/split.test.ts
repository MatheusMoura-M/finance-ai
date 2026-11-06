import { describe, expect, it } from "vitest";
import { buildInstallments, splitInstallmentAmounts } from "./split";

describe("splitInstallmentAmounts", () => {
  it("divide igualmente quando a conta é exata", () => {
    expect(splitInstallmentAmounts(2400, 12)).toEqual(Array(12).fill(200));
  });

  it("coloca os centavos que sobram na 1ª parcela", () => {
    expect(splitInstallmentAmounts(100, 3)).toEqual([33.34, 33.33, 33.33]);
    expect(splitInstallmentAmounts(10, 3)).toEqual([3.34, 3.33, 3.33]);
  });

  it("a soma das parcelas é sempre igual ao total", () => {
    for (const [total, count] of [
      [999.99, 7],
      [1234.56, 24],
      [0.05, 2],
      [89.9, 10],
    ]) {
      const sumCents = splitInstallmentAmounts(total, count).reduce(
        (sum, amount) => sum + Math.round(amount * 100),
        0,
      );

      expect(sumCents).toBe(Math.round(total * 100));
    }
  });
});

describe("buildInstallments", () => {
  it("cria uma parcela por mês, no mesmo dia, com o número no nome", () => {
    const installments = buildInstallments({
      name: "TV",
      total: 600,
      count: 3,
      firstDate: new Date(2026, 10, 15),
    });

    expect(installments).toEqual([
      {
        name: "TV (1/3)",
        amount: 200,
        date: new Date(2026, 10, 15),
        installmentNumber: 1,
        installmentTotal: 3,
      },
      {
        name: "TV (2/3)",
        amount: 200,
        date: new Date(2026, 11, 15),
        installmentNumber: 2,
        installmentTotal: 3,
      },
      {
        name: "TV (3/3)",
        amount: 200,
        date: new Date(2027, 0, 15),
        installmentNumber: 3,
        installmentTotal: 3,
      },
    ]);
  });

  it("usa o último dia do mês quando o mês não tem o dia da compra", () => {
    const dates = buildInstallments({
      name: "Notebook",
      total: 300,
      count: 3,
      firstDate: new Date(2026, 0, 31),
    }).map((installment) => installment.date);

    expect(dates).toEqual([
      new Date(2026, 0, 31),
      new Date(2026, 1, 28),
      new Date(2026, 2, 31),
    ]);
  });
});
