import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserSubscription: vi.fn(),
  getAiReportInput: vi.fn(),
  getBudgetsForMonth: vi.fn(),
  findMany: vi.fn(),
  renderMonthReportPdf: vi.fn(),
}));

vi.mock("@/app/_data/get-user-subscription", () => ({
  getUserSubscription: mocks.getUserSubscription,
}));
vi.mock("@/app/_lib/ai-report/data", () => ({
  getAiReportInput: mocks.getAiReportInput,
}));
vi.mock("@/app/_lib/budgets/queries", () => ({
  getBudgetsForMonth: mocks.getBudgetsForMonth,
}));
vi.mock("@/app/_lib/export/month-report-pdf", () => ({
  renderMonthReportPdf: mocks.renderMonthReportPdf,
}));
vi.mock("@/app/_lib/prisma", () => ({
  db: { transaction: { findMany: mocks.findMany } },
}));

import { GET } from "./route";

const totals = {
  deposits: 0,
  expenses: 0,
  investments: 0,
  balance: 0,
  transactionCount: 0,
};

const request = (query: string) =>
  new NextRequest(`http://localhost/api/reports/month${query}`);

describe("GET /api/reports/month", () => {
  beforeEach(() => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: true,
    });
    mocks.getAiReportInput.mockResolvedValue({
      month: 11,
      year: 2026,
      previousMonth: 10,
      previousYear: 2026,
      current: totals,
      previous: totals,
      expensesByCategory: [],
      topExpenses: [],
    });
    mocks.getBudgetsForMonth.mockResolvedValue({ effective: {}, base: {} });
    mocks.findMany.mockResolvedValue([]);
    mocks.renderMonthReportPdf.mockResolvedValue(Buffer.from("%PDF-1.4"));
  });

  it("recusa usuário não autenticado", async () => {
    mocks.getUserSubscription.mockRejectedValue(new Error("Unauthorized"));

    expect((await GET(request("?month=11&year=2026"))).status).toBe(401);
  });

  it("é exclusivo do Plano Premium", async () => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: false,
    });

    const response = await GET(request("?month=11&year=2026"));

    expect(response.status).toBe(403);
    expect(mocks.renderMonthReportPdf).not.toHaveBeenCalled();
  });

  it("recusa mês inválido", async () => {
    expect((await GET(request("?month=13&year=2026"))).status).toBe(400);
    expect((await GET(request(""))).status).toBe(400);
  });

  it("gera o PDF do mês com os dados só do usuário", async () => {
    const response = await GET(request("?month=11&year=2026"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="relatorio-novembro-de-2026.pdf"',
    );
    expect(mocks.getAiReportInput).toHaveBeenCalledWith("user_1", 11, 2026);
    expect(mocks.getBudgetsForMonth).toHaveBeenCalledWith("user_1", 11, 2026);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user_1",
          date: {
            gte: new Date(2026, 10, 1, 0, 0, 0, 0),
            lte: new Date(2026, 10, 30, 23, 59, 59, 999),
          },
        },
      }),
    );
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe(
      "%PDF-1.4",
    );
  });
});
