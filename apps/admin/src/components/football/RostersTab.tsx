'use client';

import { useQuery } from '@tanstack/react-query';
import { getSeasonEntries, type Team, type Season } from '@org/api';
import { Loader2, ClipboardList } from 'lucide-react';
import { cardClass } from './styles';

function deriveShort(name?: string): string {
  return (name ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
}
function teamInitials(t: { shortName?: string; name?: string }): string {
  return (t.shortName?.trim() || deriveShort(t.name) || (t.name ?? '').slice(0, 2)).toUpperCase();
}
function resolveLogoUrl(t: Team): string | null {
  if (t.logoUrl) return t.logoUrl;
  const l = t.logo;
  if (!l) return null;
  if (typeof l === 'string') return l.startsWith('http') ? l : null;
  return l.url ?? null;
}

export function RostersTab({
  seasonId,
  season,
  competitionName,
}: {
  seasonId: string;
  season: Season | null;
  competitionName?: string;
}) {
  const entriesQuery = useQuery({
    queryKey: ['football', 'entries', seasonId],
    queryFn: () => getSeasonEntries(seasonId),
    enabled: !!seasonId,
  });
  const teams = entriesQuery.data ?? [];

  if (!seasonId) {
    return (
      <div className={`${cardClass} p-8 text-center`}>
        <ClipboardList className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a competition and season above to see the enrolled teams.
        </p>
      </div>
    );
  }

  const scopeLabel = [competitionName, season?.name].filter(Boolean).join(' · ');

  return (
    <section className={`${cardClass} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Enrolled teams</h2>
          {scopeLabel && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{scopeLabel}</p>
          )}
        </div>
        <span className="text-sm text-gray-400 shrink-0">{teams.length} teams</span>
      </div>

      {entriesQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#003153] dark:text-[#F59E0B]" />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No teams enrolled in this season yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map((t: Team) => {
            const url = resolveLogoUrl(t);
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-3"
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover bg-white"
                  />
                ) : (
                  <span className="h-10 w-10 shrink-0 rounded-full bg-[#003153] text-white text-xs font-bold flex items-center justify-center">
                    {teamInitials(t)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {t.name}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {[t.shortName || deriveShort(t.name), t.city].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
