'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories, getTrendingArticles } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Article from '@/components/layouts/Article';
import { Flame } from 'lucide-react';

// The /news landing ("Amakuru"): a browseable news hub.
//  - Trending strip (most-read)
//  - Category chips that filter the feed (All + each category)
//  - The existing Article feed, reused (all-latest with load-more when "All",
//    category offset pages when a chip is active).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickList(res: any): any[] {
  const candidates = [res?.data?.data, res?.data?.articles, res?.data, res?.articles, res];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

export function NewsHub() {
  const locale = useLocale();
  const tNav = useTranslations('nav');
  const tFeed = useTranslations('feed');
  const tSidebar = useTranslations('sidebar');
  const [cat, setCat] = useState<string | undefined>(undefined);

  const { data: categoriesRaw = [] } = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => getCategories(locale),
  });
  const { data: trendingRaw } = useQuery({
    queryKey: ['trending-hub', locale],
    queryFn: () => getTrendingArticles({ limit: 6, language: locale }),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories = (Array.isArray(categoriesRaw) ? categoriesRaw : []) as any[];
  const topCats = categories.filter((c) => c?.slug && c.slug !== 'breaking-news');
  const trending = pickList(trendingRaw).slice(0, 6);

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
      active
        ? 'border-[#003153] bg-[#003153] text-white dark:border-[#F59E0B] dark:bg-[#F59E0B] dark:text-gray-900'
        : 'border-gray-200 text-gray-600 hover:border-[#003153]/40 dark:border-gray-700 dark:text-gray-300 dark:hover:border-[#F59E0B]/40'
    }`;

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          {tNav('news')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tSidebar('stayInformed')}</p>
      </div>

      {/* Trending strip */}
      {trending.length > 0 && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-[#F59E0B]" />
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {tSidebar('trendingNow')}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((a, i) => (
              <Link
                key={a.id ?? a.slug}
                href={`/article/${a.slug}`}
                className="group flex items-start gap-2.5"
              >
                <span className="text-lg font-extrabold leading-none tabular-nums text-[#003153]/25 dark:text-[#F59E0B]/40">
                  {i + 1}
                </span>
                <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-800 group-hover:text-[#003153] dark:text-gray-200 dark:group-hover:text-[#F59E0B]">
                  {a.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Category chips */}
      <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto">
        <button type="button" onClick={() => setCat(undefined)} className={chip(!cat)}>
          {tFeed('all')}
        </button>
        {topCats.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCat(c.slug)}
            className={chip(cat === c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Feed — reuses the existing Article component (all-latest or by category) */}
      <Article categoryKey={cat} />
    </div>
  );
}
