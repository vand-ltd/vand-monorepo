'use client'

import React, { ReactNode, useEffect, useState } from "react";
import { TrendingUp, Clock, Eye, ArrowUp, Flame, Megaphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getTrendingArticles, getRelatedArticles, getArticles } from "@org/api";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatTimeAgo } from "@/lib/timeago";
import { FootballWidget } from "./FootballWidget";
import { FootballStrip } from "./FootballStrip";
import { AdSlot } from "@/components/ads/AdSlot";
import { AdCoordinatorProvider } from "@/components/ads/AdCoordinator";
import type { AdSection, AdPageType } from "@org/api";

type AsideBannerProps = {
  children: ReactNode;
};

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function AdPlaceholder({ size, label }: { size: string; label: string }) {
  return (
    <Card className="overflow-hidden !p-0 !gap-0 hidden lg:block">
      <div className="w-full h-[250px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 dark:bg-brand-accent/10 flex items-center justify-center mb-3">
          <Megaphone className="h-6 w-6 text-brand-primary dark:text-brand-accent" />
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">{size}</p>
      </div>
    </Card>
  );
}

// Section-specific ad slot for non-article sections (football / data hub).
// The data-ad-slot differs per section so each can serve its own campaign.
function SectionAdCard({ section, title }: { section: 'football' | 'data'; title: string }) {
  return (
    <Card className="overflow-hidden !p-0 !gap-0">
      <div
        data-ad-slot={`${section}-sidebar`}
        className="relative h-[250px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center text-center p-6"
      >
        <span className="absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {section}
        </span>
        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 dark:bg-brand-accent/10 flex items-center justify-center mb-3">
          <Megaphone className="h-6 w-6 text-brand-primary dark:text-brand-accent" />
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">300 × 250</p>
      </div>
    </Card>
  );
}

function StickyBottomBanner({
  label,
  section,
  pageType,
}: {
  label: string;
  section: AdSection;
  pageType: AdPageType;
}) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-gray-200 dark:border-gray-700 px-3 py-2 shadow-lg">
      <div className="max-w-screen-xl mx-auto flex items-center justify-center">
        <AdSlot
          placement="Footer"
          section={section}
          pageType={pageType}
          fallback={
            <div className="h-[50px] w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Megaphone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <span className="font-medium">{label}</span>
              <span className="text-[10px] text-gray-400">· 320×50</span>
            </div>
          }
        />
      </div>
    </div>
  );
}

function BackToTop({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
    >
      <ArrowUp className="h-4 w-4" />
      <span>{t('backToTop')}</span>
    </button>
  );
}

const AsideBanner = ({ children }: AsideBannerProps) => {
  const locale = useLocale();
  const t = useTranslations('sidebar');
  const pathname = usePathname();
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;
    const update = () => setHeaderHeight(header.offsetHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Detect current page type from pathname
  // Strip locale prefix: /en/article/foo -> /article/foo
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, '/');
  const isArticleView = pathWithoutLocale.startsWith('/article/');
  const isAuthorPage = pathWithoutLocale.startsWith('/author/');
  const isHomePage = pathWithoutLocale === '/' || pathWithoutLocale === '';
  const isCategoryPage = !isArticleView && !isAuthorPage && !isHomePage && pathWithoutLocale !== '/search' && !pathWithoutLocale.startsWith('/login');
  // Non-article sections (football, data hub) have no "related/category" articles,
  // so the sidebar shows a section ad slot there instead of an empty list.
  const isFootballPage = pathWithoutLocale.startsWith('/football');
  const isDataPage = pathWithoutLocale.startsWith('/data');

  const articleSlug = isArticleView ? pathWithoutLocale.replace('/article/', '').split('/')[0] : '';
  const categorySlug = isCategoryPage ? pathWithoutLocale.split('/').filter(Boolean)[0] : '';

  // Map the current page to the ad-targeting vocabulary (section + pageType) so
  // the dynamic ad slots below serve the right campaign.
  const footballPageType = (): AdPageType => {
    const parts = pathWithoutLocale.split('/').filter(Boolean); // ['football', ...]
    if (parts.length <= 1) return 'list';
    if (/^\d{4}-\d{2}-\d{2}$/.test(parts[1])) return 'date';
    if (parts[1] === 'player') return 'player';
    if (parts.length >= 3) return parts[2].includes('-vs-') ? 'match' : 'competition';
    return 'competition';
  };
  const adSection: AdSection = isFootballPage
    ? 'football'
    : isDataPage
      ? 'fuel'
      : isHomePage
        ? 'home'
        : 'news';
  const adPageType: AdPageType = isArticleView
    ? 'article'
    : isFootballPage
      ? footballPageType()
      : isHomePage
        ? 'home'
        : 'list';

  // Trending — for home and fallback
  const { data: trendingData } = useQuery({
    queryKey: ['trending-sidebar', locale],
    queryFn: () => getTrendingArticles({ language: locale, limit: 5 }),
    enabled: isHomePage || isAuthorPage,
  });

  // Related articles — for article view
  const { data: relatedData } = useQuery({
    queryKey: ['related-sidebar', articleSlug],
    queryFn: () => getRelatedArticles(articleSlug),
    enabled: isArticleView && !!articleSlug,
  });

  // Category top stories — for category pages
  const { data: categoryData } = useQuery({
    queryKey: ['category-sidebar', locale, categorySlug],
    queryFn: () => getArticles({ language: locale, categorySlug, status: 'Published', limit: 5 }),
    enabled: isCategoryPage && !!categorySlug,
  });

  // Pick which list to show
  let stories: any[] = [];
  let sidebarTitle = t('trendingNow');
  if (isArticleView) {
    stories = (Array.isArray(relatedData) ? relatedData : relatedData?.articles ?? []).slice(0, 5);
    sidebarTitle = t('relatedStories');
  } else if (isCategoryPage) {
    stories = (Array.isArray(categoryData) ? categoryData : categoryData?.articles ?? []).slice(0, 5);
    sidebarTitle = t('moreInCategory');
  } else {
    stories = Array.isArray(trendingData) ? trendingData : trendingData?.articles ?? [];
  }
  const trendingStories = stories;

  // One header "advertise here" box (matches the Header ad size). Reused for
  // both header slots so an empty box keeps the leaderboard shape.
  const headerAdBox = (
    <div
      className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400"
      style={{ aspectRatio: '728 / 90' }}
    >
      <Megaphone className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      <div className="text-center">
        <p className="text-xs font-medium">{t('adSpaceAvailable')}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('adLeaderboard')}</p>
      </div>
    </div>
  );

  return (
    <AdCoordinatorProvider>
      {/* Top Banner — two side-by-side header ad slots. Each shows an ad when
          available, otherwise its "advertise here" box. Second is desktop-only. */}
      <div className='bg-background border-b'>
        <div className="max-w-screen-xl mx-auto my-4 px-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdSlot
            placement="Header"
            section={adSection}
            pageType={adPageType}
            alwaysShowFallback
            fallback={headerAdBox}
          />
          <div className="hidden sm:block">
            <AdSlot
              placement="Header"
              section={adSection}
              pageType={adPageType}
              alwaysShowFallback
              fallback={headerAdBox}
            />
          </div>
        </div>
      </div>

      <main className='w-full bg-gray-50 dark:bg-gray-900/50'>
        <div className='max-w-screen-xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8'>
          {/* Main Content */}
          <div className='w-full max-w-full min-w-0'>
            {/* Football teaser — homepage only (a compact inline scores strip on
                mobile; the full card is in the desktop sidebar). */}
            {isHomePage && (
              <div className="lg:hidden mb-6">
                <FootballStrip />
              </div>
            )}
            {children}
          </div>

          {/* Enhanced Sidebar */}
          <aside className='space-y-6'>
            {/* On article view */}
            {isArticleView && (
              <>
                {/* Related Stories Card */}
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
                        <h3 className="font-bold text-white">{sidebarTitle}</h3>
                      </div>
                      <TrendingUp className="h-4 w-4 text-white/40" />
                    </div>
                  </div>
                  <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-800 max-h-[60vh] overflow-y-auto">
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
                        className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group border-l-2 border-transparent hover:border-brand-accent"
                      >
                        <span className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-medium leading-tight line-clamp-2 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors">
                            {story.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-0.5">
                              <Eye className="h-3 w-3" />
                              {formatViews(story.viewCount || 0)}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(story.createdAt, locale)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>

                <div className="sticky space-y-6" style={{ top: headerHeight + 120 }}>
                  <AdSlot
                    placement="Sidebar"
                    section={adSection}
                    pageType={adPageType}
                    fallback={<AdPlaceholder size="300 x 250" label={t('adSpaceAvailable')} />}
                  />

                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <ArrowUp className="h-4 w-4" />
                    <span>{t('backToTop')}</span>
                  </button>
                </div>
              </>
            )}

            {/* Default sidebar (home, category, etc.) */}
            {!isArticleView && (
              <>
            {/* Football — desktop sidebar, homepage only (mobile shows a strip at the top) */}
            {isHomePage && (
              <div className="hidden lg:block">
                <FootballWidget />
              </div>
            )}
            {isFootballPage || isDataPage ? (
              // Football/data: the ad, the advertise card and back-to-top all
              // stick together as one block on desktop.
              <div className="lg:sticky space-y-6" style={{ top: headerHeight + 16 }}>
                <AdSlot
                  placement="Sidebar"
                  section={adSection}
                  pageType={adPageType}
                  fallback={
                    <SectionAdCard
                      section={isFootballPage ? 'football' : 'data'}
                      title={t('adSpaceAvailable')}
                    />
                  }
                />
                {/* A second box appears only once a second ad is sold. */}
                <AdSlot placement="Sidebar" section={adSection} pageType={adPageType} />
                <BackToTop t={t} />
              </div>
            ) : (
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
                    <h3 className="font-bold text-white">{sidebarTitle}</h3>
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
                {/* #1 Trending — featured card */}
                {trendingStories.length > 0 && (
                  <Link
                    href={`/${locale}/article/${trendingStories[0].slug}`}
                    className="block group"
                  >
                    <div className="relative h-40 overflow-hidden">
                      {trendingStories[0].thumbnail?.url ? (
                        <Image
                          src={trendingStories[0].thumbnail.url}
                          alt={trendingStories[0].title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="300px"
                        />
                      ) : (
                        <div
                          className="w-full h-full relative overflow-hidden"
                          style={{
                            background: 'light-dark(linear-gradient(145deg, #f3f4f6, #fff), linear-gradient(145deg, rgba(0,49,83,0.3), #1f2937))',
                          }}
                        >
                          <span className="absolute -bottom-2 -right-1 font-black select-none leading-none opacity-[0.07]" style={{ fontSize: '6rem' }}>
                            {(trendingStories[0].category?.name || 'M')[0]}
                          </span>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image src="/favicon.svg" alt="" width={32} height={32} className="object-contain opacity-50" />
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-accent text-white">
                          #1
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h4 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-brand-accent transition-colors">
                          {trendingStories[0].title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/70">
                          <span className="font-medium text-brand-accent">{trendingStories[0].category?.name}</span>
                          <span className="flex items-center gap-0.5">
                            <Eye className="h-3 w-3" />
                            {formatViews(trendingStories[0].viewCount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* #2+ Trending — compact rows */}
                {trendingStories.slice(1).map((story: any, index: number) => (
                  <Link
                    key={story.id}
                    href={`/${locale}/article/${story.slug}`}
                    className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group border-l-2 border-transparent hover:border-brand-accent"
                  >
                    <span className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {index + 2}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-medium leading-tight line-clamp-2 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors">
                        {story.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Eye className="h-3 w-3" />
                          {formatViews(story.viewCount || 0)}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(story.createdAt, locale)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
            )}

            {/* News/home sidebar: the long trending list scrolls, while the
                advertise card, ad and back-to-top stick together. (Football/data
                already render their own sticky block above.) */}
            {!isFootballPage && !isDataPage && (
              <div className="sticky space-y-6" style={{ top: headerHeight + 16 }}>
                <AdSlot
                  placement="Sidebar"
                  section={adSection}
                  pageType={adPageType}
                  fallback={<AdPlaceholder size="300 x 250" label={t('adSpaceAvailable')} />}
                />
                <BackToTop t={t} />
              </div>
            )}
              </>
            )}
          </aside>
        </div>
      </main>

      {/* Mobile-only sticky bottom banner */}
      <StickyBottomBanner label={t('adSpaceAvailable')} section={adSection} pageType={adPageType} />
    </AdCoordinatorProvider>
  );
};

export default AsideBanner;