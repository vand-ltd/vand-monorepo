'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getArticlesFeed } from '@org/api';
import { useLocale } from 'next-intl';

export function ArticleFeed() {
  const locale = useLocale();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['articles-feed', locale],
    queryFn: ({ pageParam }) =>
      getArticlesFeed({ cursor: pageParam, language: locale }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
  });

  const articles = data?.pages.flatMap((page) => page.articles) ?? [];

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      {articles.map((article) => (
        <div key={article.id}>
          {/* Render your article card here using: */}
          {/* article.title, article.excerpt, article.thumbnail?.url, */}
          {/* article.category.name, article.author.user.fullName, */}
          {/* article.createdAt */}
        </div>
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
