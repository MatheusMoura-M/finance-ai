import { cn } from "@/app/_lib/utils";
import { formatCurrency } from "@/app/_utils/currency";
import { ArrowDownRightIcon, ArrowUpRightIcon, EqualIcon } from "lucide-react";

export interface MonthComparison {
  /** Valor do mês anterior. */
  previous: number;
  /** Nome curto do mês anterior (ex.: "out."). */
  previousLabel: string;
  /** "percent" para receita/despesa/investimento; "absolute" para o saldo, que pode ser negativo. */
  mode: "percent" | "absolute";
  /** Se subir é bom (receita, saldo, investimento) ou ruim (despesa). */
  increaseIsGood: boolean;
}

interface MonthVariationProps extends MonthComparison {
  current: number;
}

/**
 * Variação em relação ao mês anterior. A cor indica se a mudança é boa ou
 * ruim, mas a seta e o texto sempre acompanham (nunca só a cor).
 */
const MonthVariation = ({
  current,
  previous,
  previousLabel,
  mode,
  increaseIsGood,
}: MonthVariationProps) => {
  const difference = Math.round((current - previous) * 100) / 100;

  if (current === 0 && previous === 0) {
    return null;
  }

  if (mode === "percent" && previous === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Sem valores em {previousLabel}
      </p>
    );
  }

  if (difference === 0) {
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <EqualIcon size={12} aria-hidden />
        Igual a {previousLabel}
      </p>
    );
  }

  const increased = difference > 0;
  const isGood = increased === increaseIsGood;
  const Icon = increased ? ArrowUpRightIcon : ArrowDownRightIcon;

  const value =
    mode === "percent"
      ? `${Math.round((Math.abs(difference) / Math.abs(previous)) * 100)}%`
      : formatCurrency(Math.abs(difference));

  return (
    <p
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isGood ? "text-primary" : "text-danger",
      )}
    >
      <Icon size={12} aria-hidden />
      <span>
        {increased ? "+" : "−"}
        {value}
      </span>
      <span className="font-normal text-muted-foreground">
        vs. {previousLabel}
      </span>
    </p>
  );
};

export default MonthVariation;
