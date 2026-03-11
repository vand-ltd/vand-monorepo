'use client'

import React, { ReactNode } from "react";
import { TrendingUp, Clock, Eye, ArrowUp, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getTrendingArticles } from "@org/api";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";

type AsideBannerProps = {
  children: ReactNode;
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

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
        <div className="my-4 w-full max-w-[728px] mx-auto h-[120px] bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-50"></div>
          <div className="relative text-center">
            <div className="text-lg font-semibold text-gray-700 mb-1">Premium Advertisement Space</div>
            <span className="text-xs text-gray-500">728 × 90 (Desktop) / 320 × 100 (Mobile)</span>
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
                          <span>{formatTimeAgo(story.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Side Advertisement */}
            <Card>
              <CardContent className="p-4">
                <div className="w-full h-[300px] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 border border-purple-200 dark:border-purple-700 rounded-lg flex items-center justify-center text-sm text-purple-600 dark:text-purple-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-50"></div>
                  <div className="relative text-center">
                    <div className="text-base font-semibold mb-1">Advertisement</div>
                    <span className="text-xs">300 × 250 Sidebar Ad</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">{t('todaysStats')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('articlesPublished')}</span>
                    <span className="font-bold text-success">47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('totalReaders')}</span>
                    <span className="font-bold text-brand-primary">2.4M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('breakingStories')}</span>
                    <span className="font-bold text-error">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Advertisement Section */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <div className="text-xs text-brand-secondary dark:text-brand-secondary font-medium uppercase tracking-wide">
                    Sponsored Content
                  </div>
                  <div className="relative aspect-square w-24 mx-auto rounded-lg overflow-hidden bg-white dark:bg-gray-800 p-2">
                    <img
                      src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=96&h=96&fit=crop"
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                      TechCorp Solutions
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      Revolutionizing business automation with AI-powered solutions. 
                      Join 10,000+ companies worldwide.
                    </p>
                  </div>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                    Learn More
                  </button>
                  <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                    <span>⭐</span>
                    <span>4.9/5</span>
                    <span>•</span>
                    <span>Trusted by 10K+ companies</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Signup */}
            <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-gray-800 dark:to-gray-800 border-brand-primary">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2 text-brand-primary dark:text-white">{t('stayInformed')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {t('newsletterDescription')}
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder={t('enterEmail')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button className="w-full bg-brand-primary hover:bg-brand-secondary text-white py-2 rounded-lg text-sm font-medium transition-colors">
                    {t('subscribeNow')}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Alternative Advertisement Layout */}
            <Card className="overflow-hidden">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-green-400 to-blue-500">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=240&fit=crop"
                  alt="Business Advertisement"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Ad
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <h4 className="text-white font-bold text-sm mb-1">
                    Growth Marketing Platform
                  </h4>
                  <p className="text-gray-200 text-xs line-clamp-2">
                    Scale your business with data-driven marketing strategies
                  </p>
                </div>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">MarketGrow Inc.</span>
                  <button className="bg-success hover:bg-green-700 text-white text-xs font-medium px-3 py-1 rounded transition-colors">
                    Try Free
                  </button>
                </div>
              </CardContent>
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