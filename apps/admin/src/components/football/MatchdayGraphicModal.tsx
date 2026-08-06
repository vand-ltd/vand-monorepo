'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMatches, type Match } from '@org/api';
import { X, Download, Copy, Check, Loader2, Square, RectangleVertical } from 'lucide-react';
import { StatsCard, matchdayBody, buildStatsCaption, type CardSize, type FixtureVM } from './StatsCard';
import { resolveLogoUrl } from './ResultCard';
import { urlToDataUrl, downloadCardPng, slugify } from './graphicUtils';

type Bucket = { key: string; label: string; matches: Match[]; first: number };

// Group matches into a selectable round: league rounds, cup group-stage
// matchdays (per stage + round), and each knockout round (per stage).
function bucketOf(m: Match): { key: string; label: string } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const st = (m as any).stage as { id?: string; name?: string; type?: string } | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stageId = (m as any).stageId ?? st?.id ?? '';
  if (st?.type === 'Knockout') return { key: `ko:${stageId}`, label: st.name ?? 'Knockout' };
  if (st?.type === 'Group') return { key: `grp:${stageId}:${m.round}`, label: `${st.name ?? 'Group stage'} · ${m.round}` };
  return { key: `rnd:${m.round}`, label: m.round || 'Matchday' };
}

export function MatchdayGraphicModal({
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
  const [size, setSize] = useState<CardSize>('story');
  const [mode, setMode] = useState<'fixtures' | 'results' | 'all'>('all');
  const [bucketKey, setBucketKey] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const matchesQuery = useQuery({
    queryKey: ['matchday-graphic', seasonId],
    queryFn: () => getMatches({ seasonId, order: 'asc' }),
    enabled: !!seasonId,
  });
  const matches = matchesQuery.data ?? [];

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();
    for (const m of matches) {
      const { key, label } = bucketOf(m);
      const kt = m.kickoffAt ? new Date(m.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
      const ex = map.get(key);
      if (ex) {
        ex.matches.push(m);
        ex.first = Math.min(ex.first, kt);
      } else {
        map.set(key, { key, label, matches: [m], first: kt });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.first - b.first);
  }, [matches]);

  const bucket = buckets.find((b) => b.key === bucketKey) ?? null;

  // Results = FullTime; Fixtures = not finished. Keyed on status, not score
  // (a scheduled match may carry a default 0–0).
  const filtered = useMemo(() => {
    const bm = bucket?.matches ?? [];
    return bm.filter((m) => {
      const finished = m.status === 'FullTime';
      return mode === 'all' ? true : mode === 'results' ? finished : !finished;
    });
  }, [bucket, mode]);

  const imgUrls = useMemo(() => {
    const urls: string[] = [];
    for (const m of bucket?.matches ?? []) {
      const h = resolveLogoUrl(m.homeTeam);
      if (h) urls.push(h);
      const a = resolveLogoUrl(m.awayTeam);
      if (a) urls.push(a);
    }
    return Array.from(new Set(urls));
  }, [bucket]);

  const imgQuery = useQuery({
    queryKey: ['matchday-imgs', bucketKey, imgUrls.join(',')],
    queryFn: async () => {
      const map: Record<string, string | null> = {};
      await Promise.all(imgUrls.map(async (u) => (map[u] = await urlToDataUrl(u))));
      return map;
    },
    enabled: !!bucketKey && matchesQuery.isSuccess,
  });

  const ready = !!bucketKey && matchesQuery.isSuccess && imgQuery.isSuccess;

  const cap = size === 'story' ? 18 : 9;
  const rows: FixtureVM[] = useMemo(() => {
    const imap = imgQuery.data ?? {};
    return filtered.slice(0, cap).map((m) => {
      const done = m.status === 'FullTime' && m.homeScore != null && m.awayScore != null;
      const dt = m.kickoffAt ? new Date(m.kickoffAt) : null;
      const hu = resolveLogoUrl(m.homeTeam);
      const au = resolveLogoUrl(m.awayTeam);
      return {
        id: m.id,
        date: dt ? dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) : '',
        homeName: m.homeTeam?.name ?? '—',
        homeCrest: hu ? imap[hu] ?? null : null,
        awayName: m.awayTeam?.name ?? '—',
        awayCrest: au ? imap[au] ?? null : null,
        emphasize: null,
        score: done ? `${m.homeScore}–${m.awayScore}` : null,
        time: dt ? dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      } as FixtureVM;
    });
  }, [filtered, imgQuery.data, cap]);

  const title = bucket?.label ?? 'Matchday';
  const modeTitle = mode === 'results' ? 'Results' : mode === 'fixtures' ? 'Fixtures' : '';

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      await downloadCardPng(
        cardRef.current,
        `menyesha-${slugify(competitionLabel ?? 'football')}-${slugify(title)}-${mode}-${size}.png`
      );
    } finally {
      setDownloading(false);
    }
  };

  const copyCaption = async () => {
    const caption = buildStatsCaption({
      title: [title, modeTitle].filter(Boolean).join(' · '),
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
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Matchday graphic</h3>
          <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Round / stage picker */}
          <select
            value={bucketKey}
            onChange={(e) => setBucketKey(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B]"
          >
            <option value="">Select a round / stage…</option>
            {buckets.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label} ({b.matches.length})
              </option>
            ))}
          </select>

          {/* Fixtures / Results / All */}
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
            {!bucketKey ? (
              <div className="flex h-[320px] items-center justify-center text-center text-sm text-gray-400">
                Pick a round or stage to preview.
              </div>
            ) : !ready ? (
              <div className="flex h-[320px] items-center justify-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="flex h-[320px] items-center justify-center text-center text-sm text-gray-400">
                {mode === 'results' ? 'No results in this round yet.' : mode === 'fixtures' ? 'No upcoming fixtures in this round.' : 'No matches in this round.'}
              </div>
            ) : (
              <div style={{ width: cardW * scale, height: cardH * scale, overflow: 'hidden' }} className="rounded-lg shadow-lg">
                <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
                  <StatsCard ref={cardRef} size={size} competitionLabel={competitionLabel} title={title} seasonLabel={seasonName}>
                    {matchdayBody(size, rows)}
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
              disabled={!bucketKey}
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
