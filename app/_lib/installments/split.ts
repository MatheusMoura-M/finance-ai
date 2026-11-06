import { addMonths } from "date-fns";

export const MIN_INSTALLMENTS = 2;
export const MAX_INSTALLMENTS = 24;

export interface Installment {
  name: string;
  amount: number;
  date: Date;
  installmentNumber: number;
  installmentTotal: number;
}

/**
 * Valor de cada parcela, em reais. Divide igualmente (sem juros); os
 * centavos que sobram da divisão vão para a 1ª parcela.
 * Ex.: R$ 100 em 3x → 33,34 + 33,33 + 33,33.
 */
export const splitInstallmentAmounts = (total: number, count: number) => {
  const totalCents = Math.round(total * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents - baseCents * count;

  return Array.from(
    { length: count },
    (_, index) => (baseCents + (index === 0 ? remainder : 0)) / 100,
  );
};

/**
 * Parcelas de uma compra: uma por mês, no mesmo dia da compra (em meses mais
 * curtos, o último dia), com o nome "Compra (1/12)".
 */
export const buildInstallments = ({
  name,
  total,
  count,
  firstDate,
}: {
  name: string;
  total: number;
  count: number;
  firstDate: Date;
}): Installment[] =>
  splitInstallmentAmounts(total, count).map((amount, index) => ({
    name: `${name} (${index + 1}/${count})`,
    amount,
    // addMonths já usa o último dia quando o mês não tem o dia (31/01 → 28/02).
    date: addMonths(firstDate, index),
    installmentNumber: index + 1,
    installmentTotal: count,
  }));
