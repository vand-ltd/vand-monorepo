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
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ArrowLeft,
  Calendar,
  CalendarOff,
  RotateCcw,
} from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { TeamLink } from '@/components/football/TeamLink';
import { useTeamSlugMap } from '@/lib/teamSlugs';

function teamName(t?: { name?: string; shortName?: string }): string {
  return t?.name ?? t?.shortName ?? 'TBD';
}
function crestUrl(t: any): string | null {
  if (t?.logoUrl) return t.logoUrl;
  const l = t?.logo;
  if (typeof l === 'string') return l.startsWith('http') ? l : null; // ignore bare media ids
  return l?.url ?? null;
}
// Show the competition type only when the name doesn't already convey it —
// "Kagame Cup · Cup" / "BK Pro League · League" would be redundant.
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
// A self-contained calendar popover — pure DOM, so it works everywhere (real
// mobile, the DevTools emulator, and desktop) without the native OS date picker.
function DatePickerButton({
  date,
  onChange,
  dateLocale,
  btn,
  todayLabel,
}: {
  date: string;
  onChange: (d: string) => void;
  dateLocale: string;
  btn: string;
  todayLabel: string;
}) {
  const todayKey = dayOffsetKey(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const base = date ? new Date(`${date}T00:00:00`) : new Date();
  const [viewY, setViewY] = useState(base.getFullYear());
  const [viewM, setViewM] = useState(base.getMonth());

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  const openPicker = () => {
    const b = date ? new Date(`${date}T00:00:00`) : new Date();
    setViewY(b.getFullYear());
    setViewM(b.getMonth());
    setOpen(true);
  };

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const firstDow = new Date(viewY, viewM, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const key = (d: number) =>
    `${viewY}-${String(viewM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const monthLabel = new Date(viewY, viewM, 1).toLocaleDateString(dateLocale, {
    month: 'long',
    year: 'numeric',
  });
  const prevMonth = () =>
    viewM === 0 ? (setViewM(11), setViewY((y) => y - 1)) : setViewM((m) => m - 1);
  const nextMonth = () =>
    viewM === 11 ? (setViewM(0), setViewY((y) => y + 1)) : setViewM((m) => m + 1);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className={btn}
        aria-label="Pick date"
        aria-expanded={open}
      >
        <Calendar className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{monthLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[10px] text-gray-400">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) =>
              d === null ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChange(key(d));
                    setOpen(false);
                  }}
                  className={`h-8 rounded-md text-sm transition-colors ${
                    key(d) === date
                      ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                      : key(d) === todayKey
                        ? 'ring-1 ring-inset ring-[#003153] dark:ring-[#F59E0B] text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {d}
                </button>
              )
            )}
          </div>
          {/* Quick jump back to today, however far you've navigated. */}
          <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                onChange(todayKey);
                setOpen(false);
              }}
              className="w-full rounded-md py-1.5 text-xs font-semibold text-[#003153] transition-colors hover:bg-gray-100 dark:text-[#F59E0B] dark:hover:bg-gray-700"
            >
              {todayLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const t = useTranslations('football');
  const locale = useLocale();
  const dateLocale = locale === 'rw' ? 'en' : locale;
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
        title={t('returnToToday')}
        aria-label={isToday ? label : t('returnToToday')}
        className={`inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium min-w-[64px] whitespace-nowrap text-center transition-colors ${
          isToday
            ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        {/* No hover on mobile — this icon makes "tap to return to today"
            discoverable whenever you've stepped away from today. */}
        {!isToday && <RotateCcw className="h-3 w-3 shrink-0 text-[#003153] dark:text-[#F59E0B]" />}
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
      <DatePickerButton
        date={date}
        onChange={onChange}
        dateLocale={dateLocale}
        btn={btn}
        todayLabel={t('today')}
      />
    </div>
  );
}

import { LIVE_STATUSES, useNow, liveMinuteLabel } from '@/lib/matchClock';

// The flagship league is pinned to the top of the all-competitions views.
const PINNED_COMPETITION_SLUG = 'bk-pro-league';
function isPinnedCompetition(g: { slug?: string; name?: string }): boolean {
  return (
    g.slug === PINNED_COMPETITION_SLUG ||
    (g.name ?? '').toLowerCase().includes('bk pro league')
  );
}

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

  // Standings by competition + selected season. Request the live table so
  // in-progress scores fold in; poll fast only while a match is actually live.
  const standingsQuery = useQuery({
    queryKey: ['public-standings', competitionId, selectedSeasonId],
    queryFn: () => getCompetitionStandings(competitionId, selectedSeasonId || undefined, { live: true }),
    enabled: !!competitionId && !!selectedSeasonId && view === 'standings',
    refetchInterval: (query) => (query.state.data?.hasLiveMatches ? 20000 : 60000),
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
  // slug for the header link); a league season groups by date; a cup season
  // groups by stage → group (with a stage subtitle).
  type Group = {
    key: string;
    name?: string;
    slug?: string;
    type?: string;
    date?: string;
    stage?: string;
    list: Match[];
  };
  const groups = useMemo<Group[]>(() => {
    if (!competitionId) {
      const filtered = [...matches].sort(
        (a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
      );
      const byComp = new Map<string, Group>();
      for (const m of filtered) {
        const c = (m as any).season?.competition;
        const key = c?.id ?? 'other';
        if (!byComp.has(key))
          byComp.set(key, { key, name: c?.name ?? '', slug: c?.slug, type: c?.type, list: [] });
        byComp.get(key)!.list.push(m);
      }
      // Pin the flagship league to the top; the rest keep earliest-kickoff order
      // (Array.sort is stable, so returning 0 preserves insertion order).
      return Array.from(byComp.values()).sort(
        (a, b) => (isPinnedCompetition(a) ? 0 : 1) - (isPinnedCompetition(b) ? 0 : 1)
      );
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

    // Cup season → group by stage/group (LiveScore-style section headers).
    if (hasStages) {
      const stageOrder = new Map(stageList.map((s, i) => [s.id, s.order ?? i]));
      const bySection = new Map<string, Group>();
      for (const m of filtered) {
        const st = (m as any).stage;
        const gp = (m as any).group;
        const key = gp?.id ?? st?.id ?? 'unassigned';
        if (!bySection.has(key)) {
          bySection.set(key, {
            key,
            name: gp?.name ?? st?.name ?? t('other'),
            // For a group, subtitle with its stage; for a bare knockout stage, none.
            stage: gp?.name && st?.name ? st.name : undefined,
            list: [],
          });
        }
        bySection.get(key)!.list.push(m);
      }
      // Order: by stage order, then group name.
      return Array.from(bySection.values()).sort((a, b) => {
        const sa = stageOrder.get(a.list[0] && (a.list[0] as any).stage?.id) ?? 99;
        const sb = stageOrder.get(b.list[0] && (b.list[0] as any).stage?.id) ?? 99;
        return sa - sb || (a.name ?? '').localeCompare(b.name ?? '');
      });
    }

    const byDate = new Map<string, Group>();
    for (const m of filtered) {
      const key = dateKey(m.kickoffAt);
      if (!byDate.has(key)) byDate.set(key, { key, date: key, list: [] });
      byDate.get(key)!.list.push(m);
    }
    return Array.from(byDate.values());
  }, [matches, view, competitionId, selectedRound, hasStages, stageList, t]);

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
          {/* Matchday (round) filter — leagues only; cups group by stage instead */}
          {!hasStages && (view === 'results' || view === 'fixtures') && rounds.length > 0 && (
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
                <MatchListRow key={m.id} m={m} dateLocale={dateLocale} t={t} showStage={hasStages} />
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
            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#003153] to-[#005F73] px-5 py-5 text-white shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
                <CalendarOff className="h-6 w-6 text-[#F59E0B]" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold sm:text-lg">{t('noMatchesTodayTitle')}</p>
                <p className="mt-0.5 text-sm text-white/70">{t('noMatchesTodaySubtitle')}</p>
              </div>
            </div>
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
                // League season: one section per matchday date
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  {new Date(`${group.date}T00:00:00`).toLocaleDateString(dateLocale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              ) : competitionId ? (
                // Cup season: one section per stage / group
                <div className="mb-2 flex items-baseline gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
                    {group.name}
                  </h3>
                  {group.stage && (
                    <span className="text-[11px] text-gray-400">{group.stage}</span>
                  )}
                </div>
              ) : (
                // All-competitions view: header links to the competition, tagged with its type
                <Link
                  href={`/football/${group.slug || group.key}`}
                  className="inline-flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] transition-colors"
                >
                  {group.name}
                  {showCompType(group.name, group.type) && (
                    <span className="rounded bg-[#003153]/10 dark:bg-[#F59E0B]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#003153] dark:text-[#F59E0B]">
                      {group.type}
                    </span>
                  )}
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {group.list.map((m) => (
                  <MatchListRow
                    key={m.id}
                    m={m}
                    dateLocale={dateLocale}
                    t={t}
                    // Cup sections have a stage/group header; the all-competitions
                    // view groups by competition, so tag each row there instead.
                    showStage={!competitionId}
                    // Cup stage sections aren't grouped by date, so show each
                    // match's date on the row (league sections have a date header).
                    showDate={!!competitionId && !group.date}
                  />
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
                <MatchListRow key={m.id} m={m} dateLocale={dateLocale} t={t} showStage />
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
  const hasLive = !!query.data?.hasLiveMatches;

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

  // Shown while a table folds in an in-progress match — positions are provisional.
  const liveBadge = hasLive ? (
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        {t('liveTable')}
      </span>
      <span className="text-[11px] text-gray-400">{t('liveTableNote')}</span>
    </div>
  ) : null;

  if (groups.length > 0) {
    const ordered = [...groups].sort(
      (a, b) => (a.group?.order ?? 99) - (b.group?.order ?? 99)
    );
    return (
      <div className="space-y-6">
        {liveBadge}
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
            {(g.standings ?? []).some((r) => r.qualified === true) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-1 rounded-sm bg-green-500" />
                  {g.group?.advancesCount
                    ? g.group?.bestLosersCount
                      ? t('topNPlusBestLosers', {
                          count: g.group.advancesCount,
                          best: g.group.bestLosersCount,
                        })
                      : t('topNAdvance', { count: g.group.advancesCount })
                    : t('qualifiesForKnockout')}
                </span>
                {(g.standings ?? []).some((r) => r.qualifiedAs === 'bestLoser') && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-1 rounded-sm bg-green-300" />
                    {t('bestThirdPlaced')}
                  </span>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    );
  }

  return (
    <div>
      {liveBadge}
      <StandingsGrid rows={rows} t={t} />
    </div>
  );
}

// Position-cell classes for a qualifying standings row, by HOW the team
// qualified: direct top-N = solid green, best 3rd-placed = a lighter green.
function qualifyPosClasses(r: StandingRow): string {
  const how = r.qualifiedAs ?? (r.qualified === true ? 'group' : null);
  if (how === 'group')
    return 'border-l-[3px] border-l-green-500 font-semibold text-green-600 dark:text-green-400';
  if (how === 'bestLoser')
    return 'border-l-[3px] border-l-green-300 font-semibold text-green-500 dark:text-green-300';
  return 'text-gray-400';
}

function StandingsGrid({
  rows,
  t,
}: {
  rows: StandingRow[];
  t: ReturnType<typeof useTranslations>;
}) {
  // Standings rows may omit team.slug — resolve it from the cached teams list.
  const { resolveSlug } = useTeamSlugMap();
  const th = 'px-2 py-2 text-center font-medium';
  const td = 'px-2 py-2.5 text-center tabular-nums text-gray-600 dark:text-gray-300';
  // Pinned (sticky) first columns keep team visible while the stats scroll.
  // A live row tints amber so the sticky columns must match that tint (not white).
  const stickyBg = 'bg-white dark:bg-gray-800';
  const liveStickyBg = 'bg-amber-50 dark:bg-amber-950/40';
  const posSticky = (live: boolean) =>
    `sticky left-0 z-10 ${live ? liveStickyBg : stickyBg} w-10`;
  const teamSticky = (live: boolean) =>
    `sticky left-10 z-10 ${live ? liveStickyBg : stickyBg} w-40 pr-2 border-r border-gray-100 dark:border-gray-700`;
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <table className="min-w-[640px] w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className={`${posSticky(false)} py-2 text-center font-medium`}>#</th>
            <th className={`${teamSticky(false)} py-2 text-left font-medium`}>{t('team')}</th>
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
            <tr
              key={r.team?.id ?? r.position}
              className={`border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                r.isLive ? 'bg-amber-50 dark:bg-amber-950/40' : ''
              }`}
            >
              <td className={`${posSticky(!!r.isLive)} py-2.5 text-center ${qualifyPosClasses(r)}`}>
                {r.position}
              </td>
              <td className={`${teamSticky(!!r.isLive)} py-2.5`}>
                <span className="flex items-center gap-2 min-w-0">
                  <Crest team={r.team} />
                  <TeamLink slug={resolveSlug(r.team)} className="min-w-0 flex-1 truncate font-medium text-gray-900 dark:text-white">
                    {teamName(r.team)}
                  </TeamLink>
                  {r.isLive && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-600"
                      title="Live"
                    />
                  )}
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
            {s.type === 'Group' && s.advancesPerGroup ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                <span className="inline-block h-2 w-1 rounded-sm bg-green-500" />
                {s.bestLosersCount
                  ? t('topNPlusBestLosers', { count: s.advancesPerGroup, best: s.bestLosersCount })
                  : t('topNAdvance', { count: s.advancesPerGroup })}
              </span>
            ) : null}
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
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 px-3 py-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {g.name}
                      </span>
                      {g.advancesCount ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                          <span className="inline-block h-2 w-1 rounded-sm bg-green-500" />
                          {t('topNAdvance', { count: g.advancesCount })}
                        </span>
                      ) : null}
                    </div>
                    {(g.teams ?? []).length === 0 ? (
                      <p className="px-3 py-3 text-xs text-gray-400">{t('noTeams')}</p>
                    ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {(g.teams ?? []).map((team) => (
                          <li key={team.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                            <Crest team={team} />
                            <TeamLink slug={team?.slug} className="truncate text-gray-900 dark:text-white">
                              {teamName(team)}
                            </TeamLink>
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
                      <TeamLink slug={r.team?.slug} className="truncate">{teamName(r.team)}</TeamLink>
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
  showStage,
  showDate,
}: {
  m: Match;
  dateLocale: string;
  t: ReturnType<typeof useTranslations>;
  showStage?: boolean;
  // Show each match's date in the status column. Needed when the section isn't
  // grouped by date (cup stages), so the date isn't lost.
  showDate?: boolean;
}) {
  // In mixed feeds (no per-stage section headers) tag the row with its
  // group/stage so a cup fixture's context isn't lost.
  const stageTag =
    showStage && ((m as any).group?.name || (m as any).stage?.name)
      ? [(m as any).group?.name, (m as any).stage?.name].filter(Boolean).join(' · ')
      : null;
  const isLive = LIVE_STATUSES.includes(m.status);
  const isFinished = m.status === 'FullTime';
  // Only a started match shows a score; a scheduled fixture shows its time,
  // even if the backend seeded it with a default 0–0.
  const hasScore = (isLive || isFinished) && m.homeScore != null && m.awayScore != null;
  const home = (m as any).homeTeam;
  const away = (m as any).awayTeam;
  const now = useNow(m.status === 'Live');

  const status = isLive ? (
    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
      </span>
      {liveMinuteLabel(m, now, { live: t('live'), halfTime: t('halfTime') })}
    </span>
  ) : isFinished ? (
    // A tie decided in extra time shows AET instead of FT.
    <span className="text-gray-400">{m.afterExtraTime ? t('aetShort') : t('ft')}</span>
  ) : (
    <span className="text-gray-400">
      {new Date(m.kickoffAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', hour12: false })}
    </span>
  );

  // In cup stage sections there's no date header, so prefix the row's status
  // with its own date.
  const statusCol = showDate ? (
    <>
      <span className="block text-[10px] font-medium text-gray-400">
        {new Date(m.kickoffAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}
      </span>
      {status}
    </>
  ) : (
    status
  );

  const hasPens = m.homePenalties != null && m.awayPenalties != null;
  // The server derives the winner (score → penalties). Fall back to the score
  // only if winnerTeamId isn't present.
  const winnerId = m.winnerTeamId ?? null;
  const homeWin = winnerId
    ? winnerId === (home as any)?.id
    : hasScore && (m.homeScore as number) > (m.awayScore as number);
  const awayWin = winnerId
    ? winnerId === (away as any)?.id
    : hasScore && (m.awayScore as number) > (m.homeScore as number);
  // Progressed marker only makes sense in a knockout tie that has a winner.
  const isKnockout = (m as any).stage?.type === 'Knockout';
  const homeThrough = isKnockout && !!winnerId && winnerId === (home as any)?.id;
  const awayThrough = isKnockout && !!winnerId && winnerId === (away as any)?.id;
  // A green ▲ marks the team that went through the tie.
  const throughMark = (on: boolean) =>
    on ? (
      <ChevronUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label={t('advanced')} />
    ) : null;

  const nameCls = (win: boolean) =>
    `flex-1 truncate ${win ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`;
  const scoreCls = (win: boolean) =>
    `shrink-0 tabular-nums ${win ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`;

  return (
    <Link
      href={`/football/${(m as any).season?.competition?.slug ?? 'match'}/${(m as any).slug ?? m.id}`}
      className="block hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
    >
      {stageTag && (
        <div className="px-3 sm:px-4 pt-1.5 -mb-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400 truncate">
          {stageTag}
        </div>
      )}
      {/* Mobile: teams stacked, one above the other */}
      <div className="sm:hidden flex items-center gap-3 px-3 py-2.5 text-sm">
        <span className="w-12 shrink-0 text-center text-[11px]">
          {statusCol}
          {hasPens && (
            <span className="block text-[9px] font-semibold tabular-nums text-gray-400">
              {m.homePenalties}-{m.awayPenalties} {t('penaltiesShort')}
            </span>
          )}
        </span>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <Crest team={home} />
            <TeamLink nested slug={home?.slug} className={nameCls(homeWin)}>
              {teamName(home)}
            </TeamLink>
            {throughMark(homeThrough)}
            {hasScore && <span className={`${scoreCls(homeWin)} ml-auto`}>{m.homeScore}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Crest team={away} />
            <TeamLink nested slug={away?.slug} className={nameCls(awayWin)}>
              {teamName(away)}
            </TeamLink>
            {throughMark(awayThrough)}
            {hasScore && <span className={`${scoreCls(awayWin)} ml-auto`}>{m.awayScore}</span>}
          </div>
        </div>
      </div>

      {/* Desktop: flat home | score | away */}
      <div className="hidden sm:flex items-center gap-3 px-4 py-3 text-sm">
        <span className="w-24 shrink-0 text-xs">{statusCol}</span>
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          {throughMark(homeThrough)}
          <TeamLink
            nested
            slug={home?.slug}
            className={`truncate text-right ${
              homeWin ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {teamName(home)}
          </TeamLink>
          <Crest team={home} />
        </div>
        <span className="shrink-0 w-14 text-center">
          <span className="block font-bold tabular-nums text-gray-900 dark:text-white">
            {hasScore ? `${m.homeScore} - ${m.awayScore}` : 'v'}
          </span>
          {hasPens && (
            <span className="block text-[9px] font-semibold tabular-nums text-gray-400">
              {m.homePenalties}-{m.awayPenalties} {t('penaltiesShort')}
            </span>
          )}
        </span>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Crest team={away} />
          <TeamLink
            nested
            slug={away?.slug}
            className={`truncate ${
              awayWin ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            {teamName(away)}
          </TeamLink>
          {throughMark(awayThrough)}
        </div>
      </div>
    </Link>
  );
}

function Crest({ team }: { team: any }) {
  const router = useRouter();
  const url = crestUrl(team);
  const inner = url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="h-6 w-6 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
  ) : (
    <span className="h-6 w-6 rounded-full bg-[#003153] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
      {initials(team)}
    </span>
  );

  // When the team has a profile slug, the crest links to /football/team/:slug.
  // We navigate via onClick (not an <a>) so it's safe inside a match-row link —
  // preventDefault/stopPropagation stop the row from also firing.
  if (!team?.slug) return inner;
  const go = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/football/team/${team.slug}`);
  };
  return (
    <span
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') go(e);
      }}
      title={teamName(team)}
      className="shrink-0 cursor-pointer rounded-full transition-shadow hover:ring-2 hover:ring-[#003153]/40 dark:hover:ring-[#F59E0B]/40"
    >
      {inner}
    </span>
  );
}
