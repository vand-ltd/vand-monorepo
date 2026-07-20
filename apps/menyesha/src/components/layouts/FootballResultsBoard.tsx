'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getMatches,
  getSeasons,
  getCompetition,
  getCompetitionStandings,
  getTopScorers,
  getTopAssists,
  getSeasonStages,
  type Match,
  type StandingRow,
  type StandingsResult,
  type StatLeaderRow,
  type Stage,
} from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Loader2, ChevronRight, ChevronLeft, ArrowLeft, Calendar } from 'lucide-react';
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

// Local YYYY-MM-DD, to match an <input type="date"> value.
function dateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

// Local YYYY-MM-DD for today + offset days.
function dayOffsetKey(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return dateKey(d.toISOString());
}

// Shift a YYYY-MM-DD date by delta days.
function shiftDate(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  d.setDate(d.getDate() + delta);
  return dateKey(d.toISOString());
}

// Compact date navigation: ‹ Today ›  + a calendar-icon-only picker.
// The middle label shows "Today", or the date once you step away with the arrows.
function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const t = useTranslations('football');
  const locale = useLocale();
  const dateLocale = locale === 'rw' ? 'en' : locale;
  const inputRef = useRef<HTMLInputElement>(null);
  const isToday = date === dayOffsetKey(0);
  let label = '';
  if (isToday) label = t('today');
  else if (date === dayOffsetKey(1)) label = t('tomorrow');
  else if (date === dayOffsetKey(-1)) label = t('yesterday');
  else if (date) {
    const d = new Date(`${date}T00:00:00`);
    // e.g. "Friday, 19 Jul" (day before month, regardless of locale order)
    label = `${d.toLocaleDateString(dateLocale, { weekday: 'long' })}, ${d.getDate()} ${d.toLocaleDateString(
      dateLocale,
      { month: 'short' }
    )}`;
  }
  const btn =
    'p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors';
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(shiftDate(date, -1))}
        className={btn}
        aria-label={t('yesterday')}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange(dayOffsetKey(0))}
        className={`px-2.5 py-2 rounded-lg text-xs font-medium min-w-[64px] whitespace-nowrap text-center transition-colors ${
          isToday
            ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        {label}
      </button>
      <button
        type="button"
        onClick={() => onChange(shiftDate(date, 1))}
        className={btn}
        aria-label={t('tomorrow')}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <div className="relative inline-flex">
        <button
          type="button"
          onClick={() => (inputRef.current as any)?.showPicker?.()}
          className={btn}
          aria-label="Pick date"
        >
          <Calendar className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          type="date"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden
        />
      </div>
    </div>
  );
}

const LIVE_STATUSES = ['Live', 'HalfTime'];

// Competition tabs, in display order. 'overview' is the default (bare URL);
// the rest are reflected in the path as /…/<tab>. Add future tabs here.
const COMPETITION_TABS = [
  'overview',
  'fixtures',
  'results',
  'standings',
  'stages',
  'scorers',
  'assists',
] as const;
type CompetitionTab = (typeof COMPETITION_TABS)[number];
const isCompetitionTab = (v?: string): v is CompetitionTab =>
  !!v && (COMPETITION_TABS as readonly string[]).includes(v);

export function FootballResultsBoard({
  initialDate,
  initialCompetition,
  initialSeason,
  initialTab,
}: {
  initialDate?: string;
  initialCompetition?: string; // competition slug (or id)
  initialSeason?: string; // season slug (or id)
  initialTab?: string; // one of COMPETITION_TABS (defaults to overview)
}) {
  const locale = useLocale();
  const t = useTranslations('football');
  const dateLocale = locale === 'rw' ? 'en' : locale;

  const [competitionId, setCompetitionId] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [view, setView] = useState<CompetitionTab>(
    isCompetitionTab(initialTab) ? initialTab : 'overview'
  );
  const [selectedDate, setSelectedDate] = useState(initialDate ?? '');
  const [selectedRound, setSelectedRound] = useState(''); // '' = all matchdays
  const didInitComp = useRef(false);

  // Default to today. Set on the client (effect) to avoid an SSR/CSR mismatch.
  useEffect(() => {
    if (!selectedDate) setSelectedDate(dayOffsetKey(0));
  }, [selectedDate]);

  // Sole source: the selected day's matches from the server (?date=).
  const matchesQuery = useQuery({
    queryKey: ['public-matches-date', selectedDate],
    queryFn: () => getMatches({ date: selectedDate }),
    enabled: !!selectedDate,
    refetchInterval: 30000,
  });
  const dayMatches = (matchesQuery.data ?? []) as Match[];

  // Fallback for empty days (sparse leagues): the latest results + next
  // fixtures across all competitions, so the landing is never blank.
  const recentQuery = useQuery({
    queryKey: ['public-all-matches'],
    queryFn: () => getMatches({ order: 'desc' }),
    enabled: !competitionId,
    refetchInterval: 60000,
  });
  const fallback = useMemo(() => {
    const all = (recentQuery.data ?? []) as Match[];
    const byDate = (list: Match[]) => {
      const m = new Map<string, Match[]>();
      for (const x of list) {
        const k = dateKey(x.kickoffAt);
        if (!m.has(k)) m.set(k, []);
        m.get(k)!.push(x);
      }
      return Array.from(m.entries());
    };
    const results = all
      .filter((m) => m.status === 'FullTime' || LIVE_STATUSES.includes(m.status))
      .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime())
      .slice(0, 8);
    const upcoming = all
      .filter((m) => m.status === 'Scheduled')
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
      .slice(0, 8);
    return {
      hasAny: results.length > 0 || upcoming.length > 0,
      results: byDate(results),
      upcoming: byDate(upcoming),
    };
  }, [recentQuery.data]);

  // All seasons (each with competition slug/id) — a date-less resolver for
  // /football/<competition>/<season> URLs, and the source for the season nav.
  const allSeasonsQuery = useQuery({
    queryKey: ['all-seasons'],
    queryFn: () => getSeasons(),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allSeasons = (allSeasonsQuery.data ?? []) as any[];

  // Every competition that has a season — so cups with no fixtures yet (e.g. a
  // group stage that hasn't been scheduled) are still reachable. Falls back to
  // whatever the day's matches expose.
  const competitions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; slug?: string }>();
    for (const s of allSeasons) {
      const c = s.competition;
      if (c?.id && !map.has(c.id)) map.set(c.id, { id: c.id, name: c.name, slug: c.slug });
    }
    for (const m of dayMatches) {
      const c = (m as any).season?.competition;
      if (c?.id && !map.has(c.id)) map.set(c.id, { id: c.id, name: c.name, slug: c.slug });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSeasons, dayMatches]);
  const seasons = useMemo(
    () => allSeasons.filter((s) => (s.competitionId ?? s.competition?.id) === competitionId),
    [allSeasons, competitionId]
  );

  // Resolve the competition (+ season) from the URL slugs, once seasons load.
  useEffect(() => {
    if (didInitComp.current || !initialCompetition || allSeasons.length === 0) return;
    const compSeasons = allSeasons.filter(
      (s) => s.competition?.slug === initialCompetition || s.competition?.id === initialCompetition
    );
    if (compSeasons.length === 0) return;
    const season =
      (initialSeason
        ? compSeasons.find((s) => s.slug === initialSeason || s.id === initialSeason)
        : undefined) ??
      compSeasons.find((s) => s.isCurrent) ??
      compSeasons[0];
    setCompetitionId(season.competition?.id ?? season.competitionId);
    setSelectedSeasonId(season.id);
    didInitComp.current = true;
  }, [allSeasons, initialCompetition, initialSeason]);

  // Default to the current season (or first) whenever the season set changes
  // (e.g. picking a competition from the all-view dropdown).
  useEffect(() => {
    if (seasons.length === 0) return;
    if (selectedSeasonId && seasons.some((s) => s.id === selectedSeasonId)) return;
    setSelectedSeasonId((seasons.find((s) => s.isCurrent) ?? seasons[0]).id);
  }, [seasons, selectedSeasonId]);

  // Reflect the scope in the path so it's shareable/crawlable:
  //   /football/YYYY-MM-DD                      (all competitions, a day)
  //   /football/<competition>/<season>[/<tab>]  (a competition's season)
  useEffect(() => {
    if (competitionId) {
      const season = allSeasons.find((s) => s.id === selectedSeasonId);
      const compSlug =
        season?.competition?.slug ??
        competitions.find((c) => c.id === competitionId)?.slug ??
        competitionId;
      const seasonSlug = season?.slug ?? selectedSeasonId;
      if (!compSlug || !seasonSlug) return;
      let path = `/${locale}/football/${compSlug}/${seasonSlug}`;
      if (view !== 'overview') path += `/${view}`;
      if (window.location.pathname !== path) window.history.replaceState(null, '', path);
      return;
    }
    if (!selectedDate) return;
    const path = `/${locale}/football/${selectedDate}`;
    if (window.location.pathname !== path) window.history.replaceState(null, '', path);
  }, [competitionId, selectedSeasonId, allSeasons, competitions, selectedDate, view, locale]);

  // A selected competition shows a whole season's matches (grouped by date).
  const compMatchesQuery = useQuery({
    queryKey: ['season-matches', selectedSeasonId],
    queryFn: () => getMatches({ seasonId: selectedSeasonId }),
    enabled: !!competitionId && !!selectedSeasonId,
    refetchInterval: 30000,
  });
  const matches = useMemo(
    () => ((competitionId ? compMatchesQuery.data : dayMatches) ?? []) as Match[],
    [competitionId, compMatchesQuery.data, dayMatches]
  );

  // Rounds (matchdays) available in the season, for the round filter.
  const rounds = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) if (m.round) set.add(m.round);
    return Array.from(set).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ''), 10);
      const nb = parseInt(b.replace(/\D/g, ''), 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [matches]);
  // Reset the round filter when the competition/season changes.
  useEffect(() => {
    setSelectedRound('');
  }, [competitionId, selectedSeasonId]);

  // Standings by competition + selected season.
  const standingsQuery = useQuery({
    queryKey: ['public-standings', competitionId, selectedSeasonId],
    queryFn: () => getCompetitionStandings(competitionId, selectedSeasonId || undefined),
    enabled: !!competitionId && !!selectedSeasonId && view === 'standings',
    refetchInterval: 60000,
  });

  // Top scorers / assists leaderboards for the selected season.
  const scorersQuery = useQuery({
    queryKey: ['top-scorers', selectedSeasonId],
    queryFn: () => getTopScorers(selectedSeasonId),
    enabled: !!selectedSeasonId && view === 'scorers',
  });
  const assistsQuery = useQuery({
    queryKey: ['top-assists', selectedSeasonId],
    queryFn: () => getTopAssists(selectedSeasonId),
    enabled: !!selectedSeasonId && view === 'assists',
  });

  // Cup structure (stages + groups). Leagues have none, so the tab is hidden then.
  const stagesQuery = useQuery({
    queryKey: ['season-stages', selectedSeasonId],
    queryFn: () => getSeasonStages(selectedSeasonId),
    enabled: !!selectedSeasonId,
    retry: false,
  });
  const stageList = stagesQuery.data ?? [];
  const hasStages = stageList.length > 0;
  const visibleTabs = COMPETITION_TABS.filter((v) => v !== 'stages' || hasStages);

  // Desktop scroll arrows for the competition tab bar (mobile scrolls by touch).
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabCanLeft, setTabCanLeft] = useState(false);
  const [tabCanRight, setTabCanRight] = useState(false);
  const updateTabArrows = () => {
    const el = tabsRef.current;
    if (!el) return;
    setTabCanLeft(el.scrollLeft > 4);
    setTabCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  const scrollTabs = (dir: number) =>
    tabsRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });
  useEffect(() => {
    updateTabArrows();
    window.addEventListener('resize', updateTabArrows);
    return () => window.removeEventListener('resize', updateTabArrows);
  }, [competitionId, view]);

  // Competition info (name + logo) for the selected-competition card.
  const competitionQuery = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => getCompetition(competitionId),
    enabled: !!competitionId,
  });
  const compName =
    competitionQuery.data?.name ??
    competitions.find((c) => c.id === competitionId)?.name ??
    (matches[0] as any)?.season?.competition?.name ??
    '';
  const compLogo = crestUrl(competitionQuery.data);

  const listLoading = competitionId
    ? allSeasonsQuery.isLoading || !selectedSeasonId || compMatchesQuery.isLoading
    : !selectedDate || matchesQuery.isLoading;

  // Uniform group shape: all-competitions view groups by competition (name +
  // slug for the header link); a selected competition groups by date.
  type Group = { key: string; name?: string; slug?: string; date?: string; list: Match[] };
  const groups = useMemo<Group[]>(() => {
    if (!competitionId) {
      const filtered = [...matches].sort(
        (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
      );
      const byComp = new Map<string, Group>();
      for (const m of filtered) {
        const c = (m as any).season?.competition;
        const key = c?.id ?? 'other';
        if (!byComp.has(key)) byComp.set(key, { key, name: c?.name ?? '', slug: c?.slug, list: [] });
        byComp.get(key)!.list.push(m);
      }
      return Array.from(byComp.values());
    }

    const filtered = (
      view === 'results'
        ? matches.filter((m) => m.status === 'FullTime' || LIVE_STATUSES.includes(m.status))
        : matches.filter((m) => m.status === 'Scheduled')
    ).filter((m) => !selectedRound || m.round === selectedRound);
    filtered.sort((a, b) => {
      const ta = new Date(a.kickoffAt).getTime();
      const tb = new Date(b.kickoffAt).getTime();
      return view === 'fixtures' ? ta - tb : tb - ta;
    });
    const byDate = new Map<string, Group>();
    for (const m of filtered) {
      const key = dateKey(m.kickoffAt);
      if (!byDate.has(key)) byDate.set(key, { key, date: key, list: [] });
      byDate.get(key)!.list.push(m);
    }
    return Array.from(byDate.values());
  }, [matches, view, competitionId, selectedRound]);

  // Overview: one combined list — the 5 matches closest to today (recent
  // results + imminent fixtures), shown chronologically. "View more" when >5.
  const overview = useMemo(() => {
    const now = Date.now();
    const top = [...matches]
      .sort(
        (a, b) =>
          Math.abs(new Date(a.kickoffAt).getTime() - now) -
          Math.abs(new Date(b.kickoffAt).getTime() - now)
      )
      .slice(0, 5)
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
    const hasMore = matches.length > 5;
    // Upcoming to see -> Fixtures; otherwise the season's done -> Results.
    const moreTarget: 'results' | 'fixtures' = matches.some((m) => m.status === 'Scheduled')
      ? 'fixtures'
      : 'results';
    return { top, hasMore, moreTarget };
  }, [matches]);

  const selectClass =
    'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] min-w-[200px]';

  return (
    <div className={competitionId ? 'flex flex-col lg:flex-row gap-6' : undefined}>
      {competitionId && (
        <aside className="lg:w-52 lg:shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
            {t('seasons')}
          </h3>
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
            {seasons.map((s) => {
              const active = s.id === selectedSeasonId;
              const count = (s as any)._count?.matches;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSeasonId(s.id)}
                  className={`shrink-0 lg:w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    {s.name}
                    {s.isCurrent && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          active ? 'bg-white dark:bg-gray-900' : 'bg-green-500'
                        }`}
                      />
                    )}
                  </span>
                  {count != null && (
                    <span
                      className={`block text-[11px] ${
                        active ? 'text-white/70 dark:text-gray-900/70' : 'text-gray-400'
                      }`}
                    >
                      {t('nMatches', { count })}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>
      )}
      <div className={competitionId ? 'flex-1 min-w-0' : ''}>
        {/* Controls */}
      {competitionId ? (
        <div className="mb-5">
          {/* Competition card (replaces the selector + date picker) */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setCompetitionId('')}
                title={t('allCompetitions')}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {compLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={compLogo}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0"
                />
              ) : (
                <span className="h-9 w-9 rounded-full bg-[#003153] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {initials({ name: compName })}
                </span>
              )}
              <span className="font-bold text-gray-900 dark:text-white truncate">{compName}</span>
            </div>
          </div>
          {/* Tabs — scroll by touch on mobile, by arrows on desktop */}
          <div className="relative w-fit max-w-full">
            <div
              ref={tabsRef}
              onScroll={updateTabArrows}
              className="flex flex-nowrap overflow-x-auto no-scrollbar gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5"
            >
              {visibleTabs.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`shrink-0 whitespace-nowrap px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    view === v
                      ? 'bg-white dark:bg-gray-700 text-[#003153] dark:text-[#F59E0B] shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {t(v)}
                </button>
              ))}
            </div>
            {/* Desktop arrows — auto-hidden at each end */}
            {tabCanLeft && (
              <button
                type="button"
                onClick={() => scrollTabs(-1)}
                aria-label="Scroll tabs left"
                className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {tabCanRight && (
              <button
                type="button"
                onClick={() => scrollTabs(1)}
                aria-label="Scroll tabs right"
                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Matchday (round) filter — Results & Fixtures only */}
          {(view === 'results' || view === 'fixtures') && rounds.length > 0 && (
            <div className="mt-3">
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className={selectClass}
              >
                <option value="">{t('allRounds')}</option>
                {rounds.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <select
            value={competitionId}
            onChange={(e) => setCompetitionId(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('allCompetitions')}</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <DateNav date={selectedDate} onChange={setSelectedDate} />
        </div>
      )}

      {competitionId && view === 'standings' ? (
        <StandingsTable query={standingsQuery} t={t} />
      ) : competitionId && view === 'scorers' ? (
        <StatLeaders query={scorersQuery} metric="goals" t={t} />
      ) : competitionId && view === 'assists' ? (
        <StatLeaders query={assistsQuery} metric="assists" t={t} />
      ) : competitionId && view === 'stages' ? (
        <StagesView stages={stageList} loading={stagesQuery.isLoading} t={t} />
      ) : listLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-[#003153] dark:text-[#F59E0B]" />
        </div>
      ) : competitionId && view === 'overview' ? (
        overview.top.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('noMatches')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {overview.top.map((m) => (
                <MatchListRow key={m.id} m={m} dateLocale={dateLocale} t={t} />
              ))}
            </div>
            {overview.hasMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setView(overview.moreTarget)}
                  className="inline-flex items-center gap-0.5 text-sm font-medium text-[#003153] dark:text-[#F59E0B] hover:underline"
                >
                  {t('viewMore')}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )
      ) : groups.length === 0 ? (
        !competitionId && fallback.hasAny ? (
          <div className="space-y-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('noMatchesToday')}</p>
            <FallbackSection
              title={t('latestResults')}
              groups={fallback.results}
              dateLocale={dateLocale}
              t={t}
            />
            <FallbackSection
              title={t('upcomingFixtures')}
              groups={fallback.upcoming}
              dateLocale={dateLocale}
              t={t}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {!competitionId
                ? t('noMatches')
                : view === 'results'
                  ? t('noResults')
                  : t('noFixtures')}
            </p>
          </div>
        )
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              {group.date ? (
                // Competition view: one section per matchday date
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  {new Date(`${group.date}T00:00:00`).toLocaleDateString(dateLocale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              ) : (
                // All-competitions view: league header links to the competition
                <Link
                  href={`/football/${group.slug || group.key}`}
                  className="inline-flex items-center gap-1 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] transition-colors"
                >
                  {group.name}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {group.list.map((m) => (
                  <MatchListRow key={m.id} m={m} dateLocale={dateLocale} t={t} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function FallbackSection({
  title,
  groups,
  dateLocale,
  t,
}: {
  title: string;
  groups: [string, Match[]][];
  dateLocale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (groups.length === 0) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      <div className="space-y-4">
        {groups.map(([date, list]) => (
          <div key={date}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              {new Date(`${date}T00:00:00`).toLocaleDateString(dateLocale, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </h4>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {list.map((m) => (
                <MatchListRow key={m.id} m={m} dateLocale={dateLocale} t={t} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// A season is either a league (standings) or a group stage (groups) — exactly
// one is populated, so: groups.length ? one table per group : a single table.
function StandingsTable({
  query,
  t,
}: {
  query: { data?: StandingsResult; isLoading: boolean };
  t: ReturnType<typeof useTranslations>;
}) {
  const rows = query.data?.standings ?? [];
  const groups = query.data?.groups ?? [];

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-[#003153] dark:text-[#F59E0B]" />
      </div>
    );
  }
  if (groups.length === 0 && rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('noStandings')}</p>
      </div>
    );
  }

  if (groups.length > 0) {
    const ordered = [...groups].sort(
      (a, b) => (a.group?.order ?? 99) - (b.group?.order ?? 99)
    );
    return (
      <div className="space-y-6">
        {ordered.map((g) => (
          <section key={g.group?.id ?? g.group?.name}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {g.group?.name}
              </h3>
              {g.group?.stage?.name && (
                <span className="text-[11px] text-gray-400">{g.group.stage.name}</span>
              )}
            </div>
            <StandingsGrid rows={g.standings ?? []} t={t} />
          </section>
        ))}
      </div>
    );
  }

  return <StandingsGrid rows={rows} t={t} />;
}

function StandingsGrid({
  rows,
  t,
}: {
  rows: StandingRow[];
  t: ReturnType<typeof useTranslations>;
}) {
  const th = 'px-2 py-2 text-center font-medium';
  const td = 'px-2 py-2.5 text-center tabular-nums text-gray-600 dark:text-gray-300';
  // Pinned (sticky) first columns keep team visible while the stats scroll.
  const stickyBg = 'bg-white dark:bg-gray-800';
  const posSticky = `sticky left-0 z-10 ${stickyBg} w-10`;
  const teamSticky = `sticky left-10 z-10 ${stickyBg} w-40 pr-2 border-r border-gray-100 dark:border-gray-700`;
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <table className="min-w-[640px] w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className={`${posSticky} py-2 text-center font-medium`}>#</th>
            <th className={`${teamSticky} py-2 text-left font-medium`}>{t('team')}</th>
            <th className={th}>P</th>
            <th className={th}>W</th>
            <th className={th}>D</th>
            <th className={th}>L</th>
            <th className={th}>GF</th>
            <th className={th}>GA</th>
            <th className={th}>GD</th>
            <th className={th}>Pts</th>
            <th className={`${th} min-w-[116px]`}>{t('form')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team?.id ?? r.position} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
              <td className={`${posSticky} py-2.5 text-center text-gray-400`}>{r.position}</td>
              <td className={`${teamSticky} py-2.5`}>
                <span className="flex items-center gap-2 min-w-0">
                  <Crest team={r.team} />
                  <span className="truncate font-medium text-gray-900 dark:text-white">
                    {teamName(r.team)}
                  </span>
                </span>
              </td>
              <td className={td}>{r.played}</td>
              <td className={td}>{r.won}</td>
              <td className={td}>{r.drawn}</td>
              <td className={td}>{r.lost}</td>
              <td className={td}>{r.goalsFor}</td>
              <td className={td}>{r.goalsAgainst}</td>
              <td className={td}>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
              <td className="px-2 py-2.5 text-center font-bold text-gray-900 dark:text-white">
                {r.points}
              </td>
              <td className="px-2 py-2.5">
                <FormBadges form={r.form} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Cup structure: each stage in order, with its groups and their teams.
function StagesView({
  stages,
  loading,
  t,
}: {
  stages: Stage[];
  loading: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-[#003153] dark:text-[#F59E0B]" />
      </div>
    );
  }
  if (stages.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('noStages')}</p>
      </div>
    );
  }

  const ordered = [...stages].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  return (
    <div className="space-y-6">
      {ordered.map((s) => (
        <section key={s.id}>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</h3>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                s.type === 'Group'
                  ? 'bg-[#003153]/10 text-[#003153] dark:bg-[#F59E0B]/10 dark:text-[#F59E0B]'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
              }`}
            >
              {s.type}
            </span>
          </div>

          {(s.groups ?? []).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...(s.groups ?? [])]
                .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
                .map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
                  >
                    <div className="border-b border-gray-100 dark:border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {g.name}
                    </div>
                    {(g.teams ?? []).length === 0 ? (
                      <p className="px-3 py-3 text-xs text-gray-400">{t('noTeams')}</p>
                    ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {(g.teams ?? []).map((team) => (
                          <li key={team.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                            <Crest team={team} />
                            <span className="truncate text-gray-900 dark:text-white">
                              {teamName(team)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-4 text-xs text-gray-400">
              {t('noGroups')}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

function StatLeaders({
  query,
  metric,
  t,
}: {
  query: { data?: StatLeaderRow[]; isLoading: boolean };
  metric: 'goals' | 'assists';
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
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {metric === 'goals' ? t('noScorers') : t('noAssists')}
        </p>
      </div>
    );
  }
  const th = 'px-2 py-2 text-center font-medium w-12';
  // Lead with the ranked metric's column (A first on the assists tab, G first on scorers).
  const statCols =
    metric === 'goals'
      ? ([
          { key: 'goals', label: t('goalsAbbr') },
          { key: 'assists', label: t('assistsAbbr') },
        ] as const)
      : ([
          { key: 'assists', label: t('assistsAbbr') },
          { key: 'goals', label: t('goalsAbbr') },
        ] as const);
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className="px-2 py-2 text-center font-medium w-10">#</th>
            <th className="px-2 py-2 text-left font-medium">{t('player')}</th>
            {statCols.map((c) => (
              <th key={c.key} className={th}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.player?.id ?? r.rank}
              className="border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <td className="px-2 py-2.5 text-center text-gray-400 tabular-nums">{r.rank}</td>
              <td className="px-2 py-2.5">
                <span className="flex items-center gap-2.5 min-w-0">
                  <PlayerAvatar player={r.player} />
                  <span className="min-w-0">
                    {r.player?.slug ? (
                      <Link
                        href={`/football/player/${r.player.slug}`}
                        className="block truncate font-medium text-gray-900 dark:text-white hover:underline"
                      >
                        {r.player.fullName}
                      </Link>
                    ) : (
                      <span className="block truncate font-medium text-gray-900 dark:text-white">
                        {r.player?.fullName}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400 min-w-0">
                      <Crest team={r.team} />
                      <span className="truncate">{teamName(r.team)}</span>
                    </span>
                  </span>
                </span>
              </td>
              {statCols.map((c) => (
                <td
                  key={c.key}
                  className={`px-2 py-2.5 text-center tabular-nums ${
                    c.key === metric
                      ? 'font-bold text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlayerAvatar({ player }: { player?: { fullName?: string; photo?: string | null } }) {
  const photo = typeof player?.photo === 'string' && player.photo.startsWith('http') ? player.photo : null;
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo}
      alt=""
      className="h-8 w-8 shrink-0 rounded-full object-cover bg-gray-100 dark:bg-gray-700"
    />
  ) : (
    <span className="h-8 w-8 shrink-0 rounded-full bg-[#003153] text-white text-[10px] font-bold flex items-center justify-center">
      {initials({ name: player?.fullName })}
    </span>
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
      {new Date(m.kickoffAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
    </span>
  );

  const homeWin = hasScore && (m.homeScore as number) > (m.awayScore as number);
  const awayWin = hasScore && (m.awayScore as number) > (m.homeScore as number);

  const nameCls = (win: boolean) =>
    `flex-1 truncate ${win ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`;
  const scoreCls = (win: boolean) =>
    `shrink-0 tabular-nums ${win ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`;

  return (
    <Link
      href={`/football/${(m as any).season?.competition?.slug ?? 'match'}/${(m as any).slug ?? m.id}`}
      className="block hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
    >
      {/* Mobile: teams stacked, one above the other */}
      <div className="sm:hidden flex items-center gap-3 px-3 py-2.5 text-sm">
        <span className="w-12 shrink-0 text-center text-[11px]">{status}</span>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <Crest team={home} />
            <span className={nameCls(homeWin)}>{teamName(home)}</span>
            {hasScore && <span className={scoreCls(homeWin)}>{m.homeScore}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Crest team={away} />
            <span className={nameCls(awayWin)}>{teamName(away)}</span>
            {hasScore && <span className={scoreCls(awayWin)}>{m.awayScore}</span>}
          </div>
        </div>
      </div>

      {/* Desktop: flat home | score | away */}
      <div className="hidden sm:flex items-center gap-3 px-4 py-3 text-sm">
        <span className="w-24 shrink-0 text-xs">{status}</span>
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
        <span className="shrink-0 w-14 text-center font-bold tabular-nums text-gray-900 dark:text-white">
          {hasScore ? `${m.homeScore} - ${m.awayScore}` : 'v'}
        </span>
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
