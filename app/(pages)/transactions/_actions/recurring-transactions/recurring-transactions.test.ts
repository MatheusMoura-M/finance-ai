import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/app/_lib/prisma", () => ({
  db: {
    recurringTransaction: {
      updateMany: mocks.updateMany,
      deleteMany: mocks.deleteMany,
    },
  },
}));

import {
  deleteRecurringTransaction,
  updateRecurringTransaction,
} from "./index";

const ID = "6f1c2b9e-3a4d-4c5e-8f7a-1b2c3d4e5f60";

const rent = {
  id: ID,
  name: "Aluguel",
  amount: 1900,
  type: "EXPENSE" as const,
  category: "HOUSING" as const,
  paymentMethod: "PIX" as const,
  dayOfMonth: 10,
};

describe("recorrências", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("edita só a recorrência do próprio usuário", async () => {
    const result = await updateRecurringTransaction(rent);

    expect(result.success).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: ID, userId: "user_1" },
      data: {
        name: "Aluguel",
        amount: 1900,
        type: "EXPENSE",
        category: "HOUSING",
        paymentMethod: "PIX",
        dayOfMonth: 10,
      },
    });
  });

  it("recusa dia do mês fora de 1 a 31", async () => {
    const result = await updateRecurringTransaction({
      ...rent,
      dayOfMonth: 32,
    });

    expect(result).toEqual({ success: false, error: "Dados inválidos." });
  });

  it("avisa quando a recorrência não é do usuário", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    expect(await updateRecurringTransaction(rent)).toEqual({
      success: false,
      error: "Recorrência não encontrada.",
    });
  });

  it("para de repetir apagando só a recorrência do usuário", async () => {
    const result = await deleteRecurringTransaction({ id: ID });

    expect(result.success).toBe(true);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { id: ID, userId: "user_1" },
    });
  });

  it("recusa usuário não autenticado", async () => {
    mocks.auth.mockResolvedValue({ userId: null });

    expect((await deleteRecurringTransaction({ id: ID })).success).toBe(false);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });
});
