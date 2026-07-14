'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSeasonEntries,
  getVenues,
  getMatches,
  createMatchesBulk,
  updateMatch,
  MATCH_STATUSES,
  type Team,
  type Venue,
  type Match,
  type MatchStatus,
  type MatchInput,
  type Season,
} from '@org/api';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, CalendarDays, Save } from 'lucide-react';
import { cardClass, inputClass, labelClass, primaryBtn, ghostBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

type FixtureRow = { homeTeamId: string; awayTeamId: string; kickoff: string; venueId: string };
const emptyRow: FixtureRow = { homeTeamId: '', awayTeamId: '', kickoff: '', venueId: '' };

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

  /* ----------------------------- Bulk fixtures --------------------------- */
  const [round, setRound] = useState('Matchday 1');
  const [rows, setRows] = useState<FixtureRow[]>([{ ...emptyRow }]);
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
      }));
      return createMatchesBulk({ seasonId, round: round.trim(), matches });
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
            <div className="mb-3 max-w-xs">
              <label className={labelClass}>Round</label>
              <input
                value={round}
                onChange={(e) => setRound(e.target.value)}
                placeholder="e.g. Matchday 1"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select
                    value={row.homeTeamId}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r, j) => (j === i ? { ...r, homeTeamId: e.target.value } : r)))
                    }
                    className={`${inputClass} flex-1 min-w-[140px]`}
                  >
                    <option value="">Home team…</option>
                    {teams.map((t: Team) => (
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
                    {teams.map((t: Team) => (
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
                disabled={!validRows.length || !round.trim() || createMatchesMut.isPending}
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
        ) : (matchesQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">No matches scheduled for this season yet.</p>
        ) : (
          <div className="space-y-2">
            {(matchesQuery.data ?? []).map((m: Match) => (
              <MatchRow
                key={m.id}
                match={m}
                homeName={teamName(m.homeTeamId, m.homeTeam)}
                awayName={teamName(m.awayTeamId, m.awayTeam)}
                onSaved={() => qc.invalidateQueries({ queryKey: ['football', 'matches', seasonId] })}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MatchRow({
  match,
  homeName,
  awayName,
  onSaved,
}: {
  match: Match;
  homeName: string;
  awayName: string;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<MatchStatus>(match.status ?? 'Scheduled');
  const [home, setHome] = useState<string>(match.homeScore != null ? String(match.homeScore) : '');
  const [away, setAway] = useState<string>(match.awayScore != null ? String(match.awayScore) : '');
  const [minute, setMinute] = useState<string>(match.minute != null ? String(match.minute) : '');

  const saveMut = useMutation({
    mutationFn: () =>
      updateMatch(match.id, {
        status,
        ...(home.trim() ? { homeScore: Number(home) } : {}),
        ...(away.trim() ? { awayScore: Number(away) } : {}),
        ...(minute.trim() ? { minute: Number(minute) } : {}),
      }),
    onSuccess: () => {
      toast.success('Match updated');
      onSaved();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to update match')),
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
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
      <span className="text-xs text-gray-400 w-24 shrink-0">{kickoff}</span>
      <span className="flex-1 min-w-[120px] text-right text-sm font-medium text-gray-900 dark:text-white truncate">
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
      <span className="flex-1 min-w-[120px] text-sm font-medium text-gray-900 dark:text-white truncate">
        {awayName}
      </span>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as MatchStatus)}
        className="px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#003153] outline-none"
      >
        {MATCH_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        type="number"
        min="0"
        max="120"
        value={minute}
        onChange={(e) => setMinute(e.target.value)}
        placeholder="min"
        className={`${scoreInput} w-14`}
        aria-label="Minute"
      />
      <button
        type="button"
        onClick={() => saveMut.mutate()}
        disabled={saveMut.isPending}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#003153] hover:bg-[#005F73] text-white text-xs font-medium transition-colors disabled:opacity-50"
      >
        {saveMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Save
      </button>
    </div>
  );
}
