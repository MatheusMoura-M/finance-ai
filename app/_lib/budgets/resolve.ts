import { TransactionCategory } from "@prisma/client";

export interface BudgetRow {
  category: TransactionCategory;
  amount: number | null;
  month: number;
  year: number;
  onlyThisMonth: boolean;
}

export type BudgetMap = Partial<Record<TransactionCategory, number>>;

export interface ResolvedBudgets {
  /** Orçamento que vale no mês (já considerando o "só neste mês"). */
  effective: BudgetMap;
  /** Orçamento "a partir de" que valeria no mês sem o ajuste "só neste mês". */
  base: BudgetMap;
}

const monthKey = (year: number, month: number) => year * 12 + (month - 1);

/**
 * Decide qual orçamento vale em cada categoria num mês:
 * 1. um registro "só neste mês" para aquele mês, se houver;
 * 2. senão, o registro "a partir de" mais recente até aquele mês.
 * Valor nulo ou zero significa "sem orçamento".
 */
export const resolveMonthBudgets = (
  rows: BudgetRow[],
  month: number,
  year: number,
): ResolvedBudgets => {
  const target = monthKey(year, month);
  const latestBase = new Map<
    TransactionCategory,
    { key: number; amount: number | null }
  >();
  const overrides = new Map<TransactionCategory, number | null>();

  for (const row of rows) {
    const key = monthKey(row.year, row.month);

    if (row.onlyThisMonth) {
      if (key === target) overrides.set(row.category, row.amount);
      continue;
    }

    const current = latestBase.get(row.category);

    if (key <= target && (!current || key > current.key)) {
      latestBase.set(row.category, { key, amount: row.amount });
    }
  }

  const base: BudgetMap = {};
  const effective: BudgetMap = {};

  latestBase.forEach(({ amount }, category) => {
    if (amount) base[category] = amount;
  });

  const categories = new Set<TransactionCategory>();
  latestBase.forEach((_, category) => categories.add(category));
  overrides.forEach((_, category) => categories.add(category));

  categories.forEach((category) => {
    const amount = overrides.has(category)
      ? overrides.get(category)
      : base[category];

    if (amount) effective[category] = amount;
  });

  return { effective, base };
};

export type BudgetLevel = "ok" | "warning" | "over";

/** Situação de uma categoria em relação ao orçamento. */
export const getBudgetStatus = (spent: number, budget: number) => {
  const percent = Math.round((spent / budget) * 100);
  const level: BudgetLevel =
    spent > budget ? "over" : percent >= 80 ? "warning" : "ok";

  return {
    percent,
    level,
    /** Positivo: quanto ainda pode gastar. Negativo: quanto passou. */
    remaining: Math.round((budget - spent) * 100) / 100,
  };
};
