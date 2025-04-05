"use client";

import { CalendarDatePickerTest } from "@/app/_components/calendarCustom/calendar-date-picker_home";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface TimeSelectProps {
  availableYears: number[];
}

const debounceDelay = 2000;

const TimeSelect = ({ availableYears }: TimeSelectProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { push } = useRouter();

  const callCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);

    const currentMonth = selectedDate
      ? String(selectedDate.getMonth() + 1).padStart(2, "0")
      : "N/A";

    const currentYear = selectedDate?.getFullYear();

    callCountRef.current += 1;

    if (callCountRef.current >= 2) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      push(`/?month=${currentMonth}&year=${currentYear}`);

      setTimeout(() => {
        callCountRef.current = 0;
      }, 5000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        push(`/?month=${currentMonth}&year=${currentYear}`);
        callCountRef.current = 0;
      }, debounceDelay);
    }
  };

  return (
    <CalendarDatePickerTest
      date={date}
      onDateSelect={handleDateChange}
      className="h-8 w-[180px]"
      variant="outline"
      availableYears={availableYears}
    />
  );
};

export default TimeSelect;
