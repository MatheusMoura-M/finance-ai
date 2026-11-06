import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserSubscription: vi.fn(),
  getServerEnv: vi.fn(),
  getAiReportInput: vi.fn(),
  getAiReportUsage: vi.fn(),
  streamAiReport: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/app/_data/get-user-subscription", () => ({
  getUserSubscription: mocks.getUserSubscription,
}));
vi.mock("@/app/_lib/env", () => ({ getServerEnv: mocks.getServerEnv }));
vi.mock("@/app/_lib/ai-report/data", () => ({
  getAiReportInput: mocks.getAiReportInput,
}));
vi.mock("@/app/_lib/ai-report/usage", () => ({
  getAiReportUsage: mocks.getAiReportUsage,
}));
vi.mock("@/app/_lib/ai-report/stream", () => ({
  DEFAULT_AI_REPORT_MODEL: "gpt-4o-mini",
  DUMMY_AI_REPORT_MODEL: "dummy",
  streamAiReport: mocks.streamAiReport,
}));
vi.mock("@/app/_lib/prisma", () => ({
  db: { aiReport: { create: mocks.create } },
}));

import { POST } from "./route";

const totals = (transactionCount: number) => ({
  deposits: 0,
  expenses: 0,
  investments: 0,
  balance: 0,
  transactionCount,
});

const request = (body: unknown) =>
  new Request("http://localhost/api/ai-report", {
    method: "POST",
    body: JSON.stringify(body),
  });

async function* pieces(...values: string[]) {
  for (const value of values) yield value;
}

describe("POST /api/ai-report", () => {
  beforeEach(() => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: true,
    });
    mocks.getServerEnv.mockReturnValue({ OPENAI_API_KEY: "sk-test" });
    mocks.getAiReportUsage.mockResolvedValue({
      used: 0,
      limit: 5,
      remaining: 5,
    });
    mocks.getAiReportInput.mockResolvedValue({
      month: 2,
      year: 2026,
      previousMonth: 1,
      previousYear: 2026,
      current: totals(3),
      previous: totals(0),
      expensesByCategory: [],
      topExpenses: [],
    });
    mocks.streamAiReport.mockImplementation(() =>
      pieces("# Relatório", " de fevereiro"),
    );
    mocks.create.mockResolvedValue({});
  });

  it("recusa usuário não autenticado", async () => {
    mocks.getUserSubscription.mockRejectedValue(new Error("Unauthorized"));

    const response = await POST(request({ month: "02", year: 2026 }));

    expect(response.status).toBe(401);
  });

  it("exige Plano Premium", async () => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: false,
    });

    const response = await POST(request({ month: "02", year: 2026 }));

    expect(response.status).toBe(403);
    expect(mocks.streamAiReport).not.toHaveBeenCalled();
  });

  it("recusa mês inválido", async () => {
    const response = await POST(request({ month: "13", year: 2026 }));

    expect(response.status).toBe(400);
  });

  it("bloqueia quando o limite diário acabou", async () => {
    mocks.getAiReportUsage.mockResolvedValue({
      used: 5,
      limit: 5,
      remaining: 0,
    });

    const response = await POST(request({ month: "02", year: 2026 }));

    expect(response.status).toBe(429);
    expect(mocks.getAiReportInput).not.toHaveBeenCalled();
  });

  it("não chama a IA quando o mês não tem transações", async () => {
    mocks.getAiReportInput.mockResolvedValue({
      month: 2,
      year: 2026,
      previousMonth: 1,
      previousYear: 2026,
      current: totals(0),
      previous: totals(0),
      expensesByCategory: [],
      topExpenses: [],
    });

    const response = await POST(request({ month: "02", year: 2026 }));

    expect(response.status).toBe(400);
    expect(mocks.streamAiReport).not.toHaveBeenCalled();
  });

  it("faz streaming do relatório e salva no fim, pelo usuário e mês", async () => {
    const response = await POST(request({ month: "02", year: 2026 }));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("# Relatório de fevereiro");
    expect(mocks.getAiReportInput).toHaveBeenCalledWith("user_1", 2, 2026);
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        month: 2,
        year: 2026,
        content: "# Relatório de fevereiro",
        model: "gpt-4o-mini",
      },
    });
  });

  it("usa o modelo configurado em OPENAI_MODEL", async () => {
    mocks.getServerEnv.mockReturnValue({
      OPENAI_API_KEY: "sk-test",
      OPENAI_MODEL: "gpt-4.1-mini",
    });

    const response = await POST(request({ month: "02", year: 2026 }));
    await response.text();

    expect(mocks.streamAiReport).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4.1-mini", apiKey: "sk-test" }),
    );
  });

  it("devolve 502 e não salva quando a IA falha logo no início", async () => {
    mocks.streamAiReport.mockImplementation(async function* () {
      throw new Error("invalid api key");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request({ month: "02", year: 2026 }));

    expect(response.status).toBe(502);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
