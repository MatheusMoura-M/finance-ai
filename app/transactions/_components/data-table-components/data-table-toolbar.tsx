"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { incomeType, categories } from "./data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
// import { DataTableViewOptions } from "@/app/_components/ui/data-table-view-options";
import { CalendarDatePicker } from "@/app/_components/calendar-date-picker";
import { useState } from "react";
import { DataTableViewOptions } from "./data-table-view-options";
import { FilterSheet } from "@/app/_components/filter-sheet";
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet";
import { Filter } from "lucide-react";

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  const handleDateSelect = ({ from, to }: { from: Date; to: Date }) => {
    setDateRange({ from, to });
    table.getColumn("date")?.setFilterValue([from, to]);
  };

  return (
    <div className="flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-0">
      <div className="flex w-full items-center gap-2 pt-[3px] sm:w-auto [&:has(input:focus-visible)]:pl-[3px]">
        <Input
          placeholder="Filter labels..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) => {
            table.getColumn("name")?.setFilterValue(event.target.value);
          }}
          className="h-8 w-full placeholder:text-[#e4e2e2] focus-visible:ring-offset-1 md:w-[150px] lg:w-[250px] [&:focus-visible]:w-[calc(100%-3px)] [&:focus-visible]:md:w-[147px] [&:focus-visible]:lg:w-[247px]"
        />

        <div className="hidden gap-2 md:flex">
          {table.getColumn("category") && (
            <DataTableFacetedFilter
              column={table.getColumn("category")}
              title="Category"
              options={categories}
            />
          )}

          {table.getColumn("type") && (
            <DataTableFacetedFilter
              column={table.getColumn("type")}
              title="Type"
              options={incomeType}
            />
          )}

          <CalendarDatePicker
            date={dateRange}
            onDateSelect={handleDateSelect}
            className="h-8 w-[250px]"
            variant="outline"
          />

          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <DataTableViewOptions table={table} />

      {/* BTN FILTER */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Button
            size="icon"
            variant="outline"
            className="flex h-[31px] w-full items-center rounded-md border px-4 py-2 text-sm font-medium text-[#e4e2e2] sm:w-[20%] md:w-[93px]"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </SheetTrigger>

        <FilterSheet
          table={table}
          dateRange={dateRange}
          handleDateSelect={handleDateSelect}
        />
      </Sheet>
    </div>
  );
}
