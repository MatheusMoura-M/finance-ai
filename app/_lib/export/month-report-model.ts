import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from "@/app/_constants/transactions";
import type { AiReportInput } from "@/app/_lib/ai-report/data";
import { formatVariation } from "@/app/_lib/ai-report/prompt";
import { BudgetMap, getBudgetStatus } from "@/app/_lib/budgets/resolve";
import { formatCurrency } from "@/app/_utils/currency";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ReportTransaction {
  date: Date;
  name: string;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  amount: number;
}

export type ReportTone = "positive" | "negative" | "neutral";

export interface MonthReportModel {
  title: string;
  fileName: string;
  generatedAt: string;
  previousLabel: string;
  summary: { label: string; value: string; variation: string }[];
  categories: {
    label: string;
    spent: string;
    share: string;
    budget: string;
    status: string;
    tone: ReportTone;
  }[];
  transactions: {
    date: string;
    name: string;
    category: string;
    paymentMethod: string;
    amount: string;
    tone: ReportTone;
  }[];
}

// O PDF usa a fonte padrão Helvetica, que não tem o sinal "−" (U+2212).
const formatMoney = (value: number) => formatCurrency(value).replace(/−/g, "-");

const monthName = (month: number, year: number) =>
  format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: ptBR });

const slug = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Monta os textos do relatório mensal em PDF: resumo com variação em relação
 * ao mês anterior, gastos por categoria (com orçamento, quando houver) e a
 * lista de transações do mês.
 */
export const buildMonthReportModel = ({
  input,
  budgets,
  transactions,
  now = new Date(),
}: {
  input: AiReportInput;
  budgets: BudgetMap;
  transactions: ReportTransaction[];
  now?: Date;
}): MonthReportModel => {
  const period = monthName(input.month, input.year);
  const previousLabel = format(
    new Date(input.previousYear, input.previousMonth - 1, 1),
    "MMMM",
    { locale: ptBR },
  );
  const { current, previous } = input;

  const summary = [
    {
      label: "Receitas",
      value: formatMoney(current.deposits),
      variation: formatVariation(current.deposits, previous.deposits),
    },
    {
      label: "Despesas",
      value: formatMoney(current.expenses),
      variation: formatVariation(current.expenses, previous.expenses),
    },
    {
      label: "Investimentos",
      value: formatMoney(current.investments),
      variation: formatVariation(current.investments, previous.investments),
    },
    {
      label: "Saldo",
      value: formatMoney(current.balance),
      variation:
        previous.transactionCount === 0
          ? "sem base no mês anterior"
          : `${current.balance >= previous.balance ? "+" : "-"}${formatMoney(Math.abs(current.balance - previous.balance))}`,
    },
  ];

  // Categorias com gasto no mês + categorias com orçamento ainda sem gasto.
  const spentByCategory = new Map(
    input.expensesByCategory
      .filter((item) => item.total > 0)
      .map((item) => [item.category, item.total]),
  );
  (Object.keys(budgets) as TransactionCategory[]).forEach((category) => {
    if (!spentByCategory.has(category)) spentByCategory.set(category, 0);
  });

  const categories = Array.from(spentByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, spent]) => {
      const budget = budgets[category];
      const share =
        current.expenses > 0 ? Math.round((spent / current.expenses) * 100) : 0;

      if (!budget) {
        return {
          label: TRANSACTION_CATEGORY_LABELS[category],
          spent: formatMoney(spent),
          share: `${share}%`,
          budget: "-",
          status: "-",
          tone: "neutral" as ReportTone,
        };
      }

      const status = getBudgetStatus(spent, budget);

      return {
        label: TRANSACTION_CATEGORY_LABELS[category],
        spent: formatMoney(spent),
        share: `${share}%`,
        budget: formatMoney(budget),
        status:
          status.remaining >= 0
            ? `${status.percent}% · restam ${formatMoney(status.remaining)}`
            : `${status.percent}% · ${formatMoney(-status.remaining)} acima`,
        tone: (status.level === "over" ? "negative" : "neutral") as ReportTone,
      };
    });

  return {
    title: `Relatório de ${period}`,
    fileName: `relatorio-${slug(period)}.pdf`,
    generatedAt: format(now, "dd/MM/yyyy 'às' HH:mm"),
    previousLabel,
    summary,
    categories,
    transactions: transactions.map((transaction) => {
      const isIncome = transaction.type === TransactionType.DEPOSIT;

      return {
        date: format(transaction.date, "dd/MM"),
        name: transaction.name,
        category: TRANSACTION_CATEGORY_LABELS[transaction.category],
        paymentMethod:
          TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod],
        amount: `${isIncome ? "+" : "-"}${formatMoney(transaction.amount)}`,
        tone: isIncome
          ? "positive"
          : transaction.type === TransactionType.EXPENSE
            ? "negative"
            : "neutral",
      };
    }),
  };
};
