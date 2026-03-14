'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { FolderPlus, Loader2, Plus, X, ChevronDown } from 'lucide-react';
import { AdminGuard } from '@/components/AdminGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory } from '@org/api';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const t = useTranslations('categories');
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [nameEn, setNameEn] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [nameRw, setNameRw] = useState('');
  const [parentGroupId, setParentGroupId] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => getCategories(locale),
  });

  // Fetch English categories for groupId reference
  const { data: enCategories = [] } = useQuery({
    queryKey: ['categories', 'en'],
    queryFn: () => getCategories('en'),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success(t('created'));
      setNameEn('');
      setNameFr('');
      setNameRw('');
      setParentGroupId('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('failed');
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameFr.trim() || !nameRw.trim()) {
      toast.error(t('allLanguagesRequired'));
      return;
    }

    createMutation.mutate({
      translations: [
        { name: nameEn.trim(), language: 'en' },
        { name: nameFr.trim(), language: 'fr' },
        { name: nameRw.trim(), language: 'rw' },
      ],
      ...(parentGroupId ? { parentGroupId } : {}),
    });
  };

  return (
    <AdminGuard>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#003153] to-[#005F73] rounded-xl flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('pageTitle')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('pageSubtitle')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#003153] to-[#005F73] rounded-lg hover:opacity-90 transition-all shadow-sm"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? t('cancel') : t('addCategory')}
            </button>
          </div>

          {/* Create Form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">
                {t('newCategory')}
              </h3>

              <div className="space-y-4">
                {/* Parent Category (optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('parentCategory')}
                  </label>
                  <div className="relative">
                    <select
                      value={parentGroupId}
                      onChange={(e) => setParentGroupId(e.target.value)}
                      className="w-full h-10 px-3 pr-8 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] appearance-none"
                    >
                      <option value="">{t('noParent')}</option>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {enCategories.map((cat: any) => (
                        <option key={cat.groupId} value={cat.groupId}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('parentHint')}
                  </p>
                </div>

                {/* Translations */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      English
                    </label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      placeholder={t('namePlaceholder')}
                      required
                      className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Français
                    </label>
                    <input
                      type="text"
                      value={nameFr}
                      onChange={(e) => setNameFr(e.target.value)}
                      placeholder={t('namePlaceholder')}
                      required
                      className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Kinyarwanda
                    </label>
                    <input
                      type="text"
                      value={nameRw}
                      onChange={(e) => setNameRw(e.target.value)}
                      placeholder={t('namePlaceholder')}
                      required
                      className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003153]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#003153] to-[#005F73] rounded-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {t('create')}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Categories List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('existingCategories')}
              </h3>
            </div>

            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FolderPlus className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">{t('noCategories')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {categories.map((cat: any) => (
                  <div key={cat.id}>
                    {/* Parent category */}
                    <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#003153] dark:bg-[#F59E0B]" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {cat.name}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {cat.slug}
                        </span>
                      </div>
                      {cat.children?.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {cat.children.length} {t('subcategories')}
                        </span>
                      )}
                    </div>

                    {/* Children */}
                    {cat.children?.map((child: any) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between px-6 py-3 pl-14 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {child.name}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {child.slug}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
