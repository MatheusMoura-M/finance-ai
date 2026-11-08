import AddTransactionButton from "@/app/_components/add-transaction-button";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { cn } from "@/app/_lib/utils";
import { ReactNode } from "react";
import MonthVariation, { MonthComparison } from "./month-variation";

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  amount: number;
  size?: "small" | "large";
  userCanAddTransaction?: boolean;
  className?: string;
  comparison?: MonthComparison;
}
const SummaryCard = ({
  icon,
  title,
  amount,
  size = "small",
  userCanAddTransaction,
  className,
  comparison,
}: SummaryCardProps) => {
  return (
    <Card
      className={cn(`${size === "large" ? "bg-foreground/5" : ""}`, className)}
    >
      <CardHeader className="flex-row items-center gap-4 space-y-0 px-3.5 pt-4.5 pb-3 md:px-5 lg:px-4 lg2:px-6">
        {icon}

        <p
          className={
            size === "small" ? "text-muted-foreground" : "text-foreground/70"
          }
        >
          {title}
        </p>
      </CardHeader>

      <CardContent className="flex justify-between px-3.5 pb-4.5 sm:flex-row sm:items-stretch sm:space-x-0 md:px-5 lg:px-4 lg2:px-6">
        <div className="space-y-1">
          <p
            className={`font-bold ${size === "small" ? "text-lg md:text-xl lg:text-2xl" : "text-xl md:text-2xl lg:text-3xl"}`}
          >
            {Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(amount)}
          </p>

          {comparison && <MonthVariation current={amount} {...comparison} />}
        </div>

        {size === "large" && (
          <AddTransactionButton
            userCanAddTransaction={userCanAddTransaction}
            isHomePage
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
