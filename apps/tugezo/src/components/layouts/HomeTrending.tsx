import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Flame, Eye } from 'lucide-react';
import { SITE_URL } from '@/lib/brand';

// Server-rendered "Most read / Trending" ranked module. This is the discovery
// mechanism the homepage was missing — it deepens sessions ("always something
// else to click") and, being in the initial HTML, is crawlable too. Driven by
// the existing /articles/trending endpoint (view-based), with a latest-articles
// fallback so it never renders empty.

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

// The list can arrive under several shapes ({ data: [...] }, { data: { data,
// meta } }, { data: { articles } }, or a bare array). Return the first candidate
// that's actually an array so the caller never gets a non-array.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickList(res: any): any[] {
  const candidates = [res?.data?.data, res?.data?.articles, res?.data, res?.articles, res];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}

export async function HomeTrending() {
  const locale = await getLocale();
  const tSidebar = await getTranslations('sidebar');

  let items = pickList(await fetchJson(`/api/tugezo/articles/trending?language=${locale}&limit=6`));
  if (items.length === 0) {
    items = pickList(await fetchJson(`/api/tugezo/articles?language=${locale}&page=1&limit=6`));
  }
  items = items.slice(0, 6);
  if (items.length === 0) return null;

  const fmtViews = (n?: number) =>
    typeof n === 'number' && n > 0 ? (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`) : null;

  return (
    <section className="bg-gray-50 dark:bg-gray-900 pb-8">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-[#F59E0B]" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{tSidebar('trendingNow')}</h2>
          <span className="ml-1 h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a, i) => {
            const views = fmtViews(a.views);
            const cat = a.category?.name;
            const thumb = a.thumbnail?.url;
            return (
              <Link
                key={a.id ?? a.slug}
                href={`/article/${a.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 transition-colors hover:border-[#003153]/30 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-[#F59E0B]/30"
              >
                <span className="w-6 shrink-0 text-center text-xl font-extrabold tabular-nums text-[#003153]/25 dark:text-[#F59E0B]/40">
                  {i + 1}
                </span>
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-lg object-cover bg-gray-100 dark:bg-gray-700"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#003153] text-lg font-bold text-white">
                    {(cat || 'M')[0]}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
                    {cat && <span className="text-[#005F73] dark:text-[#F59E0B]">{cat}</span>}
                    {views && (
                      <span className="inline-flex items-center gap-0.5 text-gray-400">
                        <Eye className="h-3 w-3" />
                        {views}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 group-hover:text-[#003153] dark:text-white dark:group-hover:text-[#F59E0B]">
                    {a.title}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
