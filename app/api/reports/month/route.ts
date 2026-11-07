import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { getAiReportInput } from "@/app/_lib/ai-report/data";
import { getBudgetsForMonth } from "@/app/_lib/budgets/queries";
import { buildMonthReportModel } from "@/app/_lib/export/month-report-model";
import { renderMonthReportPdf } from "@/app/_lib/export/month-report-pdf";
import { db } from "@/app/_lib/prisma";
import { getMonthDateRange } from "@/app/_utils/date";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(1900).max(2100),
});

/** Relatório do mês em PDF (resumo, categorias e transações). Só Premium. */
export const GET = async (request: NextRequest) => {
  let subscription;

  try {
    subscription = await getUserSubscription();
  } catch {
    return NextResponse.json(
      { error: "Você precisa estar logado." },
      { status: 401 },
    );
  }

  if (!subscription.hasPremiumPlan) {
    return NextResponse.json(
      { error: "O relatório em PDF é um recurso do Plano Premium." },
      { status: 403 },
    );
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  if (!parsed.success) {
    return NextResponse.json({ error: "Mês inválido." }, { status: 400 });
  }

  const { month, year } = parsed.data;
  const { userId } = subscription;

  const [input, { effective: budgets }, transactions] = await Promise.all([
    getAiReportInput(userId, month, year),
    getBudgetsForMonth(userId, month, year),
    db.transaction.findMany({
      where: { userId, date: getMonthDateRange(month, year) },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: {
        date: true,
        name: true,
        type: true,
        category: true,
        paymentMethod: true,
        amount: true,
      },
    }),
  ]);

  const model = buildMonthReportModel({
    input,
    budgets,
    transactions: transactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    })),
  });

  const pdf = await renderMonthReportPdf(model);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${model.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
};
