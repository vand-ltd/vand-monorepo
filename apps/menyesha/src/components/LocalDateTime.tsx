'use client';

import { useEffect, useState } from 'react';
import { isTbdKickoff } from '@org/api';

// Renders a date/time in the VIEWER's own timezone (like livescore.com).
//
// On server-rendered pages, formatting a device-local time during SSR would make
// the server (UTC) and the browser (the viewer's timezone) disagree, causing a
// React hydration mismatch (#418). To avoid that, this renders empty on the
// server and first client paint, then fills in the viewer-local value on mount.
// The time isn't needed for SEO (Google indexes the team names, scores and body,
// which stay server-rendered) — only the human viewer needs it, and they get it
// in their own timezone.
export function LocalDateTime({
  iso,
  locale = 'en',
  options,
  className,
  tbdLabel = 'TBD',
}: {
  iso?: string | null;
  locale?: string;
  options: Intl.DateTimeFormatOptions;
  className?: string;
  tbdLabel?: string;
}) {
  const tbd = isTbdKickoff(iso);
  // "TBD" is constant text, so it can render on the server too (no timezone-driven
  // hydration mismatch) — unlike a formatted local time.
  const [text, setText] = useState(tbd ? tbdLabel : '');

  useEffect(() => {
    if (!iso || tbd) {
      setText(tbd ? tbdLabel : '');
      return;
    }
    setText(new Date(iso).toLocaleString(locale, { hour12: false, ...options }));
    // options is a fresh object each render; re-running is cheap and idempotent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, locale, tbd, tbdLabel]);

  return (
    <time dateTime={tbd ? undefined : iso ?? undefined} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
