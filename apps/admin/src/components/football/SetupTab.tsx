'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCompetition,
  createSeason,
  updateSeason,
  createTeamsBulk,
  updateTeam,
  deleteTeam,
  createVenuesBulk,
  addSeasonEntries,
  removeSeasonEntry,
  getTeams,
  getVenues,
  getSeasons,
  getSeasonEntries,
  getCompetitions,
  uploadMedia,
  COMPETITION_TYPES,
  type Team,
  type Venue,
  type Season,
  type Competition,
  type VenueInput,
} from '@org/api';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Upload, MapPin, X, Power, PowerOff, Pencil } from 'lucide-react';
import { EditTeamModal } from './EditTeamModal';
import { EditCompetitionModal } from './EditCompetitionModal';
import { EditVenueModal } from './EditVenueModal';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { cardClass, inputClass, primaryBtn, ghostBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

// "APR FC" -> "APR", "Rayon Sports" -> "RAY"
function deriveShort(name?: string): string {
  return (name ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
}

function teamInitials(t: { shortName?: string; name?: string }): string {
  return (t.shortName?.trim() || deriveShort(t.name) || (t.name ?? '').slice(0, 2)).toUpperCase();
}

// GET may return the logo as a url string or a media object; create sends a media id.
function resolveLogoUrl(t: Team): string | null {
  if (t.logoUrl) return t.logoUrl;
  const l = t.logo;
  if (!l) return null;
  if (typeof l === 'string') return l.startsWith('http') ? l : null;
  return l.url ?? null;
}

type TeamRow = {
  name: string;
  shortName: string;
  city: string;
  logo?: string; // media id
  logoUrl?: string; // local preview
  uploading?: boolean;
};

export function SetupTab({
  competitionId,
  seasonId,
}: {
  competitionId: string;
  seasonId: string;
}) {
  const qc = useQueryClient();

  /* ----------------------------- Competitions ---------------------------- */
  const competitionsQuery = useQuery({
    queryKey: ['football', 'competitions'],
    queryFn: getCompetitions,
  });
  const [competitionName, setCompetitionName] = useState('');
  const [competitionType, setCompetitionType] = useState<string>('League');
  const [editComp, setEditComp] = useState<Competition | null>(null);
  const createCompetitionMut = useMutation({
    mutationFn: () =>
      createCompetition({
        name: competitionName.trim(),
        ...(competitionType ? { type: competitionType } : {}),
      }),
    onSuccess: () => {
      toast.success('Competition created');
      setCompetitionName('');
      qc.invalidateQueries({ queryKey: ['football', 'competitions'] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to create competition')),
  });

  /* ------------------------------- Seasons ------------------------------- */
  // Seasons for the top-selected competition — used by the enrolled-teams label.
  const seasonsQuery = useQuery({
    queryKey: ['football', 'seasons', competitionId],
    queryFn: () => getSeasons(competitionId || undefined),
    enabled: !!competitionId,
  });
  // The Seasons form has its own competition picker (defaults to the top scope).
  const [seasonCompId, setSeasonCompId] = useState(competitionId);
  const seasonFormQuery = useQuery({
    queryKey: ['football', 'seasons', seasonCompId],
    queryFn: () => getSeasons(seasonCompId || undefined),
    enabled: !!seasonCompId,
  });
  const [seasonName, setSeasonName] = useState('');
  const [seasonIsCurrent, setSeasonIsCurrent] = useState(true);
  const createSeasonMut = useMutation({
    mutationFn: () =>
      createSeason({
        competitionId: seasonCompId,
        name: seasonName.trim(),
        isCurrent: seasonIsCurrent,
      }),
    onSuccess: () => {
      toast.success('Season created');
      setSeasonName('');
      qc.invalidateQueries({ queryKey: ['football', 'seasons', seasonCompId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to create season')),
  });

  /* -------------------------------- Teams -------------------------------- */
  const teamsQuery = useQuery({ queryKey: ['football', 'teams'], queryFn: () => getTeams() });
  const existingTeamNames = useMemo(
    () => new Set((teamsQuery.data ?? []).map((t) => t.name.trim().toLowerCase())),
    [teamsQuery.data]
  );
  const [teamRows, setTeamRows] = useState<TeamRow[]>([{ name: '', shortName: '', city: '' }]);
  const anyUploading = teamRows.some((r) => r.uploading);
  // Non-empty rows that aren't already in the DB and aren't duplicated in the form.
  const validTeams = useMemo(() => {
    const seen = new Set<string>();
    return teamRows.filter((r) => {
      const n = r.name.trim().toLowerCase();
      if (!n || existingTeamNames.has(n) || seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }, [teamRows, existingTeamNames]);

  const uploadLogo = async (index: number, file: File) => {
    setTeamRows((rs) => rs.map((r, j) => (j === index ? { ...r, uploading: true } : r)));
    try {
      const media = await uploadMedia(file);
      // Logos take the plain URL (not a media id) — matches the avatar/category
      // convention, unlike FuelPrice.sourceFileId.
      setTeamRows((rs) =>
        rs.map((r, j) =>
          j === index ? { ...r, logo: media.url, logoUrl: media.url, uploading: false } : r
        )
      );
    } catch {
      toast.error('Logo upload failed');
      setTeamRows((rs) => rs.map((r, j) => (j === index ? { ...r, uploading: false } : r)));
    }
  };

  const createTeamsMut = useMutation({
    mutationFn: () =>
      createTeamsBulk({
        teams: validTeams.map((r) => ({
          name: r.name.trim(),
          shortName: r.shortName?.trim() || deriveShort(r.name),
          ...(r.city?.trim() ? { city: r.city.trim() } : {}),
          ...(r.logo ? { logo: r.logo } : {}),
        })),
      }),
    onSuccess: () => {
      toast.success('Teams created');
      setTeamRows([{ name: '', shortName: '', city: '' }]);
      qc.invalidateQueries({ queryKey: ['football', 'teams'] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to create teams')),
  });

  /* ------------------------------- Venues -------------------------------- */
  const venuesQuery = useQuery({ queryKey: ['football', 'venues'], queryFn: getVenues });
  const existingVenueNames = useMemo(
    () => new Set((venuesQuery.data ?? []).map((v) => v.name.trim().toLowerCase())),
    [venuesQuery.data]
  );
  type VenueRow = { name: string; city: string; country: string; capacity: string };
  const newVenueRow = (): VenueRow => ({ name: '', city: '', country: 'Rwanda', capacity: '' });
  const [venueRows, setVenueRows] = useState<VenueRow[]>([newVenueRow()]);
  const validVenues = useMemo(() => {
    const seen = new Set<string>();
    return venueRows.filter((r) => {
      const n = r.name.trim().toLowerCase();
      if (!n || existingVenueNames.has(n) || seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }, [venueRows, existingVenueNames]);
  const createVenuesMut = useMutation({
    mutationFn: () => {
      const venues: VenueInput[] = validVenues.map((r) => ({
        name: r.name.trim(),
        ...(r.city.trim() ? { city: r.city.trim() } : {}),
        ...(r.country.trim() ? { country: r.country.trim() } : {}),
        ...(r.capacity.trim() ? { capacity: Number(r.capacity) } : {}),
      }));
      return createVenuesBulk({ venues });
    },
    onSuccess: () => {
      toast.success('Venues created');
      setVenueRows([newVenueRow()]);
      qc.invalidateQueries({ queryKey: ['football', 'venues'] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to create venues')),
  });

  /* --------------------------- Season entries ---------------------------- */
  const entriesQuery = useQuery({
    queryKey: ['football', 'entries', seasonId],
    queryFn: () => getSeasonEntries(seasonId),
    enabled: !!seasonId,
  });
  const enrolledIds = new Set((entriesQuery.data ?? []).map((t) => t.id));
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const addEntriesMut = useMutation({
    mutationFn: () => addSeasonEntries(seasonId, { teamIds: selectedTeamIds }),
    onSuccess: () => {
      toast.success('Teams enrolled in season');
      setSelectedTeamIds([]);
      qc.invalidateQueries({ queryKey: ['football', 'entries', seasonId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to enroll teams')),
  });

  const [removeEntryTarget, setRemoveEntryTarget] = useState<{
    teamId: string;
    name: string;
  } | null>(null);
  const removeEntryMut = useMutation({
    mutationFn: (teamId: string) => removeSeasonEntry(seasonId, teamId),
    onSuccess: () => {
      toast.success('Team unrolled from season');
      setRemoveEntryTarget(null);
      qc.invalidateQueries({ queryKey: ['football', 'entries', seasonId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to unroll team')),
  });

  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<{
    teamId: string;
    name: string;
  } | null>(null);
  const deleteTeamMut = useMutation({
    mutationFn: (teamId: string) => deleteTeam(teamId),
    onSuccess: () => {
      toast.success('Team deleted');
      setDeleteTeamTarget(null);
      qc.invalidateQueries({ queryKey: ['football', 'teams'] });
      qc.invalidateQueries({ queryKey: ['football', 'entries', seasonId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to delete team')),
  });

  // Active/Inactive visibility: default to the usable (active) teams.
  const [teamFilter, setTeamFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const toggleTeamMut = useMutation({
    mutationFn: ({ teamId, isActive }: { teamId: string; isActive: boolean }) =>
      updateTeam(teamId, { isActive }),
    onSuccess: (_data, vars) => {
      toast.success(vars.isActive ? 'Team activated' : 'Team deactivated');
      qc.invalidateQueries({ queryKey: ['football', 'teams'] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to update team')),
  });

  // A team counts as active unless explicitly flagged false.
  const isTeamActive = (t: Team) => t.isActive !== false;
  const allTeams = teamsQuery.data ?? [];
  const activeCount = allTeams.filter(isTeamActive).length;
  const inactiveCount = allTeams.length - activeCount;
  const visibleTeams = allTeams.filter((t) =>
    teamFilter === 'all' ? true : teamFilter === 'active' ? isTeamActive(t) : !isTeamActive(t)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Competitions */}
      <section className={`${cardClass} p-5`}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Competitions</h2>
        <div className="flex gap-2">
          <input
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            placeholder="e.g. BK Pro League"
            className={inputClass}
          />
          <select
            value={competitionType}
            onChange={(e) => setCompetitionType(e.target.value)}
            className={`${inputClass} w-28`}
          >
            {COMPETITION_TYPES.map((tp) => (
              <option key={tp} value={tp}>
                {tp}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!competitionName.trim() || createCompetitionMut.isPending}
            onClick={() => createCompetitionMut.mutate()}
            className={primaryBtn}
          >
            {createCompetitionMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-gray-400">
          Add a logo, country or rename via the edit button. Cups can have stages &amp; groups.
        </p>

        {competitionsQuery.isLoading ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (competitionsQuery.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">No competitions yet</p>
        ) : (
          <ul className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {(competitionsQuery.data ?? []).map((c: Competition) => {
              const url = typeof c.logo === 'string' && c.logo.startsWith('http') ? c.logo : null;
              return (
                <li key={c.id} className="group flex items-center gap-2.5 px-3 py-2 text-sm">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="h-7 w-7 rounded-full object-cover bg-white shrink-0" />
                  ) : (
                    <span className="h-7 w-7 rounded-full bg-[#003153] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      {teamInitials({ name: c.name })}
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-gray-900 dark:text-white">{c.name}</span>
                    {(c.type || c.country) && (
                      <span className="block truncate text-[11px] text-gray-400">
                        {[c.type, c.country].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditComp(c)}
                    title="Edit competition"
                    className="shrink-0 p-1 rounded-md text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Seasons */}
      <section className={`${cardClass} p-5`}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Seasons</h2>
        {/* Competition picker for the season being created */}
        <select
          value={seasonCompId}
          onChange={(e) => setSeasonCompId(e.target.value)}
          className={`${inputClass} mb-2.5`}
        >
          <option value="">Select competition…</option>
          {(competitionsQuery.data ?? []).map((c: Competition) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {!seasonCompId ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pick a competition above to add a season to it.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={seasonName}
                onChange={(e) => setSeasonName(e.target.value)}
                placeholder="e.g. 2026-2027"
                className={`${inputClass} flex-1 min-w-[140px]`}
              />
              <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={seasonIsCurrent}
                  onChange={(e) => setSeasonIsCurrent(e.target.checked)}
                  className="h-4 w-4 accent-[#003153]"
                />
                Current
              </label>
              <button
                type="button"
                disabled={!seasonName.trim() || createSeasonMut.isPending}
                onClick={() => createSeasonMut.mutate()}
                className={primaryBtn}
              >
                {createSeasonMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add
              </button>
            </div>
            {seasonFormQuery.isLoading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (seasonFormQuery.data ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">No seasons yet</p>
            ) : (
              <ul className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {(seasonFormQuery.data ?? []).map((s: Season) => (
                  <SeasonRow
                    key={s.id}
                    season={s}
                    onChanged={() =>
                      qc.invalidateQueries({ queryKey: ['football', 'seasons'] })
                    }
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* Teams */}
      <section className={`${cardClass} p-5 lg:col-span-2`}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Teams</h2>
          <span className="text-xs text-gray-400">
            {(teamsQuery.data ?? []).length} in database
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Add each club once. The short code auto-fills from the name — override it if you like.
        </p>

        {/* Column labels */}
        <div className="hidden sm:grid grid-cols-[2.75rem_1fr_5.5rem_10rem_2.5rem] gap-2 px-1 mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
          <span>Crest</span>
          <span>Club name</span>
          <span>Short</span>
          <span>City</span>
          <span />
        </div>

        <div className="space-y-2">
          {teamRows.map((row, i) => {
            const n = row.name.trim().toLowerCase();
            const dupExisting = !!n && existingTeamNames.has(n);
            const dupInForm =
              !!n && teamRows.filter((r) => r.name.trim().toLowerCase() === n).length > 1;
            const warn = dupExisting || dupInForm;
            return (
              <div
                key={i}
                className="grid grid-cols-[2.75rem_1fr_5.5rem_10rem_2.5rem] gap-2 items-start"
              >
                {/* Crest upload */}
                <label
                  title="Upload crest"
                  className="mt-0.5 h-10 w-10 shrink-0 cursor-pointer rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden hover:border-[#003153] dark:hover:border-[#F59E0B] transition-colors"
                >
                  {row.uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : row.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 text-gray-400" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadLogo(i, f);
                      e.target.value = '';
                    }}
                  />
                </label>
                <div>
                  <input
                    value={row.name}
                    onChange={(e) =>
                      setTeamRows((rs) => rs.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
                    }
                    placeholder="e.g. APR FC"
                    className={`${inputClass} ${warn ? 'border-amber-400 dark:border-amber-500' : ''}`}
                  />
                  {warn && (
                    <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-500">
                      {dupExisting ? 'Already in database — will be skipped' : 'Duplicate row'}
                    </p>
                  )}
                </div>
                <input
                  value={row.shortName ?? ''}
                  onChange={(e) =>
                    setTeamRows((rs) =>
                      rs.map((r, j) => (j === i ? { ...r, shortName: e.target.value } : r))
                    )
                  }
                  placeholder={deriveShort(row.name) || 'ABC'}
                  maxLength={5}
                  className={`${inputClass} uppercase`}
                />
                <input
                  value={row.city ?? ''}
                  onChange={(e) =>
                    setTeamRows((rs) => rs.map((r, j) => (j === i ? { ...r, city: e.target.value } : r)))
                  }
                  placeholder="City"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() =>
                    setTeamRows((rs) => (rs.length === 1 ? rs : rs.filter((_, j) => j !== i)))
                  }
                  disabled={teamRows.length === 1}
                  className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setTeamRows((rs) => [...rs, { name: '', shortName: '', city: '' }])}
            className={ghostBtn}
          >
            <Plus className="h-4 w-4" /> Add row
          </button>
          <button
            type="button"
            disabled={!validTeams.length || createTeamsMut.isPending || anyUploading}
            onClick={() => createTeamsMut.mutate()}
            className={primaryBtn}
          >
            {createTeamsMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Save {validTeams.length || ''} teams
          </button>
        </div>

        {/* Existing teams as crest cards */}
        <div className="mt-5 border-t border-gray-100 dark:border-gray-700 pt-4">
          {/* Active / Inactive / All segmented filter */}
          {allTeams.length > 0 && (
            <div className="mb-3 inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 text-xs">
              {(
                [
                  ['active', 'Active', activeCount],
                  ['inactive', 'Inactive', inactiveCount],
                  ['all', 'All', allTeams.length],
                ] as const
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTeamFilter(key)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    teamFilter === key
                      ? 'bg-[#003153] text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {label}
                  <span
                    className={`ml-1.5 ${teamFilter === key ? 'text-white/70' : 'text-gray-400'}`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}
          {teamsQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : allTeams.length === 0 ? (
            <p className="text-sm text-gray-400">No teams yet</p>
          ) : visibleTeams.length === 0 ? (
            <p className="text-sm text-gray-400">
              {teamFilter === 'inactive' ? 'No inactive teams.' : 'No active teams.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {visibleTeams.map((t: Team) => {
                const logoUrl = resolveLogoUrl(t);
                const active = isTeamActive(t);
                return (
                <div
                  key={t.id}
                  className={`group flex items-center gap-2.5 rounded-lg border p-2 transition-colors ${
                    active
                      ? 'border-gray-200 dark:border-gray-700'
                      : 'border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/60 dark:bg-gray-800/40'
                  }`}
                >
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      className={`h-8 w-8 shrink-0 rounded-full object-cover bg-white ${
                        active ? '' : 'grayscale opacity-60'
                      }`}
                    />
                  ) : (
                    <span
                      className={`h-8 w-8 shrink-0 rounded-full text-white text-[11px] font-bold flex items-center justify-center ${
                        active ? 'bg-[#003153]' : 'bg-gray-400 dark:bg-gray-600'
                      }`}
                    >
                      {teamInitials(t)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-medium ${
                        active
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {t.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {active ? (
                        <>
                          {t.shortName || deriveShort(t.name)}
                          {t.city ? ` · ${t.city}` : ''}
                        </>
                      ) : (
                        'Inactive'
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleTeamMut.mutate({ teamId: t.id, isActive: !active })}
                    disabled={toggleTeamMut.isPending}
                    title={active ? 'Deactivate team' : 'Activate team'}
                    className={`shrink-0 p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                      active
                        ? 'text-gray-300 dark:text-gray-600 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 opacity-0 group-hover:opacity-100 focus:opacity-100'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    }`}
                  >
                    {active ? (
                      <PowerOff className="h-3.5 w-3.5" />
                    ) : (
                      <Power className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTeam(t)}
                    title="Edit team"
                    className="shrink-0 p-1.5 rounded-md text-gray-300 dark:text-gray-600 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTeamTarget({ teamId: t.id, name: t.name })}
                    title="Delete team"
                    className="shrink-0 p-1.5 rounded-md text-gray-300 dark:text-gray-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Venues */}
      <section className={`${cardClass} p-5 lg:col-span-2`}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Venues</h2>
          <span className="text-xs text-gray-400">
            {(venuesQuery.data ?? []).length} in database
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Add stadiums once; they can then be attached to fixtures. Country defaults to Rwanda.
        </p>

        {/* Column labels */}
        <div className="hidden sm:grid grid-cols-[1fr_9rem_8rem_7rem_2.5rem] gap-2 px-1 mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
          <span>Venue name</span>
          <span>City</span>
          <span>Country</span>
          <span>Capacity</span>
          <span />
        </div>

        <div className="space-y-2">
          {venueRows.map((row, i) => {
            const n = row.name.trim().toLowerCase();
            const dupExisting = !!n && existingVenueNames.has(n);
            const dupInForm =
              !!n && venueRows.filter((r) => r.name.trim().toLowerCase() === n).length > 1;
            const warn = dupExisting || dupInForm;
            return (
              <div
                key={i}
                className="grid grid-cols-[1fr_9rem_8rem_7rem_2.5rem] gap-2 items-start"
              >
                <div>
                  <input
                    value={row.name}
                    onChange={(e) =>
                      setVenueRows((rs) => rs.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
                    }
                    placeholder="e.g. Amahoro Stadium"
                    className={`${inputClass} ${warn ? 'border-amber-400 dark:border-amber-500' : ''}`}
                  />
                  {warn && (
                    <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-500">
                      {dupExisting ? 'Already in database — will be skipped' : 'Duplicate row'}
                    </p>
                  )}
                </div>
                <input
                  value={row.city}
                  onChange={(e) =>
                    setVenueRows((rs) => rs.map((r, j) => (j === i ? { ...r, city: e.target.value } : r)))
                  }
                  placeholder="City"
                  className={inputClass}
                />
                <input
                  value={row.country}
                  onChange={(e) =>
                    setVenueRows((rs) => rs.map((r, j) => (j === i ? { ...r, country: e.target.value } : r)))
                  }
                  placeholder="Country"
                  className={inputClass}
                />
                <input
                  type="number"
                  min="0"
                  value={row.capacity}
                  onChange={(e) =>
                    setVenueRows((rs) =>
                      rs.map((r, j) => (j === i ? { ...r, capacity: e.target.value } : r))
                    )
                  }
                  placeholder="—"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() =>
                    setVenueRows((rs) => (rs.length === 1 ? rs : rs.filter((_, j) => j !== i)))
                  }
                  disabled={venueRows.length === 1}
                  className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setVenueRows((rs) => [...rs, newVenueRow()])}
            className={ghostBtn}
          >
            <Plus className="h-4 w-4" /> Add row
          </button>
          <button
            type="button"
            disabled={!validVenues.length || createVenuesMut.isPending}
            onClick={() => createVenuesMut.mutate()}
            className={primaryBtn}
          >
            {createVenuesMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Save {validVenues.length || ''} venues
          </button>
        </div>

        {/* Existing venues as cards */}
        <div className="mt-5 border-t border-gray-100 dark:border-gray-700 pt-4">
          {venuesQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (venuesQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">No venues yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {(venuesQuery.data ?? []).map((v: Venue) => (
                <div
                  key={v.id}
                  className="group flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 p-2"
                >
                  <span className="h-8 w-8 shrink-0 rounded-full bg-[#005F73] text-white flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {v.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {[v.city, v.country].filter(Boolean).join(', ')}
                      {v.capacity ? ` · ${v.capacity.toLocaleString()}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditVenue(v)}
                    title="Edit venue"
                    aria-label={`Edit ${v.name}`}
                    className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Season entries */}
      <section className={`${cardClass} p-5 lg:col-span-2`}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Teams in season
          </h2>
          {seasonId && (
            <span className="text-xs text-gray-400">
              {(entriesQuery.data ?? []).length} enrolled
            </span>
          )}
        </div>
        {!seasonId ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select a competition and season above to enroll teams.
          </p>
        ) : (
          <>
            {/* Currently enrolled */}
            <div className="mb-5">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                Enrolled in{' '}
                {[
                  (competitionsQuery.data ?? []).find((c) => c.id === competitionId)?.name,
                  (seasonsQuery.data ?? []).find((s) => s.id === seasonId)?.name,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'this season'}
              </p>
              {entriesQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (entriesQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">No teams enrolled yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(entriesQuery.data ?? []).map((t: Team) => {
                    const url = resolveLogoUrl(t);
                    return (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 py-1 pl-1 pr-2"
                      >
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="" className="h-6 w-6 rounded-full object-cover bg-white" />
                        ) : (
                          <span className="h-6 w-6 rounded-full bg-[#003153] text-white text-[9px] font-bold flex items-center justify-center">
                            {teamInitials(t)}
                          </span>
                        )}
                        <span className="text-sm text-gray-900 dark:text-white">{t.name}</span>
                        <button
                          type="button"
                          onClick={() => setRemoveEntryTarget({ teamId: t.id, name: t.name })}
                          title="Unroll team from season"
                          className="p-0.5 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add teams not yet enrolled */}
            {(() => {
              // Only active teams can be enrolled into a season.
              const available = allTeams.filter((t) => !enrolledIds.has(t.id) && isTeamActive(t));
              return (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                    Add teams
                  </p>
                  {available.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      {activeCount === 0
                        ? 'No active teams available. Activate a team below to enroll it.'
                        : `All ${activeCount} active teams are enrolled.`}
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {available.map((t: Team) => {
                          const checked = selectedTeamIds.includes(t.id);
                          return (
                            <label
                              key={t.id}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                                checked
                                  ? 'border-[#003153] bg-[#003153]/5 text-gray-900 dark:text-white'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setSelectedTeamIds((ids) =>
                                    e.target.checked
                                      ? [...ids, t.id]
                                      : ids.filter((id) => id !== t.id)
                                  )
                                }
                                className="h-4 w-4 accent-[#003153]"
                              />
                              <span className="truncate">{t.name}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          disabled={!selectedTeamIds.length || addEntriesMut.isPending}
                          onClick={() => addEntriesMut.mutate()}
                          className={primaryBtn}
                        >
                          {addEntriesMut.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          Enroll {selectedTeamIds.length || ''} teams
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </section>

      <AlertDialog
        open={!!removeEntryTarget}
        onOpenChange={(open) => !open && setRemoveEntryTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unroll team from season?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {removeEntryTarget?.name} from this season? Its squad and any matches for this
              season may be affected. The team record itself is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeEntryTarget && removeEntryMut.mutate(removeEntryTarget.teamId)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Unroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editTeam && <EditTeamModal team={editTeam} onClose={() => setEditTeam(null)} />}
      {editVenue && <EditVenueModal venue={editVenue} onClose={() => setEditVenue(null)} />}
      {editComp && (
        <EditCompetitionModal competition={editComp} onClose={() => setEditComp(null)} />
      )}

      <AlertDialog
        open={!!deleteTeamTarget}
        onOpenChange={(open) => !open && setDeleteTeamTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {deleteTeamTarget?.name}? This removes the team from the database
              along with its squads and season enrollments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTeamTarget && deleteTeamMut.mutate(deleteTeamTarget.teamId)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// One season row: rename inline, or mark it as the current season.
function SeasonRow({ season, onChanged }: { season: Season; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(season.name);

  const mut = useMutation({
    mutationFn: (payload: { name?: string; isCurrent?: boolean }) =>
      updateSeason(season.id, payload),
    onSuccess: () => {
      toast.success('Season updated');
      setEditing(false);
      onChanged();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to update season')),
  });

  return (
    <li className="flex items-center gap-2 px-3 py-2 text-sm">
      {editing ? (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 2026-2027"
            className={`${inputClass} flex-1 py-1`}
          />
          <button
            type="button"
            disabled={!name.trim() || mut.isPending}
            onClick={() => mut.mutate({ name: name.trim() })}
            className="px-2 py-1 rounded-md bg-[#003153] hover:bg-[#005F73] text-white text-xs font-medium disabled:opacity-50"
          >
            {mut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setName(season.name);
            }}
            className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate text-gray-900 dark:text-white">{season.name}</span>
          {season.isCurrent ? (
            <span className="shrink-0 rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              Current
            </span>
          ) : (
            <button
              type="button"
              disabled={mut.isPending}
              onClick={() => mut.mutate({ isCurrent: true })}
              className="shrink-0 text-xs font-medium text-[#003153] dark:text-[#F59E0B] hover:underline disabled:opacity-50"
            >
              Make current
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Rename season"
            className="shrink-0 p-1 rounded-md text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </li>
  );
}

