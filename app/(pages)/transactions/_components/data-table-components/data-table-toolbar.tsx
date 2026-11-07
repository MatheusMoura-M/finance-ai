"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { incomeType, categories, paymentMethods } from "./data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { CalendarDatePicker } from "@/app/_components/calendarCustom/calendar-date-picker";
import { useEffect, useRef, useState } from "react";
import { DataTableViewOptions } from "./data-table-view-options";
import { FilterSheet } from "./filter-sheet";
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet";
import { DownloadIcon, Filter } from "lucide-react";
import { useSearchParams } from "next/navigation";
import PremiumDownloadButton from "@/app/_components/premium-download-button";
import { iFirstAndLastTransactionDate } from "@/app/_components/ui/data-table";
import type { TransactionsFacets } from "@/app/_data/get-transactions";

const NAME_FILTER_DEBOUNCE_MS = 400;

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  facets: TransactionsFacets;
}

export function DataTableToolbar<TData>({
  table,
  facets,
  newestTransaction,
  oldestTransaction,
}: DataTableToolbarProps<TData> & iFirstAndLastTransactionDate) {
  const isFiltered = table.getState().columnFilters.length > 0;
  // A exportação usa os mesmos filtros e a ordenação que estão na URL.
  const searchParams = useSearchParams();

  // O período vem da URL (via filtro da coluna) ou, sem filtro, cobre tudo.
  const dateFilter = table.getColumn("date")?.getFilterValue() as
    | [Date, Date]
    | undefined;
  const dateRange = {
    from: dateFilter?.[0] ?? oldestTransaction,
    to: dateFilter?.[1] ?? newestTransaction,
  };

  const handleDateSelect = ({ from, to }: { from: Date; to: Date }) => {
    table.getColumn("date")?.setFilterValue([from, to]);
  };

  // Busca por nome com debounce: só atualiza a URL quando a pessoa para de digitar.
  const nameFilter =
    (table.getColumn("name")?.getFilterValue() as string | undefined) ?? "";
  const [nameInput, setNameInput] = useState(nameFilter);
  const lastSentName = useRef(nameFilter);

  // Sincroniza o campo quando o filtro muda por fora (limpar filtros, voltar no navegador).
  useEffect(() => {
    if (nameFilter !== lastSentName.current) {
      lastSentName.current = nameFilter;
      setNameInput(nameFilter);
    }
  }, [nameFilter]);

  useEffect(() => {
    const value = nameInput.trim();

    if (value === lastSentName.current) return;

    const timeout = setTimeout(() => {
      lastSentName.current = value;
      table.getColumn("name")?.setFilterValue(value || undefined);
    }, NAME_FILTER_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [nameInput, table]);

  const handleResetFilters = () => {
    table.resetColumnFilters();
  };

  return (
    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-0">
      <div className="flex w-full items-center gap-2 pt-[3px] sm:w-auto [&:has(input:focus-visible)]:pl-[3px]">
        <Input
          placeholder="Filtre por nome..."
          value={nameInput}
          onChange={(event) => setNameInput(event.target.value)}
          className="h-8 w-full placeholder:text-foreground/70 focus-visible:ring-offset-1 md:w-[150px] lg:w-[250px] [&:focus-visible]:w-[calc(100%-3px)] [&:focus-visible]:md:w-[147px] [&:focus-visible]:lg:w-[247px]"
        />

        <div className="hidden gap-2 md:flex">
          {table.getColumn("category") && (
            <DataTableFacetedFilter
              column={table.getColumn("category")}
              title="Categoria"
              options={categories}
              counts={facets.category}
            />
          )}

          {table.getColumn("type") && (
            <DataTableFacetedFilter
              column={table.getColumn("type")}
              title="Tipo"
              options={incomeType}
              counts={facets.type}
            />
          )}

          {table.getColumn("paymentMethod") && (
            <DataTableFacetedFilter
              column={table.getColumn("paymentMethod")}
              title="Método de Pagamento"
              options={paymentMethods}
              counts={facets.paymentMethod}
            />
          )}

          <CalendarDatePicker
            date={dateRange}
            onDateSelect={handleDateSelect}
            className="h-8 w-[250px]"
            variant="outline"
            closeOnSelect
          />

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={handleResetFilters}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* No mobile: "Filtrar" e "Exportar Excel" lado a lado, com a mesma altura. */}
      <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-foreground/90 sm:flex-none md:hidden"
            >
              <Filter aria-hidden />
              Filtrar
            </Button>
          </SheetTrigger>

          <FilterSheet
            table={table}
            facets={facets}
            dateRange={dateRange}
            handleDateSelect={handleDateSelect}
          />
        </Sheet>

        <PremiumDownloadButton
          href={`/api/transactions/export?${searchParams.toString()}`}
          fallbackFileName="transacoes-finance-ai.xlsx"
          size="sm"
          className="h-8 flex-1 sm:flex-none"
          premiumMessage="Exportar para o Excel é um recurso do Plano Premium."
        >
          <DownloadIcon aria-hidden />
          Exportar Excel
        </PremiumDownloadButton>

        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
