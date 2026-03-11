import type { Metadata } from 'next';
import ArticleView from './ArticleView';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menyesha.vand.rw';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

async function fetchArticle(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/menyesha/articles/slug/${slug}`, {
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
  const article = await fetchArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found - Menyesha',
    };
  }

  const title = article.title;
  const description = article.excerpt || `Read "${article.title}" on Menyesha`;
  const url = `${SITE_URL}/${locale}/article/${slug}`;
  const thumbnailUrl = article.thumbnail?.url;
  const authorName = article.author?.user?.fullName || 'Menyesha';
  const publishedTime = article.createdAt;
  const modifiedTime = article.updatedAt;
  const categoryName = article.category?.name;
  const tags = article.tags?.map((t: any) => (t.tag || t).name).filter(Boolean) || [];

  return {
    title: `${title} - Menyesha`,
    description,
    authors: [{ name: authorName }],
    keywords: [categoryName, ...tags].filter(Boolean),
    openGraph: {
      type: 'article',
      locale,
      url,
      siteName: 'Menyesha',
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
  const { slug } = await params;
  return <ArticleView slug={slug} />;
}
