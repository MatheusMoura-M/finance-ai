import { zodResolver } from "@hookform/resolvers/zod";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";

import { useForm } from "react-hook-form";
import { upsertTransaction } from "../_actions/upsert-transaction";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_CATEGORY_OPTIONS,
  TRANSACTION_PAYMENT_METHOD_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
} from "../_constants/transactions";
import { formatCurrency } from "../_utils/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formSchema, tFormSchema } from "@/app/(pages)/transactions/_schema";
import { MoneyInput } from "./money-input";
import { Button } from "./ui/button";
import { DatePicker } from "./ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useEffect } from "react";
import { Loader2Icon, RepeatIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { cn } from "../_lib/utils";
import { toast } from "sonner";

interface UpsertTransactionDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  defaultValues?: tFormSchema;
  transactionId?: string;
  /** A transação foi gerada por uma recorrência (editar muda só ela). */
  isRecurring?: boolean;
}

const UpsertTransactionDialog = ({
  isOpen,
  setIsOpen,
  defaultValues,
  transactionId,
  isRecurring = false,
}: UpsertTransactionDialogProps) => {
  const form = useForm<tFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      name: "",
      type: TransactionType.EXPENSE,
      category: TransactionCategory.OTHER,
      paymentMethod: TransactionPaymentMethod.OTHER,
      date: new Date(),
      repeatMonthly: false,
    },
  });

  const { user } = useUser();
  const hasPremiumPlan = user?.publicMetadata.subscriptionPlan === "premium";

  useEffect(() => {
    if (isOpen && defaultValues) {
      form.reset({
        ...defaultValues,
        date: defaultValues.date ? new Date(defaultValues.date) : new Date(),
      });
    }
  }, [isOpen, defaultValues, form]);

  const isUpdate = Boolean(transactionId);

  const onSubmit = async (data: tFormSchema) => {
    try {
      const result = await upsertTransaction({ ...data, id: transactionId });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setIsOpen(false);
      form.reset();

      const successMessage = isUpdate
        ? "Transação atualizada com sucesso!"
        : data.repeatMonthly
          ? `Transação adicionada! Ela vai se repetir todo dia ${data.date.getDate()}.`
          : "Transação adicionada com sucesso!";
      const { budgetAlert } = result.data;

      if (budgetAlert) {
        toast.warning(successMessage, {
          description: `Com ela, ${TRANSACTION_CATEGORY_LABELS[budgetAlert.category]} passou do orçamento de ${format(new Date(budgetAlert.year, budgetAlert.month - 1, 1), "MMMM", { locale: ptBR })}: ${formatCurrency(budgetAlert.spent)} de ${formatCurrency(budgetAlert.budget)}.`,
          duration: 8000,
        });
      } else {
        toast.success(successMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        isUpdate
          ? "Ocorreu um erro ao atualizar a transação."
          : "Ocorreu um erro ao adicionar a transação.",
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);

        if (!open) form.reset();
      }}
    >
      <DialogContent className="scrollbar-custom max-h-[95%] overflow-y-auto sm-max:max-w-[95%]">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Atualizar" : "Adicionar"} transação
          </DialogTitle>

          <DialogDescription>
            {isRecurring
              ? "Esta transação é de uma recorrência mensal. Alterar aqui muda só ela; os próximos meses continuam como estão."
              : "Insira as informações abaixo"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>

                  <FormControl>
                    <Input placeholder="Digite um nome..." {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>

                  <FormControl>
                    <MoneyInput
                      placeholder="Digite o valor..."
                      value={field.value}
                      onValueChange={({ floatValue }) => {
                        field.onChange(floatValue);
                      }}
                      onBlur={field.onBlur}
                      disabled={field.disabled}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>

                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo..." />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {TRANSACTION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>

                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tipo..." />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {TRANSACTION_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento</FormLabel>

                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um método de pagamento..." />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {TRANSACTION_PAYMENT_METHOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>

                  <DatePicker value={field.value} onChange={field.onChange} />

                  <FormMessage />
                </FormItem>
              )}
            />

            {!isUpdate && (
              <FormField
                control={form.control}
                name="repeatMonthly"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <label
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium",
                        hasPremiumPlan
                          ? "cursor-pointer"
                          : "cursor-not-allowed text-muted-foreground",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={Boolean(field.value) && hasPremiumPlan}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                        disabled={!hasPremiumPlan}
                      />
                      <RepeatIcon size={16} aria-hidden />
                      Repetir todo mês
                      {!hasPremiumPlan && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                          Premium
                        </span>
                      )}
                    </label>

                    <p className="text-xs text-muted-foreground">
                      {hasPremiumPlan
                        ? `Cria esta transação todo dia ${form.watch("date")?.getDate() ?? ""} (ou no último dia, em meses mais curtos), automaticamente.`
                        : "Assine o Premium para cadastrar aluguel, salário e assinaturas uma vez só."}
                    </p>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2Icon className="animate-spin" />}
                {isUpdate ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpsertTransactionDialog;
