'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getArticles, updateArticle } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Star,
  StarOff,
  Search,
  Filter,
  Plus,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const FEATURED_TYPES = ['Hero', 'Secondary', 'Spotlight'] as const;
type ArticleStatus = 'Draft' | 'InReview' | 'Published' | 'Rejected' | 'Archived';

const FEATURED_COLORS: Record<string, { badge: string; text: string }> = {
  Hero: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    text: 'text-purple-700 dark:text-purple-400',
  },
  Secondary: {
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    text: 'text-cyan-700 dark:text-cyan-400',
  },
  Spotlight: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    text: 'text-amber-700 dark:text-amber-400',
  },
};

const STATUS_COLORS: Record<ArticleStatus, string> = {
  Draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  InReview: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Archived: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

function getTransitions(status: ArticleStatus): ArticleStatus[] {
  switch (status) {
    case 'Draft': return ['InReview', 'Published'];
    case 'InReview': return ['Published', 'Draft', 'Rejected'];
    case 'Rejected': return ['Draft', 'InReview'];
    case 'Published': return ['Archived'];
    case 'Archived': return [];
    default: return [];
  }
}

export default function ArticlesPage() {
  const locale = useLocale();
  const t = useTranslations('articles');
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [featuredFilter, setFeaturedFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [featuredDropdownOpen, setFeaturedDropdownOpen] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!statusDropdownOpen && !featuredDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(null);
        setFeaturedDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [statusDropdownOpen, featuredDropdownOpen]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', locale, page, limit, statusFilter, featuredFilter],
    queryFn: () =>
      getArticles({
        language: locale,
        page,
        limit,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(featuredFilter ? { featuredType: featuredFilter } : {}),
      }),
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, featuredType }: { id: string; featuredType: string | null }) =>
      updateArticle(id, { featuredType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success(t('featureToggled'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('featureToggleFailed');
      toast.error(message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateArticle(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      toast.success(t('statusUpdated'));
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || t('statusUpdateFailed');
      toast.error(Array.isArray(message) ? message.join(', ') : message);
    },
  });

  const articles = data?.articles ?? data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };
  const totalPages = meta.totalPages || Math.ceil((meta.total || 0) / limit);

  // Client-side search filter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredArticles = searchQuery
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      articles.filter((a: any) =>
        a.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

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
              {t('totalArticles', { count: meta.total || articles.length })}
            </p>
          </div>
          <Link
            href="/create-article"
            className="inline-flex items-center space-x-2 bg-[#003153] hover:bg-[#005F73] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t('createNew')}</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B] text-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153]"
              >
                <option value="">{t('allStatuses')}</option>
                <option value="Draft">{t('statusDraft')}</option>
                <option value="InReview">{t('statusInReview')}</option>
                <option value="Published">{t('statusPublished')}</option>
                <option value="Rejected">{t('statusRejected')}</option>
                <option value="Archived">{t('statusArchived')}</option>
              </select>
            </div>

            {/* Featured Filter */}
            <select
              value={featuredFilter}
              onChange={(e) => {
                setFeaturedFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153]"
            >
              <option value="">{t('allFeatured')}</option>
              {FEATURED_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`featuredType.${type}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div ref={tableRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400">{t('noArticles')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('columnTitle')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      {t('columnCategory')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('columnStatus')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      {t('columnFeatured')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                      {t('columnViews')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                      {t('columnDate')}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('columnActions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {filteredArticles.map((article: any) => (
                    <tr
                      key={article.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                    >
                      {/* Title + Thumbnail */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-9 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                            {article.thumbnail?.url ? (
                              <img
                                src={article.thumbnail.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                —
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                              {article.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[200px] sm:max-w-[300px]">
                              {article.author?.user?.fullName || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {article.category?.name || '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <button
                            onClick={() => setStatusDropdownOpen(
                              statusDropdownOpen === article.id ? null : article.id
                            )}
                            disabled={statusMutation.isPending}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${
                              STATUS_COLORS[article.status as ArticleStatus] || STATUS_COLORS.Draft
                            }`}
                          >
                            {t(`status${article.status}`)}
                            {getTransitions(article.status as ArticleStatus).length > 0 && (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                          {statusDropdownOpen === article.id && getTransitions(article.status as ArticleStatus).length > 0 && (
                            <div className="absolute z-20 mt-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                              {getTransitions(article.status as ArticleStatus).map((targetStatus) => (
                                <button
                                  key={targetStatus}
                                  onClick={() => {
                                    statusMutation.mutate({ id: article.id, status: targetStatus });
                                    setStatusDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                >
                                  <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[targetStatus].split(' ')[0]}`} />
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {t(`status${targetStatus}`)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Featured Type */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {article.featuredType ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${FEATURED_COLORS[article.featuredType]?.badge || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                            {t(`featuredType.${article.featuredType}`)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Views */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{article.viewCount || 0}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(article.createdAt)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <div className="relative">
                            <button
                              onClick={() => {
                                if (article.status !== 'Published' && !article.featuredType) {
                                  toast.error(t('featureOnlyPublished'));
                                  return;
                                }
                                setFeaturedDropdownOpen(
                                  featuredDropdownOpen === article.id ? null : article.id
                                );
                              }}
                              disabled={toggleFeaturedMutation.isPending}
                              className={`p-1.5 rounded-lg transition-colors ${
                                article.featuredType
                                  ? `${FEATURED_COLORS[article.featuredType]?.text || 'text-gray-400'} hover:bg-gray-100 dark:hover:bg-gray-700`
                                  : article.status !== 'Published'
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              title={
                                article.featuredType
                                  ? t('removeFeatured')
                                  : article.status !== 'Published'
                                    ? t('featureOnlyPublished')
                                    : t('makeFeatured')
                              }
                            >
                              {article.featuredType ? (
                                <Star className="h-4 w-4 fill-current" />
                              ) : (
                                <StarOff className="h-4 w-4" />
                              )}
                            </button>
                            {featuredDropdownOpen === article.id && (
                              <div className="absolute z-20 mt-1 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                                {FEATURED_TYPES.map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      toggleFeaturedMutation.mutate({
                                        id: article.id,
                                        featuredType: type,
                                      });
                                      setFeaturedDropdownOpen(null);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                                      article.featuredType === type
                                        ? `font-medium ${FEATURED_COLORS[type].text}`
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                  >
                                    <Star className={`h-3 w-3 ${article.featuredType === type ? 'fill-current' : ''}`} />
                                    {t(`featuredType.${type}`)}
                                  </button>
                                ))}
                                {article.featuredType && (
                                  <>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                                    <button
                                      onClick={() => {
                                        toggleFeaturedMutation.mutate({
                                          id: article.id,
                                          featuredType: null,
                                        });
                                        setFeaturedDropdownOpen(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                                    >
                                      <StarOff className="h-3 w-3" />
                                      {t('removeFeatured')}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/articles/${article.slug}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={t('editArticle')}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('pageInfo', {
                  current: page,
                  total: totalPages,
                })}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
