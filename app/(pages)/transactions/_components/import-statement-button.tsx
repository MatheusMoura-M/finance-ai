"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { TRANSACTION_CATEGORY_OPTIONS } from "@/app/_constants/transactions";
import { UNEXPECTED_ERROR_MESSAGE } from "@/app/_lib/action-result";
import { decodeStatementFile } from "@/app/_lib/import/parse-statement";
import type {
  ImportPreviewRow,
  ImportRowNote,
} from "@/app/_lib/import/preview";
import { cn } from "@/app/_lib/utils";
import { formatCurrency } from "@/app/_utils/currency";
import { useUser } from "@clerk/nextjs";
import { TransactionCategory, TransactionType } from "@prisma/client";
import { format } from "date-fns";
import {
  FileUpIcon,
  HistoryIcon,
  Loader2Icon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import {
  confirmStatementImport,
  previewStatementImport,
} from "../_actions/import-statement";
import { MAX_STATEMENT_CHARS } from "../_actions/import-statement/schema";

const NOTE_LABELS: Record<ImportRowNote, string> = {
  "already-imported": "já importada",
  "possible-duplicate": "parece já cadastrada",
  "card-credit": "pagamento ou estorno da fatura",
};

const FORMAT_LABELS = {
  ofx: "OFX",
  "nubank-account": "CSV da conta Nubank",
  "nubank-card": "CSV da fatura do Nubank",
};

type Step = "select" | "preview";

interface ImportStatementButtonProps {
  className?: string;
}

const ImportStatementButton = ({ className }: ImportStatementButtonProps) => {
  const { user } = useUser();
  const router = useRouter();
  const hasPremiumPlan = user?.publicMetadata.subscriptionPlan === "premium";

  const fileInput = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("select");
  const [isBusy, setIsBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [formatLabel, setFormatLabel] = useState("");
  const [rows, setRows] = useState<ImportPreviewRow[]>([]);

  const selectedRows = rows.filter((row) => row.selected);
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  const reset = () => {
    setStep("select");
    setRows([]);
    setFileName("");
    setFormatLabel("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleOpenClick = () => {
    if (!hasPremiumPlan) {
      toast("Importar extrato é um recurso do Plano Premium.", {
        action: {
          label: "Assinar",
          onClick: () => router.push("/subscription"),
        },
      });
      return;
    }

    reset();
    setIsOpen(true);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsBusy(true);
    setFileName(file.name);

    try {
      const content = decodeStatementFile(await file.arrayBuffer());

      if (content.length > MAX_STATEMENT_CHARS) {
        toast.error("Arquivo grande demais. Exporte um período menor.");
        reset();
        return;
      }

      const result = await previewStatementImport({ content });

      if (!result.success) {
        toast.error(result.error);
        reset();
        return;
      }

      setRows(result.data.rows);
      setFormatLabel(FORMAT_LABELS[result.data.format]);
      setStep("preview");
    } catch (error) {
      console.error(error);
      toast.error(UNEXPECTED_ERROR_MESSAGE);
      reset();
    } finally {
      setIsBusy(false);
    }
  };

  const updateRow = (importHash: string, changes: Partial<ImportPreviewRow>) =>
    setRows((current) =>
      current.map((row) =>
        row.importHash === importHash ? { ...row, ...changes } : row,
      ),
    );

  const handleImport = async () => {
    setIsBusy(true);

    try {
      const result = await confirmStatementImport({
        rows: selectedRows.map((row) => ({
          importHash: row.importHash,
          date: row.date,
          name: row.name,
          amount: row.amount,
          type: row.type,
          category: row.category,
          paymentMethod: row.paymentMethod,
        })),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const { imported, skipped } = result.data;

      toast.success(
        `${imported} ${imported === 1 ? "transação importada" : "transações importadas"}.`,
        skipped
          ? {
              description: `${skipped} ${skipped === 1 ? "já existia e foi ignorada" : "já existiam e foram ignoradas"}.`,
            }
          : undefined,
      );
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(UNEXPECTED_ERROR_MESSAGE);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn("h-9 rounded-full px-3 sm:h-10 sm:px-4", className)}
        onClick={handleOpenClick}
      >
        <UploadIcon aria-hidden />
        <span className="sr-only sm:not-sr-only">Importar extrato</span>
        {!hasPremiumPlan && (
          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
            Premium
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !isBusy && setIsOpen(open)}>
        <DialogContent className="scrollbar-custom flex max-h-[95%] max-w-3xl flex-col sm-max:max-w-[95%]">
          <DialogHeader>
            <DialogTitle>Importar extrato</DialogTitle>
            <DialogDescription>
              {step === "select"
                ? "Envie o arquivo OFX do seu banco ou o CSV do Nubank (conta ou fatura do cartão). Você confere tudo antes de importar."
                : `${fileName} · ${formatLabel} · ${rows.length} ${rows.length === 1 ? "transação encontrada" : "transações encontradas"}`}
            </DialogDescription>
          </DialogHeader>

          {step === "select" ? (
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-10 text-center text-sm text-muted-foreground transition-colors hover:bg-muted/40",
                isBusy && "pointer-events-none opacity-60",
              )}
            >
              {isBusy ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <FileUpIcon size={28} aria-hidden />
              )}
              <span className="font-medium text-foreground">
                {isBusy
                  ? `Lendo ${fileName}…`
                  : "Escolher arquivo (.ofx ou .csv)"}
              </span>
              <span className="text-xs">
                No app do banco, procure por &quot;exportar extrato&quot;. Na
                fatura do cartão, só a parcela de cada mês é importada.
              </span>
              <input
                ref={fileInput}
                type="file"
                accept=".ofx,.csv,text/csv,application/x-ofx"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isBusy}
              />
            </label>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={allSelected}
                    onChange={(event) =>
                      setRows((current) =>
                        current.map((row) => ({
                          ...row,
                          selected: event.target.checked,
                        })),
                      )
                    }
                  />
                  Marcar todas
                </label>
                <span className="text-muted-foreground">
                  {selectedRows.length} de {rows.length} marcadas
                </span>
              </div>

              <ul className="scrollbar-custom -mx-2 min-h-0 flex-1 divide-y overflow-y-auto px-2">
                {rows.map((row) => {
                  const isIncome = row.type === TransactionType.DEPOSIT;

                  return (
                    <li
                      key={row.importHash}
                      className={cn(
                        "grid grid-cols-[auto,minmax(0,1fr),auto] items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[auto,minmax(0,1fr),180px,auto]",
                        !row.selected && "opacity-60",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={row.selected}
                        onChange={(event) =>
                          updateRow(row.importHash, {
                            selected: event.target.checked,
                          })
                        }
                        aria-label={`Importar ${row.name}`}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {row.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(row.date), "dd/MM/yyyy")}
                          {row.note && (
                            <span className="ml-2 rounded bg-muted px-1.5 py-0.5">
                              {NOTE_LABELS[row.note]}
                            </span>
                          )}
                        </p>
                      </div>

                      <p
                        className={cn(
                          "text-right text-sm font-bold sm:order-last",
                          isIncome ? "text-deposit" : "text-expense",
                        )}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(row.amount)}
                      </p>

                      <div className="col-span-3 flex items-center gap-2 pl-7 sm:col-span-1 sm:pl-0">
                        <Select
                          value={row.category}
                          onValueChange={(category) =>
                            updateRow(row.importHash, {
                              category: category as TransactionCategory,
                              categorySource: null,
                            })
                          }
                        >
                          <SelectTrigger
                            className="h-8 text-xs"
                            aria-label={`Categoria de ${row.name}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSACTION_CATEGORY_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {row.categorySource === "history" && (
                          <HistoryIcon
                            size={14}
                            className="shrink-0 text-muted-foreground"
                            aria-label="Categoria igual às suas transações anteriores"
                          />
                        )}
                        {row.categorySource === "keyword" && (
                          <SparklesIcon
                            size={14}
                            className="shrink-0 text-muted-foreground"
                            aria-label="Categoria sugerida pelo nome"
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <HistoryIcon size={12} aria-hidden /> igual às suas transações
                  anteriores
                </span>
                <span className="flex items-center gap-1">
                  <SparklesIcon size={12} aria-hidden /> sugerida pelo nome
                </span>
              </p>
            </>
          )}

          <DialogFooter className="gap-2">
            {step === "preview" && (
              <Button variant="outline" onClick={reset} disabled={isBusy}>
                Trocar arquivo
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isBusy}
            >
              Cancelar
            </Button>
            {step === "preview" && (
              <Button
                onClick={handleImport}
                disabled={isBusy || selectedRows.length === 0}
              >
                {isBusy && <Loader2Icon className="animate-spin" aria-hidden />}
                Importar {selectedRows.length}{" "}
                {selectedRows.length === 1 ? "transação" : "transações"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImportStatementButton;
