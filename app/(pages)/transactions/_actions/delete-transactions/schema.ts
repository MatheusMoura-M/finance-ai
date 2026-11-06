import { z } from "zod";

export const deleteTransactionsSchema = z.object({
  transactionId: z.string().uuid(),
  /** Numa compra parcelada: apagar só esta parcela ou todas as parcelas. */
  scope: z.enum(["single", "allInstallments"]).default("single"),
});

export type DeleteTransactionSchema = z.input<typeof deleteTransactionsSchema>;
