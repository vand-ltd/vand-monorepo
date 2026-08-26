import api from '../client';

/**
 * Football service.
 *
 * WRITE endpoints below are exactly as implemented on the backend.
 * READ endpoints (getX) are assumed to follow the same REST convention
 * (GET on the collection / resource path). If your GET paths or the
 * response envelope differ, adjust `unwrap` and the GET paths here only.
 */

// Fuel service wraps list payloads as { data: [...] }. Assume the same here,
// but tolerate a bare array/object too.
function unwrap<T>(payload: any): T {
  return (payload && payload.data !== undefined ? payload.data : payload) as T;
}

export type MatchStatus =
  | 'Scheduled'
  | 'Live'
  | 'HalfTime'
  | 'FullTime'
  | 'Postponed'
  | 'Cancelled';

export const MATCH_STATUSES: MatchStatus[] = [
  'Scheduled',
  'Live',
  'HalfTime',
  'FullTime',
  'Postponed',
  'Cancelled',
];

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD';

export const PLAYER_POSITIONS: PlayerPosition[] = ['GK', 'DEF', 'MID', 'FWD'];

// Full-name labels (positions are stored as full names, e.g. "Goalkeeper").
export const PLAYER_POSITION_LABELS: Record<PlayerPosition, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
};

// Normalize a position string (code or full name) to its GK/DEF/MID/FWD code,
// used for pitch grouping/ordering. Returns undefined when unrecognized.
export function normalizePosition(pos?: string | null): PlayerPosition | undefined {
  if (!pos) return undefined;
  const p = pos.trim().toUpperCase();
  if (p === 'GK' || p.startsWith('GOAL')) return 'GK';
  if (p === 'DEF' || p.startsWith('DEF') || p.startsWith('BACK')) return 'DEF';
  if (p === 'MID' || p.startsWith('MID')) return 'MID';
  if (p === 'FWD' || p === 'FW' || p.startsWith('FOR') || p.startsWith('ATT') || p.startsWith('STR'))
    return 'FWD';
  return undefined;
}

export type CompetitionType = 'League' | 'Cup';
export const COMPETITION_TYPES: CompetitionType[] = ['League', 'Cup'];

export interface Competition {
  id: string;
  name: string;
  slug?: string;
  type?: CompetitionType | string;
  country?: string | null;
  logo?: string | null; // plain URL from uploadMedia().url (not a media id)
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Season {
  id: string;
  competitionId: string;
  name: string;
  isCurrent: boolean;
  competition?: Competition;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  slug?: string; // SEO slug for the team profile route (/football/team/:slug)
  name: string;
  shortName?: string;
  city?: string;
  isActive?: boolean;
  logoUrl?: string | null;
  // GET may return the resolved logo as a url string or a media object.
  logo?: string | { url?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Venue {
  id: string;
  name: string;
  city?: string;
  country?: string;
  capacity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Player {
  id: string;
  membershipId?: string; // squad-row id (for DELETE /teams/:id/squad/:membershipId)
  slug?: string; // SEO slug for the player profile route
  name: string;
  shirtNumber?: number;
  position?: PlayerPosition | string;
  nationality?: string;
  teamId?: string;
  photoUrl?: string | null;
  // GET may return the photo as a url string or a media object.
  photo?: string | { url?: string } | null;
}

// Sentinel kickoff for fixtures whose date/time isn't announced yet ("TBD").
// `kickoffAt` is a required timestamp end-to-end, so instead of a nullable field
// we store this recognizable far-future instant and map it to a "TBD" label on
// display. Far-future also sorts TBD fixtures to the end of upcoming lists.
export const TBD_KICKOFF = '2099-12-31T00:00:00.000Z';
const TBD_KICKOFF_MS = new Date(TBD_KICKOFF).getTime();

// True when a kickoff is the TBD sentinel. Compares by instant so it's immune to
// timezone/format differences ("Z" vs "+00:00", ms precision, etc.).
export function isTbdKickoff(iso?: string | null): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && t === TBD_KICKOFF_MS;
}

export interface Match {
  id: string;
  seasonId: string;
  round: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  status: MatchStatus;
  referee?: string | null;
  stageId?: string | null;
  groupId?: string | null;
  stage?: { id: string; name: string; type?: StageType } | null;
  group?: { id: string; name: string } | null;
  homeScore?: number | null;
  awayScore?: number | null;
  // Knockout tie-breaker — the final shootout tally (doesn't change the scoreline).
  homePenalties?: number | null;
  awayPenalties?: number | null;
  afterExtraTime?: boolean | null;
  // Derived on the server: who went through, and how the tie was decided.
  winnerTeamId?: string | null;
  decidedBy?: 'normal' | 'extra_time' | 'penalties' | null;
  minute?: number | null;
  // Real start of the current half (the "whistle"), stamped on each transition
  // into Live — the anchor the live clock counts from. Null until kickoff.
  liveStartedAt?: string | null;
  venueId?: string | null;
  homeTeam?: Team;
  awayTeam?: Team;
  venue?: Venue;
  createdAt?: string;
  updatedAt?: string;
}

// Match event types — exactly the backend's accepted enum.
export type MatchEventType =
  | 'Goal'
  | 'Penalty'
  | 'OwnGoal'
  | 'MissedPenalty'
  | 'YellowCard'
  | 'SecondYellow'
  | 'RedCard'
  | 'Substitution';

export const MATCH_EVENT_TYPES: MatchEventType[] = [
  'Goal',
  'Penalty',
  'OwnGoal',
  'MissedPenalty',
  'YellowCard',
  'SecondYellow',
  'RedCard',
  'Substitution',
];

export interface MatchEventPlayerRef {
  id: string;
  fullName: string;
  slug?: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  teamId: string;
  type: MatchEventType;
  minute: number;
  extraMinute?: number | null;
  playerId?: string | null;
  relatedPlayerId?: string | null;
  note?: string | null;
  team?: { id: string; name: string; shortName?: string; logo?: string | { url?: string } | null };
  player?: MatchEventPlayerRef | null;
  relatedPlayer?: MatchEventPlayerRef | null;
  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  Writes (backend-confirmed)                                                 */
/* -------------------------------------------------------------------------- */

export interface CompetitionInput {
  name: string;
  type?: CompetitionType | string;
  country?: string;
  logo?: string; // upload first, then pass the returned url
  isActive?: boolean;
}

export async function createCompetition(payload: CompetitionInput): Promise<Competition> {
  const { data } = await api.post('/api/tugezo/competitions', payload);
  return unwrap<Competition>(data);
}

// PATCH /api/tugezo/competitions/:id -> partial update. Omitting a field keeps
// it; send logo: null explicitly to clear it.
export async function updateCompetition(
  competitionId: string,
  payload: {
    name?: string;
    type?: CompetitionType | string;
    country?: string | null;
    logo?: string | null;
    isActive?: boolean;
  }
): Promise<Competition> {
  const { data } = await api.patch(`/api/tugezo/competitions/${competitionId}`, payload);
  return unwrap<Competition>(data);
}

export async function createSeason(payload: {
  competitionId: string;
  name: string;
  isCurrent?: boolean;
}): Promise<Season> {
  const { data } = await api.post('/api/tugezo/seasons', payload);
  return unwrap<Season>(data);
}

// PATCH /api/tugezo/seasons/:id -> rename a season or mark it as current.
export async function updateSeason(
  seasonId: string,
  payload: { name?: string; isCurrent?: boolean }
): Promise<Season> {
  const { data } = await api.patch(`/api/tugezo/seasons/${seasonId}`, payload);
  return unwrap<Season>(data);
}

export interface TeamInput {
  name: string;
  shortName?: string;
  city?: string;
  logo?: string; // image URL from uploadMedia().url (plain URL, not a media id)
}

export async function createTeamsBulk(payload: { teams: TeamInput[] }): Promise<Team[]> {
  const { data } = await api.post('/api/tugezo/teams/bulk', payload);
  return unwrap<Team[]>(data);
}

// PATCH /api/tugezo/teams/:id -> update a team (e.g. toggle isActive).
export async function updateTeam(
  teamId: string,
  payload: {
    name?: string;
    shortName?: string;
    city?: string;
    logo?: string;
    isActive?: boolean;
  }
): Promise<Team> {
  const { data } = await api.patch(`/api/tugezo/teams/${teamId}`, payload);
  return unwrap<Team>(data);
}

// DELETE /api/tugezo/teams/:id -> delete a team.
export async function deleteTeam(teamId: string): Promise<any> {
  const { data } = await api.delete(`/api/tugezo/teams/${teamId}`);
  return unwrap<any>(data);
}

export interface PlayerInput {
  name: string;
  shirtNumber?: number;
  position?: PlayerPosition | string;
  nationality?: string;
  photo?: string; // image URL from uploadMedia().url (plain URL, not a media id)
}

// Reuse an existing player for a new season (no new Players row — just a
// SquadMembership). Mixed freely with PlayerInput entries in one call.
export interface ExistingSquadPlayerInput {
  playerId: string;
  shirtNumber?: number;
  position?: string;
}

export type SquadPlayerInput = PlayerInput | ExistingSquadPlayerInput;

export async function addSquadPlayers(
  teamId: string,
  seasonId: string,
  payload: { players: SquadPlayerInput[] }
): Promise<Player[]> {
  const { data } = await api.post(
    `/api/tugezo/teams/${teamId}/squad/players`,
    payload,
    { params: { seasonId } }
  );
  return unwrap<Player[]>(data);
}

// DELETE /api/tugezo/teams/:id/squad/:membershipId -> remove a squad member.
export async function removeSquadPlayer(teamId: string, membershipId: string): Promise<any> {
  const { data } = await api.delete(`/api/tugezo/teams/${teamId}/squad/${membershipId}`);
  return unwrap<any>(data);
}

// Partial edit of the SQUAD MEMBERSHIP (season-specific). The endpoint strictly
// whitelists these fields — person-level fields (name, nationality, photo…) live
// on the player and must go through updatePlayer instead. Send null to clear.
export interface SquadPlayerUpdate {
  shirtNumber?: number | null;
  position?: string | null; // position for THIS squad
  joinedAt?: string | null;
  leftAt?: string | null;
}

// PATCH /api/tugezo/teams/:id/squad/:membershipId -> update a squad membership.
export async function updateSquadPlayer(
  teamId: string,
  membershipId: string,
  payload: SquadPlayerUpdate
): Promise<Player> {
  const { data } = await api.patch(
    `/api/tugezo/teams/${teamId}/squad/${membershipId}`,
    payload
  );
  return unwrap<Player>(data);
}

// Partial edit of the PLAYER record (shared across every season/team). Note the
// DTO uses `fullName`, not `name`. Send null to clear an optional field.
export interface PlayerUpdate {
  fullName?: string;
  nationality?: string | null;
  position?: string | null; // general position
  photo?: string | null; // plain URL from uploadMedia().url, or null to clear
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  height?: number | null;
  bio?: string | null;
}

// PATCH /api/tugezo/players/:playerId -> update the player record.
export async function updatePlayer(
  playerId: string,
  payload: PlayerUpdate
): Promise<Player> {
  const { data } = await api.patch(`/api/tugezo/players/${playerId}`, payload);
  return unwrap<Player>(data);
}

export interface MatchInput {
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  venueId?: string;
  referee?: string;
  // Per-fixture overrides of the top-level stage/group/round.
  stageId?: string;
  groupId?: string;
  round?: string;
}

// stageId/groupId/round at the top apply to every fixture; each fixture may
// override them, so one call can cover several groups. Knockout = stageId only.
export async function createMatchesBulk(payload: {
  seasonId: string;
  round?: string;
  stageId?: string;
  groupId?: string;
  matches: MatchInput[];
}): Promise<Match[]> {
  const { data } = await api.post('/api/tugezo/matches/bulk', payload);
  return unwrap<Match[]>(data);
}

export async function addSeasonEntries(
  seasonId: string,
  payload: { teamIds: string[] }
): Promise<any> {
  const { data } = await api.post(`/api/tugezo/seasons/${seasonId}/entries`, payload);
  return unwrap<any>(data);
}

// DELETE /api/tugezo/seasons/:id/entries/:teamId -> unroll a team from a season.
export async function removeSeasonEntry(seasonId: string, teamId: string): Promise<any> {
  const { data } = await api.delete(`/api/tugezo/seasons/${seasonId}/entries/${teamId}`);
  return unwrap<any>(data);
}

/* ------------------------------ Stages & groups ---------------------------- */

export type StageType = 'Group' | 'Knockout';
export const STAGE_TYPES: StageType[] = ['Group', 'Knockout'];

export interface StageGroup {
  id: string;
  stageId?: string;
  name: string;
  order?: number;
  advancesCount?: number | null; // how many teams advance from this group
  teams?: Team[];
}

export interface Stage {
  id: string;
  seasonId?: string;
  name: string;
  type: StageType;
  order?: number;
  // Group-stage qualification rule (set once per stage). advancesPerGroup =
  // auto-qualifiers per group; bestLosersCount = extra best 3rd-placed across
  // all groups. Per-group advancesCount is an override for uneven groups.
  advancesPerGroup?: number | null;
  bestLosersCount?: number | null;
  groups?: StageGroup[];
}

export interface StageInput {
  name: string;
  type: StageType;
  order?: number;
  advancesPerGroup?: number;
  bestLosersCount?: number;
}

export interface GroupInput {
  name: string;
  order?: number;
  advancesCount?: number; // how many teams qualify from this group
  teamIds?: string[];
}

// Group rows may wrap the team ({ team: {...} }) like season entries do.
function normalizeGroup(g: any): StageGroup {
  const teams = (g?.teams ?? []).map((r: any) => (r && r.team ? r.team : r)).filter((t: any) => t?.id);
  return {
    id: g?.id,
    stageId: g?.stageId,
    name: g?.name,
    order: g?.order,
    advancesCount: g?.advancesCount ?? null,
    teams,
  };
}

function normalizeStage(s: any): Stage {
  return {
    id: s?.id,
    seasonId: s?.seasonId,
    name: s?.name,
    type: s?.type,
    order: s?.order,
    advancesPerGroup: s?.advancesPerGroup ?? null,
    bestLosersCount: s?.bestLosersCount ?? null,
    groups: (s?.groups ?? []).map(normalizeGroup),
  };
}

// POST /api/tugezo/seasons/:seasonId/stages/bulk -> whole cup structure at once.
export async function createStagesBulk(
  seasonId: string,
  payload: { stages: StageInput[] }
): Promise<Stage[]> {
  const { data } = await api.post(`/api/tugezo/seasons/${seasonId}/stages/bulk`, payload);
  return (unwrap<any[]>(data) ?? []).map(normalizeStage);
}

// POST /api/tugezo/stages/:stageId/groups/bulk -> groups + their teams at once.
export async function createGroupsBulk(
  stageId: string,
  payload: { groups: GroupInput[] }
): Promise<StageGroup[]> {
  const { data } = await api.post(`/api/tugezo/stages/${stageId}/groups/bulk`, payload);
  return (unwrap<any[]>(data) ?? []).map(normalizeGroup);
}

// PATCH /api/tugezo/stages/:stageId -> rename / retype / reorder a stage,
// or set the group-stage qualification rule (advancesPerGroup / bestLosersCount).
export async function updateStage(
  stageId: string,
  payload: {
    name?: string;
    type?: StageType;
    order?: number;
    advancesPerGroup?: number | null;
    bestLosersCount?: number | null;
  }
): Promise<Stage> {
  const { data } = await api.patch(`/api/tugezo/stages/${stageId}`, payload);
  return normalizeStage(unwrap<any>(data));
}

// DELETE /api/tugezo/stages/:stageId -> remove a stage (and its groups).
export async function deleteStage(stageId: string): Promise<any> {
  const { data } = await api.delete(`/api/tugezo/stages/${stageId}`);
  return unwrap<any>(data);
}

// GET /api/tugezo/seasons/:seasonId/stages -> stages (with groups when returned).
export async function getSeasonStages(seasonId: string): Promise<Stage[]> {
  const { data } = await api.get(`/api/tugezo/seasons/${seasonId}/stages`);
  return (unwrap<any[]>(data) ?? []).map(normalizeStage);
}

// GET /api/tugezo/stages/:stageId/groups -> groups in a stage, with teams.
export async function getStageGroups(stageId: string): Promise<StageGroup[]> {
  const { data } = await api.get(`/api/tugezo/stages/${stageId}/groups`);
  return (unwrap<any[]>(data) ?? []).map(normalizeGroup);
}

// PATCH /api/tugezo/groups/:groupId -> rename / reorder / set how many advance.
export async function updateGroup(
  groupId: string,
  payload: { name?: string; order?: number; advancesCount?: number | null }
): Promise<StageGroup> {
  const { data } = await api.patch(`/api/tugezo/groups/${groupId}`, payload);
  return normalizeGroup(unwrap<any>(data));
}

export interface VenueInput {
  name: string;
  city?: string;
  country?: string;
  capacity?: number;
}

export async function createVenuesBulk(payload: { venues: VenueInput[] }): Promise<Venue[]> {
  const { data } = await api.post('/api/tugezo/venues/bulk', payload);
  return unwrap<Venue[]>(data);
}

// PATCH /api/tugezo/venues/:id -> edit a venue's details.
export async function updateVenue(
  venueId: string,
  payload: Partial<VenueInput>
): Promise<Venue> {
  const { data } = await api.patch(`/api/tugezo/venues/${venueId}`, payload);
  return unwrap<Venue>(data);
}

export async function updateMatch(
  matchId: string,
  payload: {
    status?: MatchStatus;
    homeScore?: number;
    awayScore?: number;
    homePenalties?: number | null;
    awayPenalties?: number | null;
    afterExtraTime?: boolean;
    minute?: number;
    venueId?: string;
    kickoffAt?: string;
    referee?: string;
    // Fixture setup edits (e.g. a team is replaced, or the fixture moves round).
    homeTeamId?: string;
    awayTeamId?: string;
    round?: string;
    stageId?: string | null;
    groupId?: string | null;
  }
): Promise<Match> {
  const { data } = await api.patch(`/api/tugezo/matches/${matchId}`, payload);
  return unwrap<Match>(data);
}

// DELETE /api/tugezo/matches/:id -> delete a match.
export async function deleteMatch(matchId: string): Promise<any> {
  const { data } = await api.delete(`/api/tugezo/matches/${matchId}`);
  return unwrap<any>(data);
}

export interface MatchEventInput {
  teamId: string;
  type: MatchEventType;
  minute: number;
  extraMinute?: number;
  playerId?: string;
  relatedPlayerId?: string;
  note?: string;
}

// POST /api/tugezo/matches/:matchId/events -> add a goal/card/sub to a match.
export async function createMatchEvent(
  matchId: string,
  payload: MatchEventInput
): Promise<MatchEvent> {
  const { data } = await api.post(`/api/tugezo/matches/${matchId}/events`, payload);
  return unwrap<MatchEvent>(data);
}

// PATCH /api/tugezo/matches/:matchId/events/:eventId -> edit an event.
export async function updateMatchEvent(
  matchId: string,
  eventId: string,
  payload: Partial<MatchEventInput>
): Promise<MatchEvent> {
  const { data } = await api.patch(
    `/api/tugezo/matches/${matchId}/events/${eventId}`,
    payload
  );
  return unwrap<MatchEvent>(data);
}

/* -------------------------------------------------------------------------- */
/*  Reads (backend-confirmed paths)                                            */
/* -------------------------------------------------------------------------- */

// GET /api/tugezo/competitions -> all competitions + their seasons
export async function getCompetitions(): Promise<Competition[]> {
  const { data } = await api.get('/api/tugezo/competitions');
  return unwrap<Competition[]>(data);
}

export async function getCompetition(id: string): Promise<Competition> {
  const { data } = await api.get(`/api/tugezo/competitions/${id}`);
  return unwrap<Competition>(data);
}

// GET /api/tugezo/seasons?competitionId= -> seasons (+ entry/match counts)
export async function getSeasons(competitionId?: string): Promise<Season[]> {
  const { data } = await api.get('/api/tugezo/seasons', {
    params: competitionId ? { competitionId } : undefined,
  });
  return unwrap<Season[]>(data);
}

// GET /api/tugezo/seasons/:id -> season + enrolled teams
export async function getSeason(id: string): Promise<Season> {
  const { data } = await api.get(`/api/tugezo/seasons/${id}`);
  return unwrap<Season>(data);
}

// GET /api/tugezo/seasons/:id/entries -> teams enrolled in a season.
// The API may return bare teams or entry rows that wrap the team ({ team: {...} }),
// so normalize to a flat Team[].
export async function getSeasonEntries(seasonId: string): Promise<Team[]> {
  const { data } = await api.get(`/api/tugezo/seasons/${seasonId}/entries`);
  const rows = unwrap<any[]>(data) ?? [];
  return rows.map((r) => (r && r.team ? r.team : r)).filter((t) => t && t.id);
}

export interface StandingRow {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string[]; // recent results, e.g. ['W','D','L']
  isLive?: boolean; // true (live=true only) when an in-progress match is moving this row
  // Cup group rows: true when this position advances, false when it doesn't,
  // null when the rule is unset. League rows leave this undefined.
  qualified?: boolean | null;
  // How the team qualified: 'group' = direct top-N (solid green), 'bestLoser' =
  // best 3rd-placed (lighter shade), null = not qualified / rule unset.
  qualifiedAs?: 'group' | 'bestLoser' | null;
}

export interface StandingsGroup {
  group: {
    id: string;
    name: string;
    order?: number;
    stage?: { id: string; name: string; order?: number };
    // Effective per-group cutoff, plus the extra best-3rd-placed slots (global).
    advancesCount?: number | null;
    bestLosersCount?: number | null;
  };
  standings: StandingRow[];
}

// A season is either a league (standings filled) or a group stage (groups filled)
// — exactly one is populated. Rendering rule: groups.length ? groups : standings.
export interface StandingsResult {
  standings: StandingRow[];
  groups: StandingsGroup[];
  live?: boolean; // echoes the ?live= flag
  hasLiveMatches?: boolean; // true when a table actually includes an in-progress game
}

function extractStandings(payload: any): StandingsResult {
  // Tolerate a bare array (older shape) as a plain league table.
  if (Array.isArray(payload)) {
    return { standings: payload as StandingRow[], groups: [], live: false, hasLiveMatches: false };
  }
  return {
    standings: (payload?.standings ?? []) as StandingRow[],
    groups: (payload?.groups ?? []) as StandingsGroup[],
    live: !!payload?.live,
    hasLiveMatches: !!payload?.hasLiveMatches,
  };
}

// GET /api/tugezo/seasons/:id/standings -> { season, standings, groups }.
// Pass { live: true } to fold in-progress (Live/HalfTime) scores into the table.
export async function getStandings(
  seasonId: string,
  opts?: { live?: boolean }
): Promise<StandingsResult> {
  const { data } = await api.get(`/api/tugezo/seasons/${seasonId}/standings`, {
    params: opts?.live ? { live: true } : undefined,
  });
  return extractStandings(unwrap<any>(data));
}

// GET /api/tugezo/competitions/:id/standings?seasonId=&live= -> the table for a
// season (server resolves the current season if seasonId is omitted).
export async function getCompetitionStandings(
  competitionId: string,
  seasonId?: string,
  opts?: { live?: boolean }
): Promise<StandingsResult> {
  const params: Record<string, string | boolean> = {};
  if (seasonId) params.seasonId = seasonId;
  if (opts?.live) params.live = true;
  const { data } = await api.get(`/api/tugezo/competitions/${competitionId}/standings`, {
    params: Object.keys(params).length ? params : undefined,
  });
  return extractStandings(unwrap<any>(data));
}

// GET /api/tugezo/teams?isActive= -> teams, optionally filtered by active flag.
// Public/consumer callers should pass { isActive: true } to get only usable teams.
export async function getTeams(params?: { isActive?: boolean }): Promise<Team[]> {
  const { data } = await api.get('/api/tugezo/teams', {
    params: params && Object.keys(params).length ? params : undefined,
  });
  return unwrap<Team[]>(data);
}

export async function getTeam(id: string): Promise<Team> {
  const { data } = await api.get(`/api/tugezo/teams/${id}`);
  return unwrap<Team>(data);
}

/* ------------------------------ Team profile ------------------------------ */

export interface CompetitionRef {
  id?: string;
  name?: string;
  slug?: string;
  type?: string;
}

export interface TeamHonour {
  title: string;
  season?: string | null;
  year?: number | null;
  competition?: CompetitionRef | null;
}

// One row of the team's record, per season & competition.
export interface TeamSeasonRow {
  season?: { id: string; name: string };
  competition?: CompetitionRef;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position?: number | null;
}

// A match from the team's point of view (opponent + home/away + result).
export interface TeamPerspectiveMatch {
  slug: string;
  status: MatchStatus;
  kickoffAt: string;
  isHome: boolean;
  opponent?: {
    id?: string;
    slug?: string;
    name?: string;
    shortName?: string;
    logo?: string | { url?: string } | null;
  } | null;
  homeScore?: number | null;
  awayScore?: number | null;
  result?: 'W' | 'D' | 'L' | null;
  competition?: CompetitionRef | null;
  stage?: { id?: string; name?: string } | null;
  group?: { id?: string; name?: string } | null;
}

export interface TeamProfileTeam {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  logo?: string | { url?: string } | null;
  logoUrl?: string | null;
  country?: string | null;
  city?: string | null;
  founded?: number | null;
  bio?: string | null;
  honours?: TeamHonour[];
}

export interface TeamProfile {
  team: TeamProfileTeam;
  currentSeason?: { id: string; name: string; competition?: CompetitionRef } | null;
  seasons: TeamSeasonRow[];
  form: string[]; // last 5, current season, e.g. ['W','D','L']
  recentResults: TeamPerspectiveMatch[];
  upcomingFixtures: TeamPerspectiveMatch[];
}

// A team's run through a single cup season — group stage table (if any) plus
// its knockout matches in progression order, and a ready-to-display outcome.
export interface TeamJourneyKnockout {
  stage: { id: string; name: string; order?: number };
  match: {
    id: string;
    slug: string;
    status: MatchStatus;
    isHome: boolean;
    opponent?: {
      id?: string;
      slug?: string;
      name?: string;
      shortName?: string;
      logo?: string | { url?: string } | null;
    } | null;
    homeScore?: number | null;
    awayScore?: number | null;
    homePenalties?: number | null;
    awayPenalties?: number | null;
    afterExtraTime?: boolean | null;
    winnerTeamId?: string | null;
    advanced?: boolean; // did this team go through this round?
  };
}

export interface TeamSeasonJourney {
  team: { id: string; name: string; shortName?: string; slug?: string; logo?: string | { url?: string } | null };
  season: { id: string; name: string; competition?: CompetitionRef };
  group: {
    stage: { id: string; name: string; order?: number };
    group: { id: string; name: string };
    position: number;
    row: StandingRow;
    table: StandingRow[];
    advancesCount?: number | null; // effective per-group cutoff
    bestLosersCount?: number | null; // extra best-3rd-placed slots (global)
    qualified?: boolean | null; // did THIS team make the cut (null when rule unset)
    qualifiedAs?: 'group' | 'bestLoser' | null; // how it qualified
    complete?: boolean; // are all this group's matches played
  } | null;
  knockout: TeamJourneyKnockout[];
  outcome: string; // display label, e.g. "Winner", "Runner-up", "Eliminated in the Semi-final", "Advanced from group stage", "Eliminated in the group stage", "Group stage (in progress)"
  eliminated?: boolean | null; // machine-readable: true=out, false=still in/won, null=unknown
}

// GET /api/tugezo/teams/:id/seasons/:seasonId/journey -> a cup-season drill-down
// (loaded on demand when a user expands a cup season on the team page).
export async function getTeamSeasonJourney(
  teamId: string,
  seasonId: string
): Promise<TeamSeasonJourney> {
  const { data } = await api.get(`/api/tugezo/teams/${teamId}/seasons/${seasonId}/journey`);
  const p = unwrap<any>(data);
  return {
    team: p?.team ?? {},
    season: p?.season ?? {},
    group: p?.group ?? null,
    knockout: p?.knockout ?? [],
    outcome: p?.outcome ?? '',
    eliminated: p?.eliminated ?? null,
  };
}

// GET /api/tugezo/teams/slug/:slug -> the whole team page in one call.
export async function getTeamProfile(slug: string): Promise<TeamProfile> {
  const { data } = await api.get(`/api/tugezo/teams/slug/${slug}`);
  const p = unwrap<any>(data);
  return {
    team: p?.team ?? {},
    currentSeason: p?.currentSeason ?? null,
    seasons: p?.seasons ?? [],
    form: p?.form ?? [],
    recentResults: p?.recentResults ?? [],
    upcomingFixtures: p?.upcomingFixtures ?? [],
  };
}

// GET /api/tugezo/teams/:id/squad?seasonId= -> squad, filterable by season.
// (Note: the POST to add players is /teams/:id/squad/players; the GET is /squad.)
// Normalizes the various shapes the API may return into a flat Player[]:
//   - a bare Player[]
//   - { players: [...] }
//   - squad rows wrapping the player: [{ player: {...}, shirtNumber, position }]
//     (row-level shirtNumber/position win, since they're season-specific).
export async function getSquad(teamId: string, seasonId?: string): Promise<Player[]> {
  const { data } = await api.get(`/api/tugezo/teams/${teamId}/squad`, {
    params: seasonId ? { seasonId } : undefined,
  });
  let rows: any = unwrap<any>(data);
  if (rows && !Array.isArray(rows) && Array.isArray(rows.players)) rows = rows.players;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r: any) => {
      // A squad row wraps the player and carries season-specific fields
      // (shirtNumber) plus the membership id. The player uses `fullName`.
      const pl = r && r.player ? r.player : r ?? {};
      return {
        ...pl,
        membershipId: r && r.player ? r.id : undefined,
        name: pl.name ?? pl.fullName,
        shirtNumber: r?.shirtNumber ?? pl.shirtNumber,
        position: r?.position ?? pl.position,
      } as Player;
    })
    .filter((p: Player) => p && (p.id || p.name));
}

/* ----------------------------- Player profile ----------------------------- */

export interface PlayerTeamRef {
  id: string;
  name: string;
  shortName?: string;
  slug?: string;
  logo?: string | null;
}

export interface PlayerSeasonRef {
  id: string;
  name: string;
  startDate?: string | null;
  competition?: { id: string; name: string; slug?: string };
}

export interface PlayerStatLine {
  goals: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
}

export interface PlayerClubRef {
  source?: string;
  team?: PlayerTeamRef | null;
  clubName?: string;
  country?: string | null;
  season?: { id: string; name: string };
}

export interface PlayerTransfer {
  date?: string | null;
  year?: number | null;
  isLoan?: boolean;
  from?: PlayerClubRef | null;
  to?: PlayerClubRef | null;
}

export interface PlayerCareerEntry extends PlayerStatLine {
  source?: string;
  team?: PlayerTeamRef | null;
  clubName?: string;
  country?: string | null;
  joinedAt?: string | null;
  leftAt?: string | null;
  startYear?: number | null;
  endYear?: number | null;
  isLoan?: boolean;
  seasons?: { id: string; name: string }[];
  note?: string | null;
}

export interface PlayerProfile {
  player: {
    id: string;
    fullName: string;
    slug: string;
    position?: string | null;
    dateOfBirth?: string | null;
    placeOfBirth?: string | null;
    nationality?: string | null;
    photo?: string | null;
    height?: number | null;
    bio?: string | null;
    isActive?: boolean;
  };
  currentTeam?: {
    shirtNumber?: number | null;
    position?: string | null;
    joinedAt?: string | null;
    leftAt?: string | null;
    team?: PlayerTeamRef;
    season?: PlayerSeasonRef;
  } | null;
  transfers: PlayerTransfer[];
  career: PlayerCareerEntry[];
  stats: {
    totals: PlayerStatLine;
    byTeam: (PlayerStatLine & { team?: PlayerTeamRef; seasons?: number })[];
    bySeason: (PlayerStatLine & { season?: PlayerSeasonRef; team?: PlayerTeamRef })[];
  };
}

// GET /api/tugezo/players/slug/:slug -> full player profile.
export async function getPlayerProfile(slug: string): Promise<PlayerProfile> {
  const { data } = await api.get(`/api/tugezo/players/slug/${slug}`);
  const p = unwrap<any>(data);
  return {
    player: p?.player ?? {},
    currentTeam: p?.currentTeam ?? null,
    transfers: p?.transfers ?? [],
    career: p?.career ?? [],
    stats: {
      totals: p?.stats?.totals ?? {
        goals: 0,
        assists: 0,
        appearances: 0,
        yellowCards: 0,
        redCards: 0,
      },
      byTeam: p?.stats?.byTeam ?? [],
      bySeason: p?.stats?.bySeason ?? [],
    },
  };
}

export interface SeasonPlayerRow {
  membershipId?: string;
  playerId: string;
  name: string;
  slug?: string;
  photo?: string | null;
  nationality?: string | null;
  shirtNumber?: number | null;
  position?: string | null;
  team?: { id: string; name: string; shortName?: string; logo?: string | null };
}

// GET /api/tugezo/seasons/:id/players?search= -> every player registered in a
// season (across all teams), from the squad-membership rows.
export async function getSeasonPlayers(
  seasonId: string,
  params?: { search?: string }
): Promise<SeasonPlayerRow[]> {
  const { data } = await api.get(`/api/tugezo/seasons/${seasonId}/players`, {
    params: params && Object.keys(params).length ? params : undefined,
  });
  const rows = unwrap<any[]>(data) ?? [];
  return rows
    .map((r: any) => {
      const pl = r?.player ?? {};
      return {
        membershipId: r?.id,
        playerId: pl.id ?? r?.playerId,
        name: pl.fullName ?? pl.name ?? '',
        slug: pl.slug,
        photo: pl.photo ?? null,
        nationality: pl.nationality ?? null,
        // Row-level shirt/position are season-specific; fall back to the player's.
        shirtNumber: r?.shirtNumber ?? null,
        position: r?.position ?? pl.position ?? null,
        team: r?.team,
      } as SeasonPlayerRow;
    })
    .filter((r: SeasonPlayerRow) => !!r.playerId);
}

export interface PlayersQuery {
  search?: string;
  position?: PlayerPosition | string;
  page?: number;
  limit?: number;
}

export async function getPlayers(params?: PlayersQuery): Promise<Player[]> {
  const { data } = await api.get('/api/tugezo/players', {
    params: params && Object.keys(params).length ? params : undefined,
  });
  return unwrap<Player[]>(data);
}

export async function getVenues(): Promise<Venue[]> {
  const { data } = await api.get('/api/tugezo/venues');
  return unwrap<Venue[]>(data);
}

// GET /api/tugezo/matches -> the LiveScore feed.
export async function getMatches(params?: {
  date?: string;
  status?: MatchStatus;
  seasonId?: string;
  competitionId?: string;
  teamId?: string;
  stageId?: string;
  groupId?: string;
  round?: string;
  from?: string; // ISO date, inclusive lower bound on kickoff
  to?: string; // ISO date, inclusive upper bound on kickoff
  order?: 'asc' | 'desc';
}): Promise<Match[]> {
  const { data } = await api.get('/api/tugezo/matches', {
    params: params && Object.keys(params).length ? params : undefined,
  });
  return unwrap<Match[]>(data);
}

// GET /api/tugezo/matches/slug/:slug -> one match by slug (SEO-friendly URLs).
export async function getMatch(slug: string): Promise<Match> {
  const { data } = await api.get(`/api/tugezo/matches/slug/${slug}`);
  return unwrap<Match>(data);
}

/* ------------------------------ Head to head ------------------------------ */

export interface H2HTeamMini {
  id: string;
  slug?: string;
  name: string;
  shortName?: string;
  logo?: string | { url?: string } | null;
}

export interface HeadToHeadSummary {
  played: number;
  teamAWins: number;
  teamBWins: number;
  draws: number;
  teamAGoals: number;
  teamBGoals: number;
}

export interface HeadToHeadMeeting {
  id: string;
  slug: string;
  kickoffAt: string;
  competition?: CompetitionRef | null;
  homeTeam?: H2HTeamMini;
  awayTeam?: H2HTeamMini;
  homeScore?: number | null;
  awayScore?: number | null;
  winnerTeamId?: string | null;
  decidedBy?: 'normal' | 'extra_time' | 'penalties' | null;
}

export interface HeadToHead {
  teamA: H2HTeamMini;
  teamB: H2HTeamMini;
  summary: HeadToHeadSummary; // aggregate record, normalised to A vs B (FullTime only)
  meetings: HeadToHeadMeeting[]; // recent-first past encounters
}

// GET /api/tugezo/matches/head-to-head?teamA=&teamB=&limit= -> the all-time
// record + recent meetings between two teams. Accepts team id or slug.
export async function getHeadToHead(
  teamA: string,
  teamB: string,
  limit?: number
): Promise<HeadToHead> {
  const { data } = await api.get('/api/tugezo/matches/head-to-head', {
    params: { teamA, teamB, ...(limit ? { limit } : {}) },
  });
  const p = unwrap<any>(data);
  return {
    teamA: p?.teamA ?? {},
    teamB: p?.teamB ?? {},
    summary: p?.summary ?? {
      played: 0,
      teamAWins: 0,
      teamBWins: 0,
      draws: 0,
      teamAGoals: 0,
      teamBGoals: 0,
    },
    // The competition arrives nested under season.competition — lift it to a
    // top-level `competition` so consumers (grouping, match links) can use it.
    meetings: (p?.meetings ?? []).map((mtg: any) => ({
      ...mtg,
      competition: mtg?.competition ?? mtg?.season?.competition ?? null,
    })),
  };
}

// GET /api/tugezo/matches/:matchId/events -> timeline of goals, cards, subs.
// Optionally filter by event type and/or team.
export async function getMatchEvents(
  matchId: string,
  params?: { type?: MatchEventType; teamId?: string }
): Promise<MatchEvent[]> {
  const { data } = await api.get(`/api/tugezo/matches/${matchId}/events`, {
    params: params && Object.keys(params).length ? params : undefined,
  });
  return unwrap<MatchEvent[]>(data) ?? [];
}

export interface LineupPlayerInput {
  playerId: string;
  isStarting: boolean;
  position?: string;
  x?: number; // 0 (left touchline) .. 100 (right touchline)
  y?: number; // 0 (own goal) .. 100 (attacking end)
}

export interface LineupInput {
  formation?: string;
  coach?: string;
  isConfirmed?: boolean;
  players: LineupPlayerInput[];
}

// POST /api/tugezo/matches/:matchId/lineups/:teamId -> set a team's lineup.
export async function setMatchLineup(
  matchId: string,
  teamId: string,
  payload: LineupInput
): Promise<any> {
  const { data } = await api.put(
    `/api/tugezo/matches/${matchId}/lineups/${teamId}`,
    payload
  );
  return unwrap<any>(data);
}

export interface LineupSlot {
  playerId: string;
  isStarting: boolean;
  shirtNumber?: number | null;
  position?: string | null;
  x?: number | null; // 0 (left) .. 100 (right)
  y?: number | null; // 0 (own goal) .. 100 (attacking end)
  player?: { id: string; fullName: string; slug?: string; position?: string | null };
}

export interface MatchLineup {
  id?: string;
  teamId: string;
  formation?: string;
  coach?: string | null;
  isConfirmed?: boolean;
  team?: { id: string; name: string; shortName?: string; logo?: string | { url?: string } | null };
  slots: LineupSlot[];
}

// GET /api/tugezo/matches/:matchId/lineups/:teamId -> a team's lineup (if set).
// Normalized to a MatchLineup with a `slots` array; tolerant of a `players` key.
export async function getMatchLineup(
  matchId: string,
  teamId: string
): Promise<MatchLineup | null> {
  const { data } = await api.get(`/api/tugezo/matches/${matchId}/lineups/${teamId}`);
  const p = unwrap<any>(data);
  if (!p) return null;
  const slots: LineupSlot[] = (p.slots ?? p.players ?? [])
    .map((r: any) => ({
      playerId: r?.playerId ?? r?.player?.id,
      isStarting: !!r?.isStarting,
      shirtNumber: r?.shirtNumber ?? r?.player?.shirtNumber ?? null,
      position: r?.position ?? r?.player?.position ?? null,
      x: r?.x ?? null,
      y: r?.y ?? null,
      player: r?.player
        ? {
            id: r.player.id,
            fullName: r.player.fullName,
            slug: r.player.slug,
            position: r.player.position ?? null,
          }
        : undefined,
    }))
    .filter((r: LineupSlot) => r.playerId);
  return {
    id: p.id,
    teamId: p.teamId ?? teamId,
    formation: p.formation,
    coach: p.coach ?? null,
    isConfirmed: !!p.isConfirmed,
    team: p.team,
    slots,
  };
}

export interface StatLeaderRow {
  rank: number;
  player: { id: string; fullName: string; slug?: string; photo?: string | null };
  team: { id: string; slug?: string; name: string; shortName?: string; logo?: string | { url?: string } | null };
  goals: number;
  assists: number;
}

// GET /api/tugezo/seasons/:id/top-scorers -> { season, scorers: [...] }
export async function getTopScorers(seasonId: string): Promise<StatLeaderRow[]> {
  const { data } = await api.get(`/api/tugezo/seasons/${seasonId}/top-scorers`);
  const payload = unwrap<any>(data);
  return (payload?.scorers ?? payload ?? []) as StatLeaderRow[];
}

// GET /api/tugezo/seasons/:id/top-assists -> { season, assisters: [...] }
export async function getTopAssists(seasonId: string): Promise<StatLeaderRow[]> {
  const { data } = await api.get(`/api/tugezo/seasons/${seasonId}/top-assists`);
  const payload = unwrap<any>(data);
  return (payload?.assisters ?? payload ?? []) as StatLeaderRow[];
}

/* ------------------------------- insights --------------------------------- */

// Every insights endpoint returns the same envelope: machine-readable fields for
// public stat pages, plus a copy-paste-ready `briefing` for the admin article
// workflow. The structured fields differ per endpoint and are kept loose here —
// the admin lane only needs `season` + `briefing`; public pages read the rest.
export interface InsightResponse {
  season: { id: string; name: string; competition?: CompetitionRef };
  briefing: string;
  // Structured payload varies by endpoint (records, rows, streaks…).
  [key: string]: unknown;
}

export type InsightKind = 'numbers' | 'records' | 'streaks';

// GET /api/tugezo/seasons/:id/{numbers|records|streaks}
// `numbers` accepts an optional round label (leagues only) for one matchday.
export async function getSeasonInsight(
  seasonId: string,
  kind: InsightKind,
  opts?: { round?: string }
): Promise<InsightResponse> {
  const { data } = await api.get(`/api/tugezo/seasons/${seasonId}/${kind}`, {
    params: kind === 'numbers' && opts?.round?.trim() ? { round: opts.round.trim() } : undefined,
  });
  const p = unwrap<any>(data);
  return {
    ...p,
    season: p?.season ?? { id: seasonId, name: '' },
    briefing: typeof p?.briefing === 'string' ? p.briefing : '',
  };
}
