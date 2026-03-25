'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAuthor, getAuthorArticles } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  ArrowLeft,
  Calendar,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/timeago';

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const locale = useLocale();
  const t = useTranslations('author');

  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const { data: author, isLoading: authorLoading } = useQuery({
    queryKey: ['author', slug],
    queryFn: () => getAuthor(slug),
  });

  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['author-articles', slug, locale, page, limit],
    queryFn: () =>
      getAuthorArticles(slug, {
        language: locale,
        page,
        limit,
        status: 'Published',
      }),
    enabled: !!slug,
  });

  const articles = articlesData?.articles ?? articlesData ?? [];
  const meta = articlesData?.meta ?? { total: 0, page: 1, totalPages: 1 };
  const totalPages = meta.totalPages || Math.ceil((meta.total || 0) / limit);

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (authorLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary dark:text-brand-accent" />
      </div>
    );
  }

  if (!author) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('notFound')}
        </h1>
        <Link
          href="/"
          className="text-brand-primary hover:underline dark:text-white"
        >
          {t('backToHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Back */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-[var(--color-brand-primary)] hover:text-[var(--color-brand-secondary)] dark:text-white dark:hover:text-[var(--color-brand-accent)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('backToHome')}</span>
        </Link>
      </div>

      {/* Author Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-[var(--color-brand-primary)] to-[var(--color-brand-secondary)] px-6 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 flex-shrink-0">
              {author.internalProfile?.avatar ? (
                <Image
                  src={author.internalProfile.avatar}
                  alt={author.fullName || ''}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/20 flex items-center justify-center">
                  <User className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left text-white flex-1">
              <h1
                className="text-2xl sm:text-3xl font-bold"
                title={author.internalProfile?.displayName || undefined}
              >
                {author.fullName || slug}
              </h1>
              {author.internalProfile?.role?.displayName && (
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/20 text-xs font-medium">
                  {author.internalProfile.role.displayName}
                </span>
              )}
              {author.internalProfile?.bio && (
                <div className="mt-3 max-w-xl relative pl-4 border-l-2 border-white/40">
                  <p className="text-gray-200 leading-relaxed italic text-sm sm:text-base">
                    {author.internalProfile.bio}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-sm text-gray-200">
                {author.internalProfile?.role?.createdAt && (
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t('joined')} {formatDate(author.internalProfile.role.createdAt)}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-1.5">
                  <FileText className="h-4 w-4" />
                  <span>
                    {t('totalArticles', {
                      count: meta.total || articles.length,
                    })}
                  </span>
                </div>
              </div>
              {(author.internalProfile?.xLink || author.internalProfile?.linkedinLink) && (
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                  <span className="text-xs text-gray-300 uppercase tracking-wide">{t('followOn')}</span>
                  {author.internalProfile?.xLink && (
                    <a
                      href={author.internalProfile.xLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-medium"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      <span>X / Twitter</span>
                    </a>
                  )}
                  {author.internalProfile?.linkedinLink && (
                    <a
                      href={author.internalProfile.linkedinLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-medium"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      <span>LinkedIn</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('articles')}
        </h2>
      </div>

      {articlesLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary dark:text-brand-accent" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">{t('noArticles')}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {articles.map((article: any) => (
            <Link
              key={article.id}
              href={`/${locale}/article/${article.slug}`}
              className="group block"
            >
              <article className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300 transform hover:-translate-y-0.5">
                {/* Thumbnail */}
                <div className="relative w-full md:w-60 h-48 md:h-40 flex-shrink-0 rounded-lg overflow-hidden">
                  {article.thumbnail?.url ? (
                    <Image
                      src={article.thumbnail.url}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full relative overflow-hidden"
                      style={{
                        background: 'light-dark(linear-gradient(145deg, #f3f4f6, #fff), linear-gradient(145deg, rgba(0,49,83,0.3), #1f2937))',
                      }}
                    >
                      <span className="absolute -bottom-4 -right-2 font-black select-none leading-none opacity-[0.07]" style={{ fontSize: '10rem' }}>
                        {(article.category?.name || 'M')[0]}
                      </span>
                      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: '#F59E0B' }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image src="/favicon.svg" alt="" width={48} height={48} className="object-contain opacity-50" />
                      </div>
                    </div>
                  )}
                  {article.category?.name && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300">
                        {article.category.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(article.createdAt, locale)}</span>
                      </div>
                      {article.viewCount > 0 && (
                        <>
                          <span>·</span>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{article.viewCount}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors leading-tight mb-2">
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
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
  );
}
