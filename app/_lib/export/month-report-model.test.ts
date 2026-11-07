import { describe, expect, it } from "vitest";
import type { AiReportInput } from "@/app/_lib/ai-report/data";
import { buildMonthReportModel } from "./month-report-model";

const totals = (
  deposits: number,
  expenses: number,
  investments: number,
  transactionCount = 1,
) => ({
  deposits,
  expenses,
  investments,
  balance: deposits - expenses - investments,
  transactionCount,
});

const input: AiReportInput = {
  month: 11,
  year: 2026,
  previousMonth: 10,
  previousYear: 2026,
  current: totals(5000, 1000, 500),
  previous: totals(5000, 800, 0),
  expensesByCategory: [
    { category: "FOOD", total: 850, previousTotal: 700 },
    { category: "TRANSPORTATION", total: 150, previousTotal: 100 },
    { category: "TRAVEL", total: 0, previousTotal: 300 },
  ],
  topExpenses: [],
};

// Normaliza o espaço especial que o Intl coloca depois de "R$".
const clean = (value: unknown) =>
  JSON.parse(JSON.stringify(value).replace(/ /g, " "));

describe("buildMonthReportModel", () => {
  const model = clean(
    buildMonthReportModel({
      input,
      budgets: { FOOD: 800, HEALTH: 300 },
      transactions: [
        {
          date: new Date(2026, 10, 5, 3),
          name: "Salário",
          type: "DEPOSIT",
          category: "SALARY",
          paymentMethod: "BANK_TRANSFER",
          amount: 5000,
        },
        {
          date: new Date(2026, 10, 12, 3),
          name: "Mercado",
          type: "EXPENSE",
          category: "FOOD",
          paymentMethod: "PIX",
          amount: 850,
        },
      ],
      now: new Date(2026, 10, 30, 14, 5),
    }),
  );

  it("usa o nome do mês no título e no arquivo", () => {
    expect(model.title).toBe("Relatório de novembro de 2026");
    expect(model.fileName).toBe("relatorio-novembro-de-2026.pdf");
    expect(model.generatedAt).toBe("30/11/2026 às 14:05");
    expect(model.previousLabel).toBe("outubro");
  });

  it("resume o mês com a variação em relação ao anterior", () => {
    expect(model.summary).toEqual([
      { label: "Receitas", value: "R$ 5.000,00", variation: "sem alteração" },
      { label: "Despesas", value: "R$ 1.000,00", variation: "+25%" },
      {
        label: "Investimentos",
        value: "R$ 500,00",
        variation: "sem base no mês anterior",
      },
      { label: "Saldo", value: "R$ 3.500,00", variation: "-R$ 700,00" },
    ]);
  });

  it("lista categorias com gasto ou orçamento, com a situação do orçamento", () => {
    expect(model.categories).toEqual([
      {
        label: "Alimentação",
        spent: "R$ 850,00",
        share: "85%",
        budget: "R$ 800,00",
        status: "106% · R$ 50,00 acima",
        tone: "negative",
      },
      {
        label: "Transporte",
        spent: "R$ 150,00",
        share: "15%",
        budget: "-",
        status: "-",
        tone: "neutral",
      },
      {
        label: "Saúde",
        spent: "R$ 0,00",
        share: "0%",
        budget: "R$ 300,00",
        status: "0% · restam R$ 300,00",
        tone: "neutral",
      },
    ]);
  });

  it("lista as transações com sinal e rótulos em português", () => {
    expect(model.transactions).toEqual([
      {
        date: "05/11",
        name: "Salário",
        category: "Salário",
        paymentMethod: "Transferência Bancária",
        amount: "+R$ 5.000,00",
        tone: "positive",
      },
      {
        date: "12/11",
        name: "Mercado",
        category: "Alimentação",
        paymentMethod: "Pix",
        amount: "-R$ 850,00",
        tone: "negative",
      },
    ]);
  });
});
