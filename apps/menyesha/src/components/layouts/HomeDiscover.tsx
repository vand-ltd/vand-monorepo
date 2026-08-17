import { getLocale, getTranslations } from 'next-intl/server';
import { isTbdKickoff } from '@org/api';
import { Link } from '@/i18n/navigation';
import { ChevronRight, CalendarDays, Newspaper } from 'lucide-react';

// A server-rendered block of internal links (recent/upcoming matches, their
// competitions, and latest articles). It exists mainly for crawl discovery: the
// homepage is the highest-authority page, so real <a> links to match, competition
// and article pages — present in the initial HTML — help Google find and index
// the deep football/article archive. It's also useful for readers.

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menyesha.vand.rw';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchJson<T = any>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const PLAYED = ['FullTime', 'Live', 'HalfTime'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function teamName(tm: any): string {
  return tm?.name ?? tm?.shortName ?? 'TBD';
}

export async function HomeDiscover() {
  const locale = await getLocale();
  const t = await getTranslations('football');
  const tFeed = await getTranslations('feed');

  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 10);
  const to = new Date(now);
  to.setDate(now.getDate() + 21);

  const [matchesRes, articlesRes] = await Promise.all([
    fetchJson(`/api/menyesha/matches?from=${ymd(from)}&to=${ymd(to)}&order=desc`),
    fetchJson(`/api/menyesha/articles?language=${locale}&page=1&limit=8`),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matches: any[] = (matchesRes as any)?.data ?? (matchesRes as any) ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const articles: any[] =
    (articlesRes as any)?.data?.data ?? (articlesRes as any)?.data ?? [];

  const results = matches.filter((m) => PLAYED.includes(m.status)).slice(0, 6);
  const fixtures = matches
    .filter((m) => !PLAYED.includes(m.status))
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    .slice(0, 6);
  const matchList = [...results, ...fixtures].slice(0, 8);

  // Unique competitions seen in this window → chips linking to each competition.
  const comps = new Map<string, string>();
  for (const m of matches) {
    const c = m.season?.competition;
    if (c?.slug && !comps.has(c.slug)) comps.set(c.slug, c.name);
  }

  if (matchList.length === 0 && articles.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchHref = (m: any) => `/football/${m.season?.competition?.slug ?? 'match'}/${m.slug}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scoreOrDate = (m: any) => {
    const done = PLAYED.includes(m.status) && m.homeScore != null && m.awayScore != null;
    if (done) return `${m.homeScore}–${m.awayScore}`;
    if (isTbdKickoff(m.kickoffAt)) return 'TBD';
    // Server component (no hydration), so a fixed Kigali date is safe and stable.
    return new Date(m.kickoffAt).toLocaleDateString('en', {
      day: 'numeric',
      month: 'short',
      timeZone: 'Africa/Kigali',
    });
  };

  const cardClass =
    'rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden';
  const headClass =
    'flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700';
  const titleClass = 'flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white';
  const moreClass =
    'inline-flex items-center gap-0.5 text-xs font-medium text-[#003153] dark:text-[#F59E0B] hover:underline';

  return (
    <section className="bg-gray-50 dark:bg-gray-900 pb-8">
      <div className="max-w-screen-xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Football */}
        {matchList.length > 0 && (
          <div className={cardClass}>
            <div className={headClass}>
              <span className={titleClass}>
                <CalendarDays className="h-4 w-4 text-[#003153] dark:text-[#F59E0B]" />
                {t('pageTitle')}
              </span>
              <Link href="/football" className={moreClass}>
                {t('allResults')}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {comps.size > 0 && (
              <div className="flex flex-wrap gap-1.5 px-4 pt-3">
                {Array.from(comps, ([slug, name]) => (
                  <Link
                    key={slug}
                    href={`/football/${slug}`}
                    className="rounded-full border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:border-[#003153]/40 dark:hover:border-[#F59E0B]/40"
                  >
                    {name}
                  </Link>
                ))}
              </div>
            )}

            <ul className="divide-y divide-gray-100 dark:divide-gray-700 mt-1">
              {matchList.map((m) => (
                <li key={m.id}>
                  <Link
                    href={matchHref(m)}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                  >
                    <span className="flex-1 min-w-0 truncate text-right text-sm text-gray-900 dark:text-white">
                      {teamName(m.homeTeam)}
                    </span>
                    <span className="shrink-0 w-14 text-center text-sm font-bold tabular-nums text-gray-700 dark:text-gray-200">
                      {scoreOrDate(m)}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-white">
                      {teamName(m.awayTeam)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Latest news */}
        {articles.length > 0 && (
          <div className={cardClass}>
            <div className={headClass}>
              <span className={titleClass}>
                <Newspaper className="h-4 w-4 text-[#003153] dark:text-[#F59E0B]" />
                {tFeed('latestStories')}
              </span>
              <Link href="/news" className={moreClass}>
                {tFeed('loadMore')}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {articles.slice(0, 8).map((a) => (
                <li key={a.id ?? a.slug}>
                  <Link
                    href={`/article/${a.slug}`}
                    className="block px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors line-clamp-2"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
