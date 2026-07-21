'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMatches, getSeasons, type Match } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, ChevronRight } from 'lucide-react';

const LIVE_STATUSES = ['Live', 'HalfTime'];

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
function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function MiniCrest({ team }: { team: any }) {
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

export function FootballWidget() {
  const locale = useLocale();
  const t = useTranslations('football');
  const dateLocale = locale === 'rw' ? 'en' : locale;
  const [view, setView] = useState<'matches' | 'competitions'>('matches');

  const { data: all = [], isLoading } = useQuery({
    queryKey: ['public-all-matches'],
    queryFn: () => getMatches({ order: 'desc' }),
    refetchInterval: 30000,
  });
  const matches = all as Match[];

  // Live first, then recent results, then next fixtures — capped small.
  const rows = useMemo(() => {
    const live = matches.filter((m) => LIVE_STATUSES.includes(m.status));
    const finished = matches.filter((m) => m.status === 'FullTime');
    const upcoming = matches
      .filter((m) => m.status === 'Scheduled')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
    return [...live, ...finished, ...upcoming].slice(0, 6);
  }, [matches]);

  // Every competition that has a season — so cups without fixtures yet still
  // appear. Matches only add competitions the seasons list somehow missed.
  const { data: allSeasons = [] } = useQuery({
    queryKey: ['all-seasons'],
    queryFn: () => getSeasons(),
  });

  const competitions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug?: string; date: string }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const s of allSeasons as any[]) {
      const c = s.competition;
      if (c?.id && !map.has(c.id)) map.set(c.id, { id: c.id, name: c.name, slug: c.slug, date: '' });
    }
    for (const m of matches) {
      const c = (m as any).season?.competition;
      if (!c?.id) continue;
      if (!map.has(c.id)) {
        map.set(c.id, { id: c.id, name: c.name, slug: c.slug, date: dateKey(m.kickoffAt) });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSeasons, matches]);

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
            href="/football"
            className="inline-flex items-center gap-0.5 text-xs text-white/70 hover:text-white"
          >
            {t('allResults')}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3">
        {(['matches', 'competitions'] as const).map((v) => (
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
        {view === 'matches' ? (
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
              const comp = (m as any).season?.competition?.name ?? '';
              return (
                <Link
                  key={m.id}
                  href={`/football/${(m as any).season?.competition?.slug ?? 'match'}/${(m as any).slug ?? m.id}`}
                  className="block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                >
                  {comp && <div className="text-[10px] text-gray-400 truncate mb-1">{comp}</div>}
                  <div className="flex items-center gap-2 text-xs">
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
                  </div>
                </Link>
              );
            })}
          </div>
        ) : competitions.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-gray-400">{t('noMatches')}</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {competitions.map((c) => (
              <Link
                key={c.id}
                href={`/football/${c.slug ?? c.id}`}
                className="flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
              >
                <span className="h-6 w-6 rounded-full bg-[#003153] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                  {initials(c.name)}
                </span>
                <span className="flex-1 truncate font-medium text-gray-800 dark:text-gray-200">
                  {c.name}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
