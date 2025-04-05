import { cn } from "@/app/_lib/utils";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface iDatePartProps {
  id: string;
  date: DateRange;
  part:
    | "firstDay"
    | "secondDay"
    | "firstMonth"
    | "secondMonth"
    | "firstYear"
    | "secondYear"
    | "day"
    | "month"
    | "year";
  highlightedPart: string | null;
  setHighlightedPart: (value: React.SetStateAction<string | null>) => void;
  orientation: "to" | "from";
}

export const DatePart = ({
  id,
  date,
  part,
  highlightedPart,
  setHighlightedPart,
  orientation,
}: iDatePartProps) => {
  const handleMouseLeave = () => {
    setHighlightedPart(null);
  };

  const handleMouseOver = (part: string) => {
    setHighlightedPart(part);
  };

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const formatWithTz = (date: Date, fmt: string) =>
    formatInTimeZone(date, timeZone, fmt, { locale: ptBR });

  return (
    <span
      id={id}
      className={cn(
        "date-part text-[#e4e2e2]",
        highlightedPart === part && "font-bold underline",
      )}
      onMouseOver={() => handleMouseOver(part)}
      onMouseLeave={handleMouseLeave}
    >
      {date[orientation]
        ? formatWithTz(
            date[orientation],
            part.toLowerCase().includes("day")
              ? "dd"
              : part.toLowerCase().includes("month")
                ? "LLL"
                : "y",
          )
        : "--"}
    </span>
  );
};
