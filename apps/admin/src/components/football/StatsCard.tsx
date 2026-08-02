import { forwardRef, type ReactNode } from 'react';
import { Oswald } from 'next/font/google';
import { teamInitials } from './ResultCard';
import { MENYESHA_LOGO } from './brand';

const oswald = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'] });
const DISPLAY = oswald.style.fontFamily;
const BASE = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';

export type CardSize = 'square' | 'story';

const S = {
  square: { w: 1080, h: 1080, pad: 72, comp: 28, title: 62, sec: 26, colH: 20, cell: 26, name: 27, crest: 38, rank: 32, photo: 52, count: 46, brand: 38, foot: 22, rowH: 44, lrow: 66 },
  story: { w: 1080, h: 1920, pad: 96, comp: 34, title: 80, sec: 30, colH: 24, cell: 30, name: 33, crest: 46, rank: 40, photo: 64, count: 60, brand: 48, foot: 26, rowH: 62, lrow: 92 },
} as const;

/* --------------------------------- types ---------------------------------- */

export interface StandingVM {
  position: number;
  name: string;
  crest: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: number;
  points: number;
}
export interface StandingGroupVM {
  title?: string;
  rows: StandingVM[];
}
export interface LeaderVM {
  rank: number;
  name: string;
  photo: string | null;
  teamName: string;
  count: number;
}
// One match shown as home vs away. Used by the team-fixtures and matchday cards.
export interface FixtureVM {
  id: string;
  date: string;
  homeName: string;
  homeCrest: string | null;
  awayName: string;
  awayCrest: string | null;
  emphasize?: 'home' | 'away' | null; // bold one side (e.g. the selected team)
  score: string | null; // finished → "2–1" (home–away), else null
  time: string; // kickoff time for upcoming
}

/* --------------------------------- frame ---------------------------------- */

// Shared branded frame (background, header title, footer) — the body is passed
// in as children. forwardRef so html-to-image can capture the whole card.
export const StatsCard = forwardRef<
  HTMLDivElement,
  { size: CardSize; competitionLabel?: string; title: string; seasonLabel?: string; children: ReactNode }
>(function StatsCard({ size, competitionLabel, title, seasonLabel, children }, ref) {
  const d = S[size];
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
        gap: 28,
        background: 'linear-gradient(160deg, #00243e 0%, #003153 55%, #00121f 100%)',
        color: '#fff',
        fontFamily: BASE,
      }}
    >
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
      <div style={{ position: 'relative' }}>
        {competitionLabel && (
          <div style={{ fontFamily: DISPLAY, fontSize: d.comp, fontWeight: 700, color: '#F59E0B', letterSpacing: 2, textTransform: 'uppercase' }}>
            {competitionLabel}
          </div>
        )}
        <div style={{ height: 3, width: 48, borderRadius: 2, background: '#F59E0B', margin: '8px 0' }} />
        <div style={{ fontFamily: DISPLAY, fontSize: d.title, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>
          {title}
        </div>
      </div>
      {/* Body */}
      <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
      {/* Footer */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.14)',
          paddingTop: 22,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MENYESHA_LOGO} alt="Menyesha" style={{ height: d.brand * 1.15, width: 'auto', display: 'block' }} />
          <span style={{ fontSize: d.foot * 0.9, letterSpacing: 1, color: '#7f93a8' }}>menyesha.vand.rw</span>
        </div>
        {seasonLabel && <div style={{ fontSize: d.foot, color: '#9fb3c8' }}>{seasonLabel}</div>}
      </div>
    </div>
  );
});

/* ------------------------------ shared bits ------------------------------- */

function Circle({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    // `url` is an embedded data URL (from the modal), so no crossOrigin needed.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.08)' }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 800,
        color: '#F59E0B',
      }}
    >
      {teamInitials(name)}
    </div>
  );
}

/* ------------------------------- standings -------------------------------- */

export function standingsBody(size: CardSize, groups: StandingGroupVM[]): ReactNode {
  const d = S[size];
  const statCol = (v: number | string, bold = false) => (
    <div style={{ width: size === 'story' ? 62 : 52, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: bold ? 700 : 400, color: bold ? '#fff' : '#cdd9e5', fontSize: d.cell }}>
      {v}
    </div>
  );
  const head = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px', height: d.rowH * 0.72, color: '#7f93a8', fontSize: d.colH, textTransform: 'uppercase', letterSpacing: 1 }}>
      <div style={{ width: 44, textAlign: 'center' }}>#</div>
      <div style={{ flex: 1 }}>Team</div>
      {['P', 'W', 'D', 'L', 'GD', 'Pts'].map((h) => (
        <div key={h} style={{ width: size === 'story' ? 62 : 52, textAlign: 'center' }}>{h}</div>
      ))}
    </div>
  );
  const table = (rows: StandingVM[]) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {head}
      {rows.map((r) => (
        <div
          key={r.position}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 4px',
            height: d.rowH,
            flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ width: 44, textAlign: 'center', color: '#9fb3c8', fontFamily: DISPLAY, fontWeight: 600, fontSize: d.cell }}>
            {r.position}
          </div>
          <Circle url={r.crest} name={r.name} size={d.crest} />
          <div style={{ flex: 1, minWidth: 0, fontFamily: DISPLAY, fontSize: d.name, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.name}
          </div>
          {statCol(r.played)}
          {statCol(r.won)}
          {statCol(r.drawn)}
          {statCol(r.lost)}
          {statCol(r.gd > 0 ? `+${r.gd}` : r.gd)}
          {statCol(r.points, true)}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: size === 'story' ? 22 : 14 }}>
      {groups.map((g, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {g.title && (
            <div style={{ fontFamily: DISPLAY, fontSize: d.sec, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' }}>
              {g.title}
            </div>
          )}
          {table(g.rows)}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ leaderboard ------------------------------- */

export function leaderboardBody(size: CardSize, rows: LeaderVM[]): ReactNode {
  const d = S[size];
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((r) => (
        <div
          key={r.rank}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            height: d.lrow,
            flexShrink: 0,
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ width: 56, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: d.rank, color: r.rank <= 3 ? '#F59E0B' : '#7f93a8' }}>
            {r.rank}
          </div>
          <Circle url={r.photo} name={r.name} size={d.photo} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: d.name, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.name}
            </div>
            <div style={{ color: '#9fb3c8', fontSize: d.foot, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.teamName}
            </div>
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: d.count, fontWeight: 700, color: '#fff' }}>{r.count}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- fixtures --------------------------------- */

// Shared home-vs-away row list, used by both the team-fixtures and matchday cards.
function fixtureRows(size: CardSize, rows: FixtureVM[]): ReactNode {
  const d = S[size];
  const dateW = size === 'story' ? 130 : 104;
  const nameFont = d.cell + 2;
  const nameStyle = (emphasize: boolean, align: 'left' | 'right') =>
    ({
      minWidth: 0,
      fontFamily: DISPLAY,
      fontSize: nameFont,
      fontWeight: emphasize ? 700 : 500,
      textTransform: 'uppercase',
      color: emphasize ? '#fff' : '#9fb3c8',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      textAlign: align,
    }) as const;
  const side = (name: string, crest: string | null, emphasize: boolean, align: 'left' | 'right') => (
    <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {align === 'right' && <span style={nameStyle(emphasize, 'right')}>{name}</span>}
      <Circle url={crest} name={name} size={d.crest} />
      {align === 'left' && <span style={nameStyle(emphasize, 'left')}>{name}</span>}
    </span>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((r) => (
        <div
          key={r.id}
          style={{ display: 'flex', alignItems: 'center', gap: 10, height: d.rowH, flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span style={{ width: dateW, fontSize: d.colH, color: '#9fb3c8', whiteSpace: 'nowrap' }}>{r.date}</span>
          {side(r.homeName, r.homeCrest, r.emphasize === 'home', 'right')}
          <span
            style={{
              width: size === 'story' ? 118 : 96,
              textAlign: 'center',
              fontFamily: DISPLAY,
              fontSize: d.cell,
              fontWeight: 700,
              color: r.score ? '#fff' : '#F59E0B',
              whiteSpace: 'nowrap',
            }}
          >
            {r.score ?? r.time}
          </span>
          {side(r.awayName, r.awayCrest, r.emphasize === 'away', 'left')}
        </div>
      ))}
    </div>
  );
}

// A single team's fixtures/results — with the team crest+name headed on top.
export function fixturesBody(
  size: CardSize,
  team: { name: string; crest: string | null },
  rows: FixtureVM[]
): ReactNode {
  const d = S[size];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: size === 'story' ? 24 : 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Circle url={team.crest} name={team.name} size={d.photo} />
        <span style={{ fontFamily: DISPLAY, fontSize: d.title * 0.62, fontWeight: 700, textTransform: 'uppercase', color: '#fff' }}>
          {team.name}
        </span>
      </div>
      {fixtureRows(size, rows)}
    </div>
  );
}

// A whole matchday / stage / knockout round — just the match list (title carries
// the round name via the card frame).
export function matchdayBody(size: CardSize, rows: FixtureVM[]): ReactNode {
  return fixtureRows(size, rows);
}

/* -------------------------------- captions -------------------------------- */

export function buildStatsCaption(opts: {
  title: string;
  competitionLabel?: string;
  seasonLabel?: string;
  top?: { name: string; value: number }[];
}): string {
  const lines: string[] = [];
  if (opts.competitionLabel) lines.push(opts.competitionLabel);
  lines.push(opts.title);
  if (opts.seasonLabel) lines.push(opts.seasonLabel);
  if (opts.top && opts.top.length) {
    lines.push('');
    opts.top.slice(0, 3).forEach((t, i) => lines.push(`${i + 1}. ${t.name} (${t.value})`));
  }
  lines.push('');
  lines.push('#Menyesha #Football #Rwanda');
  return lines.join('\n');
}
