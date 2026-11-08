import {
  TransactionType,
  TransactionCategory,
  TransactionPaymentMethod,
} from "@prisma/client";
import { z } from "zod";

// No Zod 4 a mensagem vai em `error` (antes: required_error/message) e vale
// tanto para campo vazio quanto para valor inválido.
const formSchema = z.object({
  name: z.string().trim().min(1, { error: "O nome é obrigatório." }),
  amount: z
    .number({ error: "O valor é obrigatório." })
    .positive({ error: "O valor deve ser positivo." }),
  type: z.enum(TransactionType, { error: "O tipo é obrigatório." }),
  category: z.enum(TransactionCategory, {
    error: "A categoria é obrigatória.",
  }),
  paymentMethod: z.enum(TransactionPaymentMethod, {
    error: "O método de pagamento é obrigatório.",
  }),
  date: z.date({ error: "A data é obrigatória." }),
  /** Só na criação: repetir todo mês (Premium). */
  repeatMonthly: z.boolean().optional(),
  /** Só na criação: número de parcelas (1 = à vista). */
  installments: z.number().int().min(1).max(24).optional(),
});

type tFormSchema = z.infer<typeof formSchema>;

export { formSchema, type tFormSchema };
