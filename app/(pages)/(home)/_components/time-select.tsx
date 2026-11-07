"use client";

import { CalendarDatePickerTest } from "@/app/_components/calendarCustom/calendar-date-picker_home";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TimeSelectProps {
  availableYears: number[];
}

const TimeSelect = ({ availableYears }: TimeSelectProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { push } = useRouter();

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    setDate(selectedDate);

    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");

    push(`/?month=${month}&year=${selectedDate.getFullYear()}`);
  };

  return (
    <CalendarDatePickerTest
      date={date}
      onDateSelect={handleDateChange}
      className="h-9 w-full md:h-8 md:w-[180px]"
      variant="outline"
      availableYears={availableYears}
    />
  );
};

export default TimeSelect;
