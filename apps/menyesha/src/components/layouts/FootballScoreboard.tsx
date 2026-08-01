'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMatches, type Match } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, Trophy, ChevronRight, ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { TeamLink } from '@/components/football/TeamLink';

function teamName(t?: { name?: string; shortName?: string }): string {
  return t?.name ?? t?.shortName ?? 'TBD';
}
function crestUrl(t: any): string | null {
  if (t?.logoUrl) return t.logoUrl;
  const l = t?.logo;
  if (typeof l === 'string') return l.startsWith('http') ? l : null; // ignore bare media ids
  return l?.url ?? null;
}
function competitionName(m: any): string {
  return m?.season?.competition?.name ?? m?.competition?.name ?? m?.season?.name ?? '';
}
function initials(t?: { name?: string; shortName?: string }): string {
  return (t?.shortName || (t?.name ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 3)).toUpperCase() || '?';
}

import { LIVE_STATUSES, useNow, liveMinuteLabel } from '@/lib/matchClock';

export function FootballScoreboard() {
  const locale = useLocale();
  const t = useTranslations('football');
  const [view, setView] = useState<'results' | 'fixtures'>('results');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  const scrollByCards = (dir: number) =>
    scrollRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  const { data: all = [], isLoading } = useQuery({
    queryKey: ['public-matches'],
    queryFn: () => getMatches({ order: 'desc' }),
    refetchInterval: 60000,
  });

  const dateLocale = locale === 'rw' ? 'en' : locale;

  const { live, results, fixtures } = useMemo(() => {
    const matches = all as Match[];
    const live = matches.filter((m) => LIVE_STATUSES.includes(m.status));
    const results = matches.filter((m) => m.status === 'FullTime').slice(0, 8);
    const fixtures = matches
      .filter((m) => m.status === 'Scheduled')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 8);
    return { live, results, fixtures };
  }, [all]);

  // Re-measure which arrows to show when the shown set changes / on resize.
  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, all]);

  // Nothing to show at all — don't render the block.
  if (!isLoading && live.length === 0 && results.length === 0 && fixtures.length === 0) {
    return null;
  }

  const shown = view === 'results' ? [...live, ...results] : fixtures;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#F59E0B]" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('title')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
            {(['results', 'fixtures'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  view === v
                    ? 'bg-white dark:bg-gray-700 text-[#003153] dark:text-[#F59E0B] shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {t(v)}
              </button>
            ))}
          </div>
          <Link
            href="/football"
            className="hidden sm:inline-flex items-center gap-0.5 text-xs font-medium text-[#003153] dark:text-[#F59E0B] hover:underline whitespace-nowrap"
          >
            {t('allResults')}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#003153] dark:text-[#F59E0B]" />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {view === 'results' ? t('noResults') : t('noFixtures')}
          </p>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={updateArrows}
            className="flex gap-3 overflow-x-auto pb-2 no-scrollbar"
          >
            {shown.map((m) => (
              <MatchCard key={m.id} m={m} dateLocale={dateLocale} t={t} />
            ))}
          </div>
          {/* Desktop scroll arrows (mobile scrolls by touch) — hidden at each end */}
          {canLeft && (
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              aria-label="Scroll left"
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {canRight && (
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              aria-label="Scroll right"
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function MatchCard({
  m,
  dateLocale,
  t,
}: {
  m: Match;
  dateLocale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const isLive = LIVE_STATUSES.includes(m.status);
  const isFinished = m.status === 'FullTime';
  const hasScore = m.homeScore != null && m.awayScore != null;
  const now = useNow(m.status === 'Live');

  const statusNode = isLive ? (
    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
      </span>
      {liveMinuteLabel(m, now, { live: t('live'), halfTime: t('halfTime') })}
    </span>
  ) : isFinished ? (
    <span className="font-medium text-gray-400">{t('ft')}</span>
  ) : (
    <span className="text-gray-400">
      {new Date(m.kickoffAt).toLocaleString(dateLocale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </span>
  );

  const homeWin = hasScore && (m.homeScore as number) > (m.awayScore as number);
  const awayWin = hasScore && (m.awayScore as number) > (m.homeScore as number);

  return (
    <Link
      href={`/football/${(m as any).season?.competition?.slug ?? 'match'}/${(m as any).slug ?? m.id}`}
      className="shrink-0 w-[240px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 hover:border-[#003153] dark:hover:border-[#F59E0B] transition-colors"
    >
      <div className="flex items-center justify-between text-[11px] mb-2">
        <span className="truncate text-gray-500 dark:text-gray-400">{competitionName(m)}</span>
        <span className="shrink-0 ml-2">{statusNode}</span>
      </div>
      <div className="space-y-1.5">
        <TeamLine team={(m as any).homeTeam} score={m.homeScore} highlight={homeWin} hasScore={hasScore} />
        <TeamLine team={(m as any).awayTeam} score={m.awayScore} highlight={awayWin} hasScore={hasScore} />
      </div>
    </Link>
  );
}

function TeamLine({
  team,
  score,
  highlight,
  hasScore,
}: {
  team: any;
  score?: number | null;
  highlight: boolean;
  hasScore: boolean;
}) {
  const url = crestUrl(team);
  return (
    <div className="flex items-center gap-2">
      <TeamLink
        nested
        slug={team?.slug}
        title={teamName(team)}
        className="flex items-center gap-2 min-w-0 flex-1"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-5 w-5 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
        ) : (
          <span className="h-5 w-5 rounded-full bg-[#003153] text-white text-[8px] font-bold flex items-center justify-center shrink-0">
            {initials(team)}
          </span>
        )}
        <span
          className={`truncate text-sm ${
            highlight ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          {teamName(team)}
        </span>
      </TeamLink>
      {hasScore && (
        <span
          className={`text-sm tabular-nums ${
            highlight ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  );
}
