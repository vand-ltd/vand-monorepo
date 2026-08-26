'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toPng } from 'html-to-image';
import { getMatchEvents, type Match, type Team } from '@org/api';
import { X, Download, Copy, Check, Loader2, Square, RectangleVertical } from 'lucide-react';
import {
  ResultCard,
  resolveLogoUrl,
  buildScorers,
  buildCaption,
  type CardSize,
} from './ResultCard';
import { urlToDataUrl, slugify } from './graphicUtils';

export function MatchGraphicModal({
  match,
  homeName,
  awayName,
  homeTeam,
  awayTeam,
  competitionLabel,
  onClose,
}: {
  match: Match;
  homeName: string;
  awayName: string;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  competitionLabel?: string;
  onClose: () => void;
}) {
  const [size, setSize] = useState<CardSize>('square');
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const eventsQuery = useQuery({
    queryKey: ['football', 'events', match.id],
    queryFn: () => getMatchEvents(match.id),
  });
  const scorers = useMemo(
    () => buildScorers(eventsQuery.data ?? [], match),
    [eventsQuery.data, match]
  );

  // Embed both crests as data URLs (best-effort) before rendering the card.
  const homeLogo = resolveLogoUrl(homeTeam);
  const awayLogo = resolveLogoUrl(awayTeam);
  const crestsQuery = useQuery({
    queryKey: ['result-card-crests', homeLogo, awayLogo],
    queryFn: async () => {
      const [h, a] = await Promise.all([
        homeLogo ? urlToDataUrl(homeLogo) : Promise.resolve(null),
        awayLogo ? urlToDataUrl(awayLogo) : Promise.resolve(null),
      ]);
      return { home: h, away: a };
    },
  });

  const ready = eventsQuery.isSuccess && crestsQuery.isSuccess;

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Make sure the web font's glyphs are ready before rasterizing.
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready;
      }
      // No cacheBust: our images are embedded data URLs, and cache-busting
      // appends a query string that corrupts data URIs (crest drops out of PNG).
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: '#003153',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tugezo-${slugify(homeName)}-vs-${slugify(awayName)}-${size}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  const copyCaption = async () => {
    const caption = buildCaption({ match, homeName, awayName, competitionLabel });
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  // Scale the 1080px-wide card down into the preview column.
  const cardW = 1080;
  const cardH = size === 'square' ? 1080 : 1920;
  const scale = 300 / cardW;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Result graphic</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
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
            {!ready ? (
              <div className="flex h-[300px] items-center justify-center text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div
                style={{ width: cardW * scale, height: cardH * scale, overflow: 'hidden' }}
                className="rounded-lg shadow-lg"
              >
                <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
                  <ResultCard
                    ref={cardRef}
                    size={size}
                    match={match}
                    homeName={homeName}
                    awayName={awayName}
                    homeCrest={crestsQuery.data?.home ?? null}
                    awayCrest={crestsQuery.data?.away ?? null}
                    scorers={scorers}
                    competitionLabel={competitionLabel}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={download}
              disabled={!ready || downloading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#003153] hover:bg-[#005F73] px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PNG
            </button>
            <button
              onClick={copyCaption}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              Caption
            </button>
          </div>
          {(crestsQuery.data && (homeLogo && !crestsQuery.data.home)) ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Team crest couldn’t be embedded (needs CORS on the media host) — initials shown instead.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
