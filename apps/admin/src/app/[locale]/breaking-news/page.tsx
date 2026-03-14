'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Zap,
  ChevronDown,
  Globe,
  Loader2,
  Send,
  Clock,
} from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCategories, createArticle } from '@org/api';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';

export default function CreateBreakingNewsPage() {
  const t = useTranslations('breakingNews');
  const locale = useLocale();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState(locale);
  const [breakingUntil, setBreakingUntil] = useState('');

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', language],
    queryFn: () => getCategories(language),
  });


  const articleMutation = useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      toast.success(t('created'));
      router.push('/');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('failed');
      toast.error(message);
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(t('titleRequired'));
      return;
    }
    if (!category) {
      toast.error(t('categoryRequired'));
      return;
    }
    if (!content.trim()) {
      toast.error(t('contentRequired'));
      return;
    }

    articleMutation.mutate({
      title,
      excerpt,
      content,
      language,
      categoryId: category,
      isBreaking: true,
      ...(breakingUntil ? { breakingUntil: new Date(breakingUntil).toISOString() } : {}),
    });
  };

  return (
    <AuthGuard>
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        {/* Top bar */}
        <div className="sticky top-14 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('pageTitle')}
                  </h1>
                  <p className="text-xs text-red-500 font-medium">
                    {t('breakingLabel')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={articleMutation.isPending}
                className="flex items-center gap-1.5 px-4 h-9 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {articleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {t('publish')}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-5">
              {/* Breaking badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <Zap className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  {t('breakingBadge')}
                </span>
              </div>

              {/* Title */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('titleLabel')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('titlePlaceholder')}
                  className="w-full text-xl font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 bg-transparent border-none outline-none"
                />
              </div>

              {/* Excerpt */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('excerptLabel')}
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder={t('excerptPlaceholder')}
                  rows={2}
                  className="w-full text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-none outline-none resize-none"
                />
              </div>

              {/* Content */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('contentLabel')}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('contentPlaceholder')}
                  rows={6}
                  className="w-full text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-none outline-none resize-y"
                />
              </div>
            </div>

            {/* Settings sidebar */}
            <div className="space-y-5">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('settings')}
                  </h3>
                </div>

                <div className="p-5 space-y-5">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('categoryLabel')}
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-10 px-3 pr-8 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                      >
                        <option value="">{t('selectCategory')}</option>
                        {categories.map((cat: any) => (
                          cat.children?.length > 0 ? (
                            <optgroup key={cat.id} label={cat.name}>
                              {cat.children.map((sub: any) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name}
                                </option>
                              ))}
                            </optgroup>
                          ) : (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          )
                        ))}
                      </select>
                      {categoriesLoading && (
                        <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                      )}
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      {t('languageLabel')}
                    </label>
                    <div className="relative">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full h-10 px-3 pr-8 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                      >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="rw">Kinyarwanda</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Breaking Until */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {t('breakingUntilLabel')}
                    </label>
                    <input
                      type="datetime-local"
                      value={breakingUntil}
                      onChange={(e) => setBreakingUntil(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('breakingUntilHint')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info card */}
              <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800/30 p-5">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  {t('infoTitle')}
                </h3>
                <ul className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      {t(`infoTips.${i}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
