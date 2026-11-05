import {
  TRANSACTION_CATEGORY_OPTIONS,
  TRANSACTION_PAYMENT_METHOD_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from "@/app/_constants/transactions";
import { TransactionType } from "@prisma/client";
import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";

// As opções usam os próprios valores do enum do Prisma (ex.: "UTILITY"),
// assim o filtro e o contador de cada opção batem com os dados da tabela.

export const categories = TRANSACTION_CATEGORY_OPTIONS;

export const incomeType = TRANSACTION_TYPE_OPTIONS.map((option) => ({
  ...option,
  icon: option.value === TransactionType.DEPOSIT ? ArrowUpIcon : ArrowDownIcon,
}));

export const paymentMethods = TRANSACTION_PAYMENT_METHOD_OPTIONS;
