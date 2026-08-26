import type { MetadataRoute } from 'next';
import { locales } from '@org/i18n';
import { isTbdKickoff } from '@org/api';
// Always emits absolute production URLs — a localhost NEXT_PUBLIC_SITE_URL is ignored.
import { SITE_URL } from '@/lib/brand';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  'football',
];

type Cat = { slug: string; updatedAt?: string; children?: { slug: string; updatedAt?: string }[] };
type Article = { slug: string; updatedAt?: string; publishedAt?: string };

async function fetchCategories(locale: string): Promise<Cat[]> {
  try {
    const res = await fetch(`${API_URL}/api/tugezo/categories?language=${locale}`, {
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
      const res = await fetch(`${API_URL}/api/tugezo/articles/feed?${qs.toString()}`, {
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
    const res = await fetch(`${API_URL}/api/tugezo/fuel-prices/history?order=desc`, {
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

  // Football: season pages + per-match pages + dated result pages.
  // We drive everything off the season list and fetch matches PER SEASON
  // (rather than a single global /matches call), so the sitemap stays
  // complete no matter how large the match archive grows — each season is
  // naturally bounded, and no matches are ever silently dropped by a cap.
  try {
    const res = await fetch(`${API_URL}/api/tugezo/seasons`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const seasons: any[] = json.data || [];
      const dates = new Set<string>();

      // Fetch each season's matches concurrently.
      const perSeason = await Promise.all(
        seasons.map(async (s) => {
          if (!s.id) return [];
          try {
            const mRes = await fetch(
              `${API_URL}/api/tugezo/matches?seasonId=${s.id}&order=desc`,
              {
                headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
                next: { revalidate: 3600 },
              },
            );
            if (!mRes.ok) return [];
            const mJson = await mRes.json();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (mJson.data || []) as any[];
          } catch {
            return [];
          }
        }),
      );

      for (const s of seasons) {
        const compSlug = s.competition?.slug;
        const seasonSlug = s.slug;
        if (compSlug && seasonSlug) {
          for (const locale of locales) {
            entries.push({
              url: `${SITE_URL}/${locale}/football/${compSlug}/${seasonSlug}`,
              lastModified: new Date(s.updatedAt || now),
              changeFrequency: 'daily',
              priority: 0.7,
              alternates: alternatesFor(`football/${compSlug}/${seasonSlug}`),
            });
          }
        }
      }

      for (const matches of perSeason) {
        for (const m of matches) {
          const compSlug = m.season?.competition?.slug;
          const matchSlug = m.slug;
          // A TBD fixture carries the far-future sentinel kickoff — don't let it
          // seed a junk /football/2099-12-31 board URL or a future lastmod.
          const tbd = isTbdKickoff(m.kickoffAt);
          const dateStr =
            !tbd && typeof m.kickoffAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(m.kickoffAt)
              ? m.kickoffAt.slice(0, 10)
              : null;
          if (dateStr) dates.add(dateStr);
          if (compSlug && matchSlug) {
            for (const locale of locales) {
              entries.push({
                url: `${SITE_URL}/${locale}/football/${compSlug}/${matchSlug}`,
                lastModified: new Date(m.updatedAt || (tbd ? now : m.kickoffAt) || now),
                changeFrequency: 'daily',
                priority: 0.6,
                alternates: alternatesFor(`football/${compSlug}/${matchSlug}`),
              });
            }
          }
        }
      }

      for (const date of dates) {
        for (const locale of locales) {
          entries.push({
            url: `${SITE_URL}/${locale}/football/${date}`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.5,
            alternates: alternatesFor(`football/${date}`),
          });
        }
      }
    }
  } catch {
    // ignore — football pages just won't be listed this build
  }

  // Player profiles: /football/player/<slug> — paginate so every player is
  // included even as the roster grows past a single page.
  try {
    const PAGE_SIZE = 200;
    let page = 1;
    let totalPages = 1;
    do {
      const res = await fetch(
        `${API_URL}/api/tugezo/players?page=${page}&limit=${PAGE_SIZE}`,
        {
          headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
          next: { revalidate: 3600 },
        },
      );
      if (!res.ok) break;
      const json = await res.json();
      // Players are paginated as { data: { data: [...], meta } }.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const players: any[] = json.data?.data ?? json.data ?? [];
      const meta = json.data?.meta;
      totalPages = typeof meta?.totalPages === 'number' ? meta.totalPages : page;
      for (const p of players) {
        if (!p.slug) continue;
        for (const locale of locales) {
          entries.push({
            url: `${SITE_URL}/${locale}/football/player/${p.slug}`,
            lastModified: new Date(p.updatedAt || now),
            changeFrequency: 'weekly',
            priority: 0.5,
            alternates: alternatesFor(`football/player/${p.slug}`),
          });
        }
      }
      page += 1;
    } while (page <= totalPages && page <= 50); // hard stop: 50 pages = 10k players
  } catch {
    // ignore
  }

  // Team profiles: /football/team/<slug> — one list call, slugs are locale-independent.
  try {
    const res = await fetch(`${API_URL}/api/tugezo/teams`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teams: any[] = json.data?.data ?? json.data ?? [];
      // Overview at the bare URL, plus each tabbed sub-page so Google discovers
      // the fixtures / results / squad views (each is its own indexable page).
      const teamPaths = (slug: string) => [
        `football/team/${slug}`,
        `football/team/${slug}/fixtures`,
        `football/team/${slug}/results`,
        `football/team/${slug}/squad`,
      ];
      for (const team of teams) {
        if (!team.slug) continue;
        for (const path of teamPaths(team.slug)) {
          for (const locale of locales) {
            entries.push({
              url: `${SITE_URL}/${locale}/${path}`,
              lastModified: new Date(team.updatedAt || now),
              changeFrequency: 'weekly',
              priority: path.endsWith(team.slug) ? 0.5 : 0.4,
              alternates: alternatesFor(path),
            });
          }
        }
      }
    }
  } catch {
    // ignore — team pages just won't be listed this build
  }

  return entries;
}
