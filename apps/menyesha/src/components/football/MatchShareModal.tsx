'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { SocialIcons } from '@org/ui';
import { isTbdKickoff } from '@org/api';
import { urlToDataUrl, downloadCardPng, slugify } from '@/lib/shareImage';
import { X, Download, Copy, Check, Loader2, Square, RectangleVertical } from 'lucide-react';

// `minutes` is a pre-formatted, comma-joined list (e.g. "68', 73'" or
// "45' (P), 73'") so a player who scored twice shows on one line.
export type Scorer = { name: string; minutes: string };

type CardSize = 'square' | 'story';
const DIMS: Record<
  CardSize,
  { w: number; h: number; pad: number; comp: number; crest: number; name: number; score: number; vs: number; status: number; logo: number; foot: number; scorer: number; maxScorers: number }
> = {
  square: { w: 1080, h: 1080, pad: 72, comp: 32, crest: 190, name: 38, score: 120, vs: 84, status: 28, logo: 44, foot: 26, scorer: 22, maxScorers: 5 },
  story: { w: 1080, h: 1920, pad: 90, comp: 36, crest: 240, name: 44, score: 148, vs: 96, status: 32, logo: 52, foot: 28, scorer: 27, maxScorers: 8 },
};

const DISPLAY = "Georgia, 'Times New Roman', serif";
const META = 'Arial, Helvetica, sans-serif';

function initials(name: string) {
  return (name || '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || '?';
}

// Inline SVG soccer ball — a real emoji (⚽) does not rasterize reliably in
// html-to-image, so we draw the ball as vector instead. White ball + dark
// pentagon reads clearly on the dark card.
function GoalBall({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }} aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="#ffffff" stroke="#0b1b28" strokeWidth="1.4" />
      <path d="M12 6.4 L15.6 9 L14.2 13.2 H9.8 L8.4 9 Z" fill="#0b1b28" />
      <g stroke="#0b1b28" strokeWidth="1.1" fill="none" strokeLinecap="round">
        <path d="M12 6.4 V2.3" />
        <path d="M15.6 9 L19.4 6.6" />
        <path d="M14.2 13.2 L17.3 16.4" />
        <path d="M9.8 13.2 L6.7 16.4" />
        <path d="M8.4 9 L4.6 6.6" />
      </g>
    </svg>
  );
}

function Crest({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.08)' }} />;
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: '3px solid rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.34,
        fontWeight: 800,
        color: '#F59E0B',
      }}
    >
      {initials(name)}
    </div>
  );
}

const MatchShareCard = forwardRef<
  HTMLDivElement,
  {
    size: CardSize;
    homeName: string;
    awayName: string;
    homeCrest: string | null;
    awayCrest: string | null;
    homeScore?: number | null;
    awayScore?: number | null;
    hasScore: boolean;
    competition?: string;
    statusLabel: string;
    logo: string | null;
    homeScorers: Scorer[];
    awayScorers: Scorer[];
  }
>(function MatchShareCard(
  { size, homeName, awayName, homeCrest, awayCrest, homeScore, awayScore, hasScore, competition, statusLabel, logo, homeScorers, awayScorers },
  ref
) {
  const d = DIMS[size];
  const teamCol = (name: string, crest: string | null, scorers: Scorer[]) => (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', gap: d.pad * 0.3, minWidth: 0 }}>
      <Crest url={crest} name={name} size={d.crest} />
      <span
        style={{
          color: '#fff',
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: d.name,
          textAlign: 'center',
          lineHeight: 1.08,
          maxWidth: d.w * 0.34,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {name}
      </span>
      {hasScore && scorers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: d.scorer * 0.2, marginTop: d.pad * 0.15 }}>
          {scorers.slice(0, d.maxScorers).map((s, i) => (
            <span
              key={i}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: d.scorer * 0.35, color: 'rgba(255,255,255,0.85)', fontSize: d.scorer, lineHeight: 1.3 }}
            >
              <GoalBall size={d.scorer * 0.95} />
              <span>
                {s.name} {s.minutes}
              </span>
            </span>
          ))}
          {scorers.length > d.maxScorers && (
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: d.scorer }}>+{scorers.length - d.maxScorers} more</span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={ref}
      style={{
        width: d.w,
        height: d.h,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg,#00243e,#003153 55%,#00121f)',
        fontFamily: META,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{ position: 'absolute', top: -160, right: -120, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.18), transparent 62%)' }}
      />

      {/* Competition */}
      <div style={{ position: 'relative', paddingTop: d.pad, textAlign: 'center' }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: d.comp, color: '#F59E0B', letterSpacing: 2, textTransform: 'uppercase' }}>
          {competition ?? 'Rwanda Football'}
        </span>
        <div style={{ height: 4, width: 64, borderRadius: 2, background: '#F59E0B', margin: '18px auto 0' }} />
      </div>

      {/* Teams + score */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'flex-start', paddingTop: d.pad * 0.4, padding: `${d.pad * 0.4}px ${d.pad}px 0`, gap: d.pad * 0.3 }}>
        {teamCol(homeName, homeCrest, homeScorers)}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: d.w * 0.2, marginTop: d.crest * 0.28 }}>
          {hasScore ? (
            <span style={{ color: '#fff', fontFamily: DISPLAY, fontWeight: 800, fontSize: d.score, lineHeight: 1, whiteSpace: 'nowrap' }}>
              {homeScore} <span style={{ color: 'rgba(255,255,255,0.35)' }}>–</span> {awayScore}
            </span>
          ) : (
            <span style={{ color: '#F59E0B', fontFamily: DISPLAY, fontWeight: 800, fontSize: d.vs }}>V</span>
          )}
        </div>
        {teamCol(awayName, awayCrest, awayScorers)}
      </div>

      {/* Status */}
      <div style={{ position: 'relative', textAlign: 'center', paddingBottom: d.pad * 1.4 }}>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: d.status, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {statusLabel}
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255,255,255,0.14)',
          margin: `0 ${d.pad}px`,
          paddingBottom: d.pad,
          paddingTop: d.pad * 0.5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Menyesha" style={{ height: d.logo, width: 'auto' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: d.logo * 0.7 }}>Menyesha</span>
          )}
        </div>
        <SocialIcons size={d.foot * 1.3} color="rgba(255,255,255,0.8)" />
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: d.foot }}>menyesha.vand.rw</span>
      </div>
    </div>
  );
});

export function MatchShareModal({
  open,
  onClose,
  homeName,
  awayName,
  homeCrestUrl,
  awayCrestUrl,
  homeScore,
  awayScore,
  hasScore,
  competition,
  kickoffAt,
  url,
  homeScorers = [],
  awayScorers = [],
}: {
  open: boolean;
  onClose: () => void;
  homeName: string;
  awayName: string;
  homeCrestUrl?: string | null;
  awayCrestUrl?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  hasScore: boolean;
  competition?: string;
  kickoffAt?: string;
  url: string;
  homeScorers?: Scorer[];
  awayScorers?: Scorer[];
}) {
  const [size, setSize] = useState<CardSize>('square');
  const [homeCrest, setHomeCrest] = useState<string | null>(null);
  const [awayCrest, setAwayCrest] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      homeCrestUrl ? urlToDataUrl(homeCrestUrl) : Promise.resolve(null),
      awayCrestUrl ? urlToDataUrl(awayCrestUrl) : Promise.resolve(null),
      urlToDataUrl('/menyesha-logo-dark.svg'),
    ]).then(([h, a, l]) => {
      if (!alive) return;
      setHomeCrest(h);
      setAwayCrest(a);
      setLogo(l);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [open, homeCrestUrl, awayCrestUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const tbd = isTbdKickoff(kickoffAt);
  const dt = kickoffAt && !tbd ? new Date(kickoffAt) : null;
  const kickoffLabel = tbd
    ? 'TBD'
    : dt
      ? dt.toLocaleString('en', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Kigali' })
      : '';
  const statusLabel = hasScore ? 'Full time' : kickoffLabel || 'Upcoming';

  const scoreText = hasScore ? `${homeScore}–${awayScore}` : 'vs';
  const caption = [
    `${homeName} ${scoreText} ${awayName}${competition ? ` — ${competition}` : ''}${!hasScore && kickoffLabel ? ` · ${kickoffLabel}` : ''}`,
    url,
    '#Menyesha #Rwanda #Football',
  ]
    .filter(Boolean)
    .join('\n\n');

  const d = DIMS[size];
  const previewW = size === 'square' ? 320 : 250;
  const scale = previewW / d.w;

  const download = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      await downloadCardPng(cardRef.current, `menyesha-${slugify(`${homeName}-${awayName}`).slice(0, 40)}-${size}.png`);
    } finally {
      setDownloading(false);
    }
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const sizeBtn = (s: CardSize, label: string, Icon: typeof Square) => (
    <button
      type="button"
      onClick={() => setSize(s)}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
        size === s
          ? 'border-brand-primary bg-brand-primary text-white dark:border-brand-accent dark:bg-brand-accent dark:text-gray-900'
          : 'border-gray-200 text-gray-600 hover:border-brand-primary/40 dark:border-gray-700 dark:text-gray-300'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Share as image</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          {sizeBtn('square', 'Square', Square)}
          {sizeBtn('story', 'Story', RectangleVertical)}
        </div>

        <div className="flex justify-center rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary dark:text-brand-accent" />
            </div>
          ) : (
            <div style={{ width: previewW, height: d.h * scale, overflow: 'hidden', borderRadius: 12 }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <MatchShareCard
                  ref={cardRef}
                  size={size}
                  homeName={homeName}
                  awayName={awayName}
                  homeCrest={homeCrest}
                  awayCrest={awayCrest}
                  homeScore={homeScore}
                  awayScore={awayScore}
                  hasScore={hasScore}
                  competition={competition}
                  statusLabel={statusLabel}
                  logo={logo}
                  homeScorers={homeScorers}
                  awayScorers={awayScorers}
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={download}
          disabled={loading || downloading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-secondary disabled:opacity-50 dark:bg-brand-accent dark:text-gray-900"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download image
        </button>

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Caption</span>
            <button type="button" onClick={copyCaption} className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline dark:text-brand-accent">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            readOnly
            value={caption}
            rows={4}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
      </div>
    </div>
  );
}
