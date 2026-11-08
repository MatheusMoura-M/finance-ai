"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/app/_lib/utils";
import { Button } from "@/app/_components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { DatePart } from "./date-part-home";
import { useSearchParams } from "next/navigation";

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const multiSelectVariants = cva(
  "flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-foreground ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground text-background",
        link: " underline-offset-4 hover:underline text-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface CalendarDatePickerProps
  extends
    React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  id?: string;
  className?: string;
  date: Date | undefined;
  availableYears: number[];
  onDateSelect: (selectedDate: Date | undefined) => void;
}

export const CalendarDatePickerTest = React.forwardRef<
  HTMLButtonElement,
  CalendarDatePickerProps
>(
  (
    {
      id = "calendar-date-picker",
      className,
      date,
      availableYears,
      onDateSelect,
      variant,
      ...props
    },
    ref,
  ) => {
    const searchParams = useSearchParams();
    const monthUrl = Number(searchParams.get("month"));
    const yearUrl = Number(searchParams.get("year"));
    const today = new Date();

    // Mês/ano selecionados vêm sempre da URL (fonte única de verdade).
    const selectedYear = yearUrl || today.getFullYear();
    const selectedMonthIndex =
      monthUrl >= 1 && monthUrl <= 12 ? monthUrl - 1 : today.getMonth();

    // Dia 1 evita que dias 29–31 "virem" o mês seguinte (ex.: 31/02 → março).
    const currentDateUrl = new Date(selectedYear, selectedMonthIndex, 1);

    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [highlightedPart, setHighlightedPart] = React.useState<string | null>(
      null,
    );

    const handleClose = () => setIsPopoverOpen(false);

    const handleTogglePopover = () => setIsPopoverOpen((prev) => !prev);

    const handleMonthChange = (newMonthIndex: number) => {
      if (newMonthIndex < 0 || newMonthIndex > 11) return;

      onDateSelect(new Date(selectedYear, newMonthIndex, 1));
    };

    const handleYearChange = (newYear: number) => {
      if (!availableYears.includes(newYear)) return;

      onDateSelect(new Date(newYear, selectedMonthIndex, 1));
    };

    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            ref={ref}
            {...props}
            className={cn(
              "w-auto",
              multiSelectVariants({ variant, className }),
            )}
            onClick={handleTogglePopover}
            suppressHydrationWarning
          >
            <CalendarIcon
              className="mr-2 h-4 w-4 text-foreground/90"
              aria-hidden
            />
            <span>
              {date ? (
                <>
                  <DatePart
                    id={`firstMonth-${id}`}
                    date={currentDateUrl}
                    part="firstMonth"
                    highlightedPart={highlightedPart}
                    setHighlightedPart={setHighlightedPart}
                    orientation="from"
                  />
                  ,{" "}
                  <DatePart
                    id={`firstYear-${id}`}
                    date={currentDateUrl}
                    part="firstYear"
                    highlightedPart={highlightedPart}
                    setHighlightedPart={setHighlightedPart}
                    orientation="from"
                  />
                </>
              ) : (
                <span>Selecione uma data</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>

        {isPopoverOpen && (
          <PopoverContent
            id="popover-content-date-home"
            className="w-auto p-3"
            align="start"
            avoidCollisions={false}
            onInteractOutside={handleClose}
          >
            <div className="flex gap-2">
              <Select
                onValueChange={(value) => {
                  handleMonthChange(months.indexOf(value));
                }}
                value={months[selectedMonthIndex]}
              >
                <SelectTrigger className="w-30.5 font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>

                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) => {
                  handleYearChange(Number(value));
                }}
                value={selectedYear.toString()}
              >
                <SelectTrigger className="w-30.5 font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>

                <SelectContent>
                  {availableYears.map((year, idx) => (
                    <SelectItem key={idx} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        )}
      </Popover>
    );
  },
);

CalendarDatePickerTest.displayName = "CalendarDatePicker";
