import { addMonths, getDaysInMonth, isAfter, startOfMonth } from "date-fns";

/** Limite de meses gerados de uma vez (evita uma avalanche após muito tempo sem abrir o app). */
export const MAX_OCCURRENCES_PER_RUN = 24;

/**
 * Data da ocorrência no mês. Dias 29–31 em meses mais curtos viram o último
 * dia do mês. Usa meio-dia para a data não "voltar" um dia ao ser exibida em
 * outro fuso (o servidor roda em UTC e o usuário no Brasil).
 */
export const occurrenceDate = (year: number, month: number, day: number) => {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1, 1));

  return new Date(year, month - 1, Math.min(day, daysInMonth), 12, 0, 0, 0);
};

interface RecurrenceSchedule {
  dayOfMonth: number;
  startDate: Date;
  endDate: Date | null;
  lastGeneratedAt: Date | null;
}

/**
 * Datas que ainda faltam gerar, do mês seguinte à última geração até o mês
 * atual (inclusive), respeitando a data de término.
 */
export const getDueOccurrences = (
  { dayOfMonth, startDate, endDate, lastGeneratedAt }: RecurrenceSchedule,
  now: Date,
): Date[] => {
  let cursor = lastGeneratedAt
    ? addMonths(startOfMonth(lastGeneratedAt), 1)
    : startOfMonth(startDate);

  let lastMonth = startOfMonth(now);

  if (endDate && isAfter(lastMonth, startOfMonth(endDate))) {
    lastMonth = startOfMonth(endDate);
  }

  const dates: Date[] = [];

  while (
    !isAfter(cursor, lastMonth) &&
    dates.length < MAX_OCCURRENCES_PER_RUN
  ) {
    dates.push(
      occurrenceDate(cursor.getFullYear(), cursor.getMonth() + 1, dayOfMonth),
    );
    cursor = addMonths(cursor, 1);
  }

  return dates;
};
