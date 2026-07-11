import type { MetadataRoute } from 'next';
import { locales } from '@org/i18n';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
// Always emit absolute production URLs — ignore a localhost NEXT_PUBLIC_SITE_URL.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.startsWith('https://')
    ? process.env.NEXT_PUBLIC_SITE_URL
    : 'https://menyesha.vand.rw';

// Static, non-category routes that exist for every locale (slug identical across locales).
const STATIC_PATHS = [
  '',
  'about',
  'contact',
  'privacy-policy',
  'terms-of-service',
  'data',
  'data/fuel-prices',
  'data/fuel-prices/statistics',
];

type Cat = { slug: string; updatedAt?: string; children?: { slug: string; updatedAt?: string }[] };
type Article = { slug: string; updatedAt?: string; publishedAt?: string };

async function fetchCategories(locale: string): Promise<Cat[]> {
  try {
    const res = await fetch(`${API_URL}/api/menyesha/categories?language=${locale}`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

async function fetchArticles(locale: string): Promise<Article[]> {
  const out: Article[] = [];
  let cursor: string | undefined;
  // Safety cap: 50 pages × 100 = 5000 articles per locale.
  for (let i = 0; i < 50; i++) {
    const qs = new URLSearchParams({ language: locale, limit: '100' });
    if (cursor) qs.set('cursor', cursor);
    try {
      const res = await fetch(`${API_URL}/api/menyesha/articles/feed?${qs.toString()}`, {
        headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const json = await res.json();
      const data = json.data || {};
      const articles: Article[] = data.articles || [];
      for (const a of articles) if (a.slug) out.push(a);
      if (!data.meta?.hasMore || !data.meta?.nextCursor) break;
      cursor = data.meta.nextCursor;
    } catch {
      break;
    }
  }
  return out;
}

function alternatesFor(path: string) {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${SITE_URL}/${l}${path ? `/${path}` : ''}`;
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Static + data pages (with hreflang alternates, since their slugs are locale-independent)
  for (const path of STATIC_PATHS) {
    for (const locale of locales) {
      entries.push({
        url: `${SITE_URL}/${locale}${path ? `/${path}` : ''}`,
        lastModified: now,
        changeFrequency: path === '' ? 'daily' : 'monthly',
        priority: path === '' ? 1 : path.startsWith('data') ? 0.7 : 0.3,
        alternates: alternatesFor(path),
      });
    }
  }

  // Category + subcategory + article pages, per locale (slugs are localized, so no cross-locale alternates)
  const perLocale = await Promise.all(
    locales.map(async (locale) => {
      const [categories, articles] = await Promise.all([
        fetchCategories(locale),
        fetchArticles(locale),
      ]);
      return { locale, categories, articles };
    })
  );

  for (const { locale, categories, articles } of perLocale) {
    for (const cat of categories) {
      if (cat.slug === 'breaking-news') continue;
      entries.push({
        url: `${SITE_URL}/${locale}/${cat.slug}`,
        lastModified: cat.updatedAt ? new Date(cat.updatedAt) : now,
        changeFrequency: 'daily',
        priority: 0.6,
      });
      for (const child of cat.children || []) {
        entries.push({
          url: `${SITE_URL}/${locale}/${cat.slug}/${child.slug}`,
          lastModified: child.updatedAt ? new Date(child.updatedAt) : now,
          changeFrequency: 'daily',
          priority: 0.5,
        });
      }
    }

    for (const article of articles) {
      entries.push({
        url: `${SITE_URL}/${locale}/article/${article.slug}`,
        lastModified: new Date(article.updatedAt || article.publishedAt || now),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  // Fuel-price year archives (data is locale-independent, so derive years once)
  try {
    const res = await fetch(`${API_URL}/api/menyesha/fuel-prices/history?order=desc`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const years = Array.from(
        new Set((json.data || []).map((r: any) => new Date(r.effectiveDate).getFullYear()))
      );
      for (const y of years) {
        for (const locale of locales) {
          entries.push({
            url: `${SITE_URL}/${locale}/data/fuel-prices/${y}`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.5,
          });
        }
      }
    }
  } catch {
    // ignore — year pages just won't be listed this build
  }

  return entries;
}
