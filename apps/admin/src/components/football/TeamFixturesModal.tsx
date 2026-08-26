'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSeasonEntries, getMatches, isTbdKickoff, type Team } from '@org/api';
import { X, Download, Copy, Check, Loader2, Square, RectangleVertical } from 'lucide-react';
import { StatsCard, fixturesBody, buildStatsCaption, type CardSize, type FixtureVM } from './StatsCard';
import { resolveLogoUrl } from './ResultCard';
import { urlToDataUrl, downloadCardPng, slugify } from './graphicUtils';

export function TeamFixturesModal({
  seasonId,
  competitionLabel,
  seasonName,
  onClose,
}: {
  seasonId: string;
  competitionLabel?: string;
  seasonName?: string;
  onClose: () => void;
}) {
  const [size, setSize] = useState<CardSize>('story'); // fixture lists are tall
  const [mode, setMode] = useState<'fixtures' | 'results' | 'all'>('fixtures');
  const [teamId, setTeamId] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const teamsQuery = useQuery({
    queryKey: ['season-entries', seasonId],
    queryFn: () => getSeasonEntries(seasonId),
    enabled: !!seasonId,
  });
  const teams = teamsQuery.data ?? [];
  const team = teams.find((t: Team) => t.id === teamId) ?? null;

  const matchesQuery = useQuery({
    queryKey: ['team-fixtures-graphic', teamId, seasonId],
    queryFn: () => getMatches({ teamId, seasonId, order: 'asc' }),
    enabled: !!teamId && !!seasonId,
  });
  const matches = matchesQuery.data ?? [];

  // Team crest + every opponent crest to inline.
  const imgUrls = useMemo(() => {
    const urls: string[] = [];
    if (team) {
      const u = resolveLogoUrl(team);
      if (u) urls.push(u);
    }
    for (const m of matches) {
      const opp = m.homeTeamId === teamId ? m.awayTeam : m.homeTeam;
      const u = resolveLogoUrl(opp);
      if (u) urls.push(u);
    }
    return Array.from(new Set(urls));
  }, [team, matches, teamId]);

  const imgQuery = useQuery({
    queryKey: ['team-fixtures-imgs', teamId, imgUrls.join(',')],
    queryFn: async () => {
      const map: Record<string, string | null> = {};
      await Promise.all(imgUrls.map(async (u) => (map[u] = await urlToDataUrl(u))));
      return map;
    },
    enabled: !!teamId && matchesQuery.isSuccess,
  });

  const ready = !!teamId && matchesQuery.isSuccess && imgQuery.isSuccess;

  // Results = FullTime; Fixtures = anything not finished (Scheduled, etc.).
  // Keyed on status, not score, since a scheduled match may carry a default 0–0.
  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const finished = m.status === 'FullTime';
      return mode === 'all' ? true : mode === 'results' ? finished : !finished;
    });
  }, [matches, mode]);

  const cap = size === 'story' ? 18 : 9;
  const rows: FixtureVM[] = useMemo(() => {
    const imap = imgQuery.data ?? {};
    return filtered.slice(0, cap).map((m) => {
      // Only a finished match shows a score; scheduled ones show kickoff time.
      const done = m.status === 'FullTime' && m.homeScore != null && m.awayScore != null;
      const tbd = isTbdKickoff(m.kickoffAt);
      const dt = m.kickoffAt && !tbd ? new Date(m.kickoffAt) : null;
      const homeUrl = resolveLogoUrl(m.homeTeam);
      const awayUrl = resolveLogoUrl(m.awayTeam);
      return {
        id: m.id,
        date: tbd ? 'TBD' : dt ? dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) : '',
        homeName: m.homeTeam?.name ?? '—',
        homeCrest: homeUrl ? imap[homeUrl] ?? null : null,
        awayName: m.awayTeam?.name ?? '—',
        awayCrest: awayUrl ? imap[awayUrl] ?? null : null,
        emphasize: m.homeTeamId === teamId ? 'home' : 'away',
        score: done ? `${m.homeScore}–${m.awayScore}` : null,
        time: tbd ? '' : dt ? dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      } as FixtureVM;
    });
  }, [filtered, teamId, imgQuery.data, cap]);

  const teamCrest = team ? imgQuery.data?.[resolveLogoUrl(team) ?? ''] ?? null : null;
  const modeTitle = mode === 'results' ? 'Results' : mode === 'all' ? 'Fixtures & Results' : 'Fixtures';

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      await downloadCardPng(cardRef.current, `tugezo-${slugify(team?.name ?? 'team')}-${mode}-${size}.png`);
    } finally {
      setDownloading(false);
    }
  };

  const copyCaption = async () => {
    const caption = buildStatsCaption({
      title: `${team?.name ?? ''} — ${modeTitle}`,
      competitionLabel,
      seasonLabel: seasonName,
    });
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const cardW = 1080;
  const cardH = size === 'square' ? 1080 : 1920;
  const scale = 320 / cardW;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Team fixtures graphic</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Team picker */}
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B]"
          >
            <option value="">Select a team…</option>
            {teams.map((tm: Team) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>

          {/* Fixtures / Results / All filter */}
          <div className="inline-flex w-full overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
            {(
              [
                { key: 'fixtures', label: 'Fixtures' },
                { key: 'results', label: 'Results' },
                { key: 'all', label: 'All' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                  mode === key
                    ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Size toggle */}
          <div className="flex gap-2">
            {(
              [
                { key: 'square', label: 'Square · Feed', icon: Square },
                { key: 'story', label: 'Story · Status', icon: RectangleVertical },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSize(key)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  size === key
                    ? 'border-[#003153] bg-[#003153] text-white dark:border-[#F59E0B] dark:bg-[#F59E0B] dark:text-gray-900'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="flex justify-center rounded-xl bg-gray-100 dark:bg-gray-800 p-4">
            {!teamId ? (
              <div className="flex h-[320px] items-center justify-center text-center text-sm text-gray-400">
                Pick a team to preview its fixtures.
              </div>
            ) : !ready ? (
              <div className="flex h-[320px] items-center justify-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="flex h-[320px] items-center justify-center text-center text-sm text-gray-400">
                {mode === 'results'
                  ? 'No results yet for this team.'
                  : mode === 'fixtures'
                    ? 'No upcoming fixtures for this team.'
                    : 'No matches for this team yet.'}
              </div>
            ) : (
              <div style={{ width: cardW * scale, height: cardH * scale, overflow: 'hidden' }} className="rounded-lg shadow-lg">
                <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
                  <StatsCard
                    ref={cardRef}
                    size={size}
                    competitionLabel={competitionLabel}
                    title={modeTitle}
                    seasonLabel={seasonName}
                  >
                    {fixturesBody(size, { name: team?.name ?? '', crest: teamCrest }, rows)}
                  </StatsCard>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={download}
              disabled={!ready || rows.length === 0 || downloading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#003153] hover:bg-[#005F73] px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PNG
            </button>
            <button
              onClick={copyCaption}
              disabled={!teamId}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              Caption
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
