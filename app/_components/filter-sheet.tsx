import { Button } from "@/app/_components/ui/button";
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/app/_components/ui/sheet";
import { Separator } from "./ui/separator";
import { DataTableToolbarProps } from "../transactions/_components/data-table-components/data-table-toolbar";
import { DataTableFacetedFilter } from "../transactions/_components/data-table-components/data-table-faceted-filter";
import {
  categories,
  incomeType,
} from "../transactions/_components/data-table-components/data";
import { CalendarDatePicker } from "./calendar-date-picker";
import { DataTableViewOptions } from "../transactions/_components/data-table-components/data-table-view-options";

interface FilterSheetProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  handleDateSelect: ({ from, to }: { from: Date; to: Date }) => void;
}

export const FilterSheet = <TData,>({
  table,
  dateRange,
  handleDateSelect,
}: FilterSheetProps & DataTableToolbarProps<TData>) => {
  return (
    <SheetContent
      id="sheet-filter"
      className="max-w-[390px] overflow-y-auto md:hidden"
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
