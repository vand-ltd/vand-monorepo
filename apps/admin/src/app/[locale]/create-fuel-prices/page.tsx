'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createFuelPricesBulk, uploadMedia } from '@org/api';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AdminGuard } from '@/components/AdminGuard';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, Fuel, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';

const FUEL_TYPES = ['Petrol', 'Diesel', 'Kerosene'] as const;

type PriceRow = { fuelType: string; pricePerLiter: string };

export default function CreateFuelPricesPage() {
  const t = useTranslations('createFuelPrices');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [effectiveDate, setEffectiveDate] = useState('');
  const [recordedDate, setRecordedDate] = useState('');
  const [note, setNote] = useState('');
  const [sourceFile, setSourceFile] = useState<{ id: string; url: string; filename?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rows, setRows] = useState<PriceRow[]>([
    { fuelType: 'Petrol', pricePerLiter: '' },
    { fuelType: 'Diesel', pricePerLiter: '' },
  ]);

  const mutation = useMutation({
    mutationFn: createFuelPricesBulk,
    onSuccess: () => {
      toast.success(t('created'));
      router.push('/');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('failed');
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      setSourceFile({ id: uploaded.id, url: uploaded.url, filename: uploaded.filename || file.name });
    } catch {
      toast.error(t('uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateRow = (index: number, patch: Partial<PriceRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const addRow = () => setRows((prev) => [...prev, { fuelType: '', pricePerLiter: '' }]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const validRows = rows.filter((r) => r.fuelType && r.pricePerLiter !== '');
  const hasDuplicateFuel =
    new Set(validRows.map((r) => r.fuelType)).size !== validRows.length;
  const isValid = effectiveDate && recordedDate && validRows.length > 0 && !hasDuplicateFuel;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    mutation.mutate({
      effectiveDate,
      recordedDate,
      ...(sourceFile ? { sourceFileId: sourceFile.id } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      prices: validRows.map((r) => ({
        fuelType: r.fuelType,
        pricePerLiter: Number(r.pricePerLiter),
      })),
    });
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B] focus:border-transparent outline-none transition-colors';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <AdminGuard>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('backToDashboard')}</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#003153] to-[#005F73] rounded-lg flex items-center justify-center">
                <Fuel className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('pageTitle')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('pageSubtitle')}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Prices */}
            <div>
              <label className={labelClass}>{t('pricesLabel')}</label>
              <div className="space-y-2.5">
                {rows.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={row.fuelType}
                      onChange={(e) => updateRow(index, { fuelType: e.target.value })}
                      className={`${inputClass} flex-1`}
                    >
                      <option value="">{t('selectFuel')}</option>
                      {FUEL_TYPES.map((ft) => (
                        <option key={ft} value={ft}>
                          {ft}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={row.pricePerLiter}
                      onChange={(e) => updateRow(index, { pricePerLiter: e.target.value })}
                      placeholder={t('pricePlaceholder')}
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                      className="p-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title={t('removeRow')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {hasDuplicateFuel && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{t('duplicateFuel')}</p>
              )}
              <button
                type="button"
                onClick={addRow}
                className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-[#003153] dark:text-[#F59E0B] hover:underline"
              >
                <Plus className="h-4 w-4" />
                {t('addFuel')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="effectiveDate" className={labelClass}>
                  {t('effectiveDateLabel')}
                </label>
                <input
                  id="effectiveDate"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="recordedDate" className={labelClass}>
                  {t('recordedDateLabel')}
                </label>
                <input
                  id="recordedDate"
                  type="date"
                  value={recordedDate}
                  onChange={(e) => setRecordedDate(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Source file */}
            <div>
              <label className={labelClass}>{t('sourceFileLabel')}</label>
              {sourceFile ? (
                <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 p-2.5">
                  {sourceFile.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sourceFile.url}
                      alt={sourceFile.filename || ''}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <span className="flex-1 truncate text-sm text-gray-600 dark:text-gray-300">
                    {sourceFile.filename}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSourceFile(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title={t('removeFile')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 py-4 text-sm text-gray-500 dark:text-gray-400 hover:border-[#003153] dark:hover:border-[#F59E0B] transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('uploading')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {t('uploadSource')}
                    </>
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className={labelClass}>
                {t('noteLabel')}
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={t('notePlaceholder')}
                className={inputClass}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isValid || mutation.isPending}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#003153] to-[#005F73] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('creating')}</span>
                  </>
                ) : (
                  <>
                    <Fuel className="h-4 w-4" />
                    <span>{t('createButton')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}
