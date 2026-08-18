import { forwardRef, type ReactNode } from 'react';
import { Oswald } from 'next/font/google';
import { teamInitials } from './ResultCard';
import { SocialIcons } from '@org/ui';
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
  qualified?: boolean | null; // true → this position advances (green band)
  qualifiedAs?: 'group' | 'bestLoser' | null; // direct vs best 3rd-placed shade
}
export interface StandingGroupVM {
  title?: string;
  rows: StandingVM[];
  advancesCount?: number | null; // effective per-group cutoff (legend)
  bestLosersCount?: number | null; // extra best-3rd-placed slots (legend)
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
        <SocialIcons size={d.foot * 1.3} color="#9fb3c8" />
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

  // A single league table stays one wide column; multiple groups tile into two
  // columns (row-major) so many groups still fit on one card.
  const cols = groups.length <= 1 ? 1 : 2;
  const compact = cols > 1; // narrower columns → show fewer stat columns
  const statCols: { key: 'P' | 'W' | 'D' | 'L' | 'GD' | 'Pts'; get: (r: StandingVM) => number | string; bold?: boolean }[] =
    compact
      ? [
          { key: 'P', get: (r) => r.played },
          { key: 'GD', get: (r) => (r.gd > 0 ? `+${r.gd}` : r.gd) },
          { key: 'Pts', get: (r) => r.points, bold: true },
        ]
      : [
          { key: 'P', get: (r) => r.played },
          { key: 'W', get: (r) => r.won },
          { key: 'D', get: (r) => r.drawn },
          { key: 'L', get: (r) => r.lost },
          { key: 'GD', get: (r) => (r.gd > 0 ? `+${r.gd}` : r.gd) },
          { key: 'Pts', get: (r) => r.points, bold: true },
        ];

  // Vertical fit: scale every metric down so the tallest grid row of tables fits
  // the body height. Estimated analytically since html-to-image can't measure.
  const hasLegend = (g: StandingGroupVM) => g.rows.some((r) => r.qualified === true);
  const groupBase = (g: StandingGroupVM) =>
    (g.title ? d.sec + 6 : 0) + d.rowH * 0.72 + g.rows.length * d.rowH + (hasLegend(g) ? d.colH + 6 : 0) + 12;
  const gridRows = Math.ceil(groups.length / cols);
  const rowGap = size === 'story' ? 18 : 14;
  let base = rowGap * Math.max(0, gridRows - 1);
  for (let r = 0; r < gridRows; r++) {
    let rowMax = 0;
    for (let c = 0; c < cols; c++) {
      const g = groups[r * cols + c];
      if (g) rowMax = Math.max(rowMax, groupBase(g));
    }
    base += rowMax;
  }
  const targetH = size === 'story' ? 1400 : 660;
  const s = Math.max(0.5, Math.min(1, base > 0 ? targetH / base : 1));

  const rowH = Math.round(d.rowH * s);
  const crest = Math.round(d.crest * s);
  const nameF = Math.round(d.name * s);
  const cellF = Math.round(d.cell * s);
  const colHF = Math.round(d.colH * s);
  const secF = Math.round(d.sec * s);
  const posW = Math.round(44 * s);
  const statW = Math.round((size === 'story' ? 58 : 48) * s);

  const statHead = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px', height: rowH * 0.72, color: '#7f93a8', fontSize: colHF, textTransform: 'uppercase', letterSpacing: 1 }}>
      <div style={{ width: posW, textAlign: 'center' }}>#</div>
      <div style={{ flex: 1, minWidth: 0 }}>Team</div>
      {statCols.map((c) => (
        <div key={c.key} style={{ width: statW, textAlign: 'center' }}>{c.key}</div>
      ))}
    </div>
  );
  const table = (rows: StandingVM[]) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {statHead}
      {rows.map((r) => {
        // How the team qualified → bar colour: direct = solid green, best
        // loser = a lighter green. Falls back to direct for older payloads.
        const how = r.qualifiedAs ?? (r.qualified === true ? 'group' : null);
        const qColor = how === 'group' ? '#22c55e' : how === 'bestLoser' ? '#86efac' : null;
        return (
          <div
            key={r.position}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 4px 0 0',
              height: rowH,
              flexShrink: 0,
              borderTop: '1px solid rgba(255,255,255,0.07)',
              borderLeft: `4px solid ${qColor ?? 'transparent'}`,
              paddingLeft: 8,
            }}
          >
            <div style={{ width: posW, textAlign: 'center', color: qColor ?? '#9fb3c8', fontFamily: DISPLAY, fontWeight: qColor ? 700 : 600, fontSize: cellF }}>
              {r.position}
            </div>
            <Circle url={r.crest} name={r.name} size={crest} />
            <div style={{ flex: 1, minWidth: 0, fontFamily: DISPLAY, fontSize: nameF, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.name}
            </div>
            {statCols.map((c) => (
              <div key={c.key} style={{ width: statW, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: c.bold ? 700 : 400, color: c.bold ? '#fff' : '#cdd9e5', fontSize: cellF }}>
                {c.get(r)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  // Qualification legend, shown when a group marks qualifying positions.
  const legend = (g: StandingGroupVM) => {
    if (!hasLegend(g)) return null;
    const label = g.advancesCount
      ? g.bestLosersCount
        ? 'Next Stage'
        : `Top ${g.advancesCount} advance`
      : 'Qualifies for knockout stage';
    const anyBestLoser = g.rows.some((r) => r.qualifiedAs === 'bestLoser');
    const swatch = (color: string) => (
      <span style={{ display: 'inline-block', width: 4, height: 12, borderRadius: 2, background: color }} />
    );
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, color: '#8aa0b4', fontSize: colHF }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
          {swatch('#22c55e')}
          {label}
        </span>
        {anyBestLoser && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
            {swatch('#86efac')}
            Best Loser
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        columnGap: 28,
        rowGap,
        alignContent: 'start',
      }}
    >
      {groups.map((g, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          {g.title && (
            <div style={{ fontFamily: DISPLAY, fontSize: secF, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase' }}>
              {g.title}
            </div>
          )}
          {table(g.rows)}
          {legend(g)}
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
  const count = Math.max(rows.length, 1);
  // Grow the rows (and crests/scores) when there are few matches so the card
  // fills nicely; stay compact when it's full. The list is vertically centred.
  const listH = size === 'story' ? 1280 : 560;
  // Story is portrait (same 1080 width as square) so its rows have far more
  // vertical room but the SAME horizontal room. Keep the crest/font caps close
  // to square's so names keep width and don't wrap into cramped stacks.
  const maxRowH = size === 'story' ? 150 : 132;
  const rowH = Math.max(d.rowH, Math.min(maxRowH, Math.round(listH / count)));
  const crestSize = Math.round(Math.min(rowH * 0.72, size === 'story' ? 108 : 96));
  const nameFont = Math.round(Math.min(rowH * 0.38, size === 'story' ? 40 : 36));
  const scoreFont = Math.round(Math.min(rowH * 0.44, size === 'story' ? 48 : 40));
  const dateW = size === 'story' ? 130 : 104;
  const nameStyle = (emphasize: boolean, align: 'left' | 'right') =>
    ({
      minWidth: 0,
      fontFamily: DISPLAY,
      fontSize: nameFont,
      fontWeight: emphasize ? 700 : 500,
      textTransform: 'uppercase',
      color: emphasize ? '#fff' : '#9fb3c8',
      // Wrap the full name instead of truncating it.
      whiteSpace: 'normal',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      lineHeight: 1.1,
      textAlign: align,
    }) as const;
  const side = (name: string, crest: string | null, emphasize: boolean, align: 'left' | 'right') => (
    <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {align === 'right' && <span style={nameStyle(emphasize, 'right')}>{name}</span>}
      <Circle url={crest} name={name} size={crestSize} />
      {align === 'left' && <span style={nameStyle(emphasize, 'left')}>{name}</span>}
    </span>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, justifyContent: 'center' }}>
      {rows.map((r) => (
        <div
          key={r.id}
          style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: rowH, flexShrink: 0, paddingTop: 6, paddingBottom: 6, borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span style={{ width: dateW, fontSize: d.colH, color: '#9fb3c8', whiteSpace: 'nowrap' }}>{r.date}</span>
          {side(r.homeName, r.homeCrest, r.emphasize === 'home', 'right')}
          <span
            style={{
              width: size === 'story' ? 124 : 112,
              textAlign: 'center',
              fontFamily: DISPLAY,
              // Time strings are longer than a score, so render them smaller.
              fontSize: r.score ? scoreFont : Math.round(scoreFont * 0.6),
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: size === 'story' ? 24 : 16 }}>
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
