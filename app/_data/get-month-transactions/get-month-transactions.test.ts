import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/app/_lib/prisma", () => ({
  db: { transaction: { count: mocks.count } },
}));

import { getCurrentMonthTransactions } from "./index";

describe("getCurrentMonthTransactions", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.count.mockResolvedValue(3);
  });

  it("conta compras parceladas como 1 (só a 1ª parcela)", async () => {
    expect(await getCurrentMonthTransactions()).toBe(3);
    expect(mocks.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: "user_1",
        OR: [{ installmentNumber: null }, { installmentNumber: 1 }],
      }),
    });
  });
});
