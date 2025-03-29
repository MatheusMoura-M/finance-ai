"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
} from "date-fns";
import { toDate } from "date-fns-tz";
import { DateRange } from "react-day-picker";
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
import { Calendar } from "../ui/calendar";
import { DatePart } from "./date-part";

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
  date: DateRange;
  closeOnSelect?: boolean;
  numberOfMonths?: 1 | 2;
  yearsRange?: number;
  onDateSelect: (range: { from: Date; to: Date }) => void;
}

export const CalendarDatePicker = React.forwardRef<
  HTMLButtonElement,
  CalendarDatePickerProps
>(
  (
    {
      id = "calendar-date-picker",
      className,
      date,
      closeOnSelect = false,
      numberOfMonths = 2,
      yearsRange = 10,
      onDateSelect,
      variant,
      ...props
    },
    ref,
  ) => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [selectedRange, setSelectedRange] = React.useState<string | null>(
      numberOfMonths === 2 ? "This Year" : "Today",
    );
    const [monthFrom, setMonthFrom] = React.useState<Date | undefined>(
      date?.from,
    );
    const [yearFrom, setYearFrom] = React.useState<number | undefined>(
      date?.from?.getFullYear(),
    );
    const [monthTo, setMonthTo] = React.useState<Date | undefined>(
      numberOfMonths === 2 ? date?.to : date?.from,
    );
    const [yearTo, setYearTo] = React.useState<number | undefined>(
      numberOfMonths === 2
        ? date?.to?.getFullYear()
        : date?.from?.getFullYear(),
    );
    const [highlightedPart, setHighlightedPart] = React.useState<string | null>(
      null,
    );

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const handleClose = () => setIsPopoverOpen(false);

    const handleTogglePopover = () => setIsPopoverOpen((prev) => !prev);

    const selectDateRange = (from: Date, to: Date, range: string) => {
      const startDate = startOfDay(toDate(from, { timeZone }));
      const endDate =
        numberOfMonths === 2 ? endOfDay(toDate(to, { timeZone })) : startDate;
      onDateSelect({ from: startDate, to: endDate });
      setSelectedRange(range);
      setMonthFrom(from);
      setYearFrom(from.getFullYear());
      setMonthTo(to);
      setYearTo(to.getFullYear());

      if (closeOnSelect) {
        setIsPopoverOpen(false);
      }
    };

    const convertToStartOfDay = (date: Date, timeZone: string) =>
      startOfDay(toDate(date, { timeZone }));
    const convertToEndOfDay = (date: Date, timeZone: string) =>
      endOfDay(toDate(date, { timeZone }));

    const handleDateSelect = (range: DateRange | undefined) => {
      if (range && range.from) {
        const { from: fromDate, to: toDate } = range;

        let from = convertToStartOfDay(fromDate, timeZone);
        let to = toDate ? convertToEndOfDay(toDate, timeZone) : from;

        if (numberOfMonths === 1) {
          if (fromDate !== date.from) {
            to = from;
          } else {
            from = convertToStartOfDay(toDate as Date, timeZone);
          }
        }

        onDateSelect({ from, to });
        setMonthFrom(from);
        setYearFrom(from.getFullYear());
        setMonthTo(to);
        setYearTo(to.getFullYear());
      }

      setSelectedRange(null);
    };

    const handleMonthChange = (newMonthIndex: number, part: string) => {
      setSelectedRange(null);

      const isFrom = part === "from";
      const year = isFrom ? yearFrom : yearTo;
      if (year === undefined) return;
      if (newMonthIndex < 0 || newMonthIndex > yearsRange + 1) return;

      const newMonth = new Date(year, newMonthIndex, 1);
      const isRange = numberOfMonths === 2;

      const from = isFrom
        ? isRange
          ? startOfMonth(toDate(newMonth, { timeZone }))
          : date?.from
            ? new Date(
                date.from.getFullYear(),
                newMonth.getMonth(),
                date.from.getDate(),
              )
            : newMonth
        : date?.from
          ? startOfDay(toDate(date.from, { timeZone }))
          : startOfMonth(toDate(newMonth, { timeZone }));

      const to = isFrom
        ? isRange
          ? date?.to
            ? endOfDay(toDate(date.to, { timeZone }))
            : endOfMonth(toDate(newMonth, { timeZone }))
          : from
        : isRange
          ? endOfMonth(toDate(newMonth, { timeZone }))
          : from;

      if (from > to) return;

      onDateSelect({ from, to });

      if (isFrom) {
        setMonthFrom(newMonth);
        setMonthTo(date.to);
      } else {
        setMonthTo(newMonth);
        setMonthFrom(date.from);
      }
    };

    const handleYearChange = (newYear: number, part: string) => {
      setSelectedRange(null);

      const isFrom = part === "from";
      const month = isFrom ? monthFrom : monthTo;
      const isRange = numberOfMonths === 2;

      if (!years.includes(newYear)) return;

      const newMonth = month
        ? new Date(newYear, month.getMonth(), 1)
        : new Date(newYear, 0, 1);

      const from = isFrom
        ? isRange
          ? startOfMonth(toDate(newMonth, { timeZone }))
          : date.from
            ? new Date(newYear, newMonth.getMonth(), date.from.getDate())
            : newMonth
        : date.from
          ? startOfDay(toDate(date.from, { timeZone }))
          : startOfMonth(toDate(newMonth, { timeZone }));

      const to = isFrom
        ? isRange
          ? date.to
            ? endOfDay(toDate(date.to, { timeZone }))
            : endOfMonth(toDate(newMonth, { timeZone }))
          : from
        : isRange
          ? endOfMonth(toDate(newMonth, { timeZone }))
          : from;

      if (from > to) return;

      onDateSelect({ from, to });

      if (isFrom) {
        setYearFrom(newYear);
        setMonthFrom(newMonth);
        setYearTo(date.to?.getFullYear());
        setMonthTo(date.to);
      } else {
        setYearTo(newYear);
        setMonthTo(newMonth);
        setYearFrom(date.from?.getFullYear());
        setMonthFrom(date.from);
      }
    };

    const today = new Date();

    const years = Array.from(
      { length: yearsRange + 1 },
      (_, i) => today.getFullYear() - yearsRange / 2 + i,
    );

    const dateRanges = [
      { label: "Today", start: today, end: today },
      { label: "Yesterday", start: subDays(today, 1), end: subDays(today, 1) },
      {
        label: "This Week",
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      },
      {
        label: "Last Week",
        start: subDays(startOfWeek(today, { weekStartsOn: 1 }), 7),
        end: subDays(endOfWeek(today, { weekStartsOn: 1 }), 7),
      },
      { label: "Last 7 Days", start: subDays(today, 6), end: today },
      {
        label: "This Month",
        start: startOfMonth(today),
        end: endOfMonth(today),
      },
      {
        label: "Last Month",
        start: startOfMonth(subDays(today, today.getDate())),
        end: endOfMonth(subDays(today, today.getDate())),
      },
      { label: "This Year", start: startOfYear(today), end: endOfYear(today) },
      {
        label: "Last Year",
        start: startOfYear(subDays(today, 365)),
        end: endOfYear(subDays(today, 365)),
      },
    ];

    const handleWheel = (event: React.WheelEvent) => {
      event.preventDefault();
      setSelectedRange(null);

      const increment = event.deltaY > 0 ? -1 : 1;

      const updateDate = (currentDate: Date) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + increment);
        return newDate;
      };

      const selectDate = (from: Date, to: Date) => {
        onDateSelect({ from, to });
        return from;
      };

      switch (highlightedPart) {
        case "firstDay":
          if (date?.from && date?.to) {
            const newDate = updateDate(date.from);
            const isRange = numberOfMonths === 2;

            if (newDate <= date.to) {
              if (isRange) {
                selectDate(newDate, date.to);
              } else {
                selectDate(newDate, newDate);
              }

              setMonthFrom(newDate);
            } else if (newDate > date.to && !isRange) {
              selectDate(newDate, newDate);
              setMonthFrom(newDate);
            }
          }
          break;

        case "firstMonth":
          if (monthFrom) {
            const newMonthIndex = monthFrom.getMonth() + increment;
            handleMonthChange(newMonthIndex, "from");
          }
          break;

        case "firstYear":
          if (yearFrom !== undefined) {
            const newYear = yearFrom + increment;
            handleYearChange(newYear, "from");
          }
          break;

        case "secondDay":
          if (date?.from && date?.to) {
            const newDate = updateDate(date.to);

            if (newDate >= date.from) {
              selectDate(date.from, newDate);
              setMonthTo(newDate);
            }
          }
          break;

        case "secondMonth":
          if (monthTo) {
            const newMonthIndex = monthTo.getMonth() + increment;
            handleMonthChange(newMonthIndex, "to");
          }
          break;

        case "secondYear":
          if (yearTo !== undefined) {
            const newYear = yearTo + increment;
            handleYearChange(newYear, "to");
          }
          break;

        default:
          break;
      }
    };

    React.useEffect(() => {
      const firstDayElement = document.getElementById(`firstDay-${id}`);
      const firstMonthElement = document.getElementById(`firstMonth-${id}`);
      const firstYearElement = document.getElementById(`firstYear-${id}`);
      const secondDayElement = document.getElementById(`secondDay-${id}`);
      const secondMonthElement = document.getElementById(`secondMonth-${id}`);
      const secondYearElement = document.getElementById(`secondYear-${id}`);

      const elements = [
        firstDayElement,
        firstMonthElement,
        firstYearElement,
        secondDayElement,
        secondMonthElement,
        secondYearElement,
      ];

      const addPassiveEventListener = (element: HTMLElement | null) => {
        if (element) {
          element.addEventListener(
            "wheel",
            handleWheel as unknown as EventListener,
            {
              passive: false,
            },
          );
        }
      };

      elements.forEach(addPassiveEventListener);

      return () => {
        elements.forEach((element) => {
          if (element) {
            element.removeEventListener(
              "wheel",
              handleWheel as unknown as EventListener,
            );
          }
        });
      };
    }, [highlightedPart, date]);

    return (
      <>
        <style>
          {`
            .date-part {
              touch-action: none;
            }
          `}
        </style>

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
                {date?.from ? (
                  date.to ? (
                    <>
                      <DatePart
                        id={`firstDay-${id}`}
                        date={date}
                        part="firstDay"
                        highlightedPart={highlightedPart}
                        setHighlightedPart={setHighlightedPart}
                        orientation="from"
                      />{" "}
                      <DatePart
                        id={`firstMonth-${id}`}
                        date={date}
                        part="firstMonth"
                        highlightedPart={highlightedPart}
                        setHighlightedPart={setHighlightedPart}
                        orientation="from"
                      />
                      ,{" "}
                      <DatePart
                        id={`firstYear-${id}`}
                        date={date}
                        part="firstYear"
                        highlightedPart={highlightedPart}
                        setHighlightedPart={setHighlightedPart}
                        orientation="from"
                      />
                      {numberOfMonths === 2 && (
                        <>
                          {" - "}
                          <DatePart
                            id={`secondDay-${id}`}
                            date={date}
                            part="secondDay"
                            highlightedPart={highlightedPart}
                            setHighlightedPart={setHighlightedPart}
                            orientation="to"
                          />{" "}
                          <DatePart
                            id={`secondMonth-${id}`}
                            date={date}
                            part="secondMonth"
                            highlightedPart={highlightedPart}
                            setHighlightedPart={setHighlightedPart}
                            orientation="to"
                          />
                          ,{" "}
                          <DatePart
                            id={`secondYear-${id}`}
                            date={date}
                            part="secondYear"
                            highlightedPart={highlightedPart}
                            setHighlightedPart={setHighlightedPart}
                            orientation="to"
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <DatePart
                        id="day"
                        date={date}
                        part="day"
                        highlightedPart={highlightedPart}
                        setHighlightedPart={setHighlightedPart}
                        orientation="from"
                      />{" "}
                      <DatePart
                        id="month"
                        date={date}
                        part="month"
                        highlightedPart={highlightedPart}
                        setHighlightedPart={setHighlightedPart}
                        orientation="from"
                      />
                      ,{" "}
                      <DatePart
                        id="year"
                        date={date}
                        part="year"
                        highlightedPart={highlightedPart}
                        setHighlightedPart={setHighlightedPart}
                        orientation="from"
                      />
                    </>
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </span>
            </Button>
          </PopoverTrigger>

          {isPopoverOpen && (
            <PopoverContent
              id="popover-content-date"
              className="w-auto"
              align="start"
              avoidCollisions={false}
              onInteractOutside={handleClose}
              onEscapeKeyDown={handleClose}
              style={{
                maxHeight: "var(--radix-popover-content-available-height)",
                overflowY: "auto",
              }}
            >
              <div className="flex sm-max:justify-center">
                {numberOfMonths === 2 && (
                  <div className="hidden flex-col gap-1 border-r border-foreground/10 pr-4 text-left sm2:flex">
                    {dateRanges.map(({ label, start, end }) => (
                      <Button
                        key={label}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start hover:bg-primary/90 hover:text-background",
                          selectedRange === label &&
                            "bg-primary text-background hover:bg-primary/90 hover:text-background",
                        )}
                        onClick={() => {
                          selectDateRange(start, end, label);
                          setMonthFrom(start);
                          setYearFrom(start.getFullYear());
                          setMonthTo(end);
                          setYearTo(end.getFullYear());
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex h-[356px] flex-col sm-max:w-full">
                  <div className="flex items-center gap-4 sm-max:flex-col">
                    <div className="ml-3 flex gap-2 sm-max:ml-0 sm-max:w-full sm-max:justify-center">
                      <Select
                        onValueChange={(value) => {
                          handleMonthChange(months.indexOf(value), "from");
                          setSelectedRange(null);
                        }}
                        value={
                          monthFrom ? months[monthFrom.getMonth()] : undefined
                        }
                      >
                        <SelectTrigger className="w-[122px] font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0 sm-max:w-1/2">
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
                          handleYearChange(Number(value), "from");
                          setSelectedRange(null);
                        }}
                        value={yearFrom ? yearFrom.toString() : undefined}
                      >
                        <SelectTrigger className="w-[122px] font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0 sm-max:w-1/2">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>

                        <SelectContent>
                          {years.map((year, idx) => (
                            <SelectItem key={idx} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {numberOfMonths === 2 && (
                      <div className="flex gap-2 sm-max:w-full sm-max:justify-center">
                        <Select
                          onValueChange={(value) => {
                            handleMonthChange(months.indexOf(value), "to");
                            setSelectedRange(null);
                          }}
                          value={
                            monthTo ? months[monthTo.getMonth()] : undefined
                          }
                        >
                          <SelectTrigger className="w-[122px] font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0 sm-max:w-1/2">
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
                            handleYearChange(Number(value), "to");
                            setSelectedRange(null);
                          }}
                          value={yearTo ? yearTo.toString() : undefined}
                        >
                          <SelectTrigger className="w-[122px] font-medium hover:bg-accent hover:text-accent-foreground focus:ring-0 focus:ring-offset-0 sm-max:w-1/2">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>

                          <SelectContent>
                            {years.map((year, idx) => (
                              <SelectItem key={idx} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex">
                    <Calendar
                      mode="range"
                      defaultMonth={monthFrom}
                      month={monthFrom}
                      onMonthChange={setMonthFrom}
                      selected={date}
                      onSelect={handleDateSelect}
                      numberOfMonths={numberOfMonths}
                      showOutsideDays={false}
                      className={className}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>
      </>
    );
  },
);

CalendarDatePicker.displayName = "CalendarDatePicker";
