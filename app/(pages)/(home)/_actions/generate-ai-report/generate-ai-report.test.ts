import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserSubscription: vi.fn(),
  getServerEnv: vi.fn(),
  findMany: vi.fn(),
  createCompletion: vi.fn(),
}));

vi.mock("@/app/_data/get-user-subscription", () => ({
  getUserSubscription: mocks.getUserSubscription,
}));
vi.mock("@/app/_lib/env", () => ({ getServerEnv: mocks.getServerEnv }));
vi.mock("@/app/_lib/prisma", () => ({
  db: { transaction: { findMany: mocks.findMany } },
}));
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: mocks.createCompletion } };
  },
}));

import { generateAiReport } from "./index";

describe("generateAiReport", () => {
  beforeEach(() => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: true,
    });
    mocks.getServerEnv.mockReturnValue({ OPENAI_API_KEY: "sk-test" });
    mocks.findMany.mockResolvedValue([]);
    mocks.createCompletion.mockResolvedValue({
      choices: [{ message: { content: "# Relatório" } }],
    });
  });

  it("exige Plano Premium", async () => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: false,
    });

    const result = await generateAiReport({ month: "02", year: 2026 });

    expect(result.success).toBe(false);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("usa só as transações do usuário no mês e ano escolhidos", async () => {
    const result = await generateAiReport({ month: "02", year: 2025 });

    expect(result).toEqual({ success: true, data: "# Relatório" });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        date: {
          gte: new Date(2025, 1, 1, 0, 0, 0, 0),
          lte: new Date(2025, 1, 28, 23, 59, 59, 999),
        },
      },
    });
  });

  it("recusa mês inválido", async () => {
    const result = await generateAiReport({ month: "13", year: 2026 });

    expect(result).toEqual({ success: false, error: "Dados inválidos." });
  });
});
