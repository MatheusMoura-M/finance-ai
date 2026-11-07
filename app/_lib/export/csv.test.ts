import { describe, expect, it } from "vitest";
import { buildTransactionsCsv, escapeCsvText, formatCsvAmount } from "./csv";

describe("escapeCsvText", () => {
  it("mantém textos comuns", () => {
    expect(escapeCsvText("Mercado Extra")).toBe("Mercado Extra");
  });

  it("coloca entre aspas textos com ; ou aspas", () => {
    expect(escapeCsvText("Pão; leite")).toBe('"Pão; leite"');
    expect(escapeCsvText('TV "4K"')).toBe('"TV ""4K"""');
  });

  it("neutraliza textos que a planilha executaria como fórmula", () => {
    expect(escapeCsvText('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(escapeCsvText("+5511999")).toBe("'+5511999");
    expect(escapeCsvText("-10")).toBe("'-10");
    expect(escapeCsvText("@SUM(A1)")).toBe("'@SUM(A1)");
  });
});

describe("formatCsvAmount", () => {
  it("receita positiva, despesa e investimento negativos, com vírgula", () => {
    expect(formatCsvAmount("DEPOSIT", 1500)).toBe("1500,00");
    expect(formatCsvAmount("EXPENSE", 38.5)).toBe("-38,50");
    expect(formatCsvAmount("INVESTMENT", 200)).toBe("-200,00");
  });
});

describe("buildTransactionsCsv", () => {
  it("gera cabeçalho e linhas com ; e rótulos em português", () => {
    const csv = buildTransactionsCsv([
      {
        date: new Date(2026, 2, 28, 3),
        name: "Mercado",
        type: "EXPENSE",
        category: "FOOD",
        paymentMethod: "CREDIT_CARD",
        amount: 420,
      },
      {
        date: new Date(2026, 2, 5, 3),
        name: "Salário",
        type: "DEPOSIT",
        category: "SALARY",
        paymentMethod: "BANK_TRANSFER",
        amount: 5000,
      },
    ]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual([
      "Data;Nome;Tipo;Categoria;Método de pagamento;Valor",
      "28/03/2026;Mercado;Despesa;Alimentação;Cartão de Crédito;-420,00",
      "05/03/2026;Salário;Depósito;Salário;Transferência Bancária;5000,00",
      "",
    ]);
  });

  it("gera só o cabeçalho quando não há transações", () => {
    expect(buildTransactionsCsv([])).toBe(
      "\uFEFFData;Nome;Tipo;Categoria;Método de pagamento;Valor\r\n",
    );
  });
});
