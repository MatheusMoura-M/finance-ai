import { buildHistoryIndex } from "@/app/_lib/categorize/suggest";
import { describe, expect, it } from "vitest";
import { ParsedStatement } from "./parse-statement";
import { buildImportPreview, entryHash } from "./preview";

const noon = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day, 12, 0, 0, 0);

const statement: ParsedStatement = {
  format: "nubank-account",
  isCardStatement: false,
  entries: [
    {
      date: noon(2026, 10, 28),
      description: "Compra no débito - Uber",
      amount: 23.9,
      direction: "out",
    },
    {
      date: noon(2026, 10, 25),
      description: "Transferência recebida pelo Pix - João",
      amount: 150,
      direction: "in",
    },
    {
      date: noon(2026, 10, 10),
      description: "Transferência enviada pelo Pix - Imobiliária",
      amount: 1800,
      direction: "out",
    },
    {
      date: noon(2026, 10, 3),
      description: "Aplicação RDB",
      amount: 500,
      direction: "out",
    },
    {
      date: noon(2026, 10, 2),
      description: "PAG*JOSEMARIA",
      amount: 30,
      direction: "out",
    },
  ],
};

const history = buildHistoryIndex([
  { name: "Imobiliária", category: "HOUSING", paymentMethod: "PIX" },
]);

describe("buildImportPreview", () => {
  const rows = buildImportPreview({
    statement,
    history,
    existing: [
      // Aluguel já cadastrado à mão no dia 10.
      {
        date: new Date(2026, 9, 10, 3),
        amount: 1800,
        type: "EXPENSE",
        importHash: null,
      },
    ],
  });

  it("sugere tipo, categoria e forma de pagamento", () => {
    expect(
      rows.map(({ name, type, category, categorySource, paymentMethod }) => ({
        name,
        type,
        category,
        categorySource,
        paymentMethod,
      })),
    ).toEqual([
      {
        name: "Compra no débito - Uber",
        type: "EXPENSE",
        category: "TRANSPORTATION",
        categorySource: "keyword",
        paymentMethod: "DEBIT_CARD",
      },
      {
        name: "Transferência recebida pelo Pix - João",
        type: "DEPOSIT",
        category: "OTHER",
        categorySource: null,
        paymentMethod: "PIX",
      },
      {
        name: "Transferência enviada pelo Pix - Imobiliária",
        type: "EXPENSE",
        category: "HOUSING",
        categorySource: "history",
        paymentMethod: "PIX",
      },
      {
        name: "Aplicação RDB",
        type: "INVESTMENT",
        category: "INVESTMENTS",
        categorySource: "keyword",
        paymentMethod: "OTHER",
      },
      {
        name: "PAG*JOSEMARIA",
        type: "EXPENSE",
        category: "OTHER",
        categorySource: null,
        paymentMethod: "OTHER",
      },
    ]);
  });

  it("desmarca o que parece já cadastrado (mesmo dia, valor e tipo)", () => {
    expect(rows.map((row) => [row.selected, row.note])).toEqual([
      [true, null],
      [true, null],
      [false, "possible-duplicate"],
      [true, null],
      [true, null],
    ]);
  });

  it("desmarca o que já foi importado antes (mesmo arquivo de novo)", () => {
    const again = buildImportPreview({
      statement,
      history,
      existing: [
        {
          date: noon(2026, 10, 28),
          amount: 23.9,
          type: "EXPENSE",
          importHash: rows[0].importHash,
        },
      ],
    });

    expect(again[0]).toMatchObject({
      selected: false,
      note: "already-imported",
    });
  });

  it("gera hashes diferentes para lançamentos idênticos no mesmo arquivo", () => {
    const coffee = {
      date: noon(2026, 10, 1),
      description: "Café",
      amount: 5,
      direction: "out" as const,
    };

    const [first, second] = buildImportPreview({
      statement: {
        format: "ofx",
        isCardStatement: false,
        entries: [coffee, coffee],
      },
      history,
      existing: [],
    });

    expect(first.importHash).not.toBe(second.importHash);
    expect(first.importHash).toBe(entryHash("ofx", coffee, 0));
  });

  it("na fatura do cartão: tudo no crédito e pagamentos/estornos desmarcados", () => {
    const [purchase, payment] = buildImportPreview({
      statement: {
        format: "nubank-card",
        isCardStatement: true,
        entries: [
          {
            date: noon(2026, 10, 15),
            description: "Loja X - Parcela 3/10",
            amount: 120,
            direction: "out",
          },
          {
            date: noon(2026, 10, 10),
            description: "Pagamento recebido",
            amount: 1500,
            direction: "in",
          },
        ],
      },
      history,
      existing: [],
    });

    // Parcela da fatura entra só como a transação daquele mês.
    expect(purchase).toMatchObject({
      name: "Loja X - Parcela 3/10",
      type: "EXPENSE",
      paymentMethod: "CREDIT_CARD",
      selected: true,
    });
    expect(payment).toMatchObject({
      paymentMethod: "CREDIT_CARD",
      selected: false,
      note: "card-credit",
    });
  });
});
