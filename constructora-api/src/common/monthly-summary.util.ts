import { Prisma } from '@prisma/client';

export interface MonthlyAmountSummary {
  currentMonthTotal: string;
  previousMonthTotal: string;
  percentChange: number | null;
}

export interface MonthRanges {
  currentStart: Date;
  previousStart: Date;
  previousEnd: Date;
}

export function getMonthRanges(reference: Date = new Date()): MonthRanges {
  const currentStart = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const previousStart = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);

  return { currentStart, previousStart, previousEnd: currentStart };
}

export function buildMonthlySummary(
  currentSum: Prisma.Decimal | null,
  previousSum: Prisma.Decimal | null,
): MonthlyAmountSummary {
  const current = currentSum ?? new Prisma.Decimal(0);
  const previous = previousSum ?? new Prisma.Decimal(0);

  const percentChange = previous.gt(0)
    ? current.minus(previous).dividedBy(previous).times(100).toDecimalPlaces(1).toNumber()
    : null;

  return {
    currentMonthTotal: current.toString(),
    previousMonthTotal: previous.toString(),
    percentChange,
  };
}
