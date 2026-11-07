"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/app/_components/ui/button";
import { cn } from "@/app/_lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Calendário (react-day-picker 9). No v9, os estados do dia (selecionado,
 * hoje, início/meio/fim do intervalo) são classes na célula do dia, e o botão
 * clicável fica dentro dela — por isso os estilos usam `[&>button]`.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months:
          "relative flex flex-col items-center gap-4 sm:flex-row sm:items-start",
        month: "space-y-4",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between px-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "z-10 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 aria-disabled:opacity-25",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "z-10 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 aria-disabled:opacity-25",
        ),
        month_caption: "flex h-7 items-center justify-center",
        caption_label: "text-sm font-medium",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "w-9 rounded-md text-[0.8rem] font-normal text-muted-foreground",
        week: "mt-2 flex w-full",
        day: "relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground [&>button]:focus:bg-primary [&>button]:focus:text-primary-foreground",
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        // Intervalo: o fundo da faixa fica na célula; início e fim em destaque.
        range_start: "rounded-l-md bg-accent",
        range_end: "rounded-r-md bg-accent",
        range_middle:
          "bg-accent [&>button]:!bg-transparent [&>button]:!text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft
              className={cn("h-4 w-4", className)}
              {...chevronProps}
            />
          ) : (
            <ChevronRight
              className={cn("h-4 w-4", className)}
              {...chevronProps}
            />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
