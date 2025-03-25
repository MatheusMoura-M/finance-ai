import { Button } from "@/app/_components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { TRANSACTION_PAYMENT_METHOD_ICONS } from "@/app/_constants/transactions";
import { formatCurrency } from "@/app/_utils/currency";
import { Transaction, TransactionType } from "@prisma/client";
import { HandCoins } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface LastTransactionsProps {
  lastTransactions: Transaction[];
}

const LastTransactions = ({ lastTransactions }: LastTransactionsProps) => {
  const getAmountColor = (transaction: Transaction) => {
    if (transaction.type === TransactionType.EXPENSE) {
      return "text-danger";
    }

    if (transaction.type === TransactionType.DEPOSIT) {
      return "text-primary";
    }

    return "text-white";
  };

  const getAmountPrefix = (transaction: Transaction) => {
    if (transaction.type === TransactionType.DEPOSIT) {
      return "+";
    }

    return "-";
  };

  return (
    <div className="static h-[586px] min-h-[586px] min-w-[335px] rounded-md border sm:sticky sm:top-5">
      <CardHeader className="flex-row items-center justify-between space-x-2 space-y-0 px-4 lg2:px-6">
        <CardTitle className="font-bold">Últimas transações</CardTitle>

        <Button variant="outline" className="rounded-full" asChild>
          <Link href="/transactions">Ver mais</Link>
        </Button>
      </CardHeader>

      <ScrollArea className="h-[82%] min-h-[480px] pb-3 pr-3">
        <CardContent className="scrollbar-custom h-full space-y-6 overflow-auto px-4 lg2:px-6">
          {lastTransactions.length > 0 ? (
            lastTransactions.map((transaction) => (
              <div
                className="flex items-center justify-between"
                key={transaction.id}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white bg-opacity-[3%] p-3">
                    <Image
                      src={
                        TRANSACTION_PAYMENT_METHOD_ICONS[
                          transaction.paymentMethod
                        ]
                      }
                      width={20}
                      height={20}
                      className="h-5 w-5"
                      alt="PIX"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold">{transaction.name}</p>

                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <p
                  className={`text-sm font-bold ${getAmountColor(transaction)}`}
                >
                  {getAmountPrefix(transaction)}
                  {formatCurrency(Number(transaction.amount))}
                </p>
              </div>
            ))
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <h2 className="text-xl text-muted-foreground xl2:text-2xl">
                Você não tem transações esse mês
              </h2>
              <HandCoins size={32} color="#a1a1aa" />
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </div>
  );
};

export default LastTransactions;
