'use client'

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { MessageCircle, Clock, Eye, ArrowRight, BookmarkPlus, TrendingUp, Share2, Heart, Grid, List, Zap, Loader2, ChevronDown } from "lucide-react";
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getArticlesFeed, getCategories } from '@org/api';
import { useLocale } from 'next-intl';

// Keyed by category slug (language-independent) — uses inline styles to avoid !important conflicts
const categoryStyles: Record<string, { lightBg: string; darkBg: string; lightText: string; darkText: string; dot: string }> = {
  "breaking-news": { lightBg: "#fee2e2", darkBg: "#7f1d1d", lightText: "#dc2626", darkText: "#fca5a5", dot: "#dc2626" },
  medical:         { lightBg: "#cffafe", darkBg: "rgba(8,145,178,0.3)", lightText: "#0e7490", darkText: "#67e8f9", dot: "#06b6d4" },
  technology:      { lightBg: "#dbeafe", darkBg: "rgba(29,78,216,0.3)", lightText: "#1d4ed8", darkText: "#93c5fd", dot: "#003153" },
  history:         { lightBg: "#fef3c7", darkBg: "rgba(180,83,9,0.3)", lightText: "#b45309", darkText: "#fcd34d", dot: "#f59e0b" },
  environment:     { lightBg: "#d1fae5", darkBg: "rgba(4,120,87,0.3)", lightText: "#047857", darkText: "#6ee7b7", dot: "#10b981" },
  finance:         { lightBg: "#ede9fe", darkBg: "rgba(109,40,217,0.3)", lightText: "#7c3aed", darkText: "#c4b5fd", dot: "#8b5cf6" },
  space:           { lightBg: "#e0e7ff", darkBg: "rgba(67,56,202,0.3)", lightText: "#4338ca", darkText: "#a5b4fc", dot: "#6366f1" },
  innovation:      { lightBg: "#ccfbf1", darkBg: "rgba(13,148,136,0.3)", lightText: "#0d9488", darkText: "#5eead4", dot: "#14b8a6" },
  education:       { lightBg: "#ffedd5", darkBg: "rgba(194,65,12,0.3)", lightText: "#c2410c", darkText: "#fdba74", dot: "#f97316" },
  science:         { lightBg: "#ffe4e6", darkBg: "rgba(190,18,60,0.3)", lightText: "#be123c", darkText: "#fda4af", dot: "#f43f5e" },
  business:        { lightBg: "#dcfce7", darkBg: "rgba(21,128,61,0.3)", lightText: "#15803d", darkText: "#86efac", dot: "#22c55e" },
  sports:          { lightBg: "#fee2e2", darkBg: "rgba(185,28,28,0.3)", lightText: "#b91c1c", darkText: "#fca5a5", dot: "#ef4444" },
  politics:        { lightBg: "#f3f4f6", darkBg: "#374151", lightText: "#374151", darkText: "#d1d5db", dot: "#6b7280" },
};

const defaultCategoryStyle = { lightBg: "#f3f4f6", darkBg: "#374151", lightText: "#374151", darkText: "#d1d5db", dot: "#6b7280" };

function CategoryBadge({ slug, name, className = "" }: { slug?: string; name?: string; className?: string }) {
  const style = categoryStyles[slug || ""] || defaultCategoryStyle;
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${className}`}
      style={{
        backgroundColor: `light-dark(${style.lightBg}, ${style.darkBg})`,
        color: `light-dark(${style.lightText}, ${style.darkText})`,
      }}
    >
      {name || "General"}
    </span>
  );
}

function ArticleSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div className={`${
      viewMode === 'grid'
        ? 'flex flex-col space-y-4 p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700'
        : 'flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 lg:space-x-8 p-4 sm:p-5 lg:p-6 bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl border border-gray-200 dark:border-gray-700'
    } animate-pulse`}>
      <div className={`${
        viewMode === 'grid'
          ? 'w-full h-48 sm:h-52'
          : 'w-full md:w-60 lg:w-72 h-48 sm:h-52 md:h-40 lg:h-44'
      } flex-shrink-0 rounded-lg lg:rounded-xl bg-gray-200 dark:bg-gray-700`} />
      <div className="flex-1 space-y-3">
        <div className="flex items-center space-x-3">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const Article = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const locale = useLocale();

  const { data: categories } = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => getCategories(locale),
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['articles-feed', locale, selectedCategory],
    queryFn: ({ pageParam }) =>
      getArticlesFeed({
        cursor: pageParam,
        language: locale,
        ...(selectedCategory ? { categorySlug: selectedCategory } : {}),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles: any[] = data?.pages.flatMap((page: { articles: any[] }) => page.articles) ?? [];
  const heroArticle = articles[0];
  const restArticles = articles.slice(1);

  if (isLoading) {
    return (
      <div className="w-full space-y-8 sm:space-y-12">
        <div className="h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl lg:rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="space-y-5 lg:space-y-6">
          <ArticleSkeleton viewMode={viewMode} />
          <ArticleSkeleton viewMode={viewMode} />
          <ArticleSkeleton viewMode={viewMode} />
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No articles found</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 sm:space-y-12">
      {/* Hero Section */}
      {heroArticle && (
        <section className="relative w-full max-w-full overflow-hidden">
          <Link href={`/article/${heroArticle.slug}`} className="group block">
            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl lg:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl">
              <Image
                src={heroArticle.thumbnail?.url || '/favicon.svg'}
                alt={heroArticle.title}
                fill
                className={heroArticle.thumbnail?.url
                  ? 'object-cover group-hover:scale-105 transition-transform duration-700 ease-out'
                  : 'object-contain p-20 bg-gray-100 dark:bg-gray-800'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 xl:p-12 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
                  <CategoryBadge
                    slug={heroArticle.category?.slug}
                    name={heroArticle.category?.name}
                    className="px-3 sm:px-4 py-1 sm:py-1.5 shadow-lg inline-block w-fit"
                  />
                  <div className="flex items-center space-x-2 text-xs sm:text-sm opacity-90">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{formatTimeAgo(heroArticle.createdAt)}</span>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-5xl font-bold leading-tight mb-3 sm:mb-4 lg:mb-6 group-hover:text-brand-accent transition-colors duration-300 max-w-4xl">
                  {heroArticle.title}
                </h1>

                <p className="text-gray-200 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl max-w-4xl line-clamp-3 sm:line-clamp-none">
                  {heroArticle.excerpt}
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {heroArticle.author?.avatar ? (
                      <div className="relative w-8 h-8 sm:w-10 lg:w-12 sm:h-10 lg:h-12 rounded-full overflow-hidden">
                        <Image src={heroArticle.author.avatar} alt={heroArticle.author.user?.fullName || ''} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-10 lg:w-12 sm:h-10 lg:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-bold">
                          {(heroArticle.author?.user?.fullName || 'A').split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-sm sm:text-base">{heroArticle.author?.user?.fullName || 'Author'}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm opacity-90">
                    <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 sm:px-3 py-1">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{heroArticle.viewCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Latest News */}
      {restArticles.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 sm:space-x-3">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-brand-accent" />
                <span>Latest Stories</span>
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                {articles.length} articles
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>

              <div className="relative group">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${
                  selectedCategory === null
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {categories.map((cat: any) => {
                const colors = categoryStyles[cat.slug] || defaultCategoryStyle;
                const isActive = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isActive ? null : cat.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${
                      isActive ? 'ring-2 ring-offset-1 ring-gray-400 dark:ring-gray-500' : ''
                    }`}
                    style={{
                      backgroundColor: `light-dark(${colors.lightBg}, ${colors.darkBg})`,
                      color: `light-dark(${colors.lightText}, ${colors.darkText})`,
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className={`space-y-5 lg:space-y-6 ${viewMode === 'grid' ? 'md:grid md:grid-cols-2 md:gap-6 md:space-y-0' : ''}`}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {restArticles.map((article: any) => {
              return (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="group block"
                >
                  <article className={`relative ${
                    viewMode === 'grid'
                      ? 'flex flex-col space-y-4 p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300 transform hover:-translate-y-1'
                      : 'flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 lg:space-x-8 p-4 sm:p-5 lg:p-6 bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300 transform hover:-translate-y-1'
                  }`}>

                    {/* Article Image */}
                    <div className={`relative ${
                      viewMode === 'grid'
                        ? 'w-full h-48 sm:h-52'
                        : 'w-full md:w-60 lg:w-72 h-48 sm:h-52 md:h-40 lg:h-44'
                    } flex-shrink-0 rounded-lg lg:rounded-xl overflow-hidden`}>
                      <Image
                        src={article.thumbnail?.url || '/favicon.svg'}
                        alt={article.title}
                        fill
                        className={article.thumbnail?.url
                          ? 'object-cover group-hover:scale-105 transition-transform duration-500'
                          : 'object-contain p-8 bg-gray-100 dark:bg-gray-800'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <CategoryBadge slug={article.category?.slug} name={article.category?.name} />
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button className="p-1.5 bg-white/90 hover:bg-brand-primary hover:text-white rounded-full transition-colors shadow-sm">
                          <BookmarkPlus className="h-3.5 w-3.5" />
                        </button>
                        <button className="p-1.5 bg-white/90 hover:bg-brand-primary hover:text-white rounded-full transition-colors shadow-sm">
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Article Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(article.createdAt)}</span>
                          </div>
                          <span>·</span>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>{article.viewCount || 0}</span>
                          </div>
                        </div>

                        <h3 className={`font-bold text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors leading-tight ${
                          viewMode === 'grid'
                            ? 'text-base sm:text-lg mb-2'
                            : 'text-lg sm:text-xl lg:text-2xl mb-3'
                        }`}>
                          {article.title}
                        </h3>

                        <p className={`text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 ${
                          viewMode === 'grid'
                            ? 'text-sm mb-3'
                            : 'text-sm sm:text-base mb-4 sm:line-clamp-3'
                        }`}>
                          {article.excerpt}
                        </p>
                      </div>

                      <div className={`flex ${
                        viewMode === 'grid'
                          ? 'flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'
                          : 'flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0'
                      }`}>
                        <div className="flex items-center space-x-3">
                          {article.author?.avatar ? (
                            <div className={`relative rounded-full overflow-hidden ${
                              viewMode === 'grid' ? 'w-7 h-7' : 'w-8 h-8 sm:w-9 sm:h-9'
                            }`}>
                              <Image src={article.author.avatar} alt={article.author.user?.fullName || ''} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className={`bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center ${
                              viewMode === 'grid' ? 'w-7 h-7' : 'w-8 h-8 sm:w-9 sm:h-9'
                            }`}>
                              <span className="font-bold text-white text-xs">
                                {(article.author?.user?.fullName || 'A').split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className={`font-semibold text-gray-900 dark:text-white ${
                              viewMode === 'grid' ? 'text-xs' : 'text-sm'
                            }`}>{article.author?.user?.fullName || 'Author'}</div>
                          </div>
                        </div>

                        <div className={`flex items-center space-x-3 text-gray-400 ${
                          viewMode === 'grid' ? 'text-xs' : 'text-xs sm:text-sm'
                        }`}>
                          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
                            <Eye className="h-3 w-3" />
                            <span>{article.viewCount || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{article.tags?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}

            {/* Skeleton loaders while fetching next page */}
            {isFetchingNextPage && (
              <>
                <ArticleSkeleton viewMode={viewMode} />
                <ArticleSkeleton viewMode={viewMode} />
              </>
            )}
          </div>
        </section>
      )}

      {/* Load More Section */}
      <div className="text-center py-8 sm:py-12 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto space-y-5">
          {hasNextPage ? (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="group relative w-full bg-gradient-breaking-news text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl flex items-center justify-center space-x-3 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-accent via-brand-secondary to-brand-primary opacity-0 group-hover:opacity-100 group-disabled:opacity-0 transition-opacity duration-500" />

              <div className="relative flex items-center space-x-3">
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-lg font-semibold tracking-wide">Loading Stories...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="text-lg font-semibold tracking-wide">Load More Stories</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-brand-primary dark:text-brand-accent">
                <div className="w-8 h-[2px] bg-brand-accent rounded-full" />
                <span className="text-sm font-semibold">You&apos;re all caught up</span>
                <div className="w-8 h-[2px] bg-brand-accent rounded-full" />
              </div>
              <p className="text-xs text-gray-400">Check back later for more stories</p>
            </div>
          )}

          {hasNextPage && (
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
                <span>More stories available</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Article;
