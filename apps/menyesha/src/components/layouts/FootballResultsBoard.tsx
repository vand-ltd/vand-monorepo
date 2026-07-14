'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMatches, getCompetitionStandings, type Match, type StandingRow } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';

function teamName(t?: { name?: string; shortName?: string }): string {
  return t?.name ?? t?.shortName ?? 'TBD';
}
function crestUrl(t: any): string | null {
  if (t?.logoUrl) return t.logoUrl;
  const l = t?.logo;
  if (typeof l === 'string') return l.startsWith('http') ? l : null; // ignore bare media ids
  return l?.url ?? null;
}
function initials(t?: { name?: string; shortName?: string }): string {
  return (t?.shortName || (t?.name ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 3)).toUpperCase() || '?';
}

const LIVE_STATUSES = ['Live', 'HalfTime'];

export function FootballResultsBoard() {
  const locale = useLocale();
  const t = useTranslations('football');
  const dateLocale = locale === 'rw' ? 'en' : locale;

  const [competitionId, setCompetitionId] = useState('');
  const [view, setView] = useState<'results' | 'fixtures' | 'standings'>('results');

  // Same call the (working) sports teaser uses — the whole matches feed.
  const matchesQuery = useQuery({
    queryKey: ['public-all-matches'],
    queryFn: () => getMatches({ order: 'desc' }),
    refetchInterval: 60000,
  });
  const allMatches = (matchesQuery.data ?? []) as Match[];

  // Build the competition list from the matches themselves — no separate,
  // possibly-blocked call to getCompetitions.
  const competitions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const m of allMatches) {
      const c = (m as any).season?.competition;
      if (c?.id && !map.has(c.id)) map.set(c.id, { id: c.id, name: c.name });
    }
    return Array.from(map.values());
  }, [allMatches]);

  // Default to the first competition once matches load.
  useEffect(() => {
    if (!competitionId && competitions.length > 0) setCompetitionId(competitions[0].id);
  }, [competitions, competitionId]);

  const matches = useMemo(
    () => allMatches.filter((m) => (m as any).season?.competition?.id === competitionId),
    [allMatches, competitionId]
  );

  // Season id from the most recent match of this competition (newest-first).
  const seasonId = matches[0]?.seasonId ?? (matches[0] as any)?.season?.id ?? '';

  // Standings by competition (+ season) — server resolves the table.
  const standingsQuery = useQuery({
    queryKey: ['public-standings', competitionId, seasonId],
    queryFn: () => getCompetitionStandings(competitionId, seasonId || undefined),
    enabled: !!competitionId && view === 'standings',
    refetchInterval: 60000,
  });

  // Split, then group by matchday (round).
  const groups = useMemo(() => {
    const filtered =
      view === 'results'
        ? matches.filter((m) => m.status === 'FullTime' || LIVE_STATUSES.includes(m.status))
        : matches.filter((m) => m.status === 'Scheduled');

    // Fixtures read soonest-first; results newest-first.
    filtered.sort((a, b) => {
      const ta = new Date(a.kickoffAt).getTime();
      const tb = new Date(b.kickoffAt).getTime();
      return view === 'fixtures' ? ta - tb : tb - ta;
    });

    const byRound = new Map<string, Match[]>();
    for (const m of filtered) {
      const key = m.round || '—';
      if (!byRound.has(key)) byRound.set(key, []);
      byRound.get(key)!.push(m);
    }
    return Array.from(byRound.entries());
  }, [matches, view]);

  const selectClass =
    'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] min-w-[200px]';

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <select
          value={competitionId}
          onChange={(e) => setCompetitionId(e.target.value)}
          className={selectClass}
        >
          {competitions.length === 0 && <option value="">…</option>}
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
          {(['results', 'fixtures', 'standings'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === v
                  ? 'bg-white dark:bg-gray-700 text-[#003153] dark:text-[#F59E0B] shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t(v)}
            </button>
          ))}
        </div>
      </div>

      {view === 'standings' ? (
        <StandingsTable query={standingsQuery} t={t} />
      ) : matchesQuery.isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-[#003153] dark:text-[#F59E0B]" />
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {view === 'results' ? t('noResults') : t('noFixtures')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([round, list]) => (
            <div key={round}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                {round}
              </h3>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {list.map((m) => (
                  <MatchListRow key={m.id} m={m} dateLocale={dateLocale} t={t} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StandingsTable({
  query,
  t,
}: {
  query: { data?: StandingRow[]; isLoading: boolean };
  t: ReturnType<typeof useTranslations>;
}) {
  const rows = query.data ?? [];
  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-[#003153] dark:text-[#F59E0B]" />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('noStandings')}</p>
      </div>
    );
  }
  const th = 'px-2 py-2 text-center font-medium';
  const td = 'px-2 py-2.5 text-center tabular-nums text-gray-600 dark:text-gray-300';
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className="px-3 py-2 text-center font-medium w-8">#</th>
            <th className="px-2 py-2 text-left font-medium">{t('team')}</th>
            <th className={th}>P</th>
            <th className={`${th} hidden sm:table-cell`}>W</th>
            <th className={`${th} hidden sm:table-cell`}>D</th>
            <th className={`${th} hidden sm:table-cell`}>L</th>
            <th className={`${th} hidden md:table-cell`}>GF</th>
            <th className={`${th} hidden md:table-cell`}>GA</th>
            <th className={th}>GD</th>
            <th className={th}>Pts</th>
            <th className={`${th} hidden sm:table-cell`}>{t('form')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team?.id ?? r.position} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
              <td className="px-3 py-2.5 text-center text-gray-400">{r.position}</td>
              <td className="px-2 py-2.5">
                <span className="flex items-center gap-2 min-w-0">
                  <Crest team={r.team} />
                  <span className="truncate font-medium text-gray-900 dark:text-white">
                    {teamName(r.team)}
                  </span>
                </span>
              </td>
              <td className={td}>{r.played}</td>
              <td className={`${td} hidden sm:table-cell`}>{r.won}</td>
              <td className={`${td} hidden sm:table-cell`}>{r.drawn}</td>
              <td className={`${td} hidden sm:table-cell`}>{r.lost}</td>
              <td className={`${td} hidden md:table-cell`}>{r.goalsFor}</td>
              <td className={`${td} hidden md:table-cell`}>{r.goalsAgainst}</td>
              <td className={td}>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
              <td className="px-2 py-2.5 text-center font-bold text-gray-900 dark:text-white">
                {r.points}
              </td>
              <td className="px-2 py-2.5 hidden sm:table-cell">
                <FormBadges form={r.form} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormBadges({ form }: { form?: string[] }) {
  if (!form || form.length === 0) return <span className="text-gray-300">—</span>;
  const color: Record<string, string> = {
    W: 'bg-green-500',
    D: 'bg-gray-400',
    L: 'bg-red-500',
  };
  return (
    <span className="flex items-center justify-center gap-1">
      {form.slice(-5).map((r, i) => (
        <span
          key={i}
          title={r}
          className={`h-4 w-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${
            color[r] ?? 'bg-gray-300'
          }`}
        >
          {r}
        </span>
      ))}
    </span>
  );
}

function MatchListRow({
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
  const home = (m as any).homeTeam;
  const away = (m as any).awayTeam;

  const status = isLive ? (
    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
      </span>
      {m.minute != null ? `${m.minute}'` : t('live')}
    </span>
  ) : isFinished ? (
    <span className="text-gray-400">{t('ft')}</span>
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
      href={`/sports/football/match/${m.id}`}
      className="flex items-center gap-3 px-3 sm:px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
    >
      <span className="w-20 sm:w-24 shrink-0 text-xs">{status}</span>
      {/* Home (right-aligned) */}
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span
          className={`truncate text-right ${
            homeWin ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          {teamName(home)}
        </span>
        <Crest team={home} />
      </div>
      {/* Score */}
      <span className="shrink-0 w-14 text-center font-bold tabular-nums text-gray-900 dark:text-white">
        {hasScore ? `${m.homeScore} - ${m.awayScore}` : 'v'}
      </span>
      {/* Away (left-aligned) */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <Crest team={away} />
        <span
          className={`truncate ${
            awayWin ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
          }`}
        >
          {teamName(away)}
        </span>
      </div>
    </Link>
  );
}

function Crest({ team }: { team: any }) {
  const url = crestUrl(team);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-6 w-6 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
  ) : (
    <span className="h-6 w-6 rounded-full bg-[#003153] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
      {initials(team)}
    </span>
  );
}
