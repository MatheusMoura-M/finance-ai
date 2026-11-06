import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  deleteMany: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/_lib/prisma", () => ({
  db: {
    transaction: { deleteMany: mocks.deleteMany, findFirst: mocks.findFirst },
  },
}));

import { deleteTransaction } from "./index";

const TRANSACTION_ID = "6f1c2b9e-3a4d-4c5e-8f7a-1b2c3d4e5f60";

describe("deleteTransaction", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("recusa usuário não autenticado", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    const result = await deleteTransaction({ transactionId: TRANSACTION_ID });

    expect(result.success).toBe(false);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("recusa id inválido", async () => {
    const result = await deleteTransaction({ transactionId: "abc" });

    expect(result).toEqual({ success: false, error: "Dados inválidos." });
  });

  it("apaga filtrando pelo dono da transação", async () => {
    const result = await deleteTransaction({ transactionId: TRANSACTION_ID });

    expect(result.success).toBe(true);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { id: TRANSACTION_ID, userId: "user_1" },
    });
  });

  it("retorna erro ao tentar apagar transação de outro usuário", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });

    const result = await deleteTransaction({ transactionId: TRANSACTION_ID });

    expect(result).toEqual({
      success: false,
      error: "Transação não encontrada.",
    });
  });

  describe("compra parcelada", () => {
    beforeEach(() => {
      mocks.findFirst.mockResolvedValue({ installmentGroupId: "group_1" });
      mocks.deleteMany.mockResolvedValue({ count: 12 });
    });

    it("apaga todas as parcelas do mesmo grupo, só do usuário", async () => {
      const result = await deleteTransaction({
        transactionId: TRANSACTION_ID,
        scope: "allInstallments",
      });

      expect(mocks.findFirst).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID, userId: "user_1" },
        select: { installmentGroupId: true },
      });
      expect(mocks.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user_1", installmentGroupId: "group_1" },
      });
      expect(result).toEqual({ success: true, data: { deleted: 12 } });
    });

    it("'só esta' apaga apenas a parcela escolhida", async () => {
      mocks.deleteMany.mockResolvedValue({ count: 1 });

      await deleteTransaction({
        transactionId: TRANSACTION_ID,
        scope: "single",
      });

      expect(mocks.findFirst).not.toHaveBeenCalled();
      expect(mocks.deleteMany).toHaveBeenCalledWith({
        where: { id: TRANSACTION_ID, userId: "user_1" },
      });
    });

    it("não encontra parcelas de outro usuário", async () => {
      mocks.findFirst.mockResolvedValue(null);

      const result = await deleteTransaction({
        transactionId: TRANSACTION_ID,
        scope: "allInstallments",
      });

      expect(result).toEqual({
        success: false,
        error: "Transação não encontrada.",
      });
      expect(mocks.deleteMany).not.toHaveBeenCalled();
    });

    it("avisa quando a transação não é parcelada", async () => {
      mocks.findFirst.mockResolvedValue({ installmentGroupId: null });

      const result = await deleteTransaction({
        transactionId: TRANSACTION_ID,
        scope: "allInstallments",
      });

      expect(result).toEqual({
        success: false,
        error: "Esta transação não é parcelada.",
      });
    });
  });
});
