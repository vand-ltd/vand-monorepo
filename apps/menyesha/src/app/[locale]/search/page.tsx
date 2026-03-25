'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getArticles } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, Eye, MessageCircle, ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchInput } from '@/components/layouts/SearchInput';
import { formatTimeAgo } from '@/lib/timeago';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const locale = useLocale();
  const t = useTranslations('search');
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: ['search-articles', locale, query, page],
    queryFn: () =>
      getArticles({
        page,
        limit: 12,
        language: locale,
        search: query,
        status: 'Published',
      }),
    enabled: !!query,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles: any[] = data?.articles ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, totalPages: 1 };
  const totalPages = meta.totalPages || Math.ceil((meta.total || 0) / 12);

  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Back + Search */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-brand-primary dark:hover:text-brand-accent transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('title')}</span>
          </Link>

          <div className="max-w-lg">
            <SearchInput />
          </div>

          {query && (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-6">
              {t('resultsFor', { query })}
            </h1>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="w-60 h-40 flex-shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && query && articles.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('noResults', { query })}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('tryAgain')}
            </p>
          </div>
        )}

        {/* Results */}
        {articles.length > 0 && (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {articles.map((article: any) => (
              <Link
                key={article.id}
                href={`/${locale}/article/${article.slug}`}
                className="group block"
              >
                <article className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300">
                  {/* Image */}
                  <div className="relative w-full md:w-60 lg:w-72 h-48 md:h-40 lg:h-44 flex-shrink-0 rounded-lg overflow-hidden">
                    {article.thumbnail?.url ? (
                      <img
                        src={article.thumbnail.url}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : article.isBreaking ? (
                      <Image
                        src="/breaking-news-banner.svg"
                        alt="Breaking News"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Image src="/favicon.svg" alt="" width={48} height={48} className="object-contain opacity-60" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Category + Time */}
                      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                        {article.category && (
                          <span className="px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {article.category.name}
                          </span>
                        )}
                        <span className="flex items-center space-x-1 text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(article.createdAt, locale)}</span>
                        </span>
                      </div>

                      <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors leading-tight mb-2">
                        {article.title}
                      </h3>

                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 mb-3">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      {article.author?.user?.fullName && (
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {article.author.user.fullName}
                        </span>
                      )}
                      <div className="flex items-center space-x-3 text-xs text-gray-400">
                        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
                          <Eye className="h-3 w-3" />
                          <span>{article.viewCount || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{article._count?.comments || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}

          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-8">
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
                  onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-brand-primary text-white dark:bg-brand-accent dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
