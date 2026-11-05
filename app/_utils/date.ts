import { endOfMonth, startOfMonth } from "date-fns";

/**
 * Intervalo completo de um mês (do primeiro instante do dia 1 ao último
 * instante do último dia), respeitando meses de 28, 29, 30 e 31 dias.
 *
 * @param month mês de 1 a 12 (aceita "01".."12")
 */
export const getMonthDateRange = (month: string | number, year: number) => {
  const reference = new Date(year, Number(month) - 1, 1);

  return {
    gte: startOfMonth(reference),
    lte: endOfMonth(reference),
  };
};
