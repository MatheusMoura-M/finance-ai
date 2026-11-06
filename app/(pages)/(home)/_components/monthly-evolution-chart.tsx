"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/app/_components/ui/chart";
import type { MonthlyEvolution } from "@/app/_data/get-yearly-evolution";
import { formatCurrency } from "@/app/_utils/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChartColumnIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

// Cores validadas para daltonismo no fundo escuro do app (checagem da skill de
// dataviz): verde-água = entra, laranja = sai, azul = investido.
const SERIES = [
  { key: "deposits", label: "Receita", color: "#199e70" },
  { key: "expenses", label: "Despesa", color: "#d95926" },
  { key: "investments", label: "Investimento", color: "#3987e5" },
] as const;

const chartConfig = {
  deposits: { label: "Receita", color: "#199e70" },
  expenses: { label: "Despesa", color: "#d95926" },
  investments: { label: "Investimento", color: "#3987e5" },
} satisfies ChartConfig;

const MONTH_LABELS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

type ChartRow = MonthlyEvolution & { label: string };

const EvolutionTooltip = ({
  active,
  payload,
  year,
}: TooltipProps<number, string> & { year: number }) => {
  if (!active || !payload?.length) return null;

  const row = payload[0].payload as ChartRow;

  return (
    <div className="min-w-[200px] rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-2 font-semibold capitalize">
        {format(new Date(year, row.month - 1, 1), "MMMM 'de' yyyy", {
          locale: ptBR,
        })}
      </p>

      <div className="space-y-1">
        {SERIES.map((series) => (
          <div key={series.key} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: series.color }}
              aria-hidden
            />
            <span className="text-muted-foreground">{series.label}</span>
            <span className="ml-auto font-mono font-medium tabular-nums">
              {formatCurrency(row[series.key])}
            </span>
          </div>
        ))}

        <div className="mt-1 flex items-center gap-2 border-t pt-1">
          <span className="text-muted-foreground">Saldo</span>
          <span className="ml-auto font-mono font-medium tabular-nums">
            {formatCurrency(row.balance)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface MonthlyEvolutionChartProps {
  data: MonthlyEvolution[];
  year: number;
  /** Mês aberto no dashboard (1 a 12), destacado no gráfico. */
  selectedMonth: number;
}

const MonthlyEvolutionChart = ({
  data,
  year,
  selectedMonth,
}: MonthlyEvolutionChartProps) => {
  const chartData: ChartRow[] = data.map((month) => ({
    ...month,
    label: MONTH_LABELS[month.month - 1],
  }));

  const isEmpty = data.every(
    (month) => !month.deposits && !month.expenses && !month.investments,
  );

  const selectedLabel = MONTH_LABELS[selectedMonth - 1];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 px-4 sm:flex-row sm:items-start sm:justify-between lg2:px-6">
        <div className="space-y-1">
          <CardTitle className="font-bold">Evolução em {year}</CardTitle>
          <CardDescription>
            Receitas, despesas e investimentos de cada mês.
          </CardDescription>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {SERIES.map((series) => (
            <li key={series.key} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: series.color }}
                aria-hidden
              />
              {series.label}
            </li>
          ))}
        </ul>
      </CardHeader>

      <CardContent className="px-2 pb-4 sm:px-4 lg2:px-6">
        {isEmpty ? (
          <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center">
            <ChartColumnIcon size={32} className="text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma transação em {year}</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[260px] w-full"
            aria-label={`Gráfico de barras com receitas, despesas e investimentos de cada mês de ${year}`}
            role="img"
          >
            <BarChart
              data={chartData}
              barGap={2}
              barCategoryGap="22%"
              margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeOpacity={0.12} />

              {/* Faixa atrás do mês aberto no dashboard. */}
              <ReferenceArea
                x1={selectedLabel}
                x2={selectedLabel}
                fill="hsl(var(--muted))"
                fillOpacity={0.45}
                ifOverflow="extendDomain"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={(value: number) => compactCurrency.format(value)}
              />

              <ChartTooltip
                cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.25 }}
                content={<EvolutionTooltip year={year} />}
              />

              {SERIES.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.label}
                  fill={`var(--color-${series.key})`}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={16}
                />
              ))}
            </BarChart>
          </ChartContainer>
        )}

        {/* Mesmos dados em tabela, para leitores de tela. */}
        <table className="sr-only">
          <caption>Evolução mensal em {year}</caption>
          <thead>
            <tr>
              <th scope="col">Mês</th>
              {SERIES.map((series) => (
                <th key={series.key} scope="col">
                  {series.label}
                </th>
              ))}
              <th scope="col">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row) => (
              <tr key={row.month}>
                <th scope="row">{row.label}</th>
                {SERIES.map((series) => (
                  <td key={series.key}>{formatCurrency(row[series.key])}</td>
                ))}
                <td>{formatCurrency(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default MonthlyEvolutionChart;
