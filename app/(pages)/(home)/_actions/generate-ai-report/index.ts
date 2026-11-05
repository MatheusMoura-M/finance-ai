"use server";

import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import OpenAi from "openai";
import { generateAiReportSchema, GenerateAiReportSchema } from "./schema";
import { DUMMY_REPORT } from "./dummy-report";
import { getMonthDateRange } from "@/app/_utils/date";

export const generateAiReport = async (params: GenerateAiReportSchema) => {
  const { month, year } = generateAiReportSchema.parse(params);

  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await clerkClient().users.getUser(userId);

  const hasPremiumPlan = user.publicMetadata.subscriptionPlan === "premium";

  if (!hasPremiumPlan) {
    throw new Error("You need a premium plan to generate AI reports");
  }

  if (!process.env.OPENAI_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return DUMMY_REPORT;
  }

  const openAi = new OpenAi({
    apiKey: process.env.OPENAI_API_KEY,
  });

  //Pegar as transações do usuário no mês/ano recebidos
  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: getMonthDateRange(month, year),
    },
  });

  //Mandar as transações para o ChatGPT e pedir pra ele gerar o relatório
  const content = `Gere um relatório com insights sobre as minhas finanças, com dicas e orientações de como melhorar minha vida financeira. As transações estão divididas por ponto e vírgula. A estrutura de cada uma é {DATA}-{TIPO}-{VALOR}-{CATEGORIA}. Sempre traduza os nomes das categorias para português do Brasil. São elas:
 
  ${transactions
    .map(
      (transaction) =>
        `${transaction.date.toLocaleDateString("pt-BR")}-${transaction.type}-R$${transaction.amount}-${transaction.category}`,
    )
    .join(";")}`;

  const completion = await openAi.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Você é um especialista em gestão e organização de finanças pessoais. Você ajuda as pessoas a organizarem melhor as suas finanças.",
      },
      {
        role: "user",
        content,
      },
    ],
  });

  //Pegar o relatório e retornar ao usuário
  return completion.choices[0].message.content;
};
