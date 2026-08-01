'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCompetitions, getSeasons, type Competition, type Season } from '@org/api';
import { Loader2, Settings, Users, CalendarDays, ClipboardList, Layers, ImageDown } from 'lucide-react';
import { AdminGuard } from '@/components/AdminGuard';
import { SetupTab } from '@/components/football/SetupTab';
import { RostersTab } from '@/components/football/RostersTab';
import { SquadsTab } from '@/components/football/SquadsTab';
import { FixturesTab } from '@/components/football/FixturesTab';
import { StagesTab } from '@/components/football/StagesTab';
import { StatsTab } from '@/components/football/StatsTab';

type Tab = 'setup' | 'rosters' | 'stages' | 'squads' | 'fixtures' | 'stats';

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'setup', label: 'Setup', icon: Settings },
  { key: 'rosters', label: 'Enrolled Teams', icon: ClipboardList },
  { key: 'stages', label: 'Stages & Groups', icon: Layers },
  { key: 'squads', label: 'Squads', icon: Users },
  { key: 'fixtures', label: 'Fixtures & Results', icon: CalendarDays },
  { key: 'stats', label: 'Graphics', icon: ImageDown },
];

export default function FootballConsolePage() {
  const [tab, setTab] = useState<Tab>('setup');
  const [competitionId, setCompetitionId] = useState('');
  const [seasonId, setSeasonId] = useState('');

  const competitionsQuery = useQuery({
    queryKey: ['football', 'competitions'],
    queryFn: getCompetitions,
  });
  const competitions = competitionsQuery.data ?? [];

  const seasonsQuery = useQuery({
    queryKey: ['football', 'seasons', competitionId],
    queryFn: () => getSeasons(competitionId || undefined),
    enabled: !!competitionId,
  });
  const seasons = seasonsQuery.data ?? [];

  // Keep the season selection valid when the competition changes.
  const seasonOptions = useMemo(() => seasons, [seasons]);
  const selectedSeason = seasonOptions.find((s) => s.id === seasonId) ?? null;

  const selectClass =
    'px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] min-w-[180px]';

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Football</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage competitions, teams, squads, fixtures and live scores.
          </p>
        </div>

        {/* Competition / Season scope selector */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Competition
            </label>
            <select
              value={competitionId}
              onChange={(e) => {
                setCompetitionId(e.target.value);
                setSeasonId('');
              }}
              className={selectClass}
            >
              <option value="">Select competition…</option>
              {competitions.map((c: Competition) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Season
            </label>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              disabled={!competitionId || seasonsQuery.isLoading}
              className={selectClass}
            >
              <option value="">
                {seasonsQuery.isLoading ? 'Loading…' : 'Select season…'}
              </option>
              {seasonOptions.map((s: Season) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.isCurrent ? ' (current)' : ''}
                </option>
              ))}
            </select>
          </div>
          {competitionsQuery.isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400 mb-2.5" />
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          {TABS.map((tItem) => {
            const active = tab === tItem.key;
            return (
              <button
                key={tItem.key}
                type="button"
                onClick={() => setTab(tItem.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  active
                    ? 'border-[#003153] dark:border-[#F59E0B] text-[#003153] dark:text-[#F59E0B]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <tItem.icon className="h-4 w-4" />
                {tItem.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === 'setup' && (
          <SetupTab competitionId={competitionId} seasonId={seasonId} />
        )}
        {tab === 'rosters' && (
          <RostersTab
            seasonId={seasonId}
            season={selectedSeason}
            competitionName={competitions.find((c) => c.id === competitionId)?.name}
          />
        )}
        {tab === 'stages' && <StagesTab seasonId={seasonId} season={selectedSeason} />}
        {tab === 'squads' && <SquadsTab seasonId={seasonId} season={selectedSeason} />}
        {tab === 'fixtures' && <FixturesTab seasonId={seasonId} season={selectedSeason} />}
        {tab === 'stats' && <StatsTab seasonId={seasonId} season={selectedSeason} />}
      </div>
    </AdminGuard>
  );
}
