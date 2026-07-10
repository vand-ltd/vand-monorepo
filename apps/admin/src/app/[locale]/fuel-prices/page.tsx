'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFuelPriceHistory, deleteFuelPrice, type FuelPriceRecord } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  ArrowDownUp,
  FileText,
  X,
  Trash2,
} from 'lucide-react';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Kerosene'] as const;
const FUEL_COLORS: Record<string, string> = {
  Petrol: '#F59E0B',
  Diesel: '#005F73',
  Kerosene: '#6366f1',
};

function colorFor(fuelType: string): string {
  return FUEL_COLORS[fuelType] ?? '#003153';
}

function toNumber(value: string | null | undefined): number | null {
  if (value == null) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export default function FuelPricesListPage() {
  const t = useTranslations('fuelPricesList');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFuelPrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fuel-history'] });
      queryClient.invalidateQueries({ queryKey: ['admin-fuel-history-all'] });
      toast.success(t('deleted'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('deleteFailed');
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });

  const [filters, setFilters] = useState<{
    fuelType: string;
    year: string;
    direction: string;
    from: string;
    to: string;
    order: 'asc' | 'desc';
  }>({ fuelType: '', year: '', direction: '', from: '', to: '', order: 'desc' });

  const [preview, setPreview] = useState<{ url: string; filename: string } | null>(null);

  const hasActiveFilters = !!(
    filters.fuelType ||
    filters.year ||
    filters.direction ||
    filters.from ||
    filters.to
  );

  // Unfiltered fetch, only to derive the available years for the filter
  const allHistoryQuery = useQuery({
    queryKey: ['admin-fuel-history-all'],
    queryFn: () => getFuelPriceHistory(),
  });
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const rec of allHistoryQuery.data ?? []) set.add(new Date(rec.effectiveDate).getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [allHistoryQuery.data]);

  const historyQuery = useQuery({
    queryKey: [
      'admin-fuel-history',
      filters.fuelType,
      filters.year,
      filters.direction,
      filters.from,
      filters.to,
      filters.order,
    ],
    queryFn: () =>
      getFuelPriceHistory({
        fuelType: filters.fuelType || undefined,
        year: filters.year ? Number(filters.year) : undefined,
        direction: (filters.direction || undefined) as 'up' | 'down' | 'same' | undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        order: filters.order,
      }),
  });
  const rows = historyQuery.data ?? [];

  const selectClass =
    'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153]';

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('pageTitle')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('total', { count: rows.length })}
            </p>
          </div>
          <Link
            href="/create-fuel-prices"
            className="inline-flex items-center space-x-2 bg-[#003153] hover:bg-[#005F73] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addNew')}</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.fuelType}
              onChange={(e) => setFilters((f) => ({ ...f, fuelType: e.target.value }))}
              className={selectClass}
            >
              <option value="">{t('allFuels')}</option>
              {FUEL_TYPES.map((ft) => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>
            <select
              value={filters.year}
              onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
              className={selectClass}
            >
              <option value="">{t('allYears')}</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={filters.direction}
              onChange={(e) => setFilters((f) => ({ ...f, direction: e.target.value }))}
              className={selectClass}
            >
              <option value="">{t('allMovements')}</option>
              <option value="up">{t('movementUp')}</option>
              <option value="down">{t('movementDown')}</option>
              <option value="same">{t('movementSame')}</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              {t('filterFrom')}
              <input
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                className={selectClass}
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              {t('filterTo')}
              <input
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                className={selectClass}
              />
            </label>
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, order: f.order === 'desc' ? 'asc' : 'desc' }))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
              {filters.order === 'desc' ? t('orderNewest') : t('orderOldest')}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() =>
                  setFilters({ fuelType: '', year: '', direction: '', from: '', to: '', order: 'desc' })
                }
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-3.5 w-3.5" />
                {t('clearFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {historyQuery.isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400">{t('noRecords')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('colEffectiveDate')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      {t('colRecordedDate')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('colFuel')}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('colPrice')}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('colChange')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('colSource')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                      {t('colNote')}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('colActions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rows.map((rec: FuelPriceRecord) => (
                    <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {formatDate(rec.effectiveDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                        {formatDate(rec.recordedDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
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
                                setPreview({ url: rec.sourceFile!.url, filename: rec.sourceFile!.filename })
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
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#003153] dark:text-[#F59E0B] hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              {t('view')}
                            </a>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span
                          title={rec.note || undefined}
                          className="block max-w-[240px] truncate text-sm text-gray-500 dark:text-gray-400"
                        >
                          {rec.note || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={deleteMutation.isPending}
                              className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              title={t('delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('confirmDelete', {
                                  fuel: rec.fuelType,
                                  date: formatDate(rec.effectiveDate),
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(rec.id)}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                              >
                                {t('delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
    </AuthGuard>
  );
}
