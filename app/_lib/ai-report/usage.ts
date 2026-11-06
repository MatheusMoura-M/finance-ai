import { db } from "@/app/_lib/prisma";
import { subHours } from "date-fns";

/** Quantos relatórios de IA cada usuário pode gerar em 24 horas. */
export const AI_REPORT_DAILY_LIMIT = 5;

export interface AiReportUsage {
  used: number;
  limit: number;
  remaining: number;
}

/** Relatórios gerados pelo usuário nas últimas 24 horas (janela móvel). */
export const getAiReportUsage = async (
  userId: string,
): Promise<AiReportUsage> => {
  const used = await db.aiReport.count({
    where: { userId, createdAt: { gte: subHours(new Date(), 24) } },
  });

  return {
    used,
    limit: AI_REPORT_DAILY_LIMIT,
    remaining: Math.max(0, AI_REPORT_DAILY_LIMIT - used),
  };
};
