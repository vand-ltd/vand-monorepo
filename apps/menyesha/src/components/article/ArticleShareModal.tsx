'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { urlToDataUrl, coverDataUrl, downloadCardPng, slugify } from '@/lib/shareImage';
import { X, Download, Copy, Check, Loader2, Square, RectangleVertical } from 'lucide-react';

type CardSize = 'square' | 'story';
const DIMS: Record<CardSize, { w: number; h: number; pad: number; title: number; cat: number; logo: number; foot: number; lines: number }> = {
  square: { w: 1080, h: 1080, pad: 64, title: 62, cat: 28, logo: 42, foot: 26, lines: 4 },
  story: { w: 1080, h: 1920, pad: 76, title: 74, cat: 30, logo: 50, foot: 28, lines: 5 },
};

const TITLE_FONT = "Georgia, 'Times New Roman', serif";
const META_FONT = "Arial, Helvetica, sans-serif";

const ShareCard = forwardRef<
  HTMLDivElement,
  { size: CardSize; cover: string | null; logo: string | null; title: string; date?: string }
>(function ShareCard({ size, cover, logo, title, date }, ref) {
  const d = DIMS[size];
  return (
    <div
      ref={ref}
      style={{
        width: d.w,
        height: d.h,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(160deg,#00243e,#003153 55%,#00121f)',
        fontFamily: META_FONT,
      }}
    >
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {/* Legibility gradient — darkens the bottom where the text sits. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,18,31,0.15) 0%, rgba(0,18,31,0) 28%, rgba(0,18,31,0.55) 60%, rgba(0,18,31,0.96) 100%)',
        }}
      />

      <div style={{ position: 'absolute', left: d.pad, right: d.pad, bottom: d.pad }}>
        <div
          style={{
            color: '#fff',
            fontFamily: TITLE_FONT,
            fontWeight: 800,
            fontSize: d.title,
            lineHeight: 1.08,
            display: '-webkit-box',
            WebkitLineClamp: d.lines,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textShadow: '0 2px 12px rgba(0,0,0,0.35)',
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: d.pad * 0.55, display: 'flex', alignItems: 'center', gap: 16 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Menyesha" style={{ height: d.logo, width: 'auto' }} />
          ) : (
            <span style={{ color: '#fff', fontWeight: 800, fontSize: d.logo * 0.7 }}>Menyesha</span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.72)', fontSize: d.foot }}>menyesha.vand.rw</span>
          {date && <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.6)', fontSize: d.foot }}>{date}</span>}
        </div>
      </div>
    </div>
  );
});

export function ArticleShareModal({
  open,
  onClose,
  title,
  excerpt,
  thumbnailUrl,
  categoryName,
  createdAt,
  url,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  excerpt?: string;
  thumbnailUrl?: string;
  categoryName?: string;
  createdAt?: string;
  url: string;
}) {
  const [size, setSize] = useState<CardSize>('square');
  const [cover, setCover] = useState<string | null>(null);
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
      thumbnailUrl ? coverDataUrl(thumbnailUrl) : Promise.resolve(null),
      urlToDataUrl('/menyesha-logo-dark.svg'),
    ]).then(([c, l]) => {
      if (!alive) return;
      setCover(c);
      setLogo(l);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [open, thumbnailUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const date = createdAt
    ? new Date(createdAt).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Africa/Kigali' })
    : undefined;

  const caption = [
    title,
    excerpt?.trim(),
    url,
    `#Menyesha #Rwanda${categoryName ? ` #${categoryName.replace(/[^a-zA-Z0-9]/g, '')}` : ''}`,
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
      await downloadCardPng(cardRef.current, `menyesha-${slugify(title).slice(0, 40)}-${size}.png`);
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
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Preview */}
        <div className="flex justify-center rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary dark:text-brand-accent" />
            </div>
          ) : (
            <div style={{ width: previewW, height: d.h * scale, overflow: 'hidden', borderRadius: 12 }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <ShareCard ref={cardRef} size={size} cover={cover} logo={logo} title={title} date={date} />
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

        {/* Caption */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Caption</span>
            <button
              type="button"
              onClick={copyCaption}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline dark:text-brand-accent"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            readOnly
            value={caption}
            rows={5}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
          <p className="mt-1.5 text-[11px] text-gray-400">
            Post the image, and paste this caption. The description lives here — not on the image — so it stays crisp.
          </p>
        </div>
      </div>
    </div>
  );
}
