"use client";

import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from "@/app/_constants/transactions";
import { Transaction } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import DeleteTransactionButton from "../_components/delete-transaction-button";
import EditTransactionButton from "../_components/edit-transaction-button";
import TransactionTypeBadge from "../_components/type-badge";
import { DataTableColumnHeader } from "../_components/data-table-components/data-table-column-header";

// Filtros, ordenação e paginação são feitos no servidor (ver getTransactions);
// aqui ficam só a forma de exibir cada coluna.
export const transactionsColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row: { original: transaction } }) => (
      <TransactionTypeBadge transaction={transaction} />
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Categoria" />
    ),
    cell: ({ row: { original: transaction } }) =>
      TRANSACTION_CATEGORY_LABELS[transaction.category],
  },
  {
    accessorKey: "paymentMethod",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Método de Pagamento" />
    ),
    cell: ({ row: { original: transaction } }) =>
      TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod],
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data" />
    ),
    cell: ({ row: { original: transaction } }) =>
      new Date(transaction.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Valor" />
    ),
    cell: ({ row: { original: transaction } }) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number(transaction.amount)),
  },
  {
    accessorKey: "actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row: { original: transaction } }) => {
      return (
        <div className="space-x-1">
          <EditTransactionButton transaction={transaction} />
          <DeleteTransactionButton transactionId={transaction.id} />
        </div>
      );
    },
  },
];
