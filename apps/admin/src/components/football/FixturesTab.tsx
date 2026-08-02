'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSeasonEntries,
  getVenues,
  getMatches,
  getSeasonStages,
  createMatchesBulk,
  updateMatch,
  deleteMatch,
  MATCH_STATUSES,
  type Team,
  type Venue,
  type Match,
  type MatchStatus,
  type MatchInput,
  type Season,
} from '@org/api';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Trash2,
  CalendarDays,
  Save,
  ListPlus,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ImageDown,
} from 'lucide-react';
import { cardClass, inputClass, labelClass, primaryBtn, ghostBtn } from './styles';
import { MatchEventsPanel } from './MatchEventsPanel';
import { MatchLineupsPanel } from './MatchLineupsPanel';
import { MatchGraphicModal } from './MatchGraphicModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

/* --------------------------- Date-filter helpers -------------------------- */
// Local-time YYYY-MM-DD (matches how a match's kickoff day reads to the admin).
const pad2 = (n: number) => String(n).padStart(2, '0');
const dateKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayKey = () => dateKey(new Date());
const shiftKey = (key: string, days: number) => {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + days));
};
const prettyKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};
// Compact date navigation — an exact copy of the menyesha scores date nav.
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
  const today = todayKey();
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
  const cellKey = (d: number) => `${viewY}-${pad2(viewM + 1)}-${pad2(d)}`;
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
                    onChange(cellKey(d));
                    setOpen(false);
                  }}
                  className={`h-8 rounded-md text-sm transition-colors ${
                    cellKey(d) === date
                      ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                      : cellKey(d) === today
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
                onChange(today);
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

type FixtureRow = {
  homeTeamId: string;
  awayTeamId: string;
  kickoff: string;
  venueId: string;
  referee: string;
  groupId: string; // per-fixture override; '' = use the top-level group
};
const emptyRow: FixtureRow = {
  homeTeamId: '',
  awayTeamId: '',
  kickoff: '',
  venueId: '',
  referee: '',
  groupId: '',
};

export function FixturesTab({ seasonId, season }: { seasonId: string; season: Season | null }) {
  const qc = useQueryClient();

  const entriesQuery = useQuery({
    queryKey: ['football', 'entries', seasonId],
    queryFn: () => getSeasonEntries(seasonId),
    enabled: !!seasonId,
  });
  const teams = entriesQuery.data ?? [];
  const teamMap = useMemo(() => {
    const m = new Map<string, Team>();
    for (const t of teams) m.set(t.id, t);
    return m;
  }, [teams]);

  const venuesQuery = useQuery({ queryKey: ['football', 'venues'], queryFn: getVenues });
  const venues = venuesQuery.data ?? [];

  const matchesQuery = useQuery({
    queryKey: ['football', 'matches', seasonId],
    queryFn: () => getMatches({ seasonId, order: 'asc' }),
    enabled: !!seasonId,
  });
  const allMatches = matchesQuery.data ?? [];

  // Filter the match list by kickoff day — a season can have dozens of games, so
  // updating scores/events is far easier scoped to one day. Defaults to today;
  // "All dates" (showAll) drops the filter to show every game.
  const [dateFilter, setDateFilter] = useState<string>(() => todayKey());
  const [showAll, setShowAll] = useState(false);
  const pickDate = (d: string) => {
    setDateFilter(d);
    setShowAll(false);
  };
  const matchesForDate = useMemo(
    () =>
      showAll
        ? allMatches
        : allMatches.filter((m) => m.kickoffAt && dateKey(new Date(m.kickoffAt)) === dateFilter),
    [allMatches, dateFilter, showAll]
  );

  // Competition/season name for the shareable result graphic's header.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competitionLabel: string | undefined =
    (season as any)?.competition?.name ?? season?.name ?? undefined;

  // Date-nav labelling — identical to the menyesha scores nav.
  const navBtn =
    'p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors';
  const navIsToday = dateFilter === todayKey();
  const navLabel = navIsToday
    ? 'Today'
    : dateFilter === shiftKey(todayKey(), 1)
      ? 'Tomorrow'
      : dateFilter === shiftKey(todayKey(), -1)
        ? 'Yesterday'
        : (() => {
            const d = new Date(`${dateFilter}T00:00:00`);
            return `${d.toLocaleDateString('en', { weekday: 'long' })}, ${d.getDate()} ${d.toLocaleDateString(
              'en',
              { month: 'short' }
            )}`;
          })();

  // Cup structure — lets fixtures be tagged with a stage and (for group stages) a group.
  const stagesQuery = useQuery({
    queryKey: ['football', 'stages', seasonId],
    queryFn: () => getSeasonStages(seasonId),
    enabled: !!seasonId,
    retry: false,
  });
  const stages = stagesQuery.data ?? [];

  /* ----------------------------- Bulk fixtures --------------------------- */
  const [round, setRound] = useState('Matchday 1');
  const [stageId, setStageId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [rows, setRows] = useState<FixtureRow[]>([{ ...emptyRow }]);

  const activeStage = stages.find((s) => s.id === stageId) ?? null;
  const stageGroups = activeStage?.groups ?? [];
  // A knockout stage IS the round (e.g. "Semi-final"), so a separate round label
  // isn't required — it defaults to the stage name.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isKnockoutStage = (activeStage as any)?.type === 'Knockout';

  // Only teams in the effective group can play a group fixture.
  const teamsForRow = (row: FixtureRow): Team[] => {
    const gid = row.groupId || groupId;
    if (!gid) return teams;
    const g = stageGroups.find((x) => x.id === gid);
    return g?.teams?.length ? (g.teams as Team[]) : teams;
  };
  const validRows = rows.filter(
    (r) => r.homeTeamId && r.awayTeamId && r.homeTeamId !== r.awayTeamId && r.kickoff
  );

  const createMatchesMut = useMutation({
    mutationFn: () => {
      const matches: MatchInput[] = validRows.map((r) => ({
        homeTeamId: r.homeTeamId,
        awayTeamId: r.awayTeamId,
        kickoffAt: new Date(r.kickoff).toISOString(),
        ...(r.venueId ? { venueId: r.venueId } : {}),
        ...(r.referee.trim() ? { referee: r.referee.trim() } : {}),
        // Per-fixture group override, so one call can cover several groups.
        ...(r.groupId && r.groupId !== groupId ? { groupId: r.groupId } : {}),
      }));
      return createMatchesBulk({
        seasonId,
        round: round.trim() || activeStage?.name || 'Round',
        // Knockout fixtures pass a stage only; group fixtures add the group.
        ...(stageId ? { stageId } : {}),
        ...(groupId ? { groupId } : {}),
        matches,
      });
    },
    onSuccess: () => {
      toast.success('Fixtures created');
      setRows([{ ...emptyRow }]);
      qc.invalidateQueries({ queryKey: ['football', 'matches', seasonId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to create fixtures')),
  });

  if (!seasonId) {
    return (
      <div className={`${cardClass} p-8 text-center`}>
        <CalendarDays className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a competition and season above to manage fixtures.
        </p>
      </div>
    );
  }

  const teamName = (id: string, fallback?: Team) =>
    teamMap.get(id)?.name ?? fallback?.name ?? id;

  return (
    <div className="space-y-6">
      {/* Bulk add fixtures */}
      <section className={`${cardClass} p-5`}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Add matchday fixtures
        </h2>
        {teams.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No teams enrolled in {season?.name ?? 'this season'} yet. Enroll teams in the Setup tab first.
          </p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-3">
              <div className="max-w-xs flex-1 min-w-[10rem]">
                <label className={labelClass}>
                  Round {isKnockoutStage && <span className="text-gray-400">(optional)</span>}
                </label>
                <input
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  placeholder={isKnockoutStage ? activeStage?.name ?? 'e.g. Semi-final' : 'e.g. Matchday 1'}
                  className={inputClass}
                />
              </div>
              {stages.length > 0 && (
                <>
                  <div className="max-w-xs flex-1 min-w-[10rem]">
                    <label className={labelClass}>Stage</label>
                    <select
                      value={stageId}
                      onChange={(e) => {
                        setStageId(e.target.value);
                        setGroupId('');
                        setRows((rs) => rs.map((r) => ({ ...r, groupId: '' })));
                      }}
                      className={inputClass}
                    >
                      <option value="">No stage (league)</option>
                      {stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.type}
                        </option>
                      ))}
                    </select>
                  </div>
                  {stageGroups.length > 0 && (
                    <div className="max-w-xs flex-1 min-w-[10rem]">
                      <label className={labelClass}>Group</label>
                      <select
                        value={groupId}
                        onChange={(e) => {
                          setGroupId(e.target.value);
                          setRows((rs) => rs.map((r) => ({ ...r, groupId: '' })));
                        }}
                        className={inputClass}
                      >
                        <option value="">Per-fixture (set below)</option>
                        {stageGroups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  {/* Per-fixture group — only when a group stage is selected and
                      no single group was chosen above. */}
                  {stageGroups.length > 0 && !groupId && (
                    <select
                      value={row.groupId}
                      onChange={(e) =>
                        setRows((rs) =>
                          rs.map((r, j) =>
                            j === i
                              ? { ...r, groupId: e.target.value, homeTeamId: '', awayTeamId: '' }
                              : r
                          )
                        )
                      }
                      className={`${inputClass} w-32`}
                    >
                      <option value="">Group…</option>
                      {stageGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <select
                    value={row.homeTeamId}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r, j) => (j === i ? { ...r, homeTeamId: e.target.value } : r)))
                    }
                    className={`${inputClass} flex-1 min-w-[140px]`}
                  >
                    <option value="">Home team…</option>
                    {teamsForRow(row).map((t: Team) => (
                      <option key={t.id} value={t.id} disabled={t.id === row.awayTeamId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-400">vs</span>
                  <select
                    value={row.awayTeamId}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r, j) => (j === i ? { ...r, awayTeamId: e.target.value } : r)))
                    }
                    className={`${inputClass} flex-1 min-w-[140px]`}
                  >
                    <option value="">Away team…</option>
                    {teamsForRow(row).map((t: Team) => (
                      <option key={t.id} value={t.id} disabled={t.id === row.homeTeamId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    value={row.kickoff}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r, j) => (j === i ? { ...r, kickoff: e.target.value } : r)))
                    }
                    className={`${inputClass} w-52`}
                  />
                  <select
                    value={row.venueId}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r, j) => (j === i ? { ...r, venueId: e.target.value } : r)))
                    }
                    className={`${inputClass} w-40`}
                  >
                    <option value="">Venue (opt)…</option>
                    {venues.map((v: Venue) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={row.referee}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r, j) => (j === i ? { ...r, referee: e.target.value } : r)))
                    }
                    placeholder="Referee (opt)"
                    className={`${inputClass} w-36`}
                  />
                  <button
                    type="button"
                    onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                    disabled={rows.length === 1}
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRows((rs) => [...rs, { ...emptyRow }])}
                className={ghostBtn}
              >
                <Plus className="h-4 w-4" /> Add fixture
              </button>
              <button
                type="button"
                disabled={!validRows.length || (!round.trim() && !isKnockoutStage) || createMatchesMut.isPending}
                onClick={() => createMatchesMut.mutate()}
                className={primaryBtn}
              >
                {createMatchesMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Save {validRows.length || ''} fixtures
              </button>
            </div>
          </>
        )}
      </section>

      {/* Matches list + score updater */}
      <section className={`${cardClass} p-5`}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          Matches & live scores
        </h2>
        {matchesQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : allMatches.length === 0 ? (
          <p className="text-sm text-gray-400">No matches scheduled for this season yet.</p>
        ) : (
          <>
            {/* Filter by day — same date nav as the menyesha scores board.
                Defaults to today so score/event updates land on the games
                actually being played. */}
            <div className="mb-4 flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => pickDate(shiftKey(dateFilter, -1))}
                className={navBtn}
                aria-label="Yesterday"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => pickDate(todayKey())}
                title="Return to today"
                className={`px-2.5 py-2 rounded-lg text-xs font-medium min-w-[64px] whitespace-nowrap text-center transition-colors ${
                  navIsToday && !showAll
                    ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {navLabel}
              </button>
              <button
                type="button"
                onClick={() => pickDate(shiftKey(dateFilter, 1))}
                className={navBtn}
                aria-label="Tomorrow"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <DatePickerButton
                date={dateFilter}
                onChange={pickDate}
                dateLocale="en"
                btn={navBtn}
                todayLabel="Today"
              />
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  showAll
                    ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All dates
              </button>
              <span className="ml-auto text-xs text-gray-400">
                {showAll
                  ? `${allMatches.length} total`
                  : `${matchesForDate.length} on ${prettyKey(dateFilter)}`}
              </span>
            </div>

            {matchesForDate.length === 0 ? (
              <p className="text-sm text-gray-400">
                No matches on {prettyKey(dateFilter)}. Use the arrows, pick another date, or “All
                dates”.
              </p>
            ) : (
              <div className="space-y-2">
                {matchesForDate.map((m: Match) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    homeName={teamName(m.homeTeamId, m.homeTeam)}
                    awayName={teamName(m.awayTeamId, m.awayTeam)}
                    homeTeam={teamMap.get(m.homeTeamId) ?? m.homeTeam ?? null}
                    awayTeam={teamMap.get(m.awayTeamId) ?? m.awayTeam ?? null}
                    competitionLabel={competitionLabel}
                    venues={venues}
                    onSaved={() =>
                      qc.invalidateQueries({ queryKey: ['football', 'matches', seasonId] })
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function MatchRow({
  match,
  homeName,
  awayName,
  homeTeam,
  awayTeam,
  competitionLabel,
  venues,
  onSaved,
}: {
  match: Match;
  homeName: string;
  awayName: string;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  competitionLabel?: string;
  venues: Venue[];
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<MatchStatus>(match.status ?? 'Scheduled');
  const [home, setHome] = useState<string>(match.homeScore != null ? String(match.homeScore) : '');
  const [away, setAway] = useState<string>(match.awayScore != null ? String(match.awayScore) : '');
  const [venueId, setVenueId] = useState<string>(
    match.venueId ?? (match.venue as any)?.id ?? ''
  );
  const [referee, setReferee] = useState<string>(match.referee ?? '');
  const [homePens, setHomePens] = useState<string>(
    match.homePenalties != null ? String(match.homePenalties) : ''
  );
  const [awayPens, setAwayPens] = useState<string>(
    match.awayPenalties != null ? String(match.awayPenalties) : ''
  );
  const [afterExtraTime, setAfterExtraTime] = useState<boolean>(!!match.afterExtraTime);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showLineups, setShowLineups] = useState(false);
  const [showGraphic, setShowGraphic] = useState(false);

  // Shootout tally only applies to knockout ties. A blank field clears it (null).
  const isKnockout = (match.stage as any)?.type === 'Knockout';
  const pens = (v: string): number | null => (v.trim() === '' ? null : Number(v));

  const saveMut = useMutation({
    mutationFn: () =>
      updateMatch(match.id, {
        status,
        ...(home.trim() ? { homeScore: Number(home) } : {}),
        ...(away.trim() ? { awayScore: Number(away) } : {}),
        // Deliberately NOT sending `minute`: the backend sets the half base
        // (0/45) on the into-Live transition and the public clock counts from
        // liveStartedAt. Sending a stale minute here overrode the auto-45 and
        // made the second half restart from 0.
        ...(venueId ? { venueId } : {}),
        ...(referee.trim() ? { referee: referee.trim() } : {}),
        ...(isKnockout
          ? {
              homePenalties: pens(homePens),
              awayPenalties: pens(awayPens),
              afterExtraTime,
            }
          : {}),
      }),
    onSuccess: () => {
      toast.success('Match updated');
      onSaved();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to update match')),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteMatch(match.id),
    onSuccess: () => {
      toast.success('Match deleted');
      setConfirmDelete(false);
      onSaved();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to delete match')),
  });

  const kickoff = match.kickoffAt
    ? new Date(match.kickoffAt).toLocaleString('en', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const scoreInput =
    'w-12 px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003153] outline-none';

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700">
    {/* The four groups (meta / scoreline / state / actions) stack on mobile;
        `sm:contents` dissolves them back into the original single wrapped row
        from sm up, so the desktop layout is unchanged. */}
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0 sm:contents">
        <span className="text-xs text-gray-400 sm:w-24 shrink-0">{kickoff}</span>
        {(match.stage?.name || match.group?.name) && (
          <span className="shrink-0 truncate rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-300">
            {[match.stage?.name, match.group?.name].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>

      {/* Keeps team–score–score–team on one line at every width. */}
      <div className="flex items-center gap-2 min-w-0 sm:contents">
      <span className="flex-1 min-w-0 sm:min-w-[120px] text-right text-sm font-medium text-gray-900 dark:text-white truncate">
        {homeName}
      </span>
      <input
        type="number"
        min="0"
        value={home}
        onChange={(e) => setHome(e.target.value)}
        className={scoreInput}
        aria-label={`${homeName} score`}
      />
      <span className="text-gray-400">–</span>
      <input
        type="number"
        min="0"
        value={away}
        onChange={(e) => setAway(e.target.value)}
        className={scoreInput}
        aria-label={`${awayName} score`}
      />
      <span className="flex-1 min-w-0 sm:min-w-[120px] text-sm font-medium text-gray-900 dark:text-white truncate">
        {awayName}
      </span>
      </div>

      <div className="flex items-center gap-2 min-w-0 sm:contents">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as MatchStatus)}
        className="min-w-0 flex-1 sm:flex-none px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003153] outline-none"
      >
        {MATCH_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      </div>

      <div className="flex items-center gap-2 sm:contents">
      <button
        type="button"
        onClick={() => saveMut.mutate()}
        disabled={saveMut.isPending}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#003153] hover:bg-[#005F73] text-white text-xs font-medium transition-colors disabled:opacity-50"
      >
        {saveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Save
      </button>
      <button
        type="button"
        onClick={() => setShowEvents((v) => !v)}
        title="Goals, cards & subs"
        aria-expanded={showEvents}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
          showEvents
            ? 'bg-[#003153]/10 dark:bg-[#F59E0B]/10 text-[#003153] dark:text-[#F59E0B]'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <ListPlus className="h-3.5 w-3.5" />
        Events
      </button>
      <button
        type="button"
        onClick={() => setShowLineups((v) => !v)}
        title="Starting XI & bench"
        aria-expanded={showLineups}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
          showLineups
            ? 'bg-[#003153]/10 dark:bg-[#F59E0B]/10 text-[#003153] dark:text-[#F59E0B]'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Users className="h-3.5 w-3.5" />
        Lineups
      </button>
      <button
        type="button"
        onClick={() => setShowGraphic(true)}
        title="Download shareable result graphic"
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <ImageDown className="h-3.5 w-3.5" />
        Graphic
      </button>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        disabled={deleteMut.isPending}
        title="Delete match"
        aria-label="Delete match"
        className="ml-auto sm:ml-0 shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
      >
        {deleteMut.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete match?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {homeName} vs {awayName}? This removes the fixture and any recorded
              score. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMut.mutate()}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

      {/* Venue */}
      <div className="flex flex-wrap items-center gap-2 px-3 pb-2.5 -mt-1">
        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        <select
          value={venueId}
          onChange={(e) => setVenueId(e.target.value)}
          className="min-w-0 flex-1 sm:flex-none sm:max-w-[16rem] px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003153] outline-none"
        >
          <option value="">No venue</option>
          {venues.map((v: Venue) => (
            <option key={v.id} value={v.id}>
              {v.name}
              {v.city ? ` · ${v.city}` : ''}
            </option>
          ))}
        </select>
        <input
          value={referee}
          onChange={(e) => setReferee(e.target.value)}
          placeholder="Referee"
          className="min-w-0 flex-1 sm:flex-none sm:max-w-[12rem] px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003153] outline-none"
        />

        {/* Penalty shootout — knockout ties only. Doesn't change the scoreline. */}
        {isKnockout && (
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <span className="text-[11px] text-gray-400">Pens</span>
            <input
              type="number"
              min="0"
              value={homePens}
              onChange={(e) => setHomePens(e.target.value)}
              placeholder="H"
              title={`${homeName} shootout`}
              className="w-11 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003153] outline-none"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              min="0"
              value={awayPens}
              onChange={(e) => setAwayPens(e.target.value)}
              placeholder="A"
              title={`${awayName} shootout`}
              className="w-11 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003153] outline-none"
            />
            <label className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={afterExtraTime}
                onChange={(e) => setAfterExtraTime(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#003153]"
              />
              AET
            </label>
          </span>
        )}

        <span className="text-[11px] text-gray-400">Save to apply</span>
      </div>

      {showEvents && (
        <div className="px-3 pb-3">
          <MatchEventsPanel match={match} homeName={homeName} awayName={awayName} />
        </div>
      )}
      {showLineups && (
        <div className="px-3 pb-3">
          <MatchLineupsPanel match={match} homeName={homeName} awayName={awayName} />
        </div>
      )}

      {showGraphic && (
        <MatchGraphicModal
          match={match}
          homeName={homeName}
          awayName={awayName}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          competitionLabel={competitionLabel}
          onClose={() => setShowGraphic(false)}
        />
      )}
    </div>
  );
}
