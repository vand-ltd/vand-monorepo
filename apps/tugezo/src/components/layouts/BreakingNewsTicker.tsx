'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getBreakingNews } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';

export function BreakingNewsTicker() {
  const locale = useLocale();
  const t = useTranslations('breakingNews');

  const { data: breakingArticles = [] } = useQuery({
    queryKey: ['breaking-news', locale],
    queryFn: () => getBreakingNews(locale),
    refetchInterval: 60000,
  });

  if (breakingArticles.length === 0) return null;

  // Duplicate items to create seamless loop
  const tickerItems = [...breakingArticles, ...breakingArticles];

  return (
    <div className="bg-gradient-breaking-news text-white py-2 overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center">
        <div className="flex items-center space-x-2 mr-4 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="font-bold text-sm uppercase tracking-wide">
            {t('label')}
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div
            className="flex whitespace-nowrap animate-ticker"
            style={{
              animationDuration: `${breakingArticles.length * 10}s`,
            }}
          >
            {tickerItems.map((article: any, index: number) => (
              <span key={`${article.id}-${index}`} className="inline-flex items-center shrink-0">
                {index > 0 && (
                  <span className="mx-4 text-white/30">|</span>
                )}
                <Link
                  href={`/${locale}/article/${article.slug}`}
                  className="inline-flex items-center text-sm hover:underline"
                >
                  <span>{article.title}</span>
                  <span className="ml-1.5 flex items-center text-white/70 text-xs">
                    {t('readMore')} <ChevronRight className="h-3 w-3" />
                  </span>
                </Link>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
