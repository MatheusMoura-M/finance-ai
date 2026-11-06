"use server";

import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { ActionError, runAction } from "@/app/_lib/action-result";
import {
  GenerateAiReportSchema,
  generateAiReportSchema,
} from "@/app/_lib/ai-report/schema";
import { getAiReportUsage } from "@/app/_lib/ai-report/usage";
import { db } from "@/app/_lib/prisma";

/**
 * Último relatório salvo do mês (se houver) e quantas gerações ainda restam
 * nas últimas 24 horas. Não chama a IA.
 */
export const getSavedAiReport = async (params: GenerateAiReportSchema) =>
  runAction(async () => {
    const { month, year } = generateAiReportSchema.parse(params);

    const { userId, hasPremiumPlan } = await getUserSubscription();

    if (!hasPremiumPlan) {
      throw new ActionError(
        "Você precisa do Plano Premium para gerar relatórios com IA.",
      );
    }

    const [report, usage] = await Promise.all([
      db.aiReport.findFirst({
        where: { userId, month: Number(month), year },
        orderBy: { createdAt: "desc" },
        select: { content: true, createdAt: true },
      }),
      getAiReportUsage(userId),
    ]);

    return { report, usage };
  });
