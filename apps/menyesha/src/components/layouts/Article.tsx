'use client'

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Clock, Eye, ArrowRight, TrendingUp, Grid, List, Zap, Loader2, ChevronDown, Star } from "lucide-react";
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getArticlesFeed, getCategories } from '@org/api';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

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
  // Subcategories (regions)
  africa:          { lightBg: "#fef3c7", darkBg: "rgba(180,83,9,0.3)", lightText: "#92400e", darkText: "#fcd34d", dot: "#f59e0b" },
  afrique:         { lightBg: "#fef3c7", darkBg: "rgba(180,83,9,0.3)", lightText: "#92400e", darkText: "#fcd34d", dot: "#f59e0b" },
  afurika:         { lightBg: "#fef3c7", darkBg: "rgba(180,83,9,0.3)", lightText: "#92400e", darkText: "#fcd34d", dot: "#f59e0b" },
  europe:          { lightBg: "#dbeafe", darkBg: "rgba(29,78,216,0.3)", lightText: "#1e40af", darkText: "#93c5fd", dot: "#3b82f6" },
  uburayi:         { lightBg: "#dbeafe", darkBg: "rgba(29,78,216,0.3)", lightText: "#1e40af", darkText: "#93c5fd", dot: "#3b82f6" },
  international:   { lightBg: "#e0e7ff", darkBg: "rgba(67,56,202,0.3)", lightText: "#4338ca", darkText: "#a5b4fc", dot: "#6366f1" },
  mpuzamahanga:    { lightBg: "#e0e7ff", darkBg: "rgba(67,56,202,0.3)", lightText: "#4338ca", darkText: "#a5b4fc", dot: "#6366f1" },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CategoryBadges({ article, className = "" }: { article: any; className?: string }) {
  const parent = article.category?.parent;
  const category = article.category;
  if (!category) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {parent && (
        <CategoryBadge slug={parent.slug} name={parent.name} />
      )}
      <CategoryBadge slug={category.slug} name={category.name} />
    </div>
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
function AuthorLink({ author, children, className = '' }: { author: any; children: React.ReactNode; className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const slug = author?.user?.slug;
  if (!slug) return <div className={className}>{children}</div>;
  return (
    <div
      className={`cursor-pointer ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/${locale}/author/${slug}`);
      }}
    >
      {children}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ArticleThumbnail({ article, className = '', imageClassName = '' }: { article: any; className?: string; imageClassName?: string }) {
  const hasThumb = !!article.thumbnail?.url;
  const categorySlug = article.category?.slug || '';
  const style = categoryStyles[categorySlug] || defaultCategoryStyle;

  return (
    <div className={`overflow-hidden ${className}`}>
      {hasThumb ? (
        <img
          src={article.thumbnail.url}
          alt={article.title}
          className={`w-full h-full object-cover ${imageClassName}`}
        />
      ) : (
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            background: `light-dark(
              linear-gradient(145deg, ${style.lightBg}, #fff),
              linear-gradient(145deg, ${style.darkBg}, #1f2937)
            )`,
          }}
        >
          {/* Large faded category initial watermark */}
          <span
            className="absolute -bottom-4 -right-2 font-black select-none leading-none opacity-[0.07]"
            style={{ fontSize: '10rem' }}
          >
            {(article.category?.name || 'M')[0]}
          </span>
          {/* Accent stripe */}
          <div
            className="absolute top-0 left-0 w-1.5 h-full"
            style={{ backgroundColor: style.dot }}
          />
          {/* Logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image src="/favicon.svg" alt="" width={48} height={48} className="object-contain opacity-60" />
          </div>
        </div>
      )}
    </div>
  );
}

const Article = ({ categoryKey, subCategoryKey }: { categoryKey?: string; subCategoryKey?: string }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const locale = useLocale();

  // Fetch categories for current locale
  const { data: categories } = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => getCategories(locale),
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryKey || null);

  // Sync selectedCategory when categoryKey prop changes
  useEffect(() => {
    setSelectedCategory(categoryKey || null);
  }, [categoryKey]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['articles-feed', locale, selectedCategory, subCategoryKey],
    queryFn: ({ pageParam }) =>
      getArticlesFeed({
        cursor: pageParam,
        language: locale,
        ...(selectedCategory ? { categorySlug: selectedCategory } : {}),
        ...(subCategoryKey ? { subCategorySlug: subCategoryKey } : {}),
        status: 'Published',
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles: any[] = data?.pages.flatMap((page: { articles: any[] }) => page.articles) ?? [];

  // Derive featured slots — only use articles explicitly marked with featuredType
  // Hero: 1, Secondary: up to 4, Spotlight: up to 8
  // Unmarked articles always go to the Latest Stories feed
  const { heroArticle, secondaryArticles, spotlightArticles, feedArticles } = useMemo(() => {
    const hero = articles.find((a: any) => a.featuredType === 'Hero') || null;
    const secondary = articles.filter((a: any) => a.featuredType === 'Secondary').slice(0, 4);
    const spotlight = articles.filter((a: any) => a.featuredType === 'Spotlight').slice(0, 8);

    const usedIds = new Set(
      [hero?.id, ...secondary.map((a: any) => a.id), ...spotlight.map((a: any) => a.id)].filter(Boolean)
    );
    const feed = articles.filter((a: any) => !usedIds.has(a.id));

    return {
      heroArticle: hero,
      secondaryArticles: secondary,
      spotlightArticles: spotlight,
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
          HERO — Single dominant story, full width
         ══════════════════════════════════════════════════════════ */}
      {heroArticle && (
        <section>
          <Link href={`/article/${heroArticle.slug}`} className="group block">
            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl lg:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl">
              <ArticleThumbnail
                article={heroArticle}
                className="absolute inset-0"
                imageClassName="group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <CategoryBadges article={heroArticle} />
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
                  <AuthorLink author={heroArticle.author} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <AuthorAvatar author={heroArticle.author} size="md" />
                    <span className="font-semibold text-sm">{heroArticle.author?.user?.fullName || 'Author'}</span>
                  </AuthorLink>
                  <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{heroArticle.viewCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECONDARY — 3-4 important stories in a grid below hero
         ══════════════════════════════════════════════════════════ */}
      {secondaryArticles.length > 0 && (
        <section>
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${secondaryArticles.length >= 3 ? 'lg:grid-cols-3' : ''} ${secondaryArticles.length === 4 ? 'xl:grid-cols-4' : ''} gap-4 lg:gap-6`}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {secondaryArticles.map((article: any) => (
              <Link key={article.id} href={`/article/${article.slug}`} className="group block">
                <div className="relative h-[240px] sm:h-[280px] rounded-xl overflow-hidden bg-gray-900 shadow-lg">
                  <ArticleThumbnail
                    article={article}
                    className="absolute inset-0"
                    imageClassName="group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <CategoryBadges article={article} className="mb-2" />
                    <h3 className="font-bold text-base sm:text-lg leading-tight mb-2 group-hover:text-brand-accent transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs opacity-90">
                      <AuthorLink author={article.author} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                        <AuthorAvatar author={article.author} size="sm" />
                        <span>{article.author?.user?.fullName || 'Author'}</span>
                      </AuthorLink>
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
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          SPOTLIGHT — Editor's Picks (4-8 curated articles)
         ══════════════════════════════════════════════════════════ */}
      {spotlightArticles.length > 0 && (
        <section>
          <div className="flex items-center space-x-2 mb-6">
            <Star className="h-5 w-5 text-brand-accent" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Editor&apos;s Picks</h2>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              {spotlightArticles.length}
            </span>
          </div>

          {/* First spotlight article — featured horizontal card */}
          <Link href={`/article/${spotlightArticles[0].slug}`} className="group block mb-6">
            <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-xl lg:rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300">
              <div className="relative w-full md:w-1/2 h-[250px] sm:h-[300px] md:h-[320px]">
                <ArticleThumbnail
                  article={spotlightArticles[0]}
                  className="absolute inset-0"
                  imageClassName="group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <CategoryBadges article={spotlightArticles[0]} />
                </div>
              </div>
              <div className="flex-1 p-5 sm:p-6 lg:p-8 flex flex-col justify-center">
                <div className="flex items-center space-x-3 mb-3 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(spotlightArticles[0].createdAt)}</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{spotlightArticles[0].viewCount || 0} views</span>
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors leading-tight">
                  {spotlightArticles[0].title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed mb-4 line-clamp-3">
                  {spotlightArticles[0].excerpt}
                </p>
                <AuthorLink author={spotlightArticles[0].author} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                  <AuthorAvatar author={spotlightArticles[0].author} size="md" />
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">{spotlightArticles[0].author?.user?.fullName || 'Author'}</div>
                </AuthorLink>
              </div>
            </div>
          </Link>

          {/* Remaining spotlight articles — compact grid */}
          {spotlightArticles.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {spotlightArticles.slice(1).map((article: any) => (
                <Link key={article.id} href={`/article/${article.slug}`} className="group block h-full">
                  <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-brand-primary/40 transition-all duration-300">
                    <div className="relative h-[180px] flex-shrink-0">
                      <ArticleThumbnail
                        article={article}
                        className="absolute inset-0"
                        imageClassName="group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <CategoryBadges article={article} />
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors line-clamp-2 min-h-[2.5rem]">
                        {article.title}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2 min-h-[2rem]">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <AuthorLink author={article.author} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                          <AuthorAvatar author={article.author} size="sm" />
                          <span className="text-gray-600 dark:text-gray-300">{article.author?.user?.fullName || 'Author'}</span>
                        </AuthorLink>
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
                className={`group block ${viewMode === 'grid' ? 'h-full' : ''}`}
              >
                <article className={`relative ${
                  viewMode === 'grid'
                    ? 'h-full flex flex-col space-y-4 p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-brand-primary/40 transition-all duration-300 transform hover:-translate-y-1'
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
                      <CategoryBadges article={article} />
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
                      </div>

                      <h3 className={`font-bold text-gray-900 dark:text-white group-hover:text-brand-primary dark:group-hover:text-brand-accent transition-colors leading-tight ${
                        viewMode === 'grid'
                          ? 'text-base sm:text-lg mb-2 line-clamp-2 min-h-[3rem]'
                          : 'text-lg sm:text-xl lg:text-2xl mb-3'
                      }`}>
                        {article.title}
                      </h3>

                      <p className={`text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 ${
                        viewMode === 'grid'
                          ? 'text-sm mb-3 min-h-[2.5rem]'
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
                      <AuthorLink author={article.author} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                        <AuthorAvatar author={article.author} size={viewMode === 'grid' ? 'sm' : 'md'} />
                        <div className={`font-semibold text-gray-900 dark:text-white ${
                          viewMode === 'grid' ? 'text-xs' : 'text-sm'
                        }`}>{article.author?.user?.fullName || 'Author'}</div>
                      </AuthorLink>

                      <div className={`flex items-center space-x-3 text-gray-400 ${
                        viewMode === 'grid' ? 'text-xs' : 'text-xs sm:text-sm'
                      }`}>
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
