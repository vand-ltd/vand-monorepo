'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMatches, type Match } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Trophy, ChevronRight } from 'lucide-react';

import { LIVE_STATUSES, useNow, liveMinuteLabel } from '@/lib/matchClock';

function teamName(t?: { name?: string; shortName?: string }): string {
  // Prefer the full name; the row truncates it if it's too long.
  return t?.name ?? t?.shortName ?? 'TBD';
}
function crestUrl(t: any): string | null {
  if (t?.logoUrl) return t.logoUrl;
  const l = t?.logo;
  if (typeof l === 'string') return l.startsWith('http') ? l : null;
  return l?.url ?? null;
}
function initials(name?: string): string {
  return (name ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || '?';
}

function Crest({ team }: { team: any }) {
  const url = crestUrl(team);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-4 w-4 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
  ) : (
    <span className="h-4 w-4 rounded-full bg-[#003153] text-white text-[7px] font-bold flex items-center justify-center shrink-0">
      {initials(team?.shortName || team?.name)}
    </span>
  );
}

// Compact, horizontally-scrolling scores strip — for the top of mobile pages.
export function FootballStrip() {
  const locale = useLocale();
  const t = useTranslations('football');
  const dateLocale = locale === 'rw' ? 'en' : locale;

  const { data: all = [], isLoading } = useQuery({
    queryKey: ['public-all-matches'],
    queryFn: () => getMatches({ order: 'desc' }),
    refetchInterval: 30000,
  });
  const matches = all as Match[];

  const rows = useMemo(() => {
    const live = matches.filter((m) => LIVE_STATUSES.includes(m.status));
    const finished = matches.filter((m) => m.status === 'FullTime');
    const upcoming = matches
      .filter((m) => m.status === 'Scheduled')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
    return [...live, ...finished, ...upcoming].slice(0, 10);
  }, [matches]);

  // One timer for the whole strip: ticks the live clocks between refetches.
  const now = useNow(rows.some((m) => m.status === 'Live'));

  if (!isLoading && matches.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-[#F59E0B]" />
          <span className="text-sm font-bold text-gray-900 dark:text-white">{t('title')}</span>
        </div>
        <Link
          href="/football"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-[#003153] dark:text-[#F59E0B]"
        >
          {t('allResults')}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="relative">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {rows.map((m) => {
          const isLive = LIVE_STATUSES.includes(m.status);
          // Live handled separately; only a finished match shows a score.
          const hasScore = m.status === 'FullTime' && m.homeScore != null && m.awayScore != null;
          const status = isLive
            ? liveMinuteLabel(m, now, { live: t('live'), halfTime: t('halfTime') })
            : m.status === 'FullTime'
              ? t('ft')
              : new Date(m.kickoffAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });
          const comp = (m as any).season?.competition?.name ?? '';
          const sides: [string, any, number | null | undefined][] = [
            ['home', (m as any).homeTeam, m.homeScore],
            ['away', (m as any).awayTeam, m.awayScore],
          ];
          return (
            <Link
              key={m.id}
              href={`/football/${(m as any).season?.competition?.slug ?? 'match'}/${(m as any).slug ?? m.id}`}
              className="shrink-0 w-[168px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5"
            >
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5">
                <span className="truncate">{comp}</span>
                <span
                  className={`shrink-0 ml-1 ${
                    isLive ? 'text-red-600 dark:text-red-400 font-semibold' : ''
                  }`}
                >
                  {status}
                </span>
              </div>
              <div className="space-y-1">
                {sides.map(([k, team, score]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <Crest team={team} />
                    <span className="flex-1 truncate text-xs text-gray-700 dark:text-gray-300">
                      {teamName(team)}
                    </span>
                    {hasScore && (
                      <span className="text-xs font-bold tabular-nums text-gray-900 dark:text-white">
                        {score}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
        {/* Right-edge fade to hint there's more to swipe */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-gray-50 dark:from-gray-900 to-transparent" />
      </div>
    </div>
  );
}
