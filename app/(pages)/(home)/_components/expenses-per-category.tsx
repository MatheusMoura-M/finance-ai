import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constants/transactions";
import { TotalExpensePerCategory } from "@/app/_data/get-dashboard/types";
import {
  BudgetLevel,
  BudgetMap,
  getBudgetStatus,
} from "@/app/_lib/budgets/resolve";
import { cn } from "@/app/_lib/utils";
import { formatCurrency } from "@/app/_utils/currency";
import { TransactionCategory } from "@prisma/client";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckIcon,
  HandCoins,
} from "lucide-react";
import BudgetsDialog from "./budgets-dialog";

interface ExpensesPerCategoryProps {
  expensesPerCategory: TotalExpensePerCategory[];
  budgets: BudgetMap;
  month: number;
  year: number;
}

const LEVEL_STYLES: Record<
  BudgetLevel,
  { bar: string; text: string; Icon: typeof CheckIcon }
> = {
  ok: { bar: "bg-primary", text: "text-muted-foreground", Icon: CheckIcon },
  warning: {
    bar: "bg-warning",
    text: "text-warning",
    Icon: AlertTriangleIcon,
  },
  over: { bar: "bg-danger", text: "text-danger", Icon: AlertCircleIcon },
};

const ExpensesPerCategory = ({
  expensesPerCategory,
  budgets,
  month,
  year,
}: ExpensesPerCategoryProps) => {
  // Categorias com gasto no mês + categorias com orçamento ainda sem gasto.
  const spentByCategory = new Map(
    expensesPerCategory.map((item) => [item.category, item]),
  );
  const budgetOnly = (Object.keys(budgets) as TransactionCategory[]).filter(
    (category) => !spentByCategory.has(category),
  );

  const rows = [
    ...expensesPerCategory,
    ...budgetOnly.map((category) => ({
      category,
      totalAmount: 0,
      percentageOfTotal: 0,
    })),
  ];

  return (
    <div className="col-span-1 h-full min-h-[325px] rounded-md border pb-6 lg:col-span-2">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-bold">Gastos por categoria</CardTitle>
        <BudgetsDialog month={month} year={year} budgets={budgets} />
      </CardHeader>

      <ScrollArea className="h-[78%] pr-3">
        <CardContent className="scrollbar-custom h-full space-y-6 overflow-auto px-[14px] md:px-5 lg:px-4 lg2:px-6">
          {rows.length > 0 ? (
            rows.map((row) => {
              const budget = budgets[row.category];
              const label = TRANSACTION_CATEGORY_LABELS[row.category];

              if (!budget) {
                return (
                  <div key={row.category} className="space-y-2">
                    <div className="flex w-full justify-between gap-2">
                      <p className="text-sm font-bold">{label}</p>
                      <p className="text-sm">
                        <span className="font-bold">
                          {formatCurrency(row.totalAmount)}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          · {row.percentageOfTotal}% do total
                        </span>
                      </p>
                    </div>

                    <Progress
                      value={row.percentageOfTotal}
                      aria-label={`${label}: ${row.percentageOfTotal}% do total de despesas`}
                    />
                  </div>
                );
              }

              const status = getBudgetStatus(row.totalAmount, budget);
              const { bar, text, Icon } = LEVEL_STYLES[status.level];

              return (
                <div key={row.category} className="space-y-2">
                  <div className="flex w-full justify-between gap-2">
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-sm">
                      <span className="font-bold">
                        {formatCurrency(row.totalAmount)}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        de {formatCurrency(budget)}
                      </span>
                    </p>
                  </div>

                  <Progress
                    value={Math.min(status.percent, 100)}
                    indicatorClassName={bar}
                    aria-label={`${label}: ${status.percent}% do orçamento`}
                  />

                  <div className="flex justify-between gap-2 text-xs">
                    <span className={cn("flex items-center gap-1", text)}>
                      <Icon size={12} aria-hidden />
                      {status.percent}% do orçamento
                    </span>
                    <span className="text-muted-foreground">
                      {status.remaining >= 0
                        ? `restam ${formatCurrency(status.remaining)}`
                        : `${formatCurrency(-status.remaining)} acima`}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-2">
                <h2 className="text-xl text-muted-foreground xl2:text-2xl">
                  Você não tem gastos esse mês
                </h2>
                <HandCoins size={32} color="#a1a1aa" />
              </div>
              <p className="text-sm text-muted-foreground">
                Use &quot;Orçamentos&quot; para definir quanto quer gastar em
                cada categoria.
              </p>
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </div>
  );
};

export default ExpensesPerCategory;
