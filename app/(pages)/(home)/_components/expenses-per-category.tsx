import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constants/transactions";
import { TotalExpensePerCategory } from "@/app/_data/get-dashboard/types";
import { HandCoins } from "lucide-react";

interface ExpensesPerCategoryProps {
  expensesPerCategory: TotalExpensePerCategory[];
}

const ExpensesPerCategory = ({
  expensesPerCategory,
}: ExpensesPerCategoryProps) => {
  return (
    <div className="col-span-1 h-full min-h-[325px] rounded-md border pb-6 lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-bold">Gastos por categoria</CardTitle>
      </CardHeader>

      <ScrollArea className="h-[78%] pr-3">
        <CardContent className="scrollbar-custom h-full space-y-6 overflow-auto px-[14px] md:px-5 lg:px-4 lg2:px-6">
          {expensesPerCategory.length > 0 ? (
            expensesPerCategory.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex w-full justify-between">
                  <p className="text-sm font-bold">
                    {TRANSACTION_CATEGORY_LABELS[category.category]}
                  </p>

                  <p className="text-sm font-bold">
                    {category.percentageOfTotal}%
                  </p>
                </div>

                <Progress value={category.percentageOfTotal} />
              </div>
            ))
          ) : (
            <div className="flex h-full items-center justify-center gap-2">
              <h2 className="text-xl text-muted-foreground xl2:text-2xl">
                Você não tem gastos esse mês
              </h2>
              <HandCoins size={32} color="#a1a1aa" />
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </div>
  );
};

export default ExpensesPerCategory;
