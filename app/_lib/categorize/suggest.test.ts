import { describe, expect, it } from "vitest";
import {
  buildHistoryIndex,
  historyKey,
  normalizeName,
  suggestCategoryByKeyword,
  suggestForName,
  suggestPaymentMethodByText,
} from "./suggest";

describe("normalizeName e historyKey", () => {
  it("tira acentos, maiúsculas e pontuação", () => {
    expect(normalizeName("Pão de Açúcar - LJ 12*")).toBe("pao de acucar lj 12");
  });

  it("ignora parcelas, números e prefixos do banco", () => {
    expect(historyKey("TV Samsung (2/12)")).toBe("tv samsung");
    expect(historyKey("Loja X - Parcela 3/10")).toBe("loja x");
    expect(historyKey("Compra no débito - Padaria Central")).toBe(
      "padaria central",
    );
    expect(historyKey("Transferência enviada pelo Pix - Maria")).toBe("maria");
  });
});

describe("suggestCategoryByKeyword", () => {
  it.each([
    ["Uber *Trip", "TRANSPORTATION"],
    ["UBER   *TRIP HELP.UBER.COM", "TRANSPORTATION"],
    ["iFood", "FOOD"],
    ["IFD*RESTAURANTE BOM", "FOOD"],
    ["Drogasil 123", "HEALTH"],
    ["Netflix.com", "SUBSCRIPTIONS"],
    ["Pagamento de fatura", "INVOICE"],
    ["Posto Shell", "TRANSPORTATION"],
    ["Aluguel apto", "HOUSING"],
    ["Salário outubro", "SALARY"],
  ])("%s → %s", (name, category) => {
    expect(suggestCategoryByKeyword(name)).toBe(category);
  });

  it('só casa palavras inteiras ("barbearia" não é "bar")', () => {
    expect(suggestCategoryByKeyword("Barbearia do Zé")).toBeNull();
  });

  it("devolve null quando não reconhece", () => {
    expect(suggestCategoryByKeyword("PAG*JOSEMARIA")).toBeNull();
  });
});

describe("suggestPaymentMethodByText", () => {
  it.each([
    ["Transferência enviada pelo Pix - Maria", "PIX"],
    ["Compra no débito - Padaria", "DEBIT_CARD"],
    ["Pagamento de boleto efetuado", "BANK_SLIP"],
    ["TED enviada", "BANK_TRANSFER"],
    ["Saque 24h", "CASH"],
    ["Mercado", null],
  ])("%s → %s", (text, method) => {
    expect(suggestPaymentMethodByText(text)).toBe(method);
  });
});

describe("suggestForName", () => {
  const history = buildHistoryIndex([
    // Mais recente primeiro: a última correção do usuário vale.
    { name: "Uber", category: "HEALTH", paymentMethod: "PIX" },
    { name: "Uber", category: "TRANSPORTATION", paymentMethod: "CREDIT_CARD" },
    { name: "Padaria Central", category: "FOOD", paymentMethod: "DEBIT_CARD" },
  ]);

  it("o histórico do usuário vence as palavras-chave", () => {
    expect(suggestForName("UBER", history)).toEqual({
      category: "HEALTH",
      categorySource: "history",
      paymentMethod: "PIX",
      paymentMethodSource: "history",
    });
  });

  it("reconhece o mesmo nome vindo do banco com prefixo", () => {
    expect(
      suggestForName("Compra no débito - Padaria Central", history).category,
    ).toBe("FOOD");
  });

  it("usa palavras-chave quando não há histórico", () => {
    expect(suggestForName("Pix enviado - Drogasil", history)).toEqual({
      category: "HEALTH",
      categorySource: "keyword",
      paymentMethod: "PIX",
      paymentMethodSource: "keyword",
    });
  });

  it("não sugere nada quando não reconhece", () => {
    expect(suggestForName("PAG*JOSEMARIA", history)).toEqual({
      category: null,
      categorySource: null,
      paymentMethod: null,
      paymentMethodSource: null,
    });
  });
});
