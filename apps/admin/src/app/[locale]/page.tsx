'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, getAuthorArticles, updateArticle } from '@org/api';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import {
  User,
  Mail,
  Phone,
  Shield,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Archive,
  Clock,
  Loader2,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AuthGuard } from '@/components/AuthGuard';

type ArticleStatus = 'Draft' | 'InReview' | 'Published' | 'Rejected' | 'Archived';

const STATUS_COLORS: Record<ArticleStatus, string> = {
  Draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  InReview: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Archived: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const STATUS_LABELS: Record<ArticleStatus, string> = {
  Draft: 'draftArticles',
  InReview: 'inReviewArticles',
  Published: 'publishedArticles',
  Rejected: 'rejectedArticles',
  Archived: 'archivedArticles',
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const u = useTranslations('user');
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || '');
  }, []);

  const submitForReview = useMutation({
    mutationFn: (articleId: string) =>
      updateArticle(articleId, { status: 'InReview' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-articles'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const slug = me?.slug;
  const stats = me?.articleStats;

  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['my-articles', slug, locale, page, limit, statusFilter],
    queryFn: () =>
      getAuthorArticles(slug, {
        language: locale,
        page,
        limit,
        ...(statusFilter ? { status: statusFilter } : {}),
      }),
    enabled: !!slug,
  });

  const articles = articlesData?.articles ?? articlesData ?? [];
  const meta = articlesData?.meta ?? { total: 0, page: 1, totalPages: 1 };
  const totalPages = meta.totalPages || Math.ceil((meta.total || 0) / limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredArticles = searchQuery
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? articles.filter((a: any) =>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {t('welcome')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
          </div>
        ) : me ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-brand px-6 py-8 text-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                    {me.internalProfile?.avatar ? (
                      <Image
                        src={me.internalProfile.avatar}
                        alt={me.fullName}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/20 flex items-center justify-center">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white">{me.fullName}</h2>
                  {me.internalProfile?.role?.displayName && (
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <Shield className="h-4 w-4 text-[#F59E0B]" />
                      <span className="text-sm text-gray-200">
                        {me.internalProfile.role.displayName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="px-6 py-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {u('fullName')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {me.fullName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {u('email')}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {me.email}
                      </p>
                    </div>
                  </div>

                  {me.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-[#003153] dark:text-[#F59E0B]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {u('phone')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {me.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-[#3CB371]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {u('status')}
                      </p>
                      <p className="text-sm font-semibold text-[#3CB371]">
                        {u('active')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Article Stats */}
              {stats && (
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {t('articleStats')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard
                      icon={FileText}
                      label={t('totalArticles')}
                      value={stats.total}
                      color="bg-[#003153]/10 dark:bg-[#003153]/30"
                      iconColor="text-[#003153] dark:text-[#F59E0B]"
                    />
                    <StatCard
                      icon={Clock}
                      label={t('draftArticles')}
                      value={stats.draft}
                      color="bg-yellow-50 dark:bg-yellow-900/20"
                      iconColor="text-yellow-600 dark:text-yellow-400"
                    />
                    <StatCard
                      icon={CheckCircle}
                      label={t('publishedArticles')}
                      value={stats.published}
                      color="bg-green-50 dark:bg-green-900/20"
                      iconColor="text-green-600 dark:text-green-400"
                    />
                    <StatCard
                      icon={Send}
                      label={t('inReviewArticles')}
                      value={stats.inReview}
                      color="bg-blue-50 dark:bg-blue-900/20"
                      iconColor="text-blue-600 dark:text-blue-400"
                    />
                    <StatCard
                      icon={XCircle}
                      label={t('rejectedArticles')}
                      value={stats.rejected}
                      color="bg-red-50 dark:bg-red-900/20"
                      iconColor="text-red-600 dark:text-red-400"
                    />
                    <StatCard
                      icon={Archive}
                      label={t('archivedArticles')}
                      value={stats.archived}
                      color="bg-gray-50 dark:bg-gray-700/50"
                      iconColor="text-gray-600 dark:text-gray-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* My Articles */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('myArticles')}
              </h3>

              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
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
                      <option value="Draft">{t('draftArticles')}</option>
                      <option value="InReview">{t('inReviewArticles')}</option>
                      <option value="Published">{t('publishedArticles')}</option>
                      <option value="Rejected">{t('rejectedArticles')}</option>
                      <option value="Archived">{t('archivedArticles')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Articles Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {articlesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-[#003153] dark:text-[#F59E0B]" />
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('noArticles')}
                    </p>
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
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                                  {article.title}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                {article.category?.name || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  STATUS_COLORS[article.status as ArticleStatus] || STATUS_COLORS.Draft
                                }`}
                              >
                                {t(STATUS_LABELS[article.status as ArticleStatus] || 'draftArticles')}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Eye className="h-3.5 w-3.5" />
                                <span>{article.viewCount || 0}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(article.createdAt)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end space-x-1">
                                {userRole === 'reporter' && article.status === 'Draft' && (
                                  <button
                                    onClick={() => submitForReview.mutate(article.id)}
                                    disabled={submitForReview.isPending}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors inline-flex items-center space-x-1 disabled:opacity-50"
                                    title={t('submitForReview')}
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                    <span>{t('submitForReview')}</span>
                                  </button>
                                )}
                                <Link
                                  href={`/articles/${article.slug}`}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors inline-flex"
                                  title={t('viewArticle')}
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
                      {t('pageInfo', { current: page, total: totalPages })}
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
          </>
        ) : null}
      </div>
    </AuthGuard>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-3">
        <div
          className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
