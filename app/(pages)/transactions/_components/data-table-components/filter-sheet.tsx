import { Button } from "@/app/_components/ui/button";
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/app/_components/ui/sheet";
import { Separator } from "@/app/_components/ui/separator";
import { DataTableToolbarProps } from "./data-table-toolbar";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { categories, incomeType, paymentMethods } from "./data";
import { CalendarDatePicker } from "@/app/_components/calendarCustom/calendar-date-picker";
import { DataTableViewOptions } from "./data-table-view-options";

interface FilterSheetProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  handleDateSelect: ({ from, to }: { from: Date; to: Date }) => void;
}

export const FilterSheet = <TData,>({
  table,
  facets,
  dateRange,
  handleDateSelect,
}: FilterSheetProps & DataTableToolbarProps<TData>) => {
  return (
    <SheetContent
      id="sheet-filter"
      className="max-w-97.5 overflow-y-auto md:hidden"
    >
      <SheetHeader className="space-y-0">
        <SheetTitle className="text-start">Filtrar documentos</SheetTitle>
        <SheetDescription className="text-start">
          Indique os dados necessários para realizar a filtragem
        </SheetDescription>
      </SheetHeader>

      <Separator className="bg-Gray mt-4" />

      <div className="flex flex-col gap-4 py-4">
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
          className="h-8 w-full"
          variant="outline"
        />
      </div>

      <SheetFooter className="flex flex-row items-center space-x-2">
        <DataTableViewOptions table={table} isAppear />

        <Button
          type="submit"
          className="border"
          onClick={() => table.resetColumnFilters()}
        >
          Limpar
        </Button>
      </SheetFooter>
    </SheetContent>
  );
};
