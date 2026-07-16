'use client';

import { useQuery } from '@tanstack/react-query';
import { getMatch, getMatchEvents, type Match, type MatchEvent } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Loader2, ArrowLeft, MapPin, ArrowRightLeft } from 'lucide-react';

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

      {/* Events timeline */}
      <MatchEvents
        matchId={m.id}
        homeTeamId={m.homeTeamId ?? home?.id}
        live={isLive}
        t={t}
      />

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

/* --------------------------- Match events timeline --------------------------- */

function eventClock(e: MatchEvent): string {
  return `${e.minute}${e.extraMinute ? `+${e.extraMinute}` : ''}'`;
}

// A small visual + short qualifier for each event type. Icons/colors carry the
// meaning so the timeline reads at a glance regardless of language.
function EventIcon({ type }: { type: MatchEvent['type'] }) {
  switch (type) {
    case 'Goal':
    case 'Penalty':
    case 'OwnGoal':
      return <span className="text-sm leading-none">⚽</span>;
    case 'MissedPenalty':
      return <span className="text-sm leading-none opacity-60 grayscale">⚽</span>;
    case 'YellowCard':
      return <span className="inline-block h-3.5 w-2.5 rounded-[2px] bg-yellow-400" />;
    case 'RedCard':
      return <span className="inline-block h-3.5 w-2.5 rounded-[2px] bg-red-600" />;
    case 'SecondYellow':
      return (
        <span className="relative inline-block h-3.5 w-2.5">
          <span className="absolute inset-0 rounded-[2px] bg-yellow-400" />
          <span className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-[2px] bg-red-600" />
        </span>
      );
    case 'Substitution':
      return <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
    default:
      return null;
  }
}

// The qualifier shown after a goal scorer's name, e.g. "(pen)" or "(OG)".
function goalQualifier(type: MatchEvent['type']): string | null {
  if (type === 'Penalty') return 'pen';
  if (type === 'OwnGoal') return 'OG';
  return null;
}

function EventDetail({ e, alignRight }: { e: MatchEvent; alignRight: boolean }) {
  const main = e.player?.fullName;
  const qualifier = goalQualifier(e.type);
  const isGoal = e.type === 'Goal' || e.type === 'Penalty' || e.type === 'OwnGoal';

  return (
    <div className={`min-w-0 ${alignRight ? 'text-right' : 'text-left'}`}>
      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
        {main ?? '—'}
        {qualifier && <span className="ml-1 text-xs font-normal text-gray-400">({qualifier})</span>}
      </p>
      {/* Second line: assist for a goal, or the paired player for a substitution. */}
      {isGoal && e.relatedPlayer?.fullName && (
        <p className="truncate text-xs text-gray-400">assist: {e.relatedPlayer.fullName}</p>
      )}
      {e.type === 'Substitution' && e.relatedPlayer?.fullName && (
        <p className="truncate text-xs text-gray-400">for {e.relatedPlayer.fullName}</p>
      )}
      {e.type === 'MissedPenalty' && (
        <p className="truncate text-xs text-gray-400">missed penalty</p>
      )}
    </div>
  );
}

function MatchEvents({
  matchId,
  homeTeamId,
  live,
  t,
}: {
  matchId: string;
  homeTeamId?: string;
  live: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const { data: events = [] } = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: () => getMatchEvents(matchId),
    refetchInterval: live ? 30000 : false,
  });

  if (events.length === 0) return null;

  const sorted = [...events].sort(
    (a, b) => a.minute - b.minute || (a.extraMinute ?? 0) - (b.extraMinute ?? 0)
  );

  return (
    <div className="px-4 sm:px-6 py-5 border-t border-gray-100 dark:border-gray-700">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-4 text-center">
        {t('timeline')}
      </p>
      <ul className="space-y-3">
        {sorted.map((e) => {
          const isHome = homeTeamId != null && e.teamId === homeTeamId;
          return (
            <li
              key={e.id}
              className="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-center gap-2 sm:gap-3"
            >
              {/* Home side */}
              <div className="flex justify-end min-w-0">
                {isHome && (
                  <div className="flex items-center gap-2 min-w-0">
                    <EventDetail e={e} alignRight />
                    <EventIcon type={e.type} />
                  </div>
                )}
              </div>
              {/* Minute — fixed centre column keeps every row aligned */}
              <span className="text-center text-xs font-semibold tabular-nums text-gray-500 dark:text-gray-400">
                {eventClock(e)}
              </span>
              {/* Away side */}
              <div className="flex justify-start min-w-0">
                {!isHome && (
                  <div className="flex items-center gap-2 min-w-0">
                    <EventIcon type={e.type} />
                    <EventDetail e={e} alignRight={false} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
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
