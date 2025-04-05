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
  "flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
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
  extends React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  id?: string;
  className?: string;
  date: Date | undefined;
  yearsRange?: number;
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
      yearsRange = 10,
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

    const currentDateUrl =
      monthUrl && yearUrl
        ? new Date(yearUrl, monthUrl - 1, today.getDate())
        : new Date();

    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [monthFrom, setMonthFrom] = React.useState<Date | undefined>();
    const [yearFrom, setYearFrom] = React.useState<number | undefined>();
    const [highlightedPart, setHighlightedPart] = React.useState<string | null>(
      null,
    );

    const handleClose = () => setIsPopoverOpen(false);

    const handleTogglePopover = () => setIsPopoverOpen((prev) => !prev);

    const handleMonthChange = (newMonthIndex: number) => {
      const year = yearFrom;
      if (year === undefined) return;
      if (newMonthIndex < 0 || newMonthIndex > yearsRange + 1) return;

      const newMonth = new Date(year, newMonthIndex, 1);

      const from = date
        ? new Date(date.getFullYear(), newMonth.getMonth(), date.getDate())
        : newMonth;

      onDateSelect(from);
      setMonthFrom(newMonth);
    };

    const handleYearChange = (newYear: number) => {
      const month = monthFrom;

      if (!availableYears.includes(newYear)) return;

      const newMonth = month
        ? new Date(newYear, month.getMonth(), 1)
        : new Date(newYear, 0, 1);

      const from = date
        ? new Date(newYear, newMonth.getMonth(), date.getDate())
        : newMonth;

      onDateSelect(from);

      setYearFrom(newYear);
      setMonthFrom(newMonth);
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
            <CalendarIcon className="mr-2 h-4 w-4" color="#e4e2e2" />
            <span>
              {date ? (
                <>
                  <DatePart
                    id={`firstMonth-${id}`}
                    date={currentDateUrl ?? date}
                    part="firstMonth"
                    highlightedPart={highlightedPart}
                    setHighlightedPart={setHighlightedPart}
                    orientation="from"
                  />
                  ,{" "}
                  <DatePart
                    id={`firstYear-${id}`}
                    date={currentDateUrl ?? date}
                    part="firstYear"
                    highlightedPart={highlightedPart}
                    setHighlightedPart={setHighlightedPart}
                    orientation="from"
                  />
                </>
              ) : (
                <span>Pick a date</span>
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
                defaultValue={monthUrl ? months[monthUrl - 1] : ""}
                value={monthFrom ? months[monthFrom.getMonth()] : undefined}
              >
                <SelectTrigger className="w-[122px] font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Month" />
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
                defaultValue={yearUrl ? yearUrl.toString() : ""}
                value={yearFrom ? yearFrom.toString() : undefined}
              >
                <SelectTrigger className="w-[122px] font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Year" />
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
