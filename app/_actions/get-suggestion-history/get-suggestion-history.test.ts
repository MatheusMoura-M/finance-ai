import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserSubscription: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/app/_data/get-user-subscription", () => ({
  getUserSubscription: mocks.getUserSubscription,
}));
vi.mock("@/app/_lib/prisma", () => ({
  db: { transaction: { findMany: mocks.findMany } },
}));

import { getSuggestionHistory } from "./index";

describe("getSuggestionHistory", () => {
  beforeEach(() => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: true,
    });
    mocks.findMany.mockResolvedValue([
      { name: "Uber", category: "TRANSPORTATION", paymentMethod: "PIX" },
      { name: "UBER", category: "HEALTH", paymentMethod: "CASH" },
      { name: "TV (2/12)", category: "OTHER", paymentMethod: "CREDIT_CARD" },
    ]);
  });

  it("é exclusivo do Plano Premium", async () => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: false,
    });

    const result = await getSuggestionHistory();

    expect(result.success).toBe(false);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("usa as transações mais recentes do usuário, uma escolha por nome", async () => {
    const result = await getSuggestionHistory();

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { userId: "user_1" },
      orderBy: { date: "desc" },
      take: 2000,
      select: { name: true, category: true, paymentMethod: true },
    });
    expect(result).toEqual({
      success: true,
      data: [
        ["uber", { category: "TRANSPORTATION", paymentMethod: "PIX" }],
        ["tv", { category: "OTHER", paymentMethod: "CREDIT_CARD" }],
      ],
    });
  });
});
