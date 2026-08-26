'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getCurrentFuelPrices, type CurrentFuelPrice } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown, Minus, Fuel, ChevronRight } from 'lucide-react';

// Canonical display order everywhere: Petrol → Diesel → Kerosene → (others).
const FUEL_ORDER = ['Petrol', 'Diesel', 'Kerosene'];
function fuelRank(fuelType: string): number {
  const i = FUEL_ORDER.indexOf(fuelType);
  return i === -1 ? FUEL_ORDER.length : i;
}

function toNumber(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function Chip({ p }: { p: CurrentFuelPrice }) {
  const price = toNumber(p.pricePerLiter);
  if (price == null) return null;
  const change = typeof p.change === 'number' ? p.change : null;
  const DirIcon = p.direction === 'up' ? ArrowUp : p.direction === 'down' ? ArrowDown : Minus;
  // In the fuel domain a price rise is "bad" → red; a drop is "good" → green.
  const dirColor =
    p.direction === 'up'
      ? 'text-red-400'
      : p.direction === 'down'
        ? 'text-green-400'
        : 'text-white/50';
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap shrink-0 mr-5 sm:mr-6">
      <span className="text-xs text-white/70">{p.fuelType}</span>
      <span className="text-sm font-semibold tabular-nums">{price.toLocaleString()}</span>
      <span className="text-[10px] text-white/50">{p.currency ?? 'RWF'}</span>
      {change != null && p.direction != null && (
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${dirColor}`}>
          <DirIcon className="h-3 w-3" />
          {change !== 0 ? Math.abs(change).toLocaleString() : ''}
        </span>
      )}
    </span>
  );
}

export function FuelPriceStrip() {
  const locale = useLocale();
  const t = useTranslations('fuelStrip');

  const { data = [] } = useQuery({
    queryKey: ['current-fuel-prices'],
    queryFn: getCurrentFuelPrices,
    refetchInterval: 300000, // 5 min — prices change rarely, but stay fresh
  });

  // Only fuels that actually have a current price, in canonical order.
  const prices = (data as CurrentFuelPrice[])
    .filter((p) => toNumber(p.pricePerLiter) != null)
    .sort((a, b) => fuelRank(a.fuelType) - fuelRank(b.fuelType));

  if (prices.length === 0) return null;

  // Dates format oddly in rw; fall back to English like the fuel data pages.
  const dateLocale = locale === 'rw' ? 'en' : locale;
  const effectiveDate = prices[0]?.effectiveDate;
  const asOf = effectiveDate
    ? new Date(effectiveDate).toLocaleDateString(dateLocale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Link
      href={`/${locale}/data/fuel-prices`}
      className="block bg-[#003153] text-white hover:bg-[#00436f] transition-colors"
      aria-label={t('label')}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center gap-4">
        {/* Anchor: icon always pinned; the label text is pinned only on sm+.
            On mobile the label rides inside the marquee instead (see below). */}
        <div className="flex items-center gap-2 shrink-0">
          <Fuel className="h-4 w-4 text-[#F59E0B]" />
          <span className="hidden sm:inline font-bold text-sm uppercase tracking-wide whitespace-nowrap">
            {t('label')}
          </span>
        </div>

        {/* min-w-0 lets this flex child shrink so it never pushes the strip past
            the viewport. On mobile the whole string (label + prices + date)
            marquees; from sm up the chips sit static since there's room. */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Mobile: seamless marquee. Two identical groups translated -50%. */}
          <div
            className="sm:hidden flex animate-ticker"
            style={{ animationDuration: `${Math.max(prices.length * 7, 16)}s` }}
          >
            {[0, 1].map((dup) => (
              <div
                key={dup}
                aria-hidden={dup === 1}
                className="flex items-center shrink-0"
              >
                <span className="font-bold text-xs uppercase tracking-wide whitespace-nowrap mr-5">
                  {t('label')}
                </span>
                {prices.map((p) => (
                  <Chip key={`${dup}-${p.fuelType}`} p={p} />
                ))}
                {asOf && (
                  <span className="text-xs text-white/55 whitespace-nowrap mr-5">
                    {t('asOf', { date: asOf })}
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* sm+: static row */}
          <div className="hidden sm:flex items-center">
            {prices.map((p) => (
              <Chip key={p.fuelType} p={p} />
            ))}
          </div>
        </div>

        {/* As-of + affordance */}
        <div className="hidden md:flex items-center gap-1 shrink-0 text-xs text-white/60">
          {asOf && <span className="whitespace-nowrap">{t('asOf', { date: asOf })}</span>}
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
