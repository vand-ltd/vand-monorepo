'use client'

import React, { ReactNode } from "react";
import { TrendingUp, Clock, Eye, ArrowUp, Flame, Megaphone, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getTrendingArticles } from "@org/api";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { formatTimeAgo } from "@/lib/timeago";

type AsideBannerProps = {
  children: ReactNode;
};

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

const AsideBanner = ({ children }: AsideBannerProps) => {
  const locale = useLocale();
  const t = useTranslations('sidebar');

  const { data: trendingData } = useQuery({
    queryKey: ['trending-sidebar', locale],
    queryFn: () => getTrendingArticles({ language: locale, limit: 5 }),
  });

  const trendingStories = Array.isArray(trendingData) ? trendingData : trendingData?.articles ?? [];

  return (
    <>
      {/* Top Banner Ad */}
      <div className='bg-background border-b px-4'>
        <div className="my-4 w-full max-w-[728px] mx-auto h-[100px] rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <Megaphone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <div className="text-center">
            <p className="text-xs font-medium">{t('adSpaceAvailable')}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">728 x 90 · {t('adLeaderboard')}</p>
          </div>
        </div>
      </div>

      <main className='w-full bg-gray-50 dark:bg-gray-900/50 overflow-hidden'>
        <div className='max-w-screen-xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8'>
          {/* Main Content */}
          <div className='w-full max-w-full min-w-0'>
            {children}
          </div>

          {/* Enhanced Sidebar */}
          <aside className='space-y-6'>
            {/* Trending Stories */}
            <Card className="overflow-hidden !py-0 !gap-0">
              <div
                className="relative overflow-hidden text-white px-4 py-3"
                style={{ background: 'linear-gradient(to right, var(--color-brand-primary), var(--color-brand-secondary), var(--color-brand-primary))' }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(245,158,11,0.2),transparent_60%)]" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-md" style={{ backgroundColor: 'rgba(245,158,11,0.2)' }}>
                      <Flame className="h-4 w-4" style={{ color: 'var(--color-brand-accent)' }} />
                    </div>
                    <h3 className="font-bold text-white">{t('trendingNow')}</h3>
                  </div>
                  <TrendingUp className="h-4 w-4 text-white/40" />
                </div>
              </div>
              <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-800">
                {trendingStories.length === 0 && (
                  <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                )}
                {trendingStories.map((story: any, index: number) => (
                  <Link
                    key={story.id}
                    href={`/${locale}/article/${story.slug}`}
                    className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                  >
                    {/* Rank */}
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-brand-accent text-white'
                        : index === 1
                          ? 'bg-brand-primary/15 text-brand-primary dark:bg-brand-accent/20 dark:text-brand-accent'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      {index + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="relative w-20 h-14 shrink-0 rounded-md overflow-hidden">
                      {story.thumbnail?.url ? (
                        <Image
                          src={story.thumbnail.url}
                          alt={story.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="80px"
                        />
                      ) : (
                        <div
                          className="w-full h-full relative overflow-hidden"
                          style={{
                            background: 'light-dark(linear-gradient(145deg, #f3f4f6, #fff), linear-gradient(145deg, rgba(0,49,83,0.3), #1f2937))',
                          }}
                        >
                          <span className="absolute -bottom-1 -right-0.5 font-black select-none leading-none opacity-[0.07]" style={{ fontSize: '3.5rem' }}>
                            {(story.category?.name || 'M')[0]}
                          </span>
                          <div className="absolute top-0 left-0 w-0.5 h-full" style={{ backgroundColor: '#F59E0B' }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image src="/favicon.svg" alt="" width={16} height={16} className="object-contain opacity-50" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors">
                        {story.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="text-brand-primary dark:text-brand-accent font-medium truncate">
                          {story.category?.name || 'General'}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <div className="flex items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          <span>{formatViews(story.viewCount || 0)}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(story.createdAt, locale)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Advertise With Us CTA */}
            <Card className="overflow-hidden !p-0 !gap-0">
              <div
                className="relative text-white px-5 py-4"
                style={{ background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))' }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(245,158,11,0.15),transparent_60%)]" />
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Megaphone className="h-4 w-4 text-brand-accent" />
                    </div>
                    <h3 className="font-bold text-sm">{t('advertiseTitle')}</h3>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {t('advertiseDescription')}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-white/70">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-brand-accent" />
                      <span>{t('advertiseReach')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-brand-accent" />
                      <span>{t('advertiseGrowth')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="w-full h-[200px] rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                      <Megaphone className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('adSpaceAvailable')}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">300 x 250</p>
                  </div>
                  <a
                    href={`mailto:ads@menyesha.com?subject=${encodeURIComponent(t('advertiseEmailSubject'))}`}
                    className="w-full flex items-center justify-center gap-1.5 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {t('advertiseContact')}
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Second Ad Slot */}
            <Card className="overflow-hidden !p-0 !gap-0">
              <div className="w-full h-[250px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center text-center p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 dark:bg-brand-accent/10 flex items-center justify-center mb-3">
                  <Megaphone className="h-6 w-6 text-brand-primary dark:text-brand-accent" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('adSpaceAvailable')}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">300 x 250 · {t('adSidebar')}</p>
                <a
                  href={`mailto:ads@menyesha.com?subject=${encodeURIComponent(t('advertiseEmailSubject'))}`}
                  className="text-xs font-medium text-brand-primary dark:text-brand-accent hover:underline"
                >
                  {t('advertiseContact')}
                </a>
              </div>
            </Card>

            {/* Back to Top */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowUp className="h-4 w-4" />
              <span>{t('backToTop')}</span>
            </button>
          </aside>
        </div>
      </main>
    </>
  );
};

export default AsideBanner;