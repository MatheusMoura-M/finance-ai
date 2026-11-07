import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserSubscription: vi.fn(),
  findMany: vi.fn(),
  createMany: vi.fn(),
}));

vi.mock("@/app/_data/get-user-subscription", () => ({
  getUserSubscription: mocks.getUserSubscription,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/_lib/prisma", () => ({
  db: {
    transaction: { findMany: mocks.findMany, createMany: mocks.createMany },
  },
}));

import { confirmStatementImport, previewStatementImport } from "./index";

const NUBANK_CARD = [
  "date,title,amount",
  "2026-10-27,iFood,58.40",
  "2026-10-10,Pagamento recebido,-1500.00",
].join("\n");

const validRow = {
  importHash: "a".repeat(32),
  date: new Date(2026, 9, 27, 12).toISOString(),
  name: "iFood",
  amount: 58.4,
  type: "EXPENSE" as const,
  category: "FOOD" as const,
  paymentMethod: "CREDIT_CARD" as const,
};

describe("importar extrato", () => {
  beforeEach(() => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: true,
    });
    mocks.findMany.mockResolvedValue([]);
    mocks.createMany.mockResolvedValue({ count: 1 });
  });

  describe("prévia", () => {
    it("é exclusiva do Plano Premium", async () => {
      mocks.getUserSubscription.mockResolvedValue({
        userId: "user_1",
        hasPremiumPlan: false,
      });

      const result = await previewStatementImport({ content: NUBANK_CARD });

      expect(result).toEqual({
        success: false,
        error: "Importar extrato é um recurso do Plano Premium.",
      });
    });

    it("lê o arquivo e usa só o histórico e as transações do usuário", async () => {
      const result = await previewStatementImport({ content: NUBANK_CARD });

      expect(result.success).toBe(true);
      expect(mocks.findMany).toHaveBeenCalledTimes(2);
      for (const [args] of mocks.findMany.mock.calls) {
        expect(args.where.userId).toBe("user_1");
      }

      if (!result.success) return;
      expect(result.data.format).toBe("nubank-card");
      expect(
        result.data.rows.map((row) => [row.name, row.category, row.selected]),
      ).toEqual([
        ["iFood", "FOOD", true],
        ["Pagamento recebido", "OTHER", false],
      ]);
    });

    it("mostra uma mensagem clara para arquivo em formato desconhecido", async () => {
      const result = await previewStatementImport({ content: "a;b\n1;2" });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toMatch(/Formato não reconhecido/);
      expect(mocks.findMany).not.toHaveBeenCalled();
    });
  });

  describe("confirmar", () => {
    it("salva as linhas para o usuário, ignorando as já importadas", async () => {
      mocks.createMany.mockResolvedValue({ count: 1 });

      const result = await confirmStatementImport({
        rows: [validRow, { ...validRow, importHash: "b".repeat(32) }],
      });

      expect(mocks.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            userId: "user_1",
            importHash: "a".repeat(32),
            date: new Date(2026, 9, 27, 12),
            name: "iFood",
          }),
          expect.objectContaining({ importHash: "b".repeat(32) }),
        ],
        skipDuplicates: true,
      });
      expect(result).toEqual({
        success: true,
        data: { imported: 1, skipped: 1 },
      });
    });

    it("recusa dados inválidos", async () => {
      const result = await confirmStatementImport({
        rows: [{ ...validRow, amount: -10 }],
      });

      expect(result).toEqual({ success: false, error: "Dados inválidos." });
      expect(mocks.createMany).not.toHaveBeenCalled();
    });

    it("é exclusivo do Plano Premium", async () => {
      mocks.getUserSubscription.mockResolvedValue({
        userId: "user_1",
        hasPremiumPlan: false,
      });

      expect((await confirmStatementImport({ rows: [validRow] })).success).toBe(
        false,
      );
      expect(mocks.createMany).not.toHaveBeenCalled();
    });
  });
});
