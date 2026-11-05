"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { DeleteTransactionSchema, deleteTransactionsSchema } from "./schema";

export const deleteTransaction = async (params: DeleteTransactionSchema) => {
  const { transactionId } = deleteTransactionsSchema.parse(params);

  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // deleteMany com userId garante que só o dono consegue apagar a transação.
  const { count } = await db.transaction.deleteMany({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (count === 0) {
    throw new Error("Transaction not found");
  }

  revalidatePath("/transactions");
  revalidatePath("/");
};
