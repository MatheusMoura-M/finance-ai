import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildTransactionsWorkbook, signedAmount } from "./xlsx";

const readSheet = async (buffer: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  return workbook.getWorksheet("Transações")!;
};

describe("signedAmount", () => {
  it("receita positiva, despesa e investimento negativos", () => {
    expect(signedAmount("DEPOSIT", 1500)).toBe(1500);
    expect(signedAmount("EXPENSE", 38.5)).toBe(-38.5);
    expect(signedAmount("INVESTMENT", 200)).toBe(-200);
  });
});

describe("buildTransactionsWorkbook", () => {
  it("gera a planilha com cabeçalho cinza escuro, fixo e com filtros", async () => {
    const sheet = await readSheet(await buildTransactionsWorkbook([]));
    const header = sheet.getRow(1);

    expect(header.values).toEqual([
      undefined,
      "Data",
      "Nome",
      "Tipo",
      "Categoria",
      "Método de pagamento",
      "Valor",
    ]);
    expect(header.getCell(1).fill).toMatchObject({
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3F3F46" },
    });
    expect(header.getCell(1).font).toMatchObject({
      bold: true,
      color: { argb: "FFFFFFFF" },
    });
    expect(sheet.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(sheet.autoFilter).toBeTruthy();
  });

  it("grava data como data e valor como número em reais", async () => {
    const sheet = await readSheet(
      await buildTransactionsWorkbook([
        {
          // 28/03 à meia-noite no Brasil = 03:00 UTC.
          date: new Date(Date.UTC(2026, 2, 28, 3)),
          name: "Revisão da moto (3/3)",
          type: "EXPENSE",
          category: "TRANSPORTATION",
          paymentMethod: "CREDIT_CARD",
          amount: 151.26,
        },
        {
          date: new Date(Date.UTC(2026, 2, 5, 3)),
          name: "=Salário",
          type: "DEPOSIT",
          category: "SALARY",
          paymentMethod: "BANK_TRANSFER",
          amount: 5000,
        },
      ]),
    );

    const expense = sheet.getRow(2);
    expect(expense.getCell(1).value).toEqual(new Date(Date.UTC(2026, 2, 28)));
    expect(expense.getCell(1).numFmt).toBe("dd/mm/yyyy");
    expect(expense.getCell(2).value).toBe("Revisão da moto (3/3)");
    expect(expense.getCell(3).value).toBe("Despesa");
    expect(expense.getCell(4).value).toBe("Transporte");
    expect(expense.getCell(5).value).toBe("Cartão de Crédito");
    expect(expense.getCell(6).value).toBe(-151.26);
    expect(expense.getCell(6).numFmt).toBe('"R$" #,##0.00;[Red]-"R$" #,##0.00');

    // Texto começando com "=" fica como texto, não como fórmula.
    expect(sheet.getRow(3).getCell(2).value).toBe("=Salário");
    expect(sheet.getRow(3).getCell(6).value).toBe(5000);
  });

  it("ajusta a largura da coluna de nome ao maior nome", async () => {
    const sheet = await readSheet(
      await buildTransactionsWorkbook([
        {
          date: new Date(),
          name: "Um nome de transação bem comprido mesmo",
          type: "EXPENSE",
          category: "OTHER",
          paymentMethod: "PIX",
          amount: 1,
        },
      ]),
    );

    expect(sheet.getColumn(1).width).toBe(12);
    // 39 caracteres + 4 de folga.
    expect(sheet.getColumn(2).width).toBe(43);
  });
});
