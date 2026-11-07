import { describe, expect, it } from "vitest";
import { MonthReportModel } from "./month-report-model";
import { renderMonthReportPdf } from "./month-report-pdf";

const model: MonthReportModel = {
  title: "Relatório de novembro de 2026",
  fileName: "relatorio-novembro-de-2026.pdf",
  generatedAt: "30/11/2026 às 14:05",
  previousLabel: "outubro",
  summary: [
    { label: "Receitas", value: "R$ 5.000,00", variation: "sem alteração" },
    { label: "Despesas", value: "R$ 1.000,00", variation: "+25%" },
    {
      label: "Investimentos",
      value: "R$ 500,00",
      variation: "sem base no mês anterior",
    },
    { label: "Saldo", value: "R$ 3.500,00", variation: "-R$ 700,00" },
  ],
  categories: [
    {
      label: "Alimentação",
      spent: "R$ 850,00",
      share: "85%",
      budget: "R$ 800,00",
      status: "106% · R$ 50,00 acima",
      tone: "negative",
    },
  ],
  // Bastante linhas para forçar mais de uma página.
  transactions: Array.from({ length: 80 }, (_, index) => ({
    date: "12/11",
    name: `Padaria São João ${index + 1}`,
    category: "Alimentação",
    paymentMethod: "Cartão de Crédito",
    amount: "-R$ 12,50",
    tone: "negative" as const,
  })),
};

describe("renderMonthReportPdf", () => {
  it("gera um PDF válido, com várias páginas, a partir do modelo", async () => {
    const pdf = await renderMonthReportPdf(model);
    const text = pdf.toString("latin1");

    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(Number(text.match(/\/Count (\d+)/)?.[1])).toBeGreaterThan(1);
  }, 20_000);

  it("gera um PDF mesmo sem transações no mês", async () => {
    const pdf = await renderMonthReportPdf({
      ...model,
      categories: [],
      transactions: [],
    });

    expect(pdf.toString("latin1").startsWith("%PDF-")).toBe(true);
  }, 20_000);
});
