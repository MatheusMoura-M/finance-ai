"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { DataTablePagination } from "@/app/(pages)/transactions/_components/data-table-components/data-table-pagination";
import { DataTableToolbar } from "@/app/(pages)/transactions/_components/data-table-components/data-table-toolbar";
// `import type`: o módulo get-transactions é só de servidor (Prisma/Clerk).
import type { TransactionsFacets } from "@/app/_data/get-transactions";
import {
  DEFAULT_TRANSACTIONS_PAGE_SIZE,
  type TransactionsSearchParams,
} from "@/app/_data/get-transactions/search-params";
import { cn } from "@/app/_lib/utils";
import { format, parseISO } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ScrollArea } from "./scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

export interface iFirstAndLastTransactionDate {
  oldestTransaction: Date;
  newestTransaction: Date;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  total: number;
  pageCount: number;
  query: TransactionsSearchParams;
  facets: TransactionsFacets;
  firstAndLastTransactionDate: iFirstAndLastTransactionDate;
}

const resolveUpdater = <T,>(updater: Updater<T>, current: T): T =>
  typeof updater === "function" ? (updater as (old: T) => T)(current) : updater;

const formatDateParam = (date?: Date) =>
  date ? format(date, "yyyy-MM-dd") : undefined;

/**
 * Tabela de transações com filtros, ordenação e paginação feitos no servidor.
 * O estado vive na URL: cada mudança atualiza os parâmetros de busca e a
 * página é renderizada de novo no servidor com os dados daquela página.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  total,
  pageCount,
  query,
  facets,
  firstAndLastTransactionDate,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const updateSearchParams = (
    updates: Record<string, string | undefined>,
    { resetPage = true } = {},
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    if (resetPage) {
      params.delete("page");
    }

    const queryString = params.toString();

    startTransition(() => {
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    });
  };

  const pagination: PaginationState = {
    pageIndex: query.page - 1,
    pageSize: query.pageSize,
  };

  const sorting: SortingState = [
    { id: query.sort, desc: query.order === "desc" },
  ];

  const columnFilters: ColumnFiltersState = [
    ...(query.name ? [{ id: "name", value: query.name }] : []),
    ...(query.type.length ? [{ id: "type", value: query.type }] : []),
    ...(query.category.length
      ? [{ id: "category", value: query.category }]
      : []),
    ...(query.paymentMethod.length
      ? [{ id: "paymentMethod", value: query.paymentMethod }]
      : []),
    ...(query.from || query.to
      ? [
          {
            id: "date",
            value: [
              query.from
                ? parseISO(query.from)
                : firstAndLastTransactionDate.oldestTransaction,
              query.to
                ? parseISO(query.to)
                : firstAndLastTransactionDate.newestTransaction,
            ],
          },
        ]
      : []),
  ];

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const next = resolveUpdater(updater, pagination);

    if (next.pageSize !== pagination.pageSize) {
      updateSearchParams({
        pageSize:
          next.pageSize === DEFAULT_TRANSACTIONS_PAGE_SIZE
            ? undefined
            : String(next.pageSize),
      });
      return;
    }

    updateSearchParams(
      { page: next.pageIndex > 0 ? String(next.pageIndex + 1) : undefined },
      { resetPage: false },
    );
  };

  const handleSortingChange = (updater: Updater<SortingState>) => {
    const [next] = resolveUpdater(updater, sorting);
    const isDefaultSort = !next || (next.id === "date" && next.desc);

    updateSearchParams({
      sort: isDefaultSort ? undefined : next.id,
      order: isDefaultSort ? undefined : next.desc ? "desc" : "asc",
    });
  };

  const handleColumnFiltersChange = (updater: Updater<ColumnFiltersState>) => {
    const next = resolveUpdater(updater, columnFilters);
    const getValue = (id: string) =>
      next.find((filter) => filter.id === id)?.value;
    const toCsv = (id: string) => {
      const values = getValue(id) as string[] | undefined;

      return values?.length ? values.join(",") : undefined;
    };
    const dateRange = getValue("date") as [Date?, Date?] | undefined;

    updateSearchParams({
      name:
        ((getValue("name") as string | undefined) ?? "").trim() || undefined,
      type: toCsv("type"),
      category: toCsv("category"),
      paymentMethod: toCsv("paymentMethod"),
      from: formatDateParam(dateRange?.[0]),
      to: formatDateParam(dateRange?.[1]),
    });
  };

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onPaginationChange: handlePaginationChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="h-[75vh] space-y-3 overflow-hidden">
      <DataTableToolbar
        table={table}
        facets={facets}
        {...firstAndLastTransactionDate}
      />

      <ScrollArea
        className={cn(
          "h-full max-h-[75%] transition-opacity sm:max-h-[80%] [&>div]:!overflow-auto",
          isPending && "opacity-60",
        )}
        aria-busy={isPending}
      >
        <div className="min-w-[1080px] rounded-md border">
          <Table>
            <TableHeader className="sticky -top-[2px] bg-[#242020] shadow-md transition-all">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 lg:p-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Sem transações
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>

      <DataTablePagination table={table} total={total} />
    </div>
  );
}
