"use server";

import { ActionError, runAction } from "@/app/_lib/action-result";
import { getBudgetsForMonth } from "@/app/_lib/budgets/queries";
import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { SaveBudgetsSchema, saveBudgetsSchema } from "./schema";

/**
 * Salva os orçamentos do mês.
 * - "fromThisMonth": grava o valor a partir deste mês (e remove um eventual
 *   ajuste "só neste mês", para o novo valor valer já neste mês).
 * - "onlyThisMonth": grava um ajuste só para este mês; se o valor for igual
 *   ao que já valeria, remove o ajuste.
 * Só grava as categorias cujo valor mudou.
 */
export const saveBudgets = async (params: SaveBudgetsSchema) =>
  runAction(async () => {
    const { month, year, scope, budgets } = saveBudgetsSchema.parse(params);

    const { userId } = await auth();

    if (!userId) {
      throw new ActionError("Você precisa estar logado.");
    }

    const { effective, base } = await getBudgetsForMonth(userId, month, year);

    const operations: Prisma.PrismaPromise<unknown>[] = [];

    const uniqueKey = (
      category: (typeof budgets)[number]["category"],
      onlyThisMonth: boolean,
    ) => ({
      userId_category_year_month_onlyThisMonth: {
        userId,
        category,
        year,
        month,
        onlyThisMonth,
      },
    });

    for (const { category, amount } of budgets) {
      const current = effective[category] ?? null;
      const baseAmount = base[category] ?? null;

      if (scope === "fromThisMonth") {
        // Nada mudou e não há ajuste do mês: não precisa gravar.
        if (amount === current && current === baseAmount) continue;

        operations.push(
          db.budget.deleteMany({
            where: { userId, category, year, month, onlyThisMonth: true },
          }),
        );

        if (amount === baseAmount) continue;

        operations.push(
          db.budget.upsert({
            where: uniqueKey(category, false),
            create: { userId, category, year, month, amount },
            update: { amount },
          }),
        );
        continue;
      }

      // "Só neste mês"
      if (amount === current) continue;

      if (amount === baseAmount) {
        operations.push(
          db.budget.deleteMany({
            where: { userId, category, year, month, onlyThisMonth: true },
          }),
        );
        continue;
      }

      operations.push(
        db.budget.upsert({
          where: uniqueKey(category, true),
          create: {
            userId,
            category,
            year,
            month,
            amount,
            onlyThisMonth: true,
          },
          update: { amount },
        }),
      );
    }

    if (operations.length) {
      await db.$transaction(operations);
    }

    revalidatePath("/");
  });
