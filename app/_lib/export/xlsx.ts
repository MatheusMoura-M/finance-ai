import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
  TRANSACTION_TYPE_OPTIONS,
} from "@/app/_constants/transactions";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import ExcelJS from "exceljs";

export interface ExportTransaction {
  date: Date;
  name: string;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  amount: number;
}

/** Limite de linhas por exportação (proteção contra arquivos gigantes). */
export const MAX_EXPORT_ROWS = 10_000;

export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Cinza escuro (zinc-700) com texto branco no cabeçalho.
const HEADER_FILL = "FF3F3F46";
const HEADER_FONT = "FFFFFFFF";
// Valor em reais; negativos em vermelho.
const CURRENCY_FORMAT = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
const DATE_FORMAT = "dd/mm/yyyy";

const TYPE_LABELS = Object.fromEntries(
  TRANSACTION_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<TransactionType, string>;

/** Valor com sinal: entrada positiva, saída negativa. */
export const signedAmount = (type: TransactionType, amount: number) =>
  type === TransactionType.DEPOSIT ? amount : -amount;

/**
 * Data sem horário para a planilha. O Excel não tem fuso: usa o dia
 * guardado no banco (UTC), que é o dia escolhido pelo usuário.
 */
const toExcelDate = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

/**
 * Planilha .xlsx das transações: cabeçalho cinza escuro fixo, filtros,
 * datas e valores em reais formatados e colunas na largura certa.
 */
export const buildTransactionsWorkbook = async (
  transactions: ExportTransaction[],
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Finance AI";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Transações", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const longestName = transactions.reduce(
    (longest, transaction) => Math.max(longest, transaction.name.length),
    4,
  );

  sheet.columns = [
    { header: "Data", key: "date", width: 12, style: { numFmt: DATE_FORMAT } },
    { header: "Nome", key: "name", width: Math.min(60, longestName + 4) },
    { header: "Tipo", key: "type", width: 14 },
    { header: "Categoria", key: "category", width: 18 },
    { header: "Método de pagamento", key: "paymentMethod", width: 24 },
    {
      header: "Valor",
      key: "amount",
      width: 16,
      style: { numFmt: CURRENCY_FORMAT },
    },
  ];

  transactions.forEach((transaction) => {
    sheet.addRow({
      date: toExcelDate(transaction.date),
      name: transaction.name,
      type: TYPE_LABELS[transaction.type],
      category: TRANSACTION_CATEGORY_LABELS[transaction.category],
      paymentMethod:
        TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod],
      amount: signedAmount(transaction.type, transaction.amount),
    });
  });

  const header = sheet.getRow(1);
  header.height = 20;
  header.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
    cell.font = { bold: true, color: { argb: HEADER_FONT } };
    cell.alignment = { vertical: "middle" };
  });

  sheet.autoFilter = { from: "A1", to: "F1" };

  return Buffer.from(await workbook.xlsx.writeBuffer());
};
