import { getUserSubscription } from "@/app/_data/get-user-subscription";
import { getAiReportInput } from "@/app/_lib/ai-report/data";
import { buildAiReportPrompt } from "@/app/_lib/ai-report/prompt";
import { generateAiReportSchema } from "@/app/_lib/ai-report/schema";
import {
  DEFAULT_AI_REPORT_MODEL,
  DUMMY_AI_REPORT_MODEL,
  streamAiReport,
} from "@/app/_lib/ai-report/stream";
import { getAiReportUsage } from "@/app/_lib/ai-report/usage";
import { getServerEnv } from "@/app/_lib/env";
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const errorResponse = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

/**
 * Gera o relatório de IA de um mês em streaming (texto puro, pedaço por
 * pedaço). Quando termina, salva o relatório para o usuário rever depois.
 * Só para Premium e com limite de gerações por dia.
 */
export const POST = async (request: Request) => {
  let subscription;

  try {
    subscription = await getUserSubscription();
  } catch {
    return errorResponse("Você precisa estar logado.", 401);
  }

  const { userId, hasPremiumPlan } = subscription;

  if (!hasPremiumPlan) {
    return errorResponse(
      "Você precisa do Plano Premium para gerar relatórios com IA.",
      403,
    );
  }

  const parsed = generateAiReportSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return errorResponse("Dados inválidos.", 400);
  }

  const month = Number(parsed.data.month);
  const { year } = parsed.data;

  const usage = await getAiReportUsage(userId);

  if (usage.remaining === 0) {
    return errorResponse(
      `Você atingiu o limite de ${usage.limit} relatórios em 24 horas. Tente novamente mais tarde.`,
      429,
    );
  }

  const input = await getAiReportInput(userId, month, year);

  // Sem transações não há o que analisar (e não gasta a cota nem a IA).
  if (input.current.transactionCount === 0) {
    return errorResponse(
      "Não há transações neste mês para gerar o relatório.",
      400,
    );
  }

  const { OPENAI_API_KEY, OPENAI_MODEL } = getServerEnv();
  const model = OPENAI_API_KEY
    ? (OPENAI_MODEL ?? DEFAULT_AI_REPORT_MODEL)
    : DUMMY_AI_REPORT_MODEL;

  const pieces = streamAiReport({
    prompt: buildAiReportPrompt(input),
    apiKey: OPENAI_API_KEY,
    model,
  })[Symbol.asyncIterator]();

  // Busca o primeiro pedaço antes de responder: se a IA falhar logo de cara
  // (chave inválida, serviço fora do ar), o cliente recebe um erro claro em
  // vez de um 200 com o stream quebrado.
  let first: IteratorResult<string>;

  try {
    first = await pieces.next();
  } catch (error) {
    console.error("[ai-report] falha ao iniciar:", error);

    return errorResponse(
      "Não foi possível gerar o relatório agora. Tente novamente em instantes.",
      502,
    );
  }

  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let content = "";

      try {
        for (let result = first; !result.done; result = await pieces.next()) {
          content += result.value;
          controller.enqueue(encoder.encode(result.value));
        }

        // Só salva (e conta no limite) relatórios que terminaram.
        if (content.trim()) {
          await db.aiReport.create({
            data: { userId, month, year, content, model },
          });
        }

        controller.close();
      } catch (error) {
        console.error("[ai-report] falha ao gerar:", error);
        controller.error(error);
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
