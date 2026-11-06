"use client";

import { Card, CardContent } from "@/app/_components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { TRANSACTION_TYPE_COLORS } from "@/app/_constants/transactions";
import { TransactionPercentagePerType } from "@/app/_data/get-dashboard/types";
import { TransactionType } from "@prisma/client";
import { PiggyBankIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Pie, PieChart } from "recharts";
import PercentageItem from "./percentage-item";

const chartConfig = {
  [TransactionType.INVESTMENT]: {
    label: "Investimento",
    color: TRANSACTION_TYPE_COLORS[TransactionType.INVESTMENT],
  },
  [TransactionType.EXPENSE]: {
    label: "Despesa",
    color: TRANSACTION_TYPE_COLORS[TransactionType.EXPENSE],
  },
  [TransactionType.DEPOSIT]: {
    label: "Receita",
    color: TRANSACTION_TYPE_COLORS[TransactionType.DEPOSIT],
  },
} satisfies ChartConfig;

interface TransactionsPierChartProps {
  typesPercentage: TransactionPercentagePerType;
  expensesTotal: number;
  investmentsTotal: number;
  depositsTotal: number;
}

const TransactionsPieChart = ({
  expensesTotal,
  investmentsTotal,
  depositsTotal,
  typesPercentage,
}: TransactionsPierChartProps) => {
  const isEmpty =
    expensesTotal === 0 && depositsTotal === 0 && investmentsTotal === 0;

  const chartData = isEmpty
    ? [{ type: "Sem transações", amount: 1, fill: "#2b2b2b" }]
    : [
        {
          type: TransactionType.DEPOSIT,
          amount: depositsTotal,
          fill: TRANSACTION_TYPE_COLORS[TransactionType.DEPOSIT],
        },
        {
          type: TransactionType.EXPENSE,
          amount: expensesTotal,
          fill: TRANSACTION_TYPE_COLORS[TransactionType.EXPENSE],
        },
        {
          type: TransactionType.INVESTMENT,
          amount: investmentsTotal,
          fill: TRANSACTION_TYPE_COLORS[TransactionType.INVESTMENT],
        },
      ];

  return (
    <Card className="flex flex-col px-2 pb-5">
      <CardContent className="flex flex-1 flex-col items-center justify-between px-[14px] pb-0 md:px-5 lg:px-1 xl:!px-6 lg2:px-3">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px] w-full"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="type"
              innerRadius={60}
              // Espaço de 2px na cor do fundo entre as fatias.
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          </PieChart>
        </ChartContainer>

        <div className="w-full space-y-1">
          <PercentageItem
            icon={<TrendingUpIcon size={16} className="text-deposit" />}
            title="Receita"
            value={typesPercentage[TransactionType.DEPOSIT]}
          />
          <PercentageItem
            icon={<TrendingDownIcon size={16} className="text-expense" />}
            title="Despesas"
            value={typesPercentage[TransactionType.EXPENSE]}
          />
          <PercentageItem
            icon={<PiggyBankIcon size={16} className="text-investment" />}
            title="Investimentos"
            value={typesPercentage[TransactionType.INVESTMENT]}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsPieChart;
