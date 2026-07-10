'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import {
  getCurrentFuelPrices,
  getUpcomingFuelPrices,
  getFuelPriceHistory,
  getFuelPriceStats,
  type CurrentFuelPrice,
  type FuelPriceRecord,
  type FuelDirection,
} from '@org/api';
import {
  Fuel,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Hash,
  FileText,
  X,
  ArrowDownUp,
  SlidersHorizontal,
} from 'lucide-react';
import { FuelPriceChart, type FuelChartPoint } from './FuelPriceChart';

const FUEL_COLORS: Record<string, string> = {
  Petrol: '#F59E0B',
  Diesel: '#005F73',
  Kerosene: '#6366f1',
};
const DEFAULT_COLOR = '#003153';

function colorFor(fuelType: string): string {
  return FUEL_COLORS[fuelType] ?? DEFAULT_COLOR;
}

function toNumber(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function FuelPricesView() {
  const t = useTranslations('fuelPrices');
  const locale = useLocale();

  const formatDate = (iso: string, opts?: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleDateString(locale, opts ?? { year: 'numeric', month: 'short', day: 'numeric' });

  const currentQuery = useQuery({
    queryKey: ['fuel-prices-current'],
    queryFn: getCurrentFuelPrices,
  });

  const upcomingQuery = useQuery({
    queryKey: ['fuel-prices-upcoming'],
    queryFn: getUpcomingFuelPrices,
  });

  const historyQuery = useQuery({
    queryKey: ['fuel-prices-history'],
    queryFn: () => getFuelPriceHistory(),
  });

  const current = currentQuery.data ?? [];
  const upcoming = upcomingQuery.data ?? [];
  const history = historyQuery.data ?? [];

  // Current price per fuel type, for computing the upcoming delta
  const currentByFuel = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const c of current) map[c.fuelType] = toNumber(c.pricePerLiter);
    return map;
  }, [current]);

  // Fuel types offered in the history filter (all known types, incl. ones without history)
  const allFuelTypes = useMemo(() => current.map((c) => c.fuelType), [current]);

  // Years present in the (unfiltered) history, newest first
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const rec of history) set.add(new Date(rec.effectiveDate).getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [history]);

  const [histFilters, setHistFilters] = useState<{
    from: string;
    to: string;
    fuelType: string;
    year: string;
    direction: string;
    order: 'asc' | 'desc';
  }>({ from: '', to: '', fuelType: '', year: '', direction: '', order: 'desc' });

  const [filtersOpen, setFiltersOpen] = useState(false);

  // `order` is a sort, not a filter, so it doesn't count toward "active filters"
  const activeFilterCount = [
    histFilters.from,
    histFilters.to,
    histFilters.fuelType,
    histFilters.year,
    histFilters.direction,
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  // History table has its own server-driven query (filters + sort),
  // separate from the unfiltered `history` used for the chart & stats.
  const historyTableQuery = useQuery({
    queryKey: [
      'fuel-prices-history-table',
      histFilters.from,
      histFilters.to,
      histFilters.fuelType,
      histFilters.year,
      histFilters.direction,
      histFilters.order,
    ],
    queryFn: () =>
      getFuelPriceHistory({
        from: histFilters.from || undefined,
        to: histFilters.to || undefined,
        fuelType: histFilters.fuelType || undefined,
        year: histFilters.year ? Number(histFilters.year) : undefined,
        direction: (histFilters.direction || undefined) as FuelDirection | undefined,
        order: histFilters.order,
      }),
  });
  const tableHistory = historyTableQuery.data ?? [];

  // Fuel types that actually have history (chart/stats need data points)
  const fuelTypes = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const rec of history) {
      if (!seen.has(rec.fuelType)) {
        seen.add(rec.fuelType);
        ordered.push(rec.fuelType);
      }
    }
    return ordered;
  }, [history]);

  const [selectedFuel, setSelectedFuel] = useState<string | null>(null);
  const activeFuel = selectedFuel ?? fuelTypes[0] ?? null;

  const [preview, setPreview] = useState<{ url: string; filename: string } | null>(null);

  const statsQuery = useQuery({
    queryKey: ['fuel-prices-stats', activeFuel],
    queryFn: () =>
      getFuelPriceStats({ year: new Date().getFullYear(), fuelType: activeFuel as string }),
    enabled: !!activeFuel,
  });
  const stats = statsQuery.data;

  const chartData: FuelChartPoint[] = useMemo(() => {
    if (!activeFuel) return [];
    return history
      .filter((r) => r.fuelType === activeFuel)
      .slice()
      .sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime())
      .map((r) => ({
        date: formatDate(r.effectiveDate, { month: 'short', year: '2-digit' }),
        price: toNumber(r.pricePerLiter) ?? 0,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, activeFuel, locale]);

  // Server returns rows already sorted per the `order` param — render as-is.
  const sortedHistory = tableHistory;

  const isLoading = currentQuery.isLoading || historyQuery.isLoading;
  const isError = currentQuery.isError && historyQuery.isError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-24 text-gray-500 dark:text-gray-400">{t('loadError')}</div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="flex items-start gap-3">
        <div className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#003153]/10 text-[#003153] dark:bg-[#F59E0B]/15 dark:text-[#F59E0B]">
          <Fuel className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
        </div>
      </header>

      {/* Current price cards */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('currentPrices')}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {current.map((item) => (
            <CurrentCard key={item.fuelType} item={item} t={t} formatDate={formatDate} />
          ))}
        </div>
      </section>

      {/* Upcoming changes */}
      {upcoming.length > 0 && (
        <section className="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/[0.06] p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-[#F59E0B]" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('upcomingTitle')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('upcomingSubtitle')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((item) => {
              const next = toNumber(item.pricePerLiter);
              const cur = currentByFuel[item.fuelType] ?? null;
              const delta = cur != null && next != null ? next - cur : null;
              const dir = delta == null || delta === 0 ? 'same' : delta > 0 ? 'up' : 'down';
              const DirIcon = dir === 'up' ? ArrowUp : dir === 'down' ? ArrowDown : Minus;
              const dirColor =
                dir === 'up'
                  ? 'text-red-600 dark:text-red-400'
                  : dir === 'down'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400';
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: colorFor(item.fuelType) }}
                      />
                      {item.fuelType}
                    </span>
                    {delta != null && (
                      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${dirColor}`}>
                        <DirIcon className="h-3.5 w-3.5" />
                        {delta !== 0 ? Math.abs(delta).toLocaleString() : t('unchanged')}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {next?.toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-gray-400">
                      {item.currency ? `${item.currency}/L` : t('unit')}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {t('effectiveFrom', { date: formatDate(item.effectiveDate) })}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Fuel selector */}
      {fuelTypes.length > 0 && activeFuel && (
        <>
          <div className="flex flex-wrap gap-2">
            {fuelTypes.map((fuel) => {
              const isActive = fuel === activeFuel;
              return (
                <button
                  key={fuel}
                  onClick={() => setSelectedFuel(fuel)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  style={isActive ? { backgroundColor: colorFor(fuel) } : undefined}
                >
                  {fuel}
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t('statistics')}
            </h2>
            {statsQuery.isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatTile
                  icon={Hash}
                  label={t('records')}
                  value={String(stats.recordCount)}
                />
                <StatTile
                  icon={TrendingUp}
                  label={t('allTimeHigh')}
                  value={
                    stats.allTimeHigh
                      ? `${toNumber(stats.allTimeHigh.pricePerLiter)?.toLocaleString()} `
                      : '—'
                  }
                  sub={stats.allTimeHigh ? formatDate(stats.allTimeHigh.effectiveDate) : undefined}
                />
                <StatTile
                  icon={TrendingDown}
                  label={t('allTimeLow')}
                  value={
                    stats.allTimeLow
                      ? `${toNumber(stats.allTimeLow.pricePerLiter)?.toLocaleString()} `
                      : '—'
                  }
                  sub={stats.allTimeLow ? formatDate(stats.allTimeLow.effectiveDate) : undefined}
                />
                <StatTile
                  icon={BarChart3}
                  label={t('average', { year: stats.average?.year ?? new Date().getFullYear() })}
                  value={stats.average ? stats.average.pricePerLiter.toLocaleString() : '—'}
                />
                <StatTile
                  icon={ArrowUp}
                  label={t('biggestIncrease')}
                  value={stats.biggestIncrease ? `+${stats.biggestIncrease.amount.toLocaleString()}` : '—'}
                  sub={
                    stats.biggestIncrease
                      ? formatDate(stats.biggestIncrease.effectiveDate)
                      : undefined
                  }
                />
              </div>
            ) : null}
          </section>

          {/* Chart */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              {t('priceTrend', { fuel: activeFuel })}
            </h2>
            {chartData.length > 1 ? (
              <FuelPriceChart data={chartData} color={colorFor(activeFuel)} unit={t('unit')} />
            ) : (
              <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                {t('notEnoughData')}
              </p>
            )}
          </section>
        </>
      )}

      {/* History table */}
      <section>
        {/* Toolbar */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('history')}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setHistFilters((f) => ({ ...f, order: f.order === 'desc' ? 'asc' : 'desc' }))
              }
              title={histFilters.order === 'desc' ? t('orderNewest') : t('orderOldest')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {histFilters.order === 'desc' ? t('orderNewest') : t('orderOldest')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                filtersOpen || hasActiveFilters
                  ? 'border-[#003153] text-[#003153] dark:border-[#F59E0B] dark:text-[#F59E0B]'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {t('filters')}
              {hasActiveFilters && (
                <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#003153] px-1 text-[10px] font-semibold text-white dark:bg-[#F59E0B] dark:text-gray-900">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  {t('colFuel')}
                </span>
                <select
                  value={histFilters.fuelType}
                  onChange={(e) => setHistFilters((f) => ({ ...f, fuelType: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003153] dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:ring-[#F59E0B]"
                >
                  <option value="">{t('allFuels')}</option>
                  {allFuelTypes.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  {t('filterYear')}
                </span>
                <select
                  value={histFilters.year}
                  onChange={(e) => setHistFilters((f) => ({ ...f, year: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003153] dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:ring-[#F59E0B]"
                >
                  <option value="">{t('allYears')}</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  {t('filterMovement')}
                </span>
                <select
                  value={histFilters.direction}
                  onChange={(e) => setHistFilters((f) => ({ ...f, direction: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003153] dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:ring-[#F59E0B]"
                >
                  <option value="">{t('allMovements')}</option>
                  <option value="up">{t('movementUp')}</option>
                  <option value="down">{t('movementDown')}</option>
                  <option value="same">{t('movementSame')}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  {t('filterFrom')}
                </span>
                <input
                  type="date"
                  value={histFilters.from}
                  max={histFilters.to || undefined}
                  onChange={(e) => setHistFilters((f) => ({ ...f, from: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003153] dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:ring-[#F59E0B]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  {t('filterTo')}
                </span>
                <input
                  type="date"
                  value={histFilters.to}
                  min={histFilters.from || undefined}
                  onChange={(e) => setHistFilters((f) => ({ ...f, to: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003153] dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:focus:ring-[#F59E0B]"
                />
              </label>
            </div>
            {hasActiveFilters && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setHistFilters({ from: '', to: '', fuelType: '', year: '', direction: '', order: 'desc' })
                  }
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <X className="h-3.5 w-3.5" />
                  {t('clearFilters')}
                </button>
              </div>
            )}
          </div>
        )}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('colDate')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('colFuel')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('colPrice')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('colChange')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('colSource')}
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
                    {t('colNote')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {historyTableQuery.isFetching && sortedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                    </td>
                  </tr>
                ) : sortedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t('noRecords')}
                    </td>
                  </tr>
                ) : (
                  sortedHistory.map((rec: FuelPriceRecord) => (
                  <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(rec.effectiveDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: colorFor(rec.fuelType) }}
                        />
                        {rec.fuelType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {toNumber(rec.pricePerLiter)?.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-gray-400">{rec.currency}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {(() => {
                        if (rec.change == null || rec.direction == null)
                          return <span className="text-xs text-gray-400">—</span>;
                        const DirIcon =
                          rec.direction === 'up' ? ArrowUp : rec.direction === 'down' ? ArrowDown : Minus;
                        const color =
                          rec.direction === 'up'
                            ? 'text-red-600 dark:text-red-400'
                            : rec.direction === 'down'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400';
                        return (
                          <span className={`inline-flex items-center justify-end gap-0.5 text-xs font-medium ${color}`}>
                            <DirIcon className="h-3.5 w-3.5" />
                            {rec.change !== 0 ? Math.abs(rec.change).toLocaleString() : t('unchanged')}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      {rec.sourceFile ? (
                        rec.sourceFile.mimeType?.startsWith('image/') ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreview({
                                url: rec.sourceFile!.url,
                                filename: rec.sourceFile!.filename,
                              })
                            }
                            title={t('viewSource')}
                            className="group block h-9 w-12 overflow-hidden rounded border border-gray-200 dark:border-gray-700"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={rec.sourceFile.url}
                              alt={rec.sourceFile.filename}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            />
                          </button>
                        ) : (
                          <a
                            href={rec.sourceFile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t('viewSource')}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#003153] hover:underline dark:text-[#F59E0B]"
                          >
                            <FileText className="h-4 w-4" />
                            {t('view')}
                          </a>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span
                        title={rec.note || undefined}
                        className="block max-w-[280px] truncate text-sm text-gray-500 dark:text-gray-400"
                      >
                        {rec.note || '—'}
                      </span>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Source preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute -right-3 -top-3 rounded-full bg-white p-1.5 text-gray-700 shadow-lg hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
              aria-label={t('close')}
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.url}
              alt={preview.filename}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
            />
            <p className="mt-2 text-center text-xs text-white/80">{preview.filename}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CurrentCard({ item, t, formatDate }: { item: CurrentFuelPrice; t: any; formatDate: (iso: string, opts?: Intl.DateTimeFormatOptions) => string }) {
  const price = toNumber(item.pricePerLiter);
  const color = colorFor(item.fuelType);
  const direction = item.direction ?? 'same';
  const DirIcon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : Minus;
  const dirColor =
    direction === 'up'
      ? 'text-red-600 dark:text-red-400'
      : direction === 'down'
        ? 'text-green-600 dark:text-green-400'
        : 'text-gray-400';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          {item.fuelType}
        </span>
        {price != null && item.change != null && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${dirColor}`}>
            <DirIcon className="h-3.5 w-3.5" />
            {item.change !== 0 ? Math.abs(item.change).toLocaleString() : t('unchanged')}
          </span>
        )}
      </div>

      <div className="mt-3">
        {price != null ? (
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {price.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-gray-400">
              {item.currency ? `${item.currency}/L` : t('unit')}
            </span>
          </p>
        ) : (
          <p className="text-2xl font-semibold text-gray-300 dark:text-gray-600">{t('notAvailable')}</p>
        )}
      </div>

      {price != null && item.effectiveDate && (
        <p className="mt-2 text-xs text-gray-400">
          {t('effectiveFrom', { date: formatDate(item.effectiveDate) })}
        </p>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-1.5 text-gray-400">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
