'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getStandings,
  getTopScorers,
  getTopAssists,
  type StandingsResult,
  type StandingRow,
  type StatLeaderRow,
} from '@org/api';
import { X, Download, Copy, Check, Loader2, Square, RectangleVertical } from 'lucide-react';
import {
  StatsCard,
  standingsBody,
  leaderboardBody,
  buildStatsCaption,
  type CardSize,
  type StandingGroupVM,
  type LeaderVM,
} from './StatsCard';
import { resolveLogoUrl } from './ResultCard';
import { urlToDataUrl, downloadCardPng, slugify } from './graphicUtils';

export type StatsGraphicType = 'standings' | 'scorers' | 'assists';

const TITLES: Record<StatsGraphicType, string> = {
  standings: 'Standings',
  scorers: 'Top Scorers',
  assists: 'Top Assists',
};

const playerPhoto = (r: StatLeaderRow): string | null =>
  typeof r.player.photo === 'string' && r.player.photo.startsWith('http') ? r.player.photo : null;

export function StatsGraphicModal({
  seasonId,
  competitionLabel,
  seasonName,
  type,
  onClose,
}: {
  seasonId: string;
  competitionLabel?: string;
  seasonName?: string;
  type: StatsGraphicType;
  onClose: () => void;
}) {
  const [size, setSize] = useState<CardSize>('square');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const dataQuery = useQuery({
    queryKey: ['stats-graphic', type, seasonId],
    queryFn: (): Promise<StandingsResult | StatLeaderRow[]> =>
      type === 'standings'
        ? getStandings(seasonId)
        : type === 'scorers'
          ? getTopScorers(seasonId)
          : getTopAssists(seasonId),
    enabled: !!seasonId,
  });

  // Every image URL to inline (team crests for standings, player photos for boards).
  const imgUrls = useMemo<string[]>(() => {
    const d = dataQuery.data;
    if (!d) return [];
    if (type === 'standings') {
      const res = d as StandingsResult;
      const rows = res.groups.length ? res.groups.flatMap((g) => g.standings) : res.standings;
      return rows.map((r) => resolveLogoUrl(r.team)).filter((u): u is string => !!u);
    }
    return (d as StatLeaderRow[]).map(playerPhoto).filter((u): u is string => !!u);
  }, [dataQuery.data, type]);

  const imgQuery = useQuery({
    queryKey: ['stats-graphic-imgs', type, seasonId, imgUrls.join(',')],
    queryFn: async () => {
      const entries = await Promise.all(imgUrls.map(async (u) => [u, await urlToDataUrl(u)] as const));
      const map: Record<string, string | null> = {};
      for (const [u, dataUrl] of entries) map[u] = dataUrl;
      return map;
    },
    enabled: dataQuery.isSuccess,
  });

  const ready = dataQuery.isSuccess && imgQuery.isSuccess;

  const built = useMemo(() => {
    const d = dataQuery.data;
    const imap = imgQuery.data ?? {};
    if (!d) return null;
    if (type === 'standings') {
      const res = d as StandingsResult;
      const toVM = (r: StandingRow) => {
        const url = resolveLogoUrl(r.team);
        return {
          position: r.position,
          name: r.team?.name ?? '—',
          crest: url ? imap[url] ?? null : null,
          played: r.played,
          won: r.won,
          drawn: r.drawn,
          lost: r.lost,
          gd: r.goalDifference,
          points: r.points,
        };
      };
      const groups: StandingGroupVM[] = res.groups.length
        ? res.groups.map((g) => ({ title: g.group?.name, rows: g.standings.map(toVM) }))
        : [{ rows: res.standings.map(toVM) }];
      return { kind: 'standings' as const, groups };
    }
    const cap = size === 'story' ? 15 : 10;
    const rows: LeaderVM[] = (d as StatLeaderRow[]).slice(0, cap).map((r) => {
      const url = playerPhoto(r);
      return {
        rank: r.rank,
        name: r.player.fullName,
        photo: url ? imap[url] ?? null : null,
        teamName: r.team?.name ?? '',
        count: type === 'scorers' ? r.goals : r.assists,
      };
    });
    return { kind: 'leaderboard' as const, rows };
  }, [dataQuery.data, imgQuery.data, type, size]);

  const isEmpty =
    built &&
    ((built.kind === 'standings' && built.groups.every((g) => g.rows.length === 0)) ||
      (built.kind === 'leaderboard' && built.rows.length === 0));

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      await downloadCardPng(
        cardRef.current,
        `menyesha-${slugify(competitionLabel ?? 'football')}-${type}-${size}.png`
      );
    } finally {
      setDownloading(false);
    }
  };

  const copyCaption = async () => {
    const top =
      built?.kind === 'leaderboard'
        ? built.rows.slice(0, 3).map((r) => ({ name: r.name, value: r.count }))
        : built?.kind === 'standings'
          ? (built.groups[0]?.rows.slice(0, 3).map((r) => ({ name: r.name, value: r.points })) ?? [])
          : [];
    const caption = buildStatsCaption({
      title: TITLES[type],
      competitionLabel,
      seasonLabel: seasonName,
      top,
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
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{TITLES[type]} graphic</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
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

          <div className="flex justify-center rounded-xl bg-gray-100 dark:bg-gray-800 p-4">
            {!ready ? (
              <div className="flex h-[320px] items-center justify-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : isEmpty ? (
              <div className="flex h-[320px] items-center justify-center text-center text-sm text-gray-400">
                No data for this season yet.
              </div>
            ) : (
              <div style={{ width: cardW * scale, height: cardH * scale, overflow: 'hidden' }} className="rounded-lg shadow-lg">
                <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
                  <StatsCard
                    ref={cardRef}
                    size={size}
                    competitionLabel={competitionLabel}
                    title={TITLES[type]}
                    seasonLabel={seasonName}
                  >
                    {built?.kind === 'standings'
                      ? standingsBody(size, built.groups)
                      : built?.kind === 'leaderboard'
                        ? leaderboardBody(size, built.rows)
                        : null}
                  </StatsCard>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={download}
              disabled={!ready || !!isEmpty || downloading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#003153] hover:bg-[#005F73] px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PNG
            </button>
            <button
              onClick={copyCaption}
              disabled={!!isEmpty}
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
