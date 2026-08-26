'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeams } from '@org/api';

// Standings rows can arrive without a team `slug` (the standings endpoint omits
// it, unlike the match endpoints), which drops the link to the team page. This
// caches the public teams list once and returns an id→slug map so those rows can
// still resolve their slug. `resolveSlug` falls back to the map when the row has
// no slug of its own.
export function useTeamSlugMap(): {
  slugById: Record<string, string>;
  resolveSlug: (team?: { id?: string; slug?: string | null } | null) => string | undefined;
} {
  const { data } = useQuery({
    queryKey: ['team-slug-map'],
    queryFn: () => getTeams(),
    staleTime: 1000 * 60 * 30,
  });

  const slugById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of data ?? []) if (t.id && t.slug) map[t.id] = t.slug;
    return map;
  }, [data]);

  const resolveSlug = (team?: { id?: string; slug?: string | null } | null) =>
    team?.slug ?? (team?.id ? slugById[team.id] : undefined) ?? undefined;

  return { slugById, resolveSlug };
}
