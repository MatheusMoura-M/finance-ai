"use server";

import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { ActionError, runAction } from "@/app/_lib/action-result";
import { buildHistoryIndex } from "@/app/_lib/categorize/suggest";
import {
  StatementParseError,
  parseStatement,
} from "@/app/_lib/import/parse-statement";
import { buildImportPreview } from "@/app/_lib/import/preview";
import { db } from "@/app/_lib/prisma";
import { endOfDay, startOfDay } from "date-fns";
import { revalidatePath } from "next/cache";
import {
  ConfirmImportSchema,
  MAX_IMPORT_ROWS,
  PreviewStatementSchema,
  confirmImportSchema,
  previewStatementSchema,
} from "./schema";

/** Quantas transações recentes usar como histórico para sugerir categorias. */
const HISTORY_SIZE = 2_000;

const requirePremium = async () => {
  const { userId, hasPremiumPlan } = await getUserSubscription();

  if (!hasPremiumPlan) {
    throw new ActionError("Importar extrato é um recurso do Plano Premium.");
  }

  return userId;
};

/**
 * Lê o extrato e devolve a prévia: cada lançamento com tipo, categoria e
 * forma de pagamento sugeridos, e o que deve vir desmarcado. Não salva nada.
 */
export const previewStatementImport = async (params: PreviewStatementSchema) =>
  runAction(async () => {
    const userId = await requirePremium();
    const { content } = previewStatementSchema.parse(params);

    let statement;

    try {
      statement = parseStatement(content);
    } catch (error) {
      if (error instanceof StatementParseError) {
        throw new ActionError(error.message);
      }
      throw error;
    }

    if (statement.entries.length > MAX_IMPORT_ROWS) {
      throw new ActionError(
        `O arquivo tem ${statement.entries.length} transações. Importe no máximo ${MAX_IMPORT_ROWS} por vez (por exemplo, um mês de cada vez).`,
      );
    }

    const dates = statement.entries.map((entry) => entry.date.getTime());

    const [history, existing] = await Promise.all([
      db.transaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: HISTORY_SIZE,
        select: { name: true, category: true, paymentMethod: true },
      }),
      db.transaction.findMany({
        where: {
          userId,
          date: {
            gte: startOfDay(new Date(Math.min(...dates))),
            lte: endOfDay(new Date(Math.max(...dates))),
          },
        },
        select: { date: true, amount: true, type: true, importHash: true },
      }),
    ]);

    return {
      format: statement.format,
      isCardStatement: statement.isCardStatement,
      rows: buildImportPreview({
        statement,
        history: buildHistoryIndex(history),
        existing: existing.map((transaction) => ({
          ...transaction,
          amount: Number(transaction.amount),
        })),
      }),
    };
  });

/**
 * Salva os lançamentos marcados na prévia. Lançamentos já importados antes
 * (mesmo importHash) são ignorados, então repetir a importação não duplica.
 */
export const confirmStatementImport = async (params: ConfirmImportSchema) =>
  runAction(async () => {
    const userId = await requirePremium();
    const { rows } = confirmImportSchema.parse(params);

    const { count } = await db.transaction.createMany({
      data: rows.map((row) => ({ ...row, date: new Date(row.date), userId })),
      skipDuplicates: true,
    });

    revalidatePath("/transactions");
    revalidatePath("/");

    return { imported: count, skipped: rows.length - count };
  });
