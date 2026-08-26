import type { Metadata } from 'next';
import ArticleView from './ArticleView';
import { SITE_URL, BRAND_NAME } from '@/lib/brand';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

// Fetch the article server-side. `language` mirrors the client's
// getArticleBySlug(slug, locale) so the shape and translations match the value
// we seed into ArticleView's query. Next dedupes this across generateMetadata
// and the page (same URL) into a single request.
async function fetchArticle(slug: string, language?: string) {
  try {
    const qs = language ? `?language=${encodeURIComponent(language)}` : '';
    const res = await fetch(`${API_URL}/api/tugezo/articles/slug/${slug}${qs}`, {
      headers: {
        'Content-Type': 'application/json',
        Origin: SITE_URL,
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await fetchArticle(slug, locale);

  if (!article) {
    return {
      title: `Article Not Found - ${BRAND_NAME}`,
    };
  }

  const title = article.title;
  const description = article.excerpt || `Read "${article.title}" on ${BRAND_NAME}`;
  const url = `${SITE_URL}/${locale}/article/${slug}`;
  const thumbnailUrl = article.thumbnail?.url;
  const authorName = article.author?.user?.fullName || `${BRAND_NAME}`;
  const publishedTime = article.createdAt;
  const modifiedTime = article.updatedAt;
  const categoryName = article.category?.name;
  const tags = article.tags?.map((t: any) => (t.tag || t).name).filter(Boolean) || [];

  return {
    title: `${title} - ${BRAND_NAME}`,
    description,
    authors: [{ name: authorName }],
    keywords: [categoryName, ...tags].filter(Boolean),
    openGraph: {
      type: 'article',
      locale,
      url,
      siteName: BRAND_NAME,
      title,
      description,
      publishedTime,
      modifiedTime,
      authors: [authorName],
      section: categoryName,
      tags,
      ...(thumbnailUrl && {
        images: [
          {
            url: thumbnailUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(thumbnailUrl && { images: [thumbnailUrl] }),
    },
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/en/article/${slug}`,
        fr: `${SITE_URL}/fr/article/${slug}`,
        rw: `${SITE_URL}/rw/article/${slug}`,
      },
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  // Server-fetch the article so its full text is in the initial HTML (crawlable
  // on Google's first pass), instead of a client-rendered skeleton. The client
  // still refetches for freshness.
  const initialArticle = await fetchArticle(slug, locale);
  return <ArticleView slug={slug} initialArticle={initialArticle} />;
}
