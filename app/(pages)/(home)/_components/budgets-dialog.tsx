"use client";

import { MoneyInput } from "@/app/_components/money-input";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Label } from "@/app/_components/ui/label";
import { TRANSACTION_CATEGORY_OPTIONS } from "@/app/_constants/transactions";
import { UNEXPECTED_ERROR_MESSAGE } from "@/app/_lib/action-result";
import type { BudgetMap } from "@/app/_lib/budgets/resolve";
import { cn } from "@/app/_lib/utils";
import { TransactionCategory } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2Icon, TargetIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { saveBudgets } from "../_actions/save-budgets";

// Orçamento é um teto de despesas: categorias de entrada ficam de fora.
const BUDGET_CATEGORIES = TRANSACTION_CATEGORY_OPTIONS.filter(
  (option) =>
    option.value !== TransactionCategory.SALARY &&
    option.value !== TransactionCategory.INVESTMENTS,
);

type Scope = "fromThisMonth" | "onlyThisMonth";

interface BudgetsDialogProps {
  month: number;
  year: number;
  /** Orçamentos que valem no mês aberto. */
  budgets: BudgetMap;
}

const BudgetsDialog = ({ month, year, budgets }: BudgetsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scope, setScope] = useState<Scope>("fromThisMonth");
  const [values, setValues] = useState<BudgetMap>(budgets);

  const monthName = format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", {
    locale: ptBR,
  });

  const handleOpenChange = (open: boolean) => {
    // Sempre abre com os valores atuais do mês.
    if (open) {
      setValues(budgets);
      setScope("fromThisMonth");
    }

    setIsOpen(open);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const result = await saveBudgets({
        month,
        year,
        scope,
        budgets: BUDGET_CATEGORIES.map(({ value }) => ({
          category: value,
          amount: values[value] || null,
        })),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Orçamentos salvos.");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(UNEXPECTED_ERROR_MESSAGE);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <TargetIcon aria-hidden />
          Orçamentos
        </Button>
      </DialogTrigger>

      <DialogContent className="scrollbar-custom max-h-[95%] overflow-y-auto sm-max:max-w-[95%]">
        <DialogHeader>
          <DialogTitle>Orçamentos de {monthName}</DialogTitle>
          <DialogDescription>
            Defina quanto quer gastar no máximo em cada categoria. Deixe em
            branco para não ter orçamento.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Aplicar</legend>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                [
                  "fromThisMonth",
                  `A partir de ${format(new Date(year, month - 1, 1), "MMMM", { locale: ptBR })}`,
                ],
                [
                  "onlyThisMonth",
                  `Só em ${format(new Date(year, month - 1, 1), "MMMM", { locale: ptBR })}`,
                ],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
                  scope === value && "border-primary bg-primary/10",
                )}
              >
                <input
                  type="radio"
                  name="budget-scope"
                  value={value}
                  checked={scope === value}
                  onChange={() => setScope(value)}
                  className="accent-primary"
                />
                {label}
              </label>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {scope === "fromThisMonth"
              ? "Os valores valem para este mês e os seguintes, até você mudar."
              : "Os valores valem só neste mês; os outros meses continuam como estão."}
          </p>
        </fieldset>

        <div className="space-y-3">
          {BUDGET_CATEGORIES.map(({ value, label }) => (
            <div
              key={value}
              className="grid grid-cols-[1fr_minmax(0,170px)] items-center gap-3"
            >
              <Label htmlFor={`budget-${value}`}>{label}</Label>
              <MoneyInput
                id={`budget-${value}`}
                placeholder="Sem orçamento"
                value={values[value] ?? ""}
                onValueChange={({ floatValue }) =>
                  setValues((current) => ({
                    ...current,
                    [value]: floatValue || undefined,
                  }))
                }
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2Icon className="animate-spin" aria-hidden />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetsDialog;
