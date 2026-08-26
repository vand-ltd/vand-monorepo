import type { FuelPriceRecord } from '@org/api';

export interface FuelSeriesInsight {
  fuelType: string;
  current: number | null;
  currentDate: string | null;
  first: number | null;
  firstDate: string | null;
  increases: number;
  decreases: number;
  unchanged: number;
  changeCount: number;
  average: number | null;
  high: { price: number; date: string } | null;
  low: { price: number; date: string } | null;
  largestIncrease: { amount: number; date: string } | null;
  largestDecrease: { amount: number; date: string } | null;
  pctVsStart: number | null;
}

export interface FuelInsights {
  updateCount: number;
  firstDate: string | null;
  lastDate: string | null;
  perFuel: Record<string, FuelSeriesInsight>;
}

function num(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Compute headline insights from the full fuel-price history — counts of
 * increases/decreases/unchanged, all-time high/low, largest moves and % vs the
 * first recorded price. Used to make the pages content-rich (not thin).
 */
export function computeFuelInsights(history: FuelPriceRecord[]): FuelInsights {
  const byFuel: Record<string, FuelPriceRecord[]> = {};
  const allDates = new Set<string>();
  for (const r of history) {
    (byFuel[r.fuelType] ||= []).push(r);
    if (r.effectiveDate) allDates.add(r.effectiveDate.slice(0, 10));
  }

  const perFuel: Record<string, FuelSeriesInsight> = {};
  for (const [fuel, recs] of Object.entries(byFuel)) {
    const asc = recs
      .slice()
      .sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());

    let increases = 0;
    let decreases = 0;
    let unchanged = 0;
    let sum = 0;
    let count = 0;
    let high: { price: number; date: string } | null = null;
    let low: { price: number; date: string } | null = null;
    let largestIncrease: { amount: number; date: string } | null = null;
    let largestDecrease: { amount: number; date: string } | null = null;

    asc.forEach((r, i) => {
      const p = num(r.pricePerLiter);
      if (p == null) return;
      sum += p;
      count++;
      if (high == null || p > high.price) high = { price: p, date: r.effectiveDate };
      if (low == null || p < low.price) low = { price: p, date: r.effectiveDate };
      if (i > 0) {
        const prev = num(asc[i - 1].pricePerLiter);
        if (prev != null) {
          const d = p - prev;
          if (d > 0) {
            increases++;
            if (largestIncrease == null || d > largestIncrease.amount)
              largestIncrease = { amount: d, date: r.effectiveDate };
          } else if (d < 0) {
            decreases++;
            if (largestDecrease == null || -d > largestDecrease.amount)
              largestDecrease = { amount: -d, date: r.effectiveDate };
          } else {
            unchanged++;
          }
        }
      }
    });

    const firstRec = asc.find((r) => num(r.pricePerLiter) != null) ?? null;
    const lastRec = [...asc].reverse().find((r) => num(r.pricePerLiter) != null) ?? null;
    const first = firstRec ? num(firstRec.pricePerLiter) : null;
    const current = lastRec ? num(lastRec.pricePerLiter) : null;

    perFuel[fuel] = {
      fuelType: fuel,
      current,
      currentDate: lastRec?.effectiveDate ?? null,
      first,
      firstDate: firstRec?.effectiveDate ?? null,
      increases,
      decreases,
      unchanged,
      changeCount: increases + decreases,
      average: count > 0 ? sum / count : null,
      high,
      low,
      largestIncrease,
      largestDecrease,
      pctVsStart:
        first != null && current != null && first !== 0 ? ((current - first) / first) * 100 : null,
    };
  }

  const sortedDates = Array.from(allDates).sort();
  return {
    updateCount: allDates.size,
    firstDate: sortedDates[0] ?? null,
    lastDate: sortedDates[sortedDates.length - 1] ?? null,
    perFuel,
  };
}
