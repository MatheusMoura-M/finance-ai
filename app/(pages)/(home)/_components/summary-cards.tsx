import { MonthTotals } from "@/app/_data/get-dashboard/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PiggyBankIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import SummaryCard from "./summary-card";

interface SummaryCards {
  month: string;
  balance: number;
  depositsTotal: number;
  investmentsTotal: number;
  expensesTotal: number;
  previousMonth: MonthTotals & { month: number; year: number };
  userCanAddTransaction?: boolean;
}

const SummaryCards = async ({
  balance,
  depositsTotal,
  investmentsTotal,
  expensesTotal,
  previousMonth,
  userCanAddTransaction,
}: SummaryCards) => {
  // Ex.: "out." — o ano só aparece quando o mês anterior é de outro ano.
  const previousDate = new Date(previousMonth.year, previousMonth.month - 1, 1);
  const previousLabel = format(
    previousDate,
    previousMonth.month === 12 ? "MMM 'de' yyyy" : "MMM",
    { locale: ptBR },
  );

  return (
    <div className="space-y-5">
      {/* PRIMEIRO CARD */}
      <SummaryCard
        icon={<WalletIcon size={16} />}
        title="Saldo"
        amount={balance}
        size="large"
        userCanAddTransaction={userCanAddTransaction}
        comparison={{
          previous: previousMonth.balance,
          previousLabel,
          mode: "absolute",
          increaseIsGood: true,
        }}
      />

      {/* OUTROS CARDS */}
      {/* Colunas: 1 (<375px) · 2 (375–699) · 1 (700–767) · 2 (768–899) · 3 (900+).
          No Tailwind 4 os breakpoints seguem a ordem de tamanho, sem precisar de "!". */}
      <div className="grid grid-cols-1 gap-3 xxs:grid-cols-2 sm:gap-5 sm2:grid-cols-1 md:grid-cols-2 md2:grid-cols-3">
        <SummaryCard
          icon={<PiggyBankIcon size={16} className="text-investment" />}
          title="Investido"
          amount={investmentsTotal}
          comparison={{
            previous: previousMonth.investmentsTotal,
            previousLabel,
            mode: "percent",
            increaseIsGood: true,
          }}
        />
        <SummaryCard
          icon={<TrendingUpIcon size={16} className="text-deposit" />}
          title="Receita"
          amount={depositsTotal}
          comparison={{
            previous: previousMonth.depositsTotal,
            previousLabel,
            mode: "percent",
            increaseIsGood: true,
          }}
        />
        <SummaryCard
          icon={<TrendingDownIcon size={16} className="text-expense" />}
          title="Despesa"
          amount={expensesTotal}
          className="col-span-1 xxs:col-span-2 sm2:col-span-1 md:col-span-2 md2:col-span-1"
          comparison={{
            previous: previousMonth.expensesTotal,
            previousLabel,
            mode: "percent",
            increaseIsGood: false,
          }}
        />
      </div>
    </div>
  );
};

export default SummaryCards;
