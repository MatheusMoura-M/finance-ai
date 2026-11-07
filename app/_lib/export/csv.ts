import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_OPTIONS,
} from "@/app/_constants/transactions";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { format } from "date-fns";

export interface CsvTransaction {
  date: Date;
  name: string;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  amount: number;
}

/** Limite de linhas por exportação (proteção contra arquivos gigantes). */
export const MAX_EXPORT_ROWS = 10_000;

// Excel em português usa ";" entre colunas e "," nos decimais.
const SEPARATOR = ";";
const LINE_BREAK = "\r\n";
// BOM: faz o Excel reconhecer UTF-8 (acentos corretos).
const BOM = "\uFEFF";

const TYPE_LABELS = Object.fromEntries(
  TRANSACTION_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<TransactionType, string>;

/**
 * Escapa um texto para o CSV. Textos que começam com = + - @ ganham um
 * apóstrofo na frente, para a planilha não executá-los como fórmula
 * (o nome da transação é digitado pelo usuário).
 */
export const escapeCsvText = (value: string) => {
  let text = value;

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/[";\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

/** Valor com sinal (entrada positiva, saída negativa) e vírgula decimal. */
export const formatCsvAmount = (type: TransactionType, amount: number) => {
  const signed = type === TransactionType.DEPOSIT ? amount : -amount;

  return signed.toFixed(2).replace(".", ",");
};

export const buildTransactionsCsv = (transactions: CsvTransaction[]) => {
  const header = [
    "Data",
    "Nome",
    "Tipo",
    "Categoria",
    "Método de pagamento",
    "Valor",
  ];

  const rows = transactions.map((transaction) => [
    format(transaction.date, "dd/MM/yyyy"),
    escapeCsvText(transaction.name),
    TYPE_LABELS[transaction.type],
    TRANSACTION_CATEGORY_LABELS[transaction.category],
    TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod],
    formatCsvAmount(transaction.type, transaction.amount),
  ]);

  return (
    BOM +
    [header, ...rows].map((row) => row.join(SEPARATOR)).join(LINE_BREAK) +
    LINE_BREAK
  );
};
