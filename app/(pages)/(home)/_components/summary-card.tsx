import AddTransactionButton from "@/app/_components/add-transaction-button";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { ReactNode } from "react";

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  amount: number;
  size?: "small" | "large";
  userCanAddTransaction?: boolean;
}
const SummaryCard = ({
  icon,
  title,
  amount,
  size = "small",
  userCanAddTransaction,
}: SummaryCardProps) => {
  return (
    <Card className={`${size === "large" ? "bg-white bg-opacity-5" : ""}`}>
      <CardHeader
        className={`pb-3 pt-5 ${size === "large" ? "flex-row items-center gap-4" : "flex-col items-center gap-4 md:flex-row"}`}
      >
        {icon}

        <p
          className={`!mt-0 ${size === "small" ? "text-muted-foreground" : "text-white opacity-70"}`}
        >
          {title}
        </p>
      </CardHeader>

      <CardContent className="flex pb-5 sm:flex-row sm:items-stretch sm:justify-between sm:space-x-0 xs:flex-col xs:items-center xs:space-y-3">
        <p
          className={`font-bold ${size === "small" ? "text-lg md:text-xl lg:text-2xl" : "text-4xl"}`}
        >
          {Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)}
        </p>

        {size === "large" && (
          <AddTransactionButton userCanAddTransaction={userCanAddTransaction} />
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
