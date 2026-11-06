import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserSubscription: vi.fn(),
  findFirst: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@/app/_data/get-user-subscription", () => ({
  getUserSubscription: mocks.getUserSubscription,
}));
vi.mock("@/app/_lib/prisma", () => ({
  db: { aiReport: { findFirst: mocks.findFirst, count: mocks.count } },
}));

import { getSavedAiReport } from "./index";

describe("getSavedAiReport", () => {
  beforeEach(() => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: true,
    });
    mocks.findFirst.mockResolvedValue(null);
    mocks.count.mockResolvedValue(2);
  });

  it("exige Plano Premium", async () => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: false,
    });

    const result = await getSavedAiReport({ month: "02", year: 2026 });

    expect(result.success).toBe(false);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("busca o relatório mais recente do usuário naquele mês e ano", async () => {
    const saved = { content: "# Relatório", createdAt: new Date(2026, 1, 3) };
    mocks.findFirst.mockResolvedValue(saved);

    const result = await getSavedAiReport({ month: "02", year: 2026 });

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { userId: "user_1", month: 2, year: 2026 },
      orderBy: { createdAt: "desc" },
      select: { content: true, createdAt: true },
    });
    expect(result).toEqual({
      success: true,
      data: { report: saved, usage: { used: 2, limit: 5, remaining: 3 } },
    });
  });

  it("conta só as gerações do usuário nas últimas 24 horas", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 5, 12, 0, 0));

    await getSavedAiReport({ month: "11", year: 2026 });

    expect(mocks.count).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        createdAt: { gte: new Date(2026, 10, 4, 12, 0, 0) },
      },
    });

    vi.useRealTimers();
  });
});
