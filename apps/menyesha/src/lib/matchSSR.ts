import type { Match, MatchEvent, MatchLineup, LineupSlot } from '@org/api';

// Server-side (ISR-cached) fetches for match detail, used to seed the client
// queries with initialData so the score, events and lineups are in the initial
// HTML (crawlable) while the client still polls for live updates. `revalidate`
// keeps this cheap — the API is hit at most once per 60s per match, not per
// request.

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menyesha.vand.rw';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}

export async function ssrMatch(slug: string): Promise<Match | null> {
  return get<Match>(`/api/menyesha/matches/slug/${slug}`);
}

export async function ssrEvents(matchId: string): Promise<MatchEvent[]> {
  return (await get<MatchEvent[]>(`/api/menyesha/matches/${matchId}/events`)) ?? [];
}

// Normalizes the lineup exactly like the client getMatchLineup, so the seeded
// initialData matches the query's expected shape.
export async function ssrLineup(matchId: string, teamId: string): Promise<MatchLineup | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = await get<any>(`/api/menyesha/matches/${matchId}/lineups/${teamId}`);
  if (!p) return null;
  const slots: LineupSlot[] = (p.slots ?? p.players ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Fetches everything a match page needs in parallel (all ISR-cached).
export async function ssrMatchBundle(slug: string): Promise<{
  match: Match | null;
  events: MatchEvent[];
  homeLineup: MatchLineup | null;
  awayLineup: MatchLineup | null;
}> {
  const match = await ssrMatch(slug);
  if (!match) return { match: null, events: [], homeLineup: null, awayLineup: null };
  const matchId = match.id;
  const homeTeamId = match.homeTeamId ?? (match as unknown as { homeTeam?: { id: string } }).homeTeam?.id;
  const awayTeamId = match.awayTeamId ?? (match as unknown as { awayTeam?: { id: string } }).awayTeam?.id;
  const [events, homeLineup, awayLineup] = await Promise.all([
    ssrEvents(matchId),
    homeTeamId ? ssrLineup(matchId, homeTeamId) : Promise.resolve(null),
    awayTeamId ? ssrLineup(matchId, awayTeamId) : Promise.resolve(null),
  ]);
  return { match, events, homeLineup, awayLineup };
}
