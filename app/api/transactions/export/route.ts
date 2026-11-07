import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { parseTransactionsSearchParams } from "@/app/_data/get-transactions/search-params";
import { buildTransactionsWhere } from "@/app/_data/get-transactions/where";
import { MAX_EXPORT_ROWS, buildTransactionsCsv } from "@/app/_lib/export/csv";
import { db } from "@/app/_lib/prisma";
import { format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Exporta em CSV as transações do usuário com os mesmos filtros e a mesma
 * ordenação da tela de transações (lidos da query string). Só Premium.
 */
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
      { error: "Exportar é um recurso do Plano Premium." },
      { status: 403 },
    );
  }

  const params = parseTransactionsSearchParams(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  const { where } = buildTransactionsWhere(subscription.userId, params);

  const transactions = await db.transaction.findMany({
    where,
    orderBy: [{ [params.sort]: params.order }, { createdAt: "desc" }],
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

  const csv = buildTransactionsCsv(
    transactions.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
    })),
  );

  const filename = `transacoes-finance-ai-${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
};
