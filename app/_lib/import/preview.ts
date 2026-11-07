import {
  HistoryIndex,
  SuggestionSource,
  suggestForName,
} from "@/app/_lib/categorize/suggest";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { format } from "date-fns";
import { createHash } from "node:crypto";
import { ParsedStatement, StatementEntry } from "./parse-statement";

/** Por que uma linha vem desmarcada na prévia. */
export type ImportRowNote =
  | "already-imported"
  | "possible-duplicate"
  | "card-credit";

export interface ImportPreviewRow {
  /** Identificador estável do lançamento (evita importar duas vezes). */
  importHash: string;
  /** Data em ISO (meio-dia do dia do lançamento). */
  date: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  categorySource: SuggestionSource | null;
  paymentMethod: TransactionPaymentMethod;
  selected: boolean;
  note: ImportRowNote | null;
}

export interface ExistingTransaction {
  date: Date;
  amount: number;
  type: TransactionType;
  importHash: string | null;
}

const dayKey = (date: Date) => format(date, "yyyy-MM-dd");
const cents = (amount: number) => Math.round(amount * 100);

/**
 * Hash do lançamento: mesmo arquivo importado de novo gera os mesmos hashes.
 * `occurrence` diferencia lançamentos idênticos no mesmo arquivo (ex.: dois
 * cafés de R$ 5 no mesmo dia).
 */
export const entryHash = (
  format: string,
  entry: StatementEntry,
  occurrence: number,
) =>
  createHash("sha256")
    .update(
      [
        format,
        entry.externalId ?? "",
        dayKey(entry.date),
        entry.direction,
        cents(entry.amount),
        entry.description,
        occurrence,
      ].join("|"),
    )
    .digest("hex")
    .slice(0, 32);

/**
 * Monta a prévia da importação: tipo, categoria e forma de pagamento
 * sugeridos, e linhas desmarcadas quando já foram importadas, parecem já
 * cadastradas ou são pagamentos/estornos da fatura do cartão.
 */
export const buildImportPreview = ({
  statement,
  history,
  existing,
}: {
  statement: ParsedStatement;
  history: HistoryIndex;
  existing: ExistingTransaction[];
}): ImportPreviewRow[] => {
  const importedHashes = new Set(
    existing.flatMap((transaction) =>
      transaction.importHash ? [transaction.importHash] : [],
    ),
  );

  // Transações já cadastradas à mão (sem importHash), por dia + valor + tipo.
  // Cada uma "consome" no máximo um lançamento do extrato.
  const manualMatches = new Map<string, number>();
  for (const transaction of existing) {
    if (transaction.importHash) continue;
    const key = `${dayKey(transaction.date)}|${cents(transaction.amount)}|${transaction.type}`;
    manualMatches.set(key, (manualMatches.get(key) ?? 0) + 1);
  }

  const occurrences = new Map<string, number>();

  return statement.entries.map((entry) => {
    const baseKey = `${entry.externalId ?? ""}|${dayKey(entry.date)}|${entry.direction}|${cents(entry.amount)}|${entry.description}`;
    const occurrence = occurrences.get(baseKey) ?? 0;
    occurrences.set(baseKey, occurrence + 1);

    const importHash = entryHash(statement.format, entry, occurrence);
    const suggestion = suggestForName(entry.description, history);

    const category = suggestion.category ?? TransactionCategory.OTHER;
    const type: TransactionType =
      entry.direction === "in"
        ? TransactionType.DEPOSIT
        : category === TransactionCategory.INVESTMENTS
          ? TransactionType.INVESTMENT
          : TransactionType.EXPENSE;

    // Na fatura do cartão, tudo foi pago no cartão de crédito.
    const paymentMethod = statement.isCardStatement
      ? TransactionPaymentMethod.CREDIT_CARD
      : (suggestion.paymentMethod ?? TransactionPaymentMethod.OTHER);

    let note: ImportRowNote | null = null;

    if (importedHashes.has(importHash)) {
      note = "already-imported";
    } else if (statement.isCardStatement && entry.direction === "in") {
      // Pagamento da fatura ou estorno: não é receita.
      note = "card-credit";
    } else {
      const matchKey = `${dayKey(entry.date)}|${cents(entry.amount)}|${type}`;
      const remaining = manualMatches.get(matchKey) ?? 0;

      if (remaining > 0) {
        manualMatches.set(matchKey, remaining - 1);
        note = "possible-duplicate";
      }
    }

    return {
      importHash,
      date: entry.date.toISOString(),
      name: entry.description.slice(0, 120),
      amount: entry.amount,
      type,
      category,
      categorySource: suggestion.categorySource,
      paymentMethod,
      selected: note === null,
      note,
    };
  });
};
