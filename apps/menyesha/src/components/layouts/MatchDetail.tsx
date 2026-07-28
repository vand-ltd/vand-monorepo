'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getMatch,
  getMatchEvents,
  getMatchLineup,
  normalizePosition,
  type Match,
  type MatchEvent,
  type MatchLineup,
  type LineupSlot,
} from '@org/api';
import { toPng } from 'html-to-image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Loader2, ArrowLeft, MapPin, ArrowUp, ArrowDown, ChevronUp, Download, CheckCircle2 } from 'lucide-react';
import { ShareButton } from '@/components/article/ShareButton';
import { LIVE_STATUSES, useNow, liveMinuteLabel } from '@/lib/matchClock';

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

// Show the competition type only when the name doesn't already convey it —
// "Kagame Cup · Cup" and "BK Pro League · League" are redundant.
const TYPE_SYNONYMS: Record<string, string[]> = {
  cup: ['cup', 'trophy', 'kombe', 'coupe', 'knockout'],
  league: ['league', 'liga', 'ligue', 'championship', 'division', 'premier'],
};
function showCompType(name?: string, type?: string | null): boolean {
  if (!type) return false;
  const n = (name ?? '').toLowerCase();
  const words = TYPE_SYNONYMS[type.toLowerCase()] ?? [type.toLowerCase()];
  return !words.some((w) => n.includes(w));
}

// crossOrigin lets a CORS-enabled host produce a clean canvas for image export.
// If the host blocks CORS the load errors — fall back to a plain (no-CORS) load
// so the crest still displays (export may then be blocked for that image).
function imgCorsFallback(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.dataset.fb) return;
  img.dataset.fb = '1';
  img.removeAttribute('crossorigin');
  const src = img.src;
  img.src = '';
  img.src = src;
}

// Wraps a player's name in a link to their profile when we have a slug.
function PlayerLink({
  slug,
  className,
  children,
}: {
  slug?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  if (!slug) return <span className={className}>{children}</span>;
  return (
    <Link href={`/football/player/${slug}`} className={`${className ?? ''} hover:underline`}>
      {children}
    </Link>
  );
}

// A referee's whistle (lucide has no whistle icon).
function WhistleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 8a2 2 0 0 0-2 2v1.2a1 1 0 0 0 .7 1l7.5 2.3A6.5 6.5 0 1 0 11 8H3Zm12.5 5.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
      />
    </svg>
  );
}

type MatchTab = 'info' | 'events' | 'lineups';

export function MatchDetail({
  slug,
  competition,
  tab = 'info',
  initialMatch,
  initialEvents,
  initialHomeLineup,
  initialAwayLineup,
}: {
  slug: string;
  competition: string;
  tab?: MatchTab;
  // Server-fetched seed data so the content is in the initial HTML (crawlable);
  // the client still refetches/polls for live updates.
  initialMatch?: Match | null;
  initialEvents?: MatchEvent[];
  initialHomeLineup?: MatchLineup | null;
  initialAwayLineup?: MatchLineup | null;
}) {
  const locale = useLocale();
  const t = useTranslations('football');
  const dateLocale = locale === 'rw' ? 'en' : locale;

  const { data: m, isLoading } = useQuery({
    queryKey: ['match', slug],
    queryFn: () => getMatch(slug),
    refetchInterval: 30000,
    initialData: initialMatch ?? undefined,
  });

  const home = (m as any)?.homeTeam;
  const away = (m as any)?.awayTeam;
  const shareTitle = m
    ? `${teamName(home)} vs ${teamName(away)} — ${(m as any).season?.competition?.name ?? 'Rwanda Football'}`
    : '';

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <Link
          href="/football"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToFootball')}
        </Link>
        {m && <ShareButton title={shareTitle} path={`/football/${competition}/${slug}`} />}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-[#003153] dark:text-[#F59E0B]" />
        </div>
      ) : !m ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-20 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('matchNotFound')}</p>
        </div>
      ) : (
        <MatchCardDetail
          m={m}
          dateLocale={dateLocale}
          t={t}
          competition={competition}
          slug={slug}
          activeTab={tab}
          initialEvents={initialEvents}
          initialHomeLineup={initialHomeLineup}
          initialAwayLineup={initialAwayLineup}
        />
      )}
    </div>
  );
}

function MatchCardDetail({
  m,
  dateLocale,
  t,
  competition,
  slug,
  activeTab,
  initialEvents,
  initialHomeLineup,
  initialAwayLineup,
}: {
  m: Match;
  dateLocale: string;
  t: ReturnType<typeof useTranslations>;
  competition: string;
  slug: string;
  activeTab: MatchTab;
  initialEvents?: MatchEvent[];
  initialHomeLineup?: MatchLineup | null;
  initialAwayLineup?: MatchLineup | null;
}) {
  const home = (m as any).homeTeam;
  const away = (m as any).awayTeam;
  // The match feed nests the competition with type + logo, so read straight from it.
  const comp = (m as any).season?.competition;
  const competitionName = comp?.name ?? '';
  const venue = (m as any).venue;
  const compLogo =
    typeof comp?.logo === 'string' && comp.logo.startsWith('http') ? comp.logo : null;
  const isLive = LIVE_STATUSES.includes(m.status);
  const isFinished = m.status === 'FullTime';
  // Ticks the live clock forward between data refetches.
  const now = useNow(m.status === 'Live');
  const hasScore = m.homeScore != null && m.awayScore != null;
  const hasPens = m.homePenalties != null && m.awayPenalties != null;
  // Server-derived winner of a knockout tie (score → penalties).
  const isKnockout = (m as any).stage?.type === 'Knockout';
  const winnerId = m.winnerTeamId ?? null;
  const homeThrough = isKnockout && !!winnerId && winnerId === home?.id;
  const awayThrough = isKnockout && !!winnerId && winnerId === away?.id;

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
      {liveMinuteLabel(m, now, { live: t('live'), halfTime: t('halfTime') })}
    </span>
  ) : isFinished ? (
    <span className="text-gray-500 dark:text-gray-400 font-medium">
      {m.afterExtraTime ? t('aetShort') : t('ft')}
    </span>
  ) : (
    <span className="text-gray-500 dark:text-gray-400">{t('fixtures')}</span>
  );

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Meta */}
      <div className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-700 text-center">
        <div className="flex items-center justify-center gap-2">
          {compLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={compLogo}
              alt=""
              className="h-5 w-5 rounded-full object-cover bg-white shrink-0"
            />
          ) : null}
          <p className="text-sm font-medium text-gray-900 dark:text-white">{competitionName}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {showCompType(competitionName, comp?.type) && (
            <span className="text-[10px] font-medium text-[#003153] dark:text-[#F59E0B] bg-[#003153]/10 dark:bg-[#F59E0B]/10 px-1.5 py-0.5 rounded">
              {comp.type}
            </span>
          )}
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
          <TeamBlock team={home} through={homeThrough} advancedLabel={t('advanced')} />
          <div className="text-center">
            {hasScore ? (
              <div className="text-3xl sm:text-4xl font-bold tabular-nums text-gray-900 dark:text-white">
                {m.homeScore} <span className="text-gray-300 dark:text-gray-600">-</span> {m.awayScore}
              </div>
            ) : (
              <div className="text-xl font-semibold text-gray-300 dark:text-gray-600">v</div>
            )}
            {hasPens && (
              <div className="mt-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                {m.homePenalties}-{m.awayPenalties} {t('penaltiesShort')}
              </div>
            )}
            <div className="mt-1.5 text-xs">{status}</div>
          </div>
          <TeamBlock team={away} through={awayThrough} advancedLabel={t('advanced')} />
        </div>
      </div>

      {/* Info / Events / Lineups tabs */}
      <MatchTabs
        m={m}
        home={home}
        away={away}
        venue={venue}
        isLive={isLive}
        dateLocale={dateLocale}
        t={t}
        competition={competition}
        slug={slug}
        activeTab={activeTab}
        initialEvents={initialEvents}
        initialHomeLineup={initialHomeLineup}
        initialAwayLineup={initialAwayLineup}
      />
    </div>
  );
}

/* ------------------------------ Match tabs -------------------------------- */

function MatchTabs({
  m,
  home,
  away,
  venue,
  isLive,
  dateLocale,
  t,
  competition,
  slug,
  activeTab,
  initialEvents,
  initialHomeLineup,
  initialAwayLineup,
}: {
  m: Match;
  home: any;
  away: any;
  venue: any;
  isLive: boolean;
  dateLocale: string;
  t: ReturnType<typeof useTranslations>;
  competition: string;
  slug: string;
  activeTab: MatchTab;
  initialEvents?: MatchEvent[];
  initialHomeLineup?: MatchLineup | null;
  initialAwayLineup?: MatchLineup | null;
}) {
  const tab = activeTab;
  const tabs: MatchTab[] = ['info', 'events', 'lineups'];

  return (
    <div className="border-t border-gray-100 dark:border-gray-700">
      {/* Tab bar — each tab is its own route */}
      <div className="flex">
        {tabs.map((v) => (
          <Link
            key={v}
            href={`/football/${competition}/${slug}/${v}`}
            scroll={false}
            className={`flex-1 py-3 text-center text-sm font-medium border-b-2 transition-colors ${
              tab === v
                ? 'border-[#003153] dark:border-[#F59E0B] text-[#003153] dark:text-[#F59E0B]'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t(v)}
          </Link>
        ))}
      </div>

      {/* Panel */}
      <div className="px-4 sm:px-6 py-5">
        {tab === 'info' && <MatchInfo m={m} venue={venue} dateLocale={dateLocale} t={t} />}
        {tab === 'events' && (
          <MatchEvents
            matchId={m.id}
            homeTeamId={m.homeTeamId ?? home?.id}
            live={isLive}
            t={t}
            initialEvents={initialEvents}
          />
        )}
        {tab === 'lineups' && (
          <MatchLineups
            matchId={m.id}
            homeTeamId={m.homeTeamId ?? home?.id}
            awayTeamId={m.awayTeamId ?? away?.id}
            homeTeam={home}
            awayTeam={away}
            referee={((m as any).referee ?? (m as any).refereeName) || undefined}
            t={t}
            initialHome={initialHomeLineup}
            initialAway={initialAwayLineup}
            initialEvents={initialEvents}
          />
        )}
      </div>
    </div>
  );
}

function MatchInfo({
  m,
  venue,
  dateLocale,
  t,
}: {
  m: Match;
  venue: any;
  dateLocale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const dateStr = new Date(m.kickoffAt).toLocaleString(dateLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const referee = ((m as any).referee ?? (m as any).refereeName) as string | undefined;
  // Venue may arrive as the prop, nested on the match, or by id — show whatever we have.
  const v = venue ?? (m as any).venue;
  const venueStr = v
    ? [v.name ?? v.stadium, v.city, v.country].filter(Boolean).join(', ') || null
    : ((m as any).venueName ?? null);

  const stage = (m as any).stage;
  const group = (m as any).group;
  const rows: { label: string; value?: string | null; icon?: React.ReactNode }[] = [
    { label: t('stage'), value: stage?.name },
    { label: t('group'), value: group?.name },
    { label: t('matchday'), value: m.round },
    { label: t('dateLabel'), value: dateStr },
    {
      label: t('venueLabel'),
      value: venueStr,
      icon: <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />,
    },
    {
      label: t('referee'),
      value: referee,
      icon: <WhistleIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />,
    },
  ].filter((r) => r.value);

  if (rows.length === 0)
    return <p className="text-sm text-gray-400 text-center py-2">{t('noInfo')}</p>;

  return (
    <dl className="divide-y divide-gray-100 dark:divide-gray-700">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{r.label}</dt>
          <dd className="text-sm font-medium text-gray-900 dark:text-white text-right min-w-0 flex items-center gap-1.5">
            {r.icon}
            <span className="truncate">{r.value}</span>
          </dd>
        </div>
      ))}
    </dl>
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
      return (
        <span className="inline-flex flex-col items-center leading-[0.6]">
          <ArrowUp className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
          <ArrowDown className="h-2.5 w-2.5 text-red-500" strokeWidth={3} />
        </span>
      );
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

// A scored goal (missed penalties are not goals and stay as their own row).
function isGoalType(type: MatchEvent['type']): boolean {
  return type === 'Goal' || type === 'Penalty' || type === 'OwnGoal';
}

// One clock per goal with its qualifier, LiveScore-style: "23', 67' (pen)".
function goalTimesLabel(goals: MatchEvent[]): string {
  return goals
    .map((g) => {
      const q = goalQualifier(g.type);
      return `${eventClock(g)}${q ? ` (${q})` : ''}`;
    })
    .join(', ');
}

// A goal scorer with all their goals, or any single non-goal event. Goals by
// the same player (same team) collapse into one row anchored at the first goal.
type TimelineItem =
  | { kind: 'goals'; key: string; teamId: string; player: MatchEvent['player']; goals: MatchEvent[] }
  | { kind: 'single'; event: MatchEvent };

function buildTimeline(sorted: MatchEvent[]): TimelineItem[] {
  const groups = new Map<string, Extract<TimelineItem, { kind: 'goals' }>>();
  const items: TimelineItem[] = [];
  for (const e of sorted) {
    // Group by team + player so a normal goal and an own goal (credited to the
    // other team) never merge.
    if (isGoalType(e.type) && e.player?.id) {
      const key = `${e.teamId}:${e.player.id}`;
      const existing = groups.get(key);
      if (existing) {
        existing.goals.push(e);
      } else {
        const item = { kind: 'goals' as const, key, teamId: e.teamId, player: e.player, goals: [e] };
        groups.set(key, item);
        items.push(item);
      }
    } else {
      items.push({ kind: 'single', event: e });
    }
  }
  return items;
}

function EventDetail({ e, alignRight }: { e: MatchEvent; alignRight: boolean }) {
  const main = e.player?.fullName;
  const qualifier = goalQualifier(e.type);
  const isGoal = e.type === 'Goal' || e.type === 'Penalty' || e.type === 'OwnGoal';

  return (
    <div className={`min-w-0 ${alignRight ? 'text-right' : 'text-left'}`}>
      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
        <PlayerLink slug={e.player?.slug}>{main ?? '—'}</PlayerLink>
        {qualifier && <span className="ml-1 text-xs font-normal text-gray-400">({qualifier})</span>}
      </p>
      {/* Second line: assist for a goal, or the paired player for a substitution. */}
      {isGoal && e.relatedPlayer?.fullName && (
        <p className="truncate text-xs text-gray-400">
          assist: <PlayerLink slug={e.relatedPlayer.slug}>{e.relatedPlayer.fullName}</PlayerLink>
        </p>
      )}
      {e.type === 'Substitution' && e.relatedPlayer?.fullName && (
        <p className="truncate text-xs text-gray-400">
          for <PlayerLink slug={e.relatedPlayer.slug}>{e.relatedPlayer.fullName}</PlayerLink>
        </p>
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
  initialEvents,
}: {
  matchId: string;
  homeTeamId?: string;
  live: boolean;
  t: ReturnType<typeof useTranslations>;
  initialEvents?: MatchEvent[];
}) {
  const { data: events = [] } = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: () => getMatchEvents(matchId),
    refetchInterval: live ? 30000 : false,
    initialData: initialEvents,
  });

  if (events.length === 0)
    return <p className="text-sm text-gray-400 text-center py-6">{t('noEvents')}</p>;

  const sorted = [...events].sort(
    (a, b) => a.minute - b.minute || (a.extraMinute ?? 0) - (b.extraMinute ?? 0)
  );
  const items = buildTimeline(sorted);

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {items.map((item) => {
          const teamId = item.kind === 'goals' ? item.teamId : item.event.teamId;
          const isHome = homeTeamId != null && teamId === homeTeamId;
          const key = item.kind === 'goals' ? item.key : item.event.id;

          // Goals collapse to one row per scorer; the ⚽ sits on the centre
          // spine and every minute shows inline. Other events keep the minute
          // in the centre column and the icon on the team's side.
          const detail =
            item.kind === 'goals' ? (
              <GoalDetail item={item} alignRight={isHome} />
            ) : (
              <EventDetail e={item.event} alignRight={isHome} />
            );
          const sideIcon =
            item.kind === 'goals' ? null : <EventIcon type={item.event.type} />;
          const centre =
            item.kind === 'goals' ? <EventIcon type="Goal" /> : eventClock(item.event);

          return (
            <li
              key={key}
              className="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-center gap-2 sm:gap-3 py-2.5"
            >
              {/* Home side */}
              <div className="flex justify-end min-w-0">
                {isHome && (
                  <div className="flex items-center gap-2 min-w-0">
                    {detail}
                    {sideIcon}
                  </div>
                )}
              </div>
              {/* Fixed centre column keeps every row aligned */}
              <span className="flex items-center justify-center text-center text-xs font-semibold tabular-nums text-gray-500 dark:text-gray-400">
                {centre}
              </span>
              {/* Away side */}
              <div className="flex justify-start min-w-0">
                {!isHome && (
                  <div className="flex items-center gap-2 min-w-0">
                    {sideIcon}
                    {detail}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
  );
}

// A grouped goal scorer: name once, all goal minutes inline. The assist line
// only makes sense for a lone goal, so it's shown when the group has just one.
function GoalDetail({
  item,
  alignRight,
}: {
  item: Extract<TimelineItem, { kind: 'goals' }>;
  alignRight: boolean;
}) {
  const only = item.goals.length === 1 ? item.goals[0] : null;
  return (
    <div className={`min-w-0 ${alignRight ? 'text-right' : 'text-left'}`}>
      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
        <PlayerLink slug={item.player?.slug}>{item.player?.fullName ?? '—'}</PlayerLink>
        <span className="ml-1.5 text-xs font-normal tabular-nums text-gray-400">
          {goalTimesLabel(item.goals)}
        </span>
      </p>
      {only?.relatedPlayer?.fullName && (
        <p className="truncate text-xs text-gray-400">
          assist: <PlayerLink slug={only.relatedPlayer.slug}>{only.relatedPlayer.fullName}</PlayerLink>
        </p>
      )}
    </div>
  );
}

/* ------------------------------- Lineups --------------------------------- */

const POS_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
// Raw position for display (may be a full name like "Goalkeeper").
function slotPosition(s: LineupSlot): string {
  return (s.position ?? s.player?.position ?? '') as string;
}
// Normalized GK/DEF/MID/FWD code for grouping/ordering.
function slotPosCode(s: LineupSlot): string {
  return normalizePosition(slotPosition(s)) ?? '';
}
function sortSlots(slots: LineupSlot[]): LineupSlot[] {
  return [...slots].sort(
    (a, b) =>
      (POS_ORDER[slotPosCode(a)] ?? 9) - (POS_ORDER[slotPosCode(b)] ?? 9) ||
      (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99)
  );
}

function MatchLineups({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeam,
  awayTeam,
  referee,
  t,
  initialHome,
  initialAway,
  initialEvents,
}: {
  matchId: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeam: any;
  awayTeam: any;
  referee?: string;
  t: ReturnType<typeof useTranslations>;
  initialHome?: MatchLineup | null;
  initialAway?: MatchLineup | null;
  initialEvents?: MatchEvent[];
}) {
  const homeQuery = useQuery({
    queryKey: ['match-lineup', matchId, homeTeamId],
    queryFn: () => getMatchLineup(matchId, homeTeamId as string),
    enabled: !!matchId && !!homeTeamId,
    retry: false,
    initialData: initialHome ?? undefined,
  });
  const awayQuery = useQuery({
    queryKey: ['match-lineup', matchId, awayTeamId],
    queryFn: () => getMatchLineup(matchId, awayTeamId as string),
    enabled: !!matchId && !!awayTeamId,
    retry: false,
    initialData: initialAway ?? undefined,
  });

  // All events — drives the per-player pitch badges and the substitutions list.
  const eventsQuery = useQuery({
    queryKey: ['match-events', matchId],
    queryFn: () => getMatchEvents(matchId),
    enabled: !!matchId,
    initialData: initialEvents,
  });
  const events = eventsQuery.data ?? [];
  const badges = buildPlayerBadges(events);

  const captureRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const home = homeQuery.data;
  const away = awayQuery.data;
  const loading = homeQuery.isLoading || awayQuery.isLoading;
  // Nothing announced for either side.
  if (!loading && !home?.slots?.length && !away?.slots?.length)
    return <p className="text-sm text-gray-400 text-center py-6">{t('lineupUnavailable')}</p>;

  const handleDownload = async () => {
    const node = captureRef.current;
    if (!node) return;
    setDownloading(true);
    try {
      // Render twice — the first pass warms image caching so crests draw reliably.
      const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: '#ffffff' };
      await toPng(node, opts);
      const dataUrl = await toPng(node, opts);
      const link = document.createElement('a');
      link.download = `${teamName(homeTeam)}-vs-${teamName(awayTeam)}-lineup`
        .replace(/\s+/g, '-')
        .toLowerCase()
        .concat('.png');
      link.href = dataUrl;
      // Some browsers only trigger the download for an anchor that's in the DOM.
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Lineup image export failed', err);
      alert(t('downloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  const homeStart = home ? sortSlots(home.slots.filter((s) => s.isStarting)) : [];
  const awayStart = away ? sortSlots(away.slots.filter((s) => s.isStarting)) : [];
  const homeSubs = home ? sortSlots(home.slots.filter((s) => !s.isStarting)) : [];
  const awaySubs = away ? sortSlots(away.slots.filter((s) => !s.isStarting)) : [];

  const byMinute = (a: MatchEvent, b: MatchEvent) =>
    a.minute - b.minute || (a.extraMinute ?? 0) - (b.extraMinute ?? 0);
  const subEvents = events.filter((e) => e.type === 'Substitution');
  const homeSubMoves = subEvents.filter((e) => e.teamId === homeTeamId).sort(byMinute);
  const awaySubMoves = subEvents.filter((e) => e.teamId === awayTeamId).sort(byMinute);

  // Shirt numbers by player id (events don't carry them; the lineup slots do).
  const numberOf: Record<string, number> = {};
  for (const s of [...(home?.slots ?? []), ...(away?.slots ?? [])]) {
    if (s.shirtNumber != null) numberOf[s.playerId] = s.shirtNumber;
  }

  // Bench players who came on → the minute they were subbed in.
  const inMinuteOf: Record<string, string> = {};
  for (const e of subEvents) {
    if (e.playerId) inMinuteOf[e.playerId] = eventClock(e);
  }

  // Each block below the pitch gets its own separator line.
  const sectionClass = 'mt-4 border-t border-gray-100 dark:border-gray-700 pt-4';

  // Both teams same status → single status above; mixed → per-team badges.
  const homeConf = !!home?.isConfirmed;
  const awayConf = !!away?.isConfirmed;
  const mixed = homeConf !== awayConf;

  // The pitch needs a formation for both sides; otherwise fall back to a list.
  const hasPitch = !!home?.formation && !!away?.formation;

  return (
    // The pitch is a fixed-ratio card; the list should use the full width available.
    <div className={hasPitch ? 'max-w-md mx-auto' : 'w-full'}>
      {/* Combined status (only when both teams agree) */}
      {!mixed && (
        <div className="mb-3 flex justify-center">
          {homeConf ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {t('confirmedLineups')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
              {t('probableLineups')}
            </span>
          )}
        </div>
      )}

      {hasPitch ? (
        <>
          {/* Combined pitch: home on top (attacking down), away on bottom (attacking up) */}
          <div
            ref={captureRef}
            className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <TeamBar
              team={homeTeam}
              formation={home?.formation}
              statusBadge={mixed ? (homeConf ? 'confirmed' : 'predicted') : null}
              accent="home"
              t={t}
            />
            <CombinedPitch
              homeStarters={homeStart}
              homeFormation={home?.formation}
              awayStarters={awayStart}
              awayFormation={away?.formation}
              homeCrest={crestUrl(homeTeam)}
              awayCrest={crestUrl(awayTeam)}
              badges={badges}
            />
            <TeamBar
              team={awayTeam}
              formation={away?.formation}
              statusBadge={mixed ? (awayConf ? 'confirmed' : 'predicted') : null}
              accent="away"
              t={t}
            />
          </div>

          {/* Download the pitch as an image */}
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t('downloadImage')}
            </button>
          </div>
        </>
      ) : (
        /* No formation for one/both teams — show a plain starting XI list */
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <StarterColumn
              team={homeTeam}
              formation={home?.formation}
              starters={homeStart}
              statusBadge={mixed ? (homeConf ? 'confirmed' : 'predicted') : null}
              t={t}
            />
            <StarterColumn
              team={awayTeam}
              formation={away?.formation}
              starters={awayStart}
              statusBadge={mixed ? (awayConf ? 'confirmed' : 'predicted') : null}
              t={t}
            />
          </div>
        </div>
      )}

      {/* Substitutions made */}
      {(homeSubMoves.length > 0 || awaySubMoves.length > 0) && (
        <div className={sectionClass}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 text-center">
            {t('substitutionsMade')}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <ul className="space-y-2">
              {homeSubMoves.map((e) => (
                <SubMoveRow key={e.id} e={e} numberOf={numberOf} />
              ))}
            </ul>
            <ul className="space-y-2">
              {awaySubMoves.map((e) => (
                <SubMoveRow key={e.id} e={e} numberOf={numberOf} />
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Substitutes (bench) */}
      {(homeSubs.length > 0 || awaySubs.length > 0) && (
        <div className={sectionClass}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 text-center">
            {t('substitutes')}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <ul className="space-y-1.5">
              {homeSubs.map((s) => (
                <BenchRow key={s.playerId} slot={s} inMinute={inMinuteOf[s.playerId]} />
              ))}
            </ul>
            <ul className="space-y-1.5">
              {awaySubs.map((s) => (
                <BenchRow key={s.playerId} slot={s} inMinute={inMinuteOf[s.playerId]} />
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Coach */}
      {(home?.coach || away?.coach) && (
        <div className={sectionClass}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 text-center">
            {t('coach')}
          </p>
          <div className="grid grid-cols-2 gap-x-4 text-sm">
            <span className="truncate text-gray-900 dark:text-white">{home?.coach || '—'}</span>
            <span className="truncate text-right text-gray-900 dark:text-white">
              {away?.coach || '—'}
            </span>
          </div>
        </div>
      )}

      {/* Referee */}
      {referee && (
        <div className={`${sectionClass} text-center`}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {t('referee')}
          </p>
          <p className="mt-1 text-sm text-gray-900 dark:text-white">{referee}</p>
        </div>
      )}
    </div>
  );
}

// One substitution: event (▲/▼) on the left, player names on the right.
function SubMoveRow({ e, numberOf }: { e: MatchEvent; numberOf: Record<string, number> }) {
  const inName = e.player?.fullName;
  const outName = e.relatedPlayer?.fullName;
  const inNum = e.playerId != null ? numberOf[e.playerId] : undefined;
  const outNum = e.relatedPlayerId != null ? numberOf[e.relatedPlayerId] : undefined;
  const minute = eventClock(e);
  const num = (n?: number) => (
    <span className="shrink-0 tabular-nums text-gray-400 w-4 text-center">{n ?? ''}</span>
  );
  return (
    <li className="text-xs">
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 tabular-nums text-gray-400 w-8 text-center">{minute}</span>
        <div className="min-w-0">
          {inName && (
            <div className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
              {num(inNum)}
              <PlayerLink
                slug={e.player?.slug}
                className="truncate text-gray-900 dark:text-white"
              >
                {inName}
              </PlayerLink>
            </div>
          )}
          {outName && (
            <div className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3 shrink-0 text-red-500" />
              {num(outNum)}
              <PlayerLink
                slug={e.relatedPlayer?.slug}
                className="truncate text-gray-500 dark:text-gray-400"
              >
                {outName}
              </PlayerLink>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function TeamBar({
  team,
  formation,
  statusBadge,
  accent,
  t,
}: {
  team: any;
  formation?: string;
  statusBadge?: 'confirmed' | 'predicted' | null;
  accent: 'home' | 'away';
  t: ReturnType<typeof useTranslations>;
}) {
  const url = crestUrl(team);
  const dot = accent === 'home' ? 'bg-white ring-1 ring-black/10' : 'bg-[#003153]';
  return (
    <div className="flex items-center justify-center gap-2 bg-emerald-800 text-white px-3 py-2">
      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dot}`} />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          crossOrigin="anonymous"
          onError={imgCorsFallback}
          className="h-5 w-5 rounded-full object-cover bg-white/10 shrink-0"
        />
      ) : null}
      <span className="font-semibold text-sm truncate">{teamName(team)}</span>
      {formation && <span className="text-[11px] text-white/70 shrink-0">{formation}</span>}
      {statusBadge && (
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
            statusBadge === 'confirmed'
              ? 'bg-emerald-400/25 text-emerald-100'
              : 'bg-white/15 text-white/70'
          }`}
        >
          {t(statusBadge)}
        </span>
      )}
    </div>
  );
}

// Starting XI as a plain list (used when a formation is missing, so no pitch).
function StarterColumn({
  team,
  formation,
  starters,
  statusBadge,
  t,
}: {
  team: any;
  formation?: string;
  starters: LineupSlot[];
  statusBadge?: 'confirmed' | 'predicted' | null;
  t: ReturnType<typeof useTranslations>;
}) {
  const url = crestUrl(team);
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-3 min-w-0">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-6 w-6 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0"
          />
        ) : (
          <span className="h-6 w-6 rounded-full bg-[#003153] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
            {initials(team)}
          </span>
        )}
        <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
          {teamName(team)}
        </span>
        {formation && (
          <span className="text-[11px] text-gray-400 shrink-0">{formation}</span>
        )}
        {statusBadge && (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
              statusBadge === 'confirmed'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
            }`}
          >
            {t(statusBadge)}
          </span>
        )}
      </div>
      {starters.length === 0 ? (
        <p className="text-xs text-gray-400">{t('lineupUnavailable')}</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {starters.map((s) => (
            <StarterRow key={s.playerId} slot={s} />
          ))}
        </ul>
      )}
    </div>
  );
}

function StarterRow({ slot }: { slot: LineupSlot }) {
  const pos = slotPosition(slot);
  return (
    <li className="flex items-center gap-2 text-sm min-w-0 py-1.5">
      <span className="shrink-0 w-5 text-center text-xs tabular-nums text-gray-400">
        {slot.shirtNumber ?? ''}
      </span>
      <span className="flex-1 min-w-0">
        <PlayerLink
          slug={slot.player?.slug}
          className="block truncate text-gray-900 dark:text-white"
        >
          {slot.player?.fullName ?? '—'}
        </PlayerLink>
        {pos && <span className="block truncate text-[10px] text-gray-400">{pos}</span>}
      </span>
    </li>
  );
}

// A bench player: shirt number in a circle, name, and an "in" tag with the
// minute when the player was subbed on.
function BenchRow({ slot, inMinute }: { slot: LineupSlot; inMinute?: string }) {
  const cameOn = !!inMinute;
  const pos = slotPosition(slot);
  return (
    <li className="flex items-center gap-2 text-sm min-w-0">
      {/* Shirt number */}
      <span className="shrink-0 h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600 text-[10px] tabular-nums text-gray-500 dark:text-gray-400 flex items-center justify-center">
        {slot.shirtNumber ?? ''}
      </span>
      <span className="flex-1 min-w-0">
        <PlayerLink
          slug={slot.player?.slug}
          className={`block truncate ${
            cameOn ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {slot.player?.fullName ?? '—'}
        </PlayerLink>
        {(pos || cameOn) && (
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            {pos && <span>{pos}</span>}
            {cameOn && (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                {pos ? <span className="text-gray-400">·</span> : null}
                <ArrowUp className="h-2.5 w-2.5" strokeWidth={3} />
                {inMinute}
              </span>
            )}
          </span>
        )}
      </span>
    </li>
  );
}

/* ------------------------------- Pitch view ------------------------------- */

// "Meddie Kagere" -> "M. Kagere"; single-word names are returned as-is.
function shortPlayerName(full?: string): string {
  if (!full) return '';
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

// Split the starting XI into pitch rows (GK → defence → … → attack).
// Uses the formation numbers when they line up with the XI; otherwise falls
// back to grouping by each player's position.
function buildFormationLines(starters: LineupSlot[], formation?: string): LineupSlot[][] {
  const sorted = sortSlots(starters);
  const nums = (formation ?? '')
    .split('-')
    .map((x) => parseInt(x, 10))
    .filter((x) => x > 0);
  const total = nums.reduce((a, b) => a + b, 0);

  if (nums.length && total + 1 === sorted.length) {
    const lines: LineupSlot[][] = [[sorted[0]]]; // GK
    let i = 1;
    for (const n of nums) {
      lines.push(sorted.slice(i, i + n));
      i += n;
    }
    if (i < sorted.length) lines.push(sorted.slice(i));
    return lines;
  }

  // Fallback: bucket by position.
  const buckets: Record<string, LineupSlot[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  const other: LineupSlot[] = [];
  for (const s of sorted) {
    const p = slotPosCode(s);
    if (buckets[p]) buckets[p].push(s);
    else other.push(s);
  }
  return [buckets.GK, buckets.DEF, buckets.MID, [...buckets.FWD, ...other]].filter(
    (l) => l.length > 0
  );
}

// Resolve every starter to an own-frame (x, y) in 0..100:
//  - use the slot's stored x/y when present (exact placement from admin)
//  - otherwise derive a sensible default from the formation row + column.
// y = 0 own goal .. 100 attacking end; x = 0 left .. 100 right.
function placeStarters(starters: LineupSlot[], formation?: string): { slot: LineupSlot; x: number; y: number }[] {
  const lines = buildFormationLines(starters, formation); // GK-first → attack
  const L = lines.length;
  const placed: { slot: LineupSlot; x: number; y: number }[] = [];
  lines.forEach((line, li) => {
    const n = line.length;
    line.forEach((slot, j) => {
      const x = slot.x != null ? slot.x : ((j + 1) / (n + 1)) * 100;
      const y = slot.y != null ? slot.y : L <= 1 ? 8 : 8 + (li / (L - 1)) * 77;
      placed.push({ slot, x, y });
    });
  });
  return placed;
}

// Map an own-frame (x, y) to a position on the shared pitch.
// Home defends the top; away defends the bottom (mirror both axes).
const PAD_Y = 5;
const PAD_X = 9;
function pitchStyle(accent: 'home' | 'away', x: number, y: number): { top: string; left: string } {
  const px = PAD_X + (x / 100) * (100 - 2 * PAD_X);
  const topHome = PAD_Y + (y / 100) * (50 - PAD_Y);
  return accent === 'home'
    ? { top: `${topHome}%`, left: `${px}%` }
    : { top: `${100 - topHome}%`, left: `${100 - px}%` };
}

// Per-player event summary for pitch badges.
type PlayerBadgeInfo = {
  goals: number;
  ownGoals: number;
  yellow: boolean;
  secondYellow: boolean;
  red: boolean;
  subbedOff: boolean;
};
function buildPlayerBadges(events: MatchEvent[]): Record<string, PlayerBadgeInfo> {
  const map: Record<string, PlayerBadgeInfo> = {};
  const get = (id?: string | null): PlayerBadgeInfo | null => {
    if (!id) return null;
    return (map[id] ??= {
      goals: 0,
      ownGoals: 0,
      yellow: false,
      secondYellow: false,
      red: false,
      subbedOff: false,
    });
  };
  for (const e of events) {
    switch (e.type) {
      case 'Goal':
      case 'Penalty': {
        const b = get(e.playerId);
        if (b) b.goals++;
        break;
      }
      case 'OwnGoal': {
        const b = get(e.playerId);
        if (b) b.ownGoals++;
        break;
      }
      case 'YellowCard': {
        const b = get(e.playerId);
        if (b) b.yellow = true;
        break;
      }
      case 'SecondYellow': {
        const b = get(e.playerId);
        if (b) {
          b.secondYellow = true;
          b.red = true;
        }
        break;
      }
      case 'RedCard': {
        const b = get(e.playerId);
        if (b) b.red = true;
        break;
      }
      case 'Substitution': {
        // relatedPlayer = the player coming off.
        const b = get(e.relatedPlayerId);
        if (b) b.subbedOff = true;
        break;
      }
    }
  }
  return map;
}

// Full pitch with both teams: home on the top half (GK at the very top,
// attacking down) and away on the bottom half (GK at the very bottom,
// attacking up), meeting at the halfway line — the LiveScore layout.
function CombinedPitch({
  homeStarters,
  homeFormation,
  awayStarters,
  awayFormation,
  homeCrest,
  awayCrest,
  badges,
}: {
  homeStarters: LineupSlot[];
  homeFormation?: string;
  awayStarters: LineupSlot[];
  awayFormation?: string;
  homeCrest?: string | null;
  awayCrest?: string | null;
  badges: Record<string, PlayerBadgeInfo>;
}) {
  const homePlaced = placeStarters(homeStarters, homeFormation);
  const awayPlaced = placeStarters(awayStarters, awayFormation);

  return (
    <div
      className="relative w-full aspect-[4/5]"
      style={{
        background:
          'repeating-linear-gradient(0deg, #15803d 0, #15803d 10%, #16a34a 10%, #16a34a 20%)',
      }}
    >
      {/* Team crest watermarks — home top-right, away bottom-left */}
      {homeCrest && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={homeCrest}
          alt=""
          aria-hidden
          crossOrigin="anonymous"
          onError={imgCorsFallback}
          className="pointer-events-none absolute top-10 right-3 h-24 w-24 rounded-full object-cover opacity-25"
        />
      )}
      {awayCrest && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={awayCrest}
          alt=""
          aria-hidden
          crossOrigin="anonymous"
          onError={imgCorsFallback}
          className="pointer-events-none absolute bottom-10 left-3 h-24 w-24 rounded-full object-cover opacity-25"
        />
      )}

      {/* Brand watermark — top-left */}
      <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1 opacity-70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/menyesha.png" alt="" className="h-9 sm:h-12 object-contain" />
        <span className="text-[10px] sm:text-xs font-bold tracking-wide text-white">
          Menyesha
        </span>
      </div>

      {/* Field markings */}
      <div className="pointer-events-none absolute inset-2 rounded-sm border border-white/25" />
      <div className="pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2 border-t border-white/30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />
      {/* Penalty boxes (top = home goal, bottom = away goal) */}
      <div className="pointer-events-none absolute left-1/2 top-2 h-12 w-3/5 -translate-x-1/2 border-x border-b border-white/25" />
      <div className="pointer-events-none absolute left-1/2 bottom-2 h-12 w-3/5 -translate-x-1/2 border-x border-t border-white/25" />

      {/* Positioned players */}
      {homePlaced.map(({ slot, x, y }) => (
        <Jersey
          key={slot.playerId}
          slot={slot}
          accent="home"
          style={pitchStyle('home', x, y)}
          badge={badges[slot.playerId]}
        />
      ))}
      {awayPlaced.map(({ slot, x, y }) => (
        <Jersey
          key={slot.playerId}
          slot={slot}
          accent="away"
          style={pitchStyle('away', x, y)}
          badge={badges[slot.playerId]}
        />
      ))}
    </div>
  );
}

function Jersey({
  slot,
  accent,
  style,
  badge,
}: {
  slot: LineupSlot;
  accent: 'home' | 'away';
  style: { top: string; left: string };
  badge?: PlayerBadgeInfo;
}) {
  const label =
    slot.shirtNumber != null
      ? String(slot.shirtNumber)
      : (slot.player?.fullName ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
  const kit =
    accent === 'home'
      ? 'bg-white text-[#003153] ring-black/10'
      : 'bg-[#003153] text-white ring-white/20';
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={style}>
      <PlayerLink
        slug={slot.player?.slug}
        className="flex flex-col items-center gap-0.5 no-underline"
      >
        <span className="relative">
          <span
            className={`h-5 w-5 sm:h-7 sm:w-7 rounded-full text-[9px] sm:text-[11px] font-bold flex items-center justify-center shadow-md ring-1 ${kit}`}
          >
            {label}
          </span>
          {badge && <PlayerBadges badge={badge} />}
        </span>
        <span className="whitespace-nowrap text-[8px] sm:text-[10px] font-bold leading-none text-white">
          {shortPlayerName(slot.player?.fullName) || '—'}
        </span>
      </PlayerLink>
    </div>
  );
}

// Event icons overlaid on the top-right of a jersey: goals, cards, subbed-off.
function PlayerBadges({ badge }: { badge: PlayerBadgeInfo }) {
  const items: React.ReactNode[] = [];
  if (badge.goals > 0) {
    items.push(
      <span key="g" title={`${badge.goals} goal${badge.goals > 1 ? 's' : ''}`} className="leading-none text-[10px]">
        ⚽{badge.goals > 1 ? <sup className="text-[7px] font-bold text-white">{badge.goals}</sup> : null}
      </span>
    );
  }
  if (badge.ownGoals > 0) {
    items.push(
      <span key="og" title="Own goal" className="leading-none text-[10px] grayscale">
        ⚽
      </span>
    );
  }
  if (badge.secondYellow) {
    items.push(
      <span key="2y" title="Second yellow" className="relative inline-block h-3 w-2">
        <span className="absolute inset-0 rounded-[1px] bg-yellow-400" />
        <span className="absolute inset-0 translate-x-[2px] translate-y-[2px] rounded-[1px] bg-red-600" />
      </span>
    );
  } else if (badge.red) {
    items.push(<span key="r" title="Red card" className="inline-block h-3 w-2 rounded-[1px] bg-red-600" />);
  } else if (badge.yellow) {
    items.push(<span key="y" title="Yellow card" className="inline-block h-3 w-2 rounded-[1px] bg-yellow-400" />);
  }
  if (badge.subbedOff) {
    items.push(
      <span
        key="sub"
        title="Substituted off"
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 ring-1 ring-white/70"
      >
        <ArrowDown className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />
      </span>
    );
  }
  if (items.length === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2 flex items-center gap-0.5 drop-shadow">
      {items}
    </span>
  );
}

function TeamBlock({
  team,
  through,
  advancedLabel,
}: {
  team: any;
  through?: boolean;
  advancedLabel?: string;
}) {
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
      <span className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white min-w-0">
        {through && <ChevronUp className="h-4 w-4 shrink-0 text-emerald-500" aria-label={advancedLabel} />}
        <span className="truncate max-w-[9rem]">{teamName(team)}</span>
      </span>
    </div>
  );
}
