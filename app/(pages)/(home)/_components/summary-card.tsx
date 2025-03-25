import AddTransactionButton from "@/app/_components/add-transaction-button";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { cn } from "@/app/_lib/utils";
import { ReactNode } from "react";

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  amount: number;
  size?: "small" | "large";
  userCanAddTransaction?: boolean;
  className?: string;
}
const SummaryCard = ({
  icon,
  title,
  amount,
  size = "small",
  userCanAddTransaction,
  className,
}: SummaryCardProps) => {
  return (
    <Card
      className={cn(
        `${size === "large" ? "bg-white bg-opacity-5" : ""}`,
        className,
      )}
    >
      <CardHeader
        className={`px-[14px] pb-3 pt-[18px] md:px-5 lg:px-4 lg2:px-6 ${size === "large" ? "flex-row items-center gap-4" : "flex-row items-center gap-4"}`}
      >
        {icon}

        <p
          className={`!mt-0 ${size === "small" ? "text-muted-foreground" : "text-white opacity-70"}`}
        >
          {title}
        </p>
      </CardHeader>

      <CardContent className="flex justify-between px-[14px] pb-[18px] sm:flex-row sm:items-stretch sm:space-x-0 md:px-5 lg:px-4 lg2:px-6">
        <p
          className={`font-bold ${size === "small" ? "text-lg md:text-xl lg:text-2xl" : "text-4xl"}`}
        >
          {Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)}
        </p>

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
