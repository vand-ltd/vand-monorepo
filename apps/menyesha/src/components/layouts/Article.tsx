'use client'

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { MessageCircle, Clock, Eye, ArrowRight, BookmarkPlus, TrendingUp, Share2, Heart, Grid, List, Zap, Loader2, ChevronDown, Star } from "lucide-react";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AuthorAvatar({ author, size = 'md' }: { author: any; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-10 h-10 sm:w-12 sm:h-12' };
  const textSizes = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' };
  const initials = (author?.user?.fullName || 'A').split(' ').map((n: string) => n[0]).join('');

  if (author?.avatar) {
    return (
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden`}>
        <img src={author.avatar} alt={author.user?.fullName || ''} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-brand-accent to-amber-400 rounded-full flex items-center justify-center ring-2 ring-white/30 dark:ring-white/20`}>
      <span className={`font-bold text-gray-900 ${textSizes[size]}`}>{initials}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ArticleThumbnail({ article, className = '', imageClassName = '' }: { article: any; className?: string; imageClassName?: string }) {
  const hasThumb = !!article.thumbnail?.url;
  return (
    <div className={`overflow-hidden ${className}`}>
      {hasThumb ? (
        <img
          src={article.thumbnail.url}
          alt={article.title}
          className={`w-full h-full object-cover ${imageClassName}`}
        />
      ) : (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Image src="/favicon.svg" alt={article.title} width={64} height={64} className="object-contain" />
        </div>
      )}
    </div>
  );
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
        status: 'Published',
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles: any[] = data?.pages.flatMap((page: { articles: any[] }) => page.articles) ?? [];

  // Derive featured slots — only use articles explicitly marked with featuredType
  // Unmarked articles always go to the Latest Stories feed
  const { heroArticle, secondaryArticles, spotlightArticle, feedArticles } = useMemo(() => {
    const hero = articles.find((a: any) => a.featuredType === 'Hero') || null;
    const secondary = articles.filter((a: any) => a.featuredType === 'Secondary').slice(0, 2);
    const spotlight = articles.find((a: any) => a.featuredType === 'Spotlight') || null;

    const usedIds = new Set(
      [hero?.id, spotlight?.id, ...secondary.map((a: any) => a.id)].filter(Boolean)
    );
    const feed = articles.filter((a: any) => !usedIds.has(a.id));

    return {
      heroArticle: hero,
      secondaryArticles: secondary,
      spotlightArticle: spotlight,
      feedArticles: feed,
    };
  }, [articles]);

  if (isLoading) {
    return (
      <div className="w-full space-y-8 sm:space-y-12">
        <div className="h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl lg:rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="space-y-5 lg:space-y-6">
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

      {/* ══════════════════════════════════════════════════════════
          HERO + SECONDARY — Top featured section
          Only displayed when articles are explicitly marked with featuredType
         ══════════════════════════════════════════════════════════ */}
      {(heroArticle || secondaryArticles.length > 0) && (
        <section className={`grid grid-cols-1 ${heroArticle && secondaryArticles.length > 0 ? 'lg:grid-cols-3' : ''} gap-4 lg:gap-6`}>
          {/* HERO — Main featured article */}
          {heroArticle && (
            <Link href={`/article/${heroArticle.slug}`} className={`group block ${secondaryArticles.length > 0 ? 'lg:col-span-2' : ''}`}>
              <div className="relative h-[400px] sm:h-[500px] lg:h-full lg:min-h-[500px] rounded-xl lg:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl">
                <ArticleThumbnail
                  article={heroArticle}
                  className="absolute inset-0"
                  imageClassName="group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 text-white">
                  <div className="flex items-center space-x-3 mb-4">
                    <CategoryBadge
                      slug={heroArticle.category?.slug}
                      name={heroArticle.category?.name}
                      className="px-3 py-1.5 shadow-lg"
                    />
                    <div className="flex items-center space-x-1.5 text-xs opacity-90">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTimeAgo(heroArticle.createdAt)}</span>
                    </div>
                  </div>

                  <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold leading-tight mb-3 group-hover:text-brand-accent transition-colors duration-300 max-w-3xl">
                    {heroArticle.title}
                  </h1>

                  <p className="text-gray-200 mb-4 text-sm sm:text-base lg:text-lg max-w-3xl line-clamp-2 lg:line-clamp-3">
                    {heroArticle.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AuthorAvatar author={heroArticle.author} size="md" />
                      <span className="font-semibold text-sm">{heroArticle.author?.user?.fullName || 'Author'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{heroArticle.viewCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* SECONDARY — 2 stacked cards beside hero */}
          {secondaryArticles.length > 0 && (
            <div className="flex flex-col gap-4 lg:gap-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {secondaryArticles.map((article: any) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="group flex-1 block">
                  <div className="relative h-[200px] sm:h-[240px] lg:h-full rounded-xl overflow-hidden bg-gray-900 shadow-lg">
                    <ArticleThumbnail
                      article={article}
                      className="absolute inset-0"
                      imageClassName="group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <CategoryBadge
                        slug={article.category?.slug}
                        name={article.category?.name}
                        className="mb-2 inline-block"
                      />
                      <h3 className="font-bold text-base sm:text-lg leading-tight mb-2 group-hover:text-brand-accent transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs opacity-90">
                        <div className="flex items-center space-x-2">
                          <AuthorAvatar author={article.author} size="sm" />
                          <span>{article.author?.user?.fullName || 'Author'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(article.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          SPOTLIGHT — Editor's Pick
          Full-width, horizontal layout with large image
         ══════════════════════════════════════════════════════════ */}
      {spotlightArticle && (
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Star className="h-5 w-5 text-brand-accent" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Editor&apos;s Pick</h2>
          </div>
          <Link href={`/article/${spotlightArticle.slug}`} className="group block">
            <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300">
              <div className="relative w-full md:w-1/2 h-[250px] sm:h-[300px] md:h-[320px]">
                <ArticleThumbnail
                  article={spotlightArticle}
                  className="absolute inset-0"
                  imageClassName="group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <CategoryBadge slug={spotlightArticle.category?.slug} name={spotlightArticle.category?.name} />
                </div>
              </div>
              <div className="flex-1 p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
                <div className="flex items-center space-x-3 mb-3 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(spotlightArticle.createdAt)}</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{spotlightArticle.viewCount || 0} views</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors leading-tight">
                  {spotlightArticle.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed mb-4 line-clamp-3">
                  {spotlightArticle.excerpt}
                </p>
                <div className="flex items-center space-x-3">
                  <AuthorAvatar author={spotlightArticle.author} size="md" />
                  <div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{spotlightArticle.author?.user?.fullName || 'Author'}</div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          LATEST STORIES — Regular feed with category filter
         ══════════════════════════════════════════════════════════ */}
      {feedArticles.length > 0 && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-2 sm:space-x-3">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-brand-accent" />
                <span>Latest Stories</span>
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                {feedArticles.length} articles
              </span>
            </div>
            <div className="flex items-center space-x-2">
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

          {/* Category Filter */}
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
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
            {feedArticles.map((article: any) => (
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
                    <ArticleThumbnail
                      article={article}
                      className="absolute inset-0"
                      imageClassName="group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-3 left-3">
                      <CategoryBadge slug={article.category?.slug} name={article.category?.name} />
                    </div>
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
                        <AuthorAvatar author={article.author} size={viewMode === 'grid' ? 'sm' : 'md'} />
                        <div className={`font-semibold text-gray-900 dark:text-white ${
                          viewMode === 'grid' ? 'text-xs' : 'text-sm'
                        }`}>{article.author?.user?.fullName || 'Author'}</div>
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
            ))}

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
