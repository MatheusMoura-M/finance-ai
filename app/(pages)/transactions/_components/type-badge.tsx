import { Badge } from "@/app/_components/ui/badge";
import { cn } from "@/app/_lib/utils";
import { Transaction, TransactionType } from "@prisma/client";
import { CircleIcon } from "lucide-react";

interface TransactionTypeBadgeProps {
  transaction: Transaction;
}

// A cor do tipo fica na bolinha; o texto usa a cor padrão para manter o
// contraste no fundo cinza do badge.
const TYPE_BADGE = {
  [TransactionType.DEPOSIT]: { label: "Depósito", dot: "fill-deposit" },
  [TransactionType.EXPENSE]: { label: "Despesa", dot: "fill-expense" },
  [TransactionType.INVESTMENT]: {
    label: "Investimento",
    dot: "fill-investment",
  },
};

const TransactionTypeBadge = ({ transaction }: TransactionTypeBadgeProps) => {
  const { label, dot } = TYPE_BADGE[transaction.type];

  return (
    <Badge className="bg-muted font-bold text-foreground hover:bg-muted">
      <CircleIcon
        size={10}
        className={cn("mr-2 stroke-none", dot)}
        aria-hidden
      />
      {label}
    </Badge>
  );
};

export default TransactionTypeBadge;
