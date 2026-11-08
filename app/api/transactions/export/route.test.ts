import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserSubscription: vi.fn(),
  findMany: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("@/app/_data/get-user-subscription", () => ({
  getUserSubscription: mocks.getUserSubscription,
}));
vi.mock("@/app/_lib/prisma", () => ({
  db: {
    $queryRaw: mocks.queryRaw,
    transaction: { findMany: mocks.findMany },
  },
}));

import ExcelJS from "exceljs";
import { MAX_EXPORT_ROWS, XLSX_CONTENT_TYPE } from "@/app/_lib/export/xlsx";
import { GET } from "./route";

const request = (query = "") =>
  new NextRequest(`http://localhost/api/transactions/export${query}`);

describe("GET /api/transactions/export", () => {
  beforeEach(() => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: true,
    });
    mocks.queryRaw.mockResolvedValue([{ id: "t1" }]);
    mocks.findMany.mockResolvedValue([
      {
        date: new Date(2026, 2, 28, 3),
        name: "Mercado",
        type: "EXPENSE",
        category: "FOOD",
        paymentMethod: "PIX",
        amount: 420,
      },
    ]);
  });

  it("recusa usuário não autenticado", async () => {
    mocks.getUserSubscription.mockRejectedValue(new Error("Unauthorized"));

    expect((await GET(request())).status).toBe(401);
  });

  it("é exclusivo do Plano Premium", async () => {
    mocks.getUserSubscription.mockResolvedValue({
      userId: "user_1",
      hasPremiumPlan: false,
    });

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("exporta com os mesmos filtros e ordenação da tela, só do usuário", async () => {
    const response = await GET(
      request(
        "?category=FOOD&from=2026-01-01&to=2026-03-31&name=mercado&sort=amount&order=asc&page=3",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(XLSX_CONTENT_TYPE);
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="transacoes-finance-ai-\d{4}-\d{2}-\d{2}\.xlsx"$/,
    );
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_1",
        id: { in: ["t1"] },
        date: {
          gte: new Date(2026, 0, 1, 0, 0, 0, 0),
          lte: new Date(2026, 2, 31, 23, 59, 59, 999),
        },
        category: { in: ["FOOD"] },
      },
      orderBy: [{ amount: "asc" }, { createdAt: "desc" }],
      take: MAX_EXPORT_ROWS,
      select: {
        date: true,
        name: true,
        type: true,
        category: true,
        paymentMethod: true,
        amount: true,
      },
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await response.arrayBuffer());
    const row = workbook.getWorksheet("Transações")!.getRow(2);

    expect(row.getCell(2).value).toBe("Mercado");
    expect(row.getCell(4).value).toBe("Alimentação");
    expect(row.getCell(6).value).toBe(-420);
  });
});
