'use client';

import { useEffect, useState } from 'react';
import type { Match } from '@org/api';

/** Statuses that count as in-progress (share the red "live" treatment). */
export const LIVE_STATUSES = ['Live', 'HalfTime'];

/**
 * Re-renders the caller on an interval while `active`, so time-derived values
 * (the live match clock) keep advancing between data refetches. Returns the
 * current epoch ms. When `active` is false no timer runs.
 */
export function useNow(active: boolean, everyMs = 15000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now()); // sync immediately when a match goes live
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [active, everyMs]);
  return now;
}

/**
 * The clock label for a match, LiveScore-style.
 *
 * The backend stamps `liveStartedAt` on each transition into Live (the whistle)
 * and sets `minute` to the half's base (0 first half, 45 second). We count the
 * wall-clock minutes since that whistle and add them to the base, so the clock
 * ticks on its own: 1→45 in the first half, 45→90 in the second. The ~30s data
 * poll re-reads both fields, so any drift self-corrects.
 *
 * - HalfTime                     → the "HT" label (frozen)
 * - Live, counting               → e.g. `73'`
 * - Live but no `liveStartedAt`  → fall back to `minute` or the "LIVE" label
 *                                  (older data, or a match live before deploy)
 * - Not in progress              → null (caller renders FT / kickoff instead)
 *
 * @param now epoch ms from {@link useNow} — passing it (not calling Date.now()
 *   here) is what makes the value advance on the interval.
 */
export function liveMinuteLabel(
  m: Match,
  now: number,
  labels: { live: string; halfTime: string },
): string | null {
  if (m.status === 'HalfTime') return labels.halfTime;
  if (m.status !== 'Live') return null;

  const base = m.minute ?? 0;
  // Where the half normally ends; time past it is stoppage → "45+2'" / "90+3'".
  // base 45+ means the second half kicked off.
  const normalEnd = base >= 45 ? 90 : 45;

  const anchor = m.liveStartedAt ? new Date(m.liveStartedAt).getTime() : null;
  if (!anchor || !Number.isFinite(anchor)) {
    // No whistle timestamp (pre-deploy / in-flight): show the raw admin minute.
    return m.minute != null ? `${m.minute}'` : labels.live;
  }

  const elapsed = Math.max(0, Math.floor((now - anchor) / 60000));
  let mins = base + elapsed;
  if (base === 0) mins = Math.max(1, mins); // never show 0' at kickoff

  // Keep counting past 45/90 as stoppage until the admin flips the status.
  return mins > normalEnd ? `${normalEnd}+${mins - normalEnd}'` : `${mins}'`;
}
