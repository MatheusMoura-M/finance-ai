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
import { addMonths, format } from "date-fns";
import {
  MAX_INSTALLMENTS,
  splitInstallmentAmounts,
} from "../_lib/installments/split";
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
import {
  HistoryIcon,
  Loader2Icon,
  RepeatIcon,
  SparklesIcon,
} from "lucide-react";
import { useTransactionSuggestions } from "./use-transaction-suggestions";
import type { SuggestionSource } from "../_lib/categorize/suggest";
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
  /** Parcela de uma compra parcelada, ex.: { number: 2, total: 12 }. */
  installment?: { number: number; total: number };
}

/** Indica de onde veio o valor preenchido automaticamente. */
const SuggestionHint = ({ source }: { source: SuggestionSource | null }) =>
  source ? (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      {source === "history" ? (
        <>
          <HistoryIcon size={12} aria-hidden /> Igual às suas transações
          anteriores com esse nome
        </>
      ) : (
        <>
          <SparklesIcon size={12} aria-hidden /> Sugerida pelo nome · você pode
          trocar
        </>
      )}
    </p>
  ) : null;

const UpsertTransactionDialog = ({
  isOpen,
  setIsOpen,
  defaultValues,
  transactionId,
  isRecurring = false,
  installment,
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
      installments: 1,
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

  // Categoria e pagamento sugeridos pelo nome (só ao criar, só Premium).
  const { sources: suggestionSources, markTouched } = useTransactionSuggestions(
    {
      form,
      enabled: hasPremiumPlan && !isUpdate,
      isOpen,
    },
  );

  // Parcelamento: só ao criar uma despesa no cartão de crédito.
  const [watchedType, watchedPaymentMethod, watchedAmount, watchedDate] =
    form.watch(["type", "paymentMethod", "amount", "date"]);
  const canSplit =
    !isUpdate &&
    watchedType === TransactionType.EXPENSE &&
    watchedPaymentMethod === TransactionPaymentMethod.CREDIT_CARD;
  const installmentCount = canSplit ? (form.watch("installments") ?? 1) : 1;
  const installmentAmounts =
    installmentCount > 1 && watchedAmount > 0
      ? splitInstallmentAmounts(watchedAmount, installmentCount)
      : [];

  const onSubmit = async (data: tFormSchema) => {
    try {
      const result = await upsertTransaction({
        ...data,
        id: transactionId,
        installments: installmentCount,
        repeatMonthly: installmentCount > 1 ? false : data.repeatMonthly,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setIsOpen(false);
      form.reset();

      const successMessage = isUpdate
        ? "Transação atualizada com sucesso!"
        : installmentCount > 1
          ? `Compra parcelada em ${installmentCount}x adicionada!`
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
              : installment
                ? `Esta é a parcela ${installment.number} de ${installment.total}. Alterar aqui muda só ela.`
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
                  <FormLabel>
                    {installmentCount > 1 ? "Valor total" : "Valor"}
                  </FormLabel>

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

                  <Select onValueChange={field.onChange} value={field.value}>
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
                    onValueChange={(value) => {
                      markTouched("category");
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria..." />
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

                  <SuggestionHint source={suggestionSources.category} />
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
                    onValueChange={(value) => {
                      markTouched("paymentMethod");
                      field.onChange(value);
                    }}
                    value={field.value}
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

                  <SuggestionHint source={suggestionSources.paymentMethod} />
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

            {canSplit && (
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelas</FormLabel>

                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={String(field.value ?? 1)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="1">À vista</SelectItem>
                        {Array.from(
                          { length: MAX_INSTALLMENTS - 1 },
                          (_, index) => index + 2,
                        ).map((count) => (
                          <SelectItem key={count} value={String(count)}>
                            {count}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {installmentAmounts.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {installmentAmounts[0] === installmentAmounts[1]
                          ? `${installmentCount}x de ${formatCurrency(installmentAmounts[1])}`
                          : `1ª de ${formatCurrency(installmentAmounts[0])} e as demais de ${formatCurrency(installmentAmounts[1])}`}
                        {watchedDate &&
                          `, de ${format(watchedDate, "MMM/yyyy", { locale: ptBR })} a ${format(addMonths(watchedDate, installmentCount - 1), "MMM/yyyy", { locale: ptBR })}.`}
                      </p>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {!isUpdate && installmentCount <= 1 && (
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
