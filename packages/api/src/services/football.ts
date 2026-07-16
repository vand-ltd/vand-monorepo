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

export interface Competition {
  id: string;
  name: string;
  slug?: string;
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
  name: string;
  shirtNumber?: number;
  position?: PlayerPosition | string;
  nationality?: string;
  teamId?: string;
  photoUrl?: string | null;
  // GET may return the photo as a url string or a media object.
  photo?: string | { url?: string } | null;
}

export interface Match {
  id: string;
  seasonId: string;
  round: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  status: MatchStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  minute?: number | null;
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

export async function createCompetition(payload: { name: string }): Promise<Competition> {
  const { data } = await api.post('/api/menyesha/competitions', payload);
  return unwrap<Competition>(data);
}

export async function createSeason(payload: {
  competitionId: string;
  name: string;
  isCurrent?: boolean;
}): Promise<Season> {
  const { data } = await api.post('/api/menyesha/seasons', payload);
  return unwrap<Season>(data);
}

export interface TeamInput {
  name: string;
  shortName?: string;
  city?: string;
  logo?: string; // image URL from uploadMedia().url (plain URL, not a media id)
}

export async function createTeamsBulk(payload: { teams: TeamInput[] }): Promise<Team[]> {
  const { data } = await api.post('/api/menyesha/teams/bulk', payload);
  return unwrap<Team[]>(data);
}

// PATCH /api/menyesha/teams/:id -> update a team (e.g. toggle isActive).
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
  const { data } = await api.patch(`/api/menyesha/teams/${teamId}`, payload);
  return unwrap<Team>(data);
}

// DELETE /api/menyesha/teams/:id -> delete a team.
export async function deleteTeam(teamId: string): Promise<any> {
  const { data } = await api.delete(`/api/menyesha/teams/${teamId}`);
  return unwrap<any>(data);
}

export interface PlayerInput {
  name: string;
  shirtNumber?: number;
  position?: PlayerPosition | string;
  nationality?: string;
  photo?: string; // image URL from uploadMedia().url (plain URL, not a media id)
}

export async function addSquadPlayers(
  teamId: string,
  seasonId: string,
  payload: { players: PlayerInput[] }
): Promise<Player[]> {
  const { data } = await api.post(
    `/api/menyesha/teams/${teamId}/squad/players`,
    payload,
    { params: { seasonId } }
  );
  return unwrap<Player[]>(data);
}

// DELETE /api/menyesha/teams/:id/squad/:membershipId -> remove a squad member.
export async function removeSquadPlayer(teamId: string, membershipId: string): Promise<any> {
  const { data } = await api.delete(`/api/menyesha/teams/${teamId}/squad/${membershipId}`);
  return unwrap<any>(data);
}

export interface MatchInput {
  homeTeamId: string;
  awayTeamId: string;
  kickoffAt: string;
  venueId?: string;
}

export async function createMatchesBulk(payload: {
  seasonId: string;
  round: string;
  matches: MatchInput[];
}): Promise<Match[]> {
  const { data } = await api.post('/api/menyesha/matches/bulk', payload);
  return unwrap<Match[]>(data);
}

export async function addSeasonEntries(
  seasonId: string,
  payload: { teamIds: string[] }
): Promise<any> {
  const { data } = await api.post(`/api/menyesha/seasons/${seasonId}/entries`, payload);
  return unwrap<any>(data);
}

// DELETE /api/menyesha/seasons/:id/entries/:teamId -> unroll a team from a season.
export async function removeSeasonEntry(seasonId: string, teamId: string): Promise<any> {
  const { data } = await api.delete(`/api/menyesha/seasons/${seasonId}/entries/${teamId}`);
  return unwrap<any>(data);
}

export interface VenueInput {
  name: string;
  city?: string;
  country?: string;
  capacity?: number;
}

export async function createVenuesBulk(payload: { venues: VenueInput[] }): Promise<Venue[]> {
  const { data } = await api.post('/api/menyesha/venues/bulk', payload);
  return unwrap<Venue[]>(data);
}

export async function updateMatch(
  matchId: string,
  payload: {
    status?: MatchStatus;
    homeScore?: number;
    awayScore?: number;
    minute?: number;
    venueId?: string;
    kickoffAt?: string;
  }
): Promise<Match> {
  const { data } = await api.patch(`/api/menyesha/matches/${matchId}`, payload);
  return unwrap<Match>(data);
}

// DELETE /api/menyesha/matches/:id -> delete a match.
export async function deleteMatch(matchId: string): Promise<any> {
  const { data } = await api.delete(`/api/menyesha/matches/${matchId}`);
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

// POST /api/menyesha/matches/:matchId/events -> add a goal/card/sub to a match.
export async function createMatchEvent(
  matchId: string,
  payload: MatchEventInput
): Promise<MatchEvent> {
  const { data } = await api.post(`/api/menyesha/matches/${matchId}/events`, payload);
  return unwrap<MatchEvent>(data);
}

// PATCH /api/menyesha/matches/:matchId/events/:eventId -> edit an event.
export async function updateMatchEvent(
  matchId: string,
  eventId: string,
  payload: Partial<MatchEventInput>
): Promise<MatchEvent> {
  const { data } = await api.patch(
    `/api/menyesha/matches/${matchId}/events/${eventId}`,
    payload
  );
  return unwrap<MatchEvent>(data);
}

/* -------------------------------------------------------------------------- */
/*  Reads (backend-confirmed paths)                                            */
/* -------------------------------------------------------------------------- */

// GET /api/menyesha/competitions -> all competitions + their seasons
export async function getCompetitions(): Promise<Competition[]> {
  const { data } = await api.get('/api/menyesha/competitions');
  return unwrap<Competition[]>(data);
}

export async function getCompetition(id: string): Promise<Competition> {
  const { data } = await api.get(`/api/menyesha/competitions/${id}`);
  return unwrap<Competition>(data);
}

// GET /api/menyesha/seasons?competitionId= -> seasons (+ entry/match counts)
export async function getSeasons(competitionId?: string): Promise<Season[]> {
  const { data } = await api.get('/api/menyesha/seasons', {
    params: competitionId ? { competitionId } : undefined,
  });
  return unwrap<Season[]>(data);
}

// GET /api/menyesha/seasons/:id -> season + enrolled teams
export async function getSeason(id: string): Promise<Season> {
  const { data } = await api.get(`/api/menyesha/seasons/${id}`);
  return unwrap<Season>(data);
}

// GET /api/menyesha/seasons/:id/entries -> teams enrolled in a season.
// The API may return bare teams or entry rows that wrap the team ({ team: {...} }),
// so normalize to a flat Team[].
export async function getSeasonEntries(seasonId: string): Promise<Team[]> {
  const { data } = await api.get(`/api/menyesha/seasons/${seasonId}/entries`);
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
}

function extractStandings(payload: any): StandingRow[] {
  if (Array.isArray(payload)) return payload as StandingRow[];
  return (payload?.standings ?? []) as StandingRow[];
}

// GET /api/menyesha/seasons/:id/standings -> { season, standings: [...] }
export async function getStandings(seasonId: string): Promise<StandingRow[]> {
  const { data } = await api.get(`/api/menyesha/seasons/${seasonId}/standings`);
  return extractStandings(unwrap<any>(data));
}

// GET /api/menyesha/competitions/:id/standings?seasonId= -> one league's table
// for a given season (server resolves current season if seasonId omitted).
export async function getCompetitionStandings(
  competitionId: string,
  seasonId?: string
): Promise<StandingRow[]> {
  const { data } = await api.get(`/api/menyesha/competitions/${competitionId}/standings`, {
    params: seasonId ? { seasonId } : undefined,
  });
  return extractStandings(unwrap<any>(data));
}

// GET /api/menyesha/teams?isActive= -> teams, optionally filtered by active flag.
// Public/consumer callers should pass { isActive: true } to get only usable teams.
export async function getTeams(params?: { isActive?: boolean }): Promise<Team[]> {
  const { data } = await api.get('/api/menyesha/teams', {
    params: params && Object.keys(params).length ? params : undefined,
  });
  return unwrap<Team[]>(data);
}

export async function getTeam(id: string): Promise<Team> {
  const { data } = await api.get(`/api/menyesha/teams/${id}`);
  return unwrap<Team>(data);
}

// GET /api/menyesha/teams/:id/squad?seasonId= -> squad, filterable by season.
// (Note: the POST to add players is /teams/:id/squad/players; the GET is /squad.)
// Normalizes the various shapes the API may return into a flat Player[]:
//   - a bare Player[]
//   - { players: [...] }
//   - squad rows wrapping the player: [{ player: {...}, shirtNumber, position }]
//     (row-level shirtNumber/position win, since they're season-specific).
export async function getSquad(teamId: string, seasonId?: string): Promise<Player[]> {
  const { data } = await api.get(`/api/menyesha/teams/${teamId}/squad`, {
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

export interface PlayersQuery {
  search?: string;
  position?: PlayerPosition | string;
  page?: number;
  limit?: number;
}

export async function getPlayers(params?: PlayersQuery): Promise<Player[]> {
  const { data } = await api.get('/api/menyesha/players', {
    params: params && Object.keys(params).length ? params : undefined,
  });
  return unwrap<Player[]>(data);
}

export async function getVenues(): Promise<Venue[]> {
  const { data } = await api.get('/api/menyesha/venues');
  return unwrap<Venue[]>(data);
}

// GET /api/menyesha/matches -> the LiveScore feed.
export async function getMatches(params?: {
  date?: string;
  status?: MatchStatus;
  seasonId?: string;
  competitionId?: string;
  teamId?: string;
  order?: 'asc' | 'desc';
}): Promise<Match[]> {
  const { data } = await api.get('/api/menyesha/matches', {
    params: params && Object.keys(params).length ? params : undefined,
  });
  return unwrap<Match[]>(data);
}

// GET /api/menyesha/matches/slug/:slug -> one match by slug (SEO-friendly URLs).
export async function getMatch(slug: string): Promise<Match> {
  const { data } = await api.get(`/api/menyesha/matches/slug/${slug}`);
  return unwrap<Match>(data);
}

// GET /api/menyesha/matches/:matchId/events -> timeline of goals, cards, subs.
export async function getMatchEvents(matchId: string): Promise<MatchEvent[]> {
  const { data } = await api.get(`/api/menyesha/matches/${matchId}/events`);
  return unwrap<MatchEvent[]>(data) ?? [];
}

export interface StatLeaderRow {
  rank: number;
  player: { id: string; fullName: string; slug?: string; photo?: string | null };
  team: { id: string; name: string; shortName?: string; logo?: string | { url?: string } | null };
  goals: number;
  assists: number;
}

// GET /api/menyesha/seasons/:id/top-scorers -> { season, scorers: [...] }
export async function getTopScorers(seasonId: string): Promise<StatLeaderRow[]> {
  const { data } = await api.get(`/api/menyesha/seasons/${seasonId}/top-scorers`);
  const payload = unwrap<any>(data);
  return (payload?.scorers ?? payload ?? []) as StatLeaderRow[];
}

// GET /api/menyesha/seasons/:id/top-assists -> { season, assisters: [...] }
export async function getTopAssists(seasonId: string): Promise<StatLeaderRow[]> {
  const { data } = await api.get(`/api/menyesha/seasons/${seasonId}/top-assists`);
  const payload = unwrap<any>(data);
  return (payload?.assisters ?? payload ?? []) as StatLeaderRow[];
}
