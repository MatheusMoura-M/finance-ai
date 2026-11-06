import { describe, expect, it } from "vitest";
import {
  MAX_OCCURRENCES_PER_RUN,
  getDueOccurrences,
  occurrenceDate,
} from "./occurrences";

const day = (year: number, month: number, d: number) =>
  new Date(year, month - 1, d, 12, 0, 0, 0);

describe("occurrenceDate", () => {
  it("usa o próprio dia quando o mês tem esse dia", () => {
    expect(occurrenceDate(2026, 3, 10)).toEqual(day(2026, 3, 10));
  });

  it("dia 31 vira o último dia em meses mais curtos", () => {
    expect(occurrenceDate(2026, 2, 31)).toEqual(day(2026, 2, 28));
    expect(occurrenceDate(2028, 2, 31)).toEqual(day(2028, 2, 29));
    expect(occurrenceDate(2026, 4, 31)).toEqual(day(2026, 4, 30));
  });
});

describe("getDueOccurrences", () => {
  const schedule = {
    dayOfMonth: 10,
    startDate: day(2026, 11, 10),
    endDate: null,
    lastGeneratedAt: day(2026, 11, 10),
  };

  it("não gera nada se o mês atual já foi gerado", () => {
    expect(getDueOccurrences(schedule, day(2026, 11, 25))).toEqual([]);
  });

  it("gera o mês atual quando o mês vira", () => {
    expect(getDueOccurrences(schedule, new Date(2026, 11, 1, 8))).toEqual([
      day(2026, 12, 10),
    ]);
  });

  it("preenche os meses em que o app não foi aberto", () => {
    expect(getDueOccurrences(schedule, day(2027, 2, 3))).toEqual([
      day(2026, 12, 10),
      day(2027, 1, 10),
      day(2027, 2, 10),
    ]);
  });

  it("começa pelo mês de início quando nada foi gerado ainda", () => {
    expect(
      getDueOccurrences(
        { ...schedule, startDate: day(2026, 9, 10), lastGeneratedAt: null },
        day(2026, 10, 1),
      ),
    ).toEqual([day(2026, 9, 10), day(2026, 10, 10)]);
  });

  it("para no mês de término", () => {
    expect(
      getDueOccurrences(
        { ...schedule, endDate: day(2027, 1, 31) },
        day(2027, 5, 1),
      ),
    ).toEqual([day(2026, 12, 10), day(2027, 1, 10)]);
  });

  it("respeita o dia 31 em cada mês", () => {
    expect(
      getDueOccurrences(
        {
          dayOfMonth: 31,
          startDate: day(2026, 1, 31),
          endDate: null,
          lastGeneratedAt: day(2026, 1, 31),
        },
        day(2026, 4, 1),
      ),
    ).toEqual([day(2026, 2, 28), day(2026, 3, 31), day(2026, 4, 30)]);
  });

  it(`gera no máximo ${MAX_OCCURRENCES_PER_RUN} meses de uma vez`, () => {
    expect(getDueOccurrences(schedule, day(2030, 1, 1))).toHaveLength(
      MAX_OCCURRENCES_PER_RUN,
    );
  });
});
