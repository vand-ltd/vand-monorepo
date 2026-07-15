'use client';

import { useQuery } from '@tanstack/react-query';
import { getMatch, type Match } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Loader2, ArrowLeft, MapPin } from 'lucide-react';

const LIVE_STATUSES = ['Live', 'HalfTime'];

function teamName(t?: { name?: string; shortName?: string }): string {
  return t?.name ?? t?.shortName ?? 'TBD';
}
function crestUrl(t: any): string | null {
  if (t?.logoUrl) return t.logoUrl;
  const l = t?.logo;
  if (typeof l === 'string') return l.startsWith('http') ? l : null;
  return l?.url ?? null;
}
function initials(t?: { name?: string; shortName?: string }): string {
  return (t?.shortName || (t?.name ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 3)).toUpperCase() || '?';
}

export function MatchDetail({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations('football');
  const dateLocale = locale === 'rw' ? 'en' : locale;

  const { data: m, isLoading } = useQuery({
    queryKey: ['match', slug],
    queryFn: () => getMatch(slug),
    refetchInterval: 30000,
  });

  return (
    <div>
      <Link
        href="/football"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToFootball')}
      </Link>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-[#003153] dark:text-[#F59E0B]" />
        </div>
      ) : !m ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-20 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('matchNotFound')}</p>
        </div>
      ) : (
        <MatchCardDetail m={m} dateLocale={dateLocale} t={t} />
      )}
    </div>
  );
}

function MatchCardDetail({
  m,
  dateLocale,
  t,
}: {
  m: Match;
  dateLocale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const home = (m as any).homeTeam;
  const away = (m as any).awayTeam;
  const competition = (m as any).season?.competition?.name ?? '';
  const venue = (m as any).venue;
  const isLive = LIVE_STATUSES.includes(m.status);
  const isFinished = m.status === 'FullTime';
  const hasScore = m.homeScore != null && m.awayScore != null;

  const kickoff = new Date(m.kickoffAt).toLocaleString(dateLocale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const status = isLive ? (
    <span className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-semibold">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      {m.minute != null ? `${m.minute}'` : t('live')}
    </span>
  ) : isFinished ? (
    <span className="text-gray-500 dark:text-gray-400 font-medium">{t('ft')}</span>
  ) : (
    <span className="text-gray-500 dark:text-gray-400">{t('fixtures')}</span>
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Meta */}
      <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-700 text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{competition}</p>
        <div className="flex items-center justify-center gap-2 mt-1">
          {m.round && (
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              {m.round}
            </span>
          )}
          <span className="text-xs text-gray-400">{kickoff}</span>
        </div>
      </div>

      {/* Scoreline */}
      <div className="px-4 sm:px-8 py-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          <TeamBlock team={home} />
          <div className="text-center">
            {hasScore ? (
              <div className="text-3xl sm:text-4xl font-bold tabular-nums text-gray-900 dark:text-white">
                {m.homeScore} <span className="text-gray-300 dark:text-gray-600">-</span> {m.awayScore}
              </div>
            ) : (
              <div className="text-xl font-semibold text-gray-300 dark:text-gray-600">v</div>
            )}
            <div className="mt-1.5 text-xs">{status}</div>
          </div>
          <TeamBlock team={away} />
        </div>
      </div>

      {/* Venue */}
      {venue?.name && (
        <div className="px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <MapPin className="h-3.5 w-3.5" />
          {[venue.name, venue.city].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
}

function TeamBlock({ team }: { team: any }) {
  const url = crestUrl(team);
  return (
    <div className="flex flex-col items-center gap-2 text-center min-w-0">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover bg-gray-100 dark:bg-gray-700" />
      ) : (
        <span className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#003153] text-white text-sm font-bold flex items-center justify-center">
          {initials(team)}
        </span>
      )}
      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[9rem]">
        {teamName(team)}
      </span>
    </div>
  );
}
