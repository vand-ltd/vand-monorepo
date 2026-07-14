'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getMatches,
  getCompetitionStandings,
  type Match,
  type StandingRow,
} from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, ChevronRight, Loader2 } from 'lucide-react';

const LIVE_STATUSES = ['Live', 'HalfTime'];

function teamName(t?: { name?: string; shortName?: string }): string {
  return t?.shortName ?? t?.name ?? 'TBD';
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

function MiniCrest({ team }: { team: any }) {
  const url = crestUrl(team);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-4 w-4 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
  ) : (
    <span className="h-4 w-4 rounded-full bg-[#003153] text-white text-[7px] font-bold flex items-center justify-center shrink-0">
      {initials(team)}
    </span>
  );
}

export function FootballWidget() {
  const locale = useLocale();
  const t = useTranslations('football');
  const dateLocale = locale === 'rw' ? 'en' : locale;
  const [view, setView] = useState<'results' | 'standings'>('results');

  const { data: all = [], isLoading } = useQuery({
    queryKey: ['public-all-matches'],
    queryFn: () => getMatches({ order: 'desc' }),
    refetchInterval: 30000,
  });
  const matches = all as Match[];

  // Show live first, then recent finished, then next fixtures — capped small.
  const rows = useMemo(() => {
    const live = matches.filter((m) => LIVE_STATUSES.includes(m.status));
    const finished = matches.filter((m) => m.status === 'FullTime');
    const upcoming = matches
      .filter((m) => m.status === 'Scheduled')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
    return [...live, ...finished, ...upcoming].slice(0, 6);
  }, [matches]);

  // Main competition + season from the most recent match (for the table) —
  // same call the /sports/football board uses.
  const competitionId = (matches[0] as any)?.season?.competition?.id ?? '';
  const seasonId = matches[0]?.seasonId ?? (matches[0] as any)?.season?.id ?? '';

  const standingsQuery = useQuery({
    queryKey: ['public-standings', competitionId, seasonId],
    queryFn: () => getCompetitionStandings(competitionId, seasonId || undefined),
    enabled: !!competitionId && view === 'standings',
    refetchInterval: 60000,
  });
  const table = (standingsQuery.data ?? []).slice(0, 5) as StandingRow[];

  // Nothing at all — hide the widget.
  if (!isLoading && matches.length === 0) return null;

  return (
    <Card className="overflow-hidden !py-0 !gap-0">
      {/* Header */}
      <div
        className="relative overflow-hidden text-white px-4 py-3"
        style={{
          background:
            'linear-gradient(to right, var(--color-brand-primary), var(--color-brand-secondary), var(--color-brand-primary))',
        }}
      >
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded-md" style={{ backgroundColor: 'rgba(245,158,11,0.2)' }}>
              <Trophy className="h-4 w-4" style={{ color: 'var(--color-brand-accent)' }} />
            </div>
            <h3 className="font-bold text-white">{t('title')}</h3>
          </div>
          <Link
            href="/sports/football"
            className="inline-flex items-center gap-0.5 text-xs text-white/70 hover:text-white"
          >
            {t('allResults')}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3">
        {(['results', 'standings'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              view === v
                ? 'bg-[#003153]/10 dark:bg-[#F59E0B]/10 text-[#003153] dark:text-[#F59E0B]'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {t(v)}
          </button>
        ))}
      </div>

      <CardContent className="p-0 pt-2">
        {view === 'results' ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((m) => {
              const isLive = LIVE_STATUSES.includes(m.status);
              const hasScore = m.homeScore != null && m.awayScore != null;
              const center = isLive
                ? m.minute != null
                  ? `${m.minute}'`
                  : t('live')
                : hasScore
                  ? `${m.homeScore}-${m.awayScore}`
                  : new Date(m.kickoffAt).toLocaleDateString(dateLocale, {
                      month: 'short',
                      day: 'numeric',
                    });
              return (
                <Link
                  key={m.id}
                  href={`/sports/football/match/${m.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                >
                  <span className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                    <span className="truncate text-gray-700 dark:text-gray-300">
                      {teamName((m as any).homeTeam)}
                    </span>
                    <MiniCrest team={(m as any).homeTeam} />
                  </span>
                  <span
                    className={`shrink-0 w-14 text-center font-bold tabular-nums ${
                      isLive ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {center}
                  </span>
                  <span className="flex-1 flex items-center gap-1.5 min-w-0">
                    <MiniCrest team={(m as any).awayTeam} />
                    <span className="truncate text-gray-700 dark:text-gray-300">
                      {teamName((m as any).awayTeam)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : standingsQuery.isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#003153] dark:text-[#F59E0B]" />
          </div>
        ) : table.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-gray-400">{t('noStandings')}</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wide text-gray-400">
              <span className="w-4" />
              <span className="flex-1">{t('team')}</span>
              <span className="w-5 text-center">P</span>
              <span className="w-6 text-right">Pts</span>
            </div>
            {table.map((r) => (
              <div key={r.team?.id ?? r.position} className="flex items-center gap-2 px-3 py-2 text-xs">
                <span className="w-4 text-center text-gray-400">{r.position}</span>
                <MiniCrest team={r.team} />
                <span className="flex-1 truncate text-gray-800 dark:text-gray-200">
                  {r.team?.name ?? teamName(r.team)}
                </span>
                <span className="w-5 text-center text-gray-400 tabular-nums">{r.played}</span>
                <span className="w-6 text-right font-bold tabular-nums text-gray-900 dark:text-white">
                  {r.points}
                </span>
              </div>
            ))}
            <Link
              href="/sports/football"
              className="block px-3 py-2 text-center text-xs font-medium text-[#003153] dark:text-[#F59E0B] hover:underline"
            >
              {t('allResults')}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
