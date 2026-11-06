import OpenAi from "openai";
import { DUMMY_REPORT } from "./dummy-report";
import { AI_REPORT_SYSTEM_PROMPT } from "./prompt";

export const DEFAULT_AI_REPORT_MODEL = "gpt-4o-mini";
export const DUMMY_AI_REPORT_MODEL = "dummy";

interface StreamAiReportOptions {
  prompt: string;
  apiKey?: string;
  model: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Gera o relatório em pedaços de texto. Sem OPENAI_API_KEY, devolve o
 * relatório de exemplo em pedaços, para simular o streaming em desenvolvimento.
 */
export async function* streamAiReport({
  prompt,
  apiKey,
  model,
}: StreamAiReportOptions): AsyncGenerator<string> {
  if (!apiKey) {
    for (const piece of DUMMY_REPORT.match(/\S+\s*/g) ?? []) {
      await sleep(15);
      yield piece;
    }
    return;
  }

  const openAi = new OpenAi({ apiKey });

  const stream = await openAi.chat.completions.create({
    model,
    stream: true,
    messages: [
      { role: "system", content: AI_REPORT_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  for await (const chunk of stream) {
    const piece = chunk.choices[0]?.delta?.content;

    if (piece) yield piece;
  }
}
