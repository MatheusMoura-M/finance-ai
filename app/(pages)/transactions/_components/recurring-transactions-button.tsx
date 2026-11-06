"use client";

import { MoneyInput } from "@/app/_components/money-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_CATEGORY_OPTIONS,
  TRANSACTION_PAYMENT_METHOD_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from "@/app/_constants/transactions";
import type { RecurringTransactionItem } from "@/app/_data/get-recurring-transactions";
import { UNEXPECTED_ERROR_MESSAGE } from "@/app/_lib/action-result";
import { formatCurrency } from "@/app/_utils/currency";
import { TransactionType } from "@prisma/client";
import { Loader2Icon, PencilIcon, RepeatIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteRecurringTransaction,
  updateRecurringTransaction,
} from "../_actions/recurring-transactions";

interface RecurringTransactionsButtonProps {
  recurrences: RecurringTransactionItem[];
}

const typeLabel = (type: TransactionType) =>
  TRANSACTION_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
  type;

const RecurringTransactionsButton = ({
  recurrences,
}: RecurringTransactionsButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransactionItem | null>(null);
  const [toDelete, setToDelete] = useState<RecurringTransactionItem | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setEditing(null);
  };

  const handleSave = async () => {
    if (!editing) return;

    if (!editing.name.trim() || !(editing.amount > 0)) {
      toast.error("Preencha o nome e um valor maior que zero.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateRecurringTransaction(editing);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Recorrência atualizada. Vale a partir do próximo mês.");
      setEditing(null);
    } catch (error) {
      console.error(error);
      toast.error(UNEXPECTED_ERROR_MESSAGE);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;

    try {
      const result = await deleteRecurringTransaction({ id: toDelete.id });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`"${toDelete.name}" não vai mais se repetir.`);
    } catch (error) {
      console.error(error);
      toast.error(UNEXPECTED_ERROR_MESSAGE);
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-full">
            <RepeatIcon aria-hidden />
            <span className="sr-only sm:not-sr-only">Recorrências</span>(
            {recurrences.length})
          </Button>
        </DialogTrigger>

        <DialogContent className="scrollbar-custom max-h-[95%] overflow-y-auto sm-max:max-w-[95%]">
          {editing ? (
            <>
              <DialogHeader>
                <DialogTitle>Editar recorrência</DialogTitle>
                <DialogDescription>
                  As mudanças valem para os próximos meses. As transações que já
                  foram criadas continuam como estão.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recurring-name">Nome</Label>
                  <Input
                    id="recurring-name"
                    value={editing.name}
                    onChange={(event) =>
                      setEditing({ ...editing, name: event.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="recurring-amount">Valor</Label>
                    <MoneyInput
                      id="recurring-amount"
                      value={editing.amount}
                      onValueChange={({ floatValue }) =>
                        setEditing({ ...editing, amount: floatValue ?? 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurring-day">Dia do mês</Label>
                    <Input
                      id="recurring-day"
                      type="number"
                      min={1}
                      max={31}
                      value={editing.dayOfMonth}
                      onChange={(event) =>
                        setEditing({
                          ...editing,
                          dayOfMonth: Math.min(
                            31,
                            Math.max(1, Number(event.target.value) || 1),
                          ),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={editing.category}
                    onValueChange={(category) =>
                      setEditing({
                        ...editing,
                        category: category as typeof editing.category,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Método de pagamento</Label>
                  <Select
                    value={editing.paymentMethod}
                    onValueChange={(paymentMethod) =>
                      setEditing({
                        ...editing,
                        paymentMethod:
                          paymentMethod as typeof editing.paymentMethod,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-xs text-muted-foreground">
                  Em meses mais curtos, os dias 29 a 31 viram o último dia do
                  mês.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Voltar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && (
                    <Loader2Icon className="animate-spin" aria-hidden />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Recorrências</DialogTitle>
                <DialogDescription>
                  Transações criadas automaticamente todo mês.
                </DialogDescription>
              </DialogHeader>

              <ul className="divide-y">
                {recurrences.map((recurrence) => (
                  <li
                    key={recurrence.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">{recurrence.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {typeLabel(recurrence.type)} ·{" "}
                        {formatCurrency(recurrence.amount)} · todo dia{" "}
                        {recurrence.dayOfMonth} ·{" "}
                        {TRANSACTION_CATEGORY_LABELS[recurrence.category]}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={() => setEditing(recurrence)}
                        aria-label={`Editar ${recurrence.name}`}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={() => setToDelete(recurrence)}
                        aria-label={`Parar de repetir ${recurrence.name}`}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Parar de repetir &quot;{toDelete?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Nenhuma transação nova será criada. As que já existem continuam na
              sua lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Parar de repetir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RecurringTransactionsButton;
