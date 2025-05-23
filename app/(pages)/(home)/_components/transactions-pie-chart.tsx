"use client";

import { Card, CardContent } from "@/app/_components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { TransactionPercentagePerType } from "@/app/_data/get-dashboard/types";
import { TransactionType } from "@prisma/client";
import { PiggyBankIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { Pie, PieChart } from "recharts";
import PercentageItem from "./percentage-item";

const chartConfig = {
  [TransactionType.INVESTMENT]: {
    label: "Investimento",
    color: "text-white",
  },
  [TransactionType.EXPENSE]: {
    label: "Despesa",
    color: "text-danger",
  },
  [TransactionType.DEPOSIT]: {
    label: "Depósito",
    color: "text-primary",
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
          fill: "#55B02E",
        },
        {
          type: TransactionType.EXPENSE,
          amount: expensesTotal,
          fill: "#E93030",
        },
        {
          type: TransactionType.INVESTMENT,
          amount: investmentsTotal,
          fill: "#FFFFFF",
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
            />
          </PieChart>
        </ChartContainer>

        <div className="w-full space-y-1">
          <PercentageItem
            icon={<TrendingUpIcon size={16} className="text-primary" />}
            title="Receita"
            value={typesPercentage[TransactionType.DEPOSIT]}
          />
          <PercentageItem
            icon={<TrendingDownIcon size={16} className="text-danger" />}
            title="Despesas"
            value={typesPercentage[TransactionType.EXPENSE]}
          />
          <PercentageItem
            icon={<PiggyBankIcon size={16} />}
            title="Investimentos"
            value={typesPercentage[TransactionType.INVESTMENT]}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsPieChart;
