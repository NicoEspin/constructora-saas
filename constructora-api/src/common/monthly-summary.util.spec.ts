import { Prisma } from '@prisma/client';
import { buildMonthlySummary, getMonthRanges } from './monthly-summary.util';

describe('getMonthRanges', () => {
  it('computes current/previous month boundaries within the same year', () => {
    const { currentStart, previousStart, previousEnd } = getMonthRanges(new Date(2026, 5, 22));

    expect(currentStart).toEqual(new Date(2026, 5, 1));
    expect(previousStart).toEqual(new Date(2026, 4, 1));
    expect(previousEnd).toEqual(currentStart);
  });

  it('rolls back into December of the prior year when reference is January', () => {
    const { currentStart, previousStart } = getMonthRanges(new Date(2026, 0, 15));

    expect(currentStart).toEqual(new Date(2026, 0, 1));
    expect(previousStart).toEqual(new Date(2025, 11, 1));
  });
});

describe('buildMonthlySummary', () => {
  it('computes a positive percent change', () => {
    const result = buildMonthlySummary(new Prisma.Decimal(150), new Prisma.Decimal(100));

    expect(result).toEqual({
      currentMonthTotal: '150',
      previousMonthTotal: '100',
      percentChange: 50,
    });
  });

  it('computes a negative percent change', () => {
    const result = buildMonthlySummary(new Prisma.Decimal(50), new Prisma.Decimal(100));

    expect(result.percentChange).toBe(-50);
  });

  it('returns null percentChange when the previous month had no activity', () => {
    const result = buildMonthlySummary(new Prisma.Decimal(100), null);

    expect(result).toEqual({
      currentMonthTotal: '100',
      previousMonthTotal: '0',
      percentChange: null,
    });
  });

  it('returns null percentChange when both months had no activity', () => {
    const result = buildMonthlySummary(null, null);

    expect(result).toEqual({
      currentMonthTotal: '0',
      previousMonthTotal: '0',
      percentChange: null,
    });
  });

  it('computes -100% when the current month dropped to zero', () => {
    const result = buildMonthlySummary(null, new Prisma.Decimal(100));

    expect(result.percentChange).toBe(-100);
  });
});
