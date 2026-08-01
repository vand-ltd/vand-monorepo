import { forwardRef } from 'react';
import { Oswald } from 'next/font/google';
import type { Match, MatchEvent, Team } from '@org/api';
import { MENYESHA_LOGO } from './brand';

// Condensed, broadcast-style display font for the scoreline / names / labels.
// Self-hosted by next/font (same-origin), so html-to-image can embed it cleanly.
const oswald = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const DISPLAY = oswald.style.fontFamily;

/* --------------------------------- Helpers -------------------------------- */

// Crest URL is stored three ways (logoUrl | logo string | logo.url) — resolve all.
export function resolveLogoUrl(t?: Team | null): string | null {
  if (!t) return null;
  if (t.logoUrl) return t.logoUrl;
  const l = t.logo;
  if (!l) return null;
  if (typeof l === 'string') return l.startsWith('http') ? l : null;
  return l.url ?? null;
}

export function teamInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase() || '?'
  );
}

const GOAL_TYPES = ['Goal', 'Penalty', 'OwnGoal'] as const;
type Scorer = { name: string; minute: string; sort: number };

function minuteLabel(e: MatchEvent): string {
  return `${e.minute}${e.extraMinute ? `+${e.extraMinute}` : ''}'`;
}

// Goals split onto the credited team's side (event.teamId), with (P)/(OG) tags.
export function buildScorers(events: MatchEvent[], match: Match): { home: Scorer[]; away: Scorer[] } {
  const home: Scorer[] = [];
  const away: Scorer[] = [];
  for (const e of events) {
    if (!GOAL_TYPES.includes(e.type as (typeof GOAL_TYPES)[number])) continue;
    const base = e.player?.fullName ?? '—';
    const suffix = e.type === 'Penalty' ? ' (P)' : e.type === 'OwnGoal' ? ' (OG)' : '';
    const entry: Scorer = {
      name: base + suffix,
      minute: minuteLabel(e),
      sort: e.minute * 100 + (e.extraMinute ?? 0),
    };
    if (e.teamId === match.homeTeamId) home.push(entry);
    else if (e.teamId === match.awayTeamId) away.push(entry);
  }
  const bySort = (a: Scorer, b: Scorer) => a.sort - b.sort;
  return { home: home.sort(bySort), away: away.sort(bySort) };
}

// A copy-paste-ready social caption.
export function buildCaption(opts: {
  match: Match;
  homeName: string;
  awayName: string;
  competitionLabel?: string;
}): string {
  const { match, homeName, awayName, competitionLabel } = opts;
  const hs = match.homeScore ?? 0;
  const as = match.awayScore ?? 0;
  const lines: string[] = [];
  if (competitionLabel) lines.push(competitionLabel);
  lines.push('⏱️ FULL TIME');
  lines.push(`${homeName} ${hs}–${as} ${awayName}`);
  if (match.homePenalties != null && match.awayPenalties != null) {
    lines.push(`(${match.homePenalties}–${match.awayPenalties} on penalties)`);
  }
  lines.push('');
  lines.push('#Menyesha #Football #Rwanda');
  return lines.join('\n');
}

export type CardSize = 'square' | 'story';

const DIMS = {
  square: { w: 1080, h: 1080, pad: 76, crest: 188, score: 128, name: 38, sub: 22, label: 30, ft: 26, scorer: 26, brand: 42, foot: 24, spread: 'center' as const },
  story: { w: 1080, h: 1920, pad: 104, crest: 240, score: 176, name: 48, sub: 28, label: 36, ft: 32, scorer: 32, brand: 52, foot: 30, spread: 'space-between' as const },
};

/* --------------------------------- Card ----------------------------------- */

type Props = {
  size: CardSize;
  match: Match;
  homeName: string;
  awayName: string;
  homeCrest: string | null; // data URL (embedded) or null → initials
  awayCrest: string | null;
  scorers: { home: Scorer[]; away: Scorer[] };
  competitionLabel?: string;
};

// The visual — fixed pixel dimensions, all inline styles so html-to-image
// captures it exactly regardless of the surrounding app CSS.
export const ResultCard = forwardRef<HTMLDivElement, Props>(function ResultCard(
  { size, match, homeName, awayName, homeCrest, awayCrest, scorers, competitionLabel },
  ref
) {
  const d = DIMS[size];
  const hs = match.homeScore ?? 0;
  const as = match.awayScore ?? 0;
  const hasPens = match.homePenalties != null && match.awayPenalties != null;
  const subtitle = [match.stage?.name, match.group?.name, match.round].filter(Boolean).join(' · ');
  const kickoff = match.kickoffAt
    ? new Date(match.kickoffAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  const note = hasPens
    ? `Won ${match.homePenalties}–${match.awayPenalties} on penalties`
    : match.afterExtraTime
      ? 'After extra time'
      : '';

  const crest = (url: string | null, name: string) =>
    url ? (
      <div
        style={{
          width: d.crest,
          height: d.crest,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Fill the circle and crop to it, so a square-background logo reads round. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name}
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    ) : (
      <div
        style={{
          width: d.crest,
          height: d.crest,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: d.crest * 0.34,
          fontWeight: 800,
          color: '#F59E0B',
          letterSpacing: 1,
        }}
      >
        {teamInitials(name)}
      </div>
    );

  const teamBlock = (url: string | null, name: string) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {crest(url, name)}
      <div
        style={{
          fontFamily: DISPLAY,
          fontSize: d.name,
          fontWeight: 600,
          color: '#fff',
          textAlign: 'center',
          lineHeight: 1.1,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          maxWidth: d.w * 0.34,
        }}
      >
        {name}
      </div>
    </div>
  );

  const scorerCol = (list: Scorer[], align: 'flex-end' | 'flex-start') => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, alignItems: align }}>
      {list.map((s, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'baseline',
            flexDirection: align === 'flex-end' ? 'row-reverse' : 'row',
          }}
        >
          <span style={{ color: '#F59E0B', fontWeight: 800, fontSize: d.scorer }}>{s.minute}</span>
          <span style={{ color: '#dbe6f0', fontSize: d.scorer }}>{s.name}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      ref={ref}
      style={{
        width: d.w,
        height: d.h,
        padding: d.pad,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: d.spread,
        gap: size === 'story' ? 0 : 56,
        background: 'linear-gradient(160deg, #00243e 0%, #003153 55%, #00121f 100%)',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: 'absolute',
          top: -160,
          right: -120,
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.18), transparent 62%)',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {competitionLabel && (
            <div style={{ fontFamily: DISPLAY, fontSize: d.label, fontWeight: 700, color: '#F59E0B', letterSpacing: 2, textTransform: 'uppercase' }}>
              {competitionLabel}
            </div>
          )}
          <div style={{ height: 3, width: 48, borderRadius: 2, background: '#F59E0B' }} />
          {subtitle && <div style={{ fontSize: d.sub, color: '#9fb3c8' }}>{subtitle}</div>}
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: d.ft,
            fontWeight: 600,
            letterSpacing: 2,
            color: '#F59E0B',
            background: 'rgba(245,158,11,0.14)',
            border: '1px solid rgba(245,158,11,0.4)',
            padding: '10px 22px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          FULL TIME
        </div>
      </div>

      {/* Scoreline */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
          {teamBlock(homeCrest, homeName)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 26, fontFamily: DISPLAY, fontSize: d.score, fontWeight: 700, lineHeight: 1, letterSpacing: -1 }}>
            <span>{hs}</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>–</span>
            <span>{as}</span>
          </div>
          {teamBlock(awayCrest, awayName)}
        </div>
        {note && <div style={{ fontSize: d.sub, color: '#9fb3c8', fontWeight: 600 }}>{note}</div>}
      </div>

      {/* Scorers */}
      {(scorers.home.length > 0 || scorers.away.length > 0) && (
        <div style={{ position: 'relative', display: 'flex', gap: 40, alignItems: 'flex-start' }}>
          {scorerCol(scorers.home, 'flex-end')}
          <div style={{ width: 2, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)' }} />
          {scorerCol(scorers.away, 'flex-start')}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.14)',
          paddingTop: 26,
          marginTop: size === 'story' ? 0 : 'auto',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MENYESHA_LOGO} alt="Menyesha" style={{ height: d.brand * 1.15, width: 'auto', display: 'block' }} />
          <span style={{ fontSize: d.foot * 0.9, letterSpacing: 1, color: '#7f93a8' }}>menyesha.vand.rw</span>
        </div>
        <div style={{ fontSize: d.foot, color: '#9fb3c8', textAlign: 'right' }}>
          {kickoff}
          {match.venue?.name ? ` · ${match.venue.name}` : ''}
        </div>
      </div>
    </div>
  );
});
