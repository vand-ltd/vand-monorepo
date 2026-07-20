import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Match — Rwanda Football | Menyesha';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menyesha.vand.rw';

type Props = { params: Promise<{ locale: string; competition: string; match: string }> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function crestUrl(team: any): string | null {
  if (team?.logoUrl) return team.logoUrl;
  const l = team?.logo;
  if (typeof l === 'string') return l.startsWith('http') ? l : null;
  return l?.url ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initials(team: any): string {
  const s = team?.shortName || team?.name || '';
  return s.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || '?';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMatch(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/api/menyesha/matches/slug/${slug}`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

function TeamCol({
  crest,
  name,
  fallback,
}: {
  crest: string | null;
  name: string;
  fallback: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 340,
        gap: 24,
      }}
    >
      {crest ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={crest}
          width={170}
          height={170}
          style={{ borderRadius: 170, objectFit: 'cover', background: 'white' }}
          alt=""
        />
      ) : (
        <div
          style={{
            display: 'flex',
            width: 170,
            height: 170,
            borderRadius: 170,
            background: '#F59E0B',
            color: '#003153',
            fontSize: 56,
            fontWeight: 800,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {fallback}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          fontSize: 40,
          fontWeight: 700,
          textAlign: 'center',
          maxWidth: 340,
          lineHeight: 1.1,
        }}
      >
        {name}
      </div>
    </div>
  );
}

function pretty(slug: string): string {
  return slug
    .split('-')
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

export default async function Image({ params }: Props) {
  const { competition, match } = await params;
  const m = match.includes('-vs-') ? await fetchMatch(match) : null;

  // Not a match (e.g. a season overview) — render a branded competition card.
  if (!m) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            color: 'white',
            background: 'linear-gradient(135deg, #003153 0%, #005F73 100%)',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, color: '#F59E0B', letterSpacing: 1 }}>
            MENYESHA
          </div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, textAlign: 'center', maxWidth: 1000 }}>
            {pretty(competition)}
          </div>
          <div style={{ display: 'flex', fontSize: 30, opacity: 0.8 }}>
            Rwanda Football · Results, Fixtures & Table
          </div>
          <div style={{ display: 'flex', fontSize: 26, opacity: 0.7, marginTop: 20 }}>
            menyesha.vand.rw
          </div>
        </div>
      ),
      size
    );
  }

  const home = m?.homeTeam;
  const away = m?.awayTeam;
  const homeName = home?.name ?? 'Home';
  const awayName = away?.name ?? 'Away';
  const competitionName = m?.season?.competition?.name ?? 'Rwanda Football';
  const round = m?.round ?? '';
  const hasScore = m?.homeScore != null && m?.awayScore != null;
  const isFinished = m?.status === 'FullTime';
  const date = m?.kickoffAt
    ? new Date(m.kickoffAt).toLocaleDateString('en', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const centerLabel = hasScore ? `${m.homeScore} - ${m.awayScore}` : 'VS';
  const statusLabel = hasScore ? (isFinished ? 'Full time' : 'Live') : date;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
          color: 'white',
          background: 'linear-gradient(135deg, #003153 0%, #005F73 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>{competitionName}</div>
            <div style={{ display: 'flex', fontSize: 24, opacity: 0.7, marginTop: 4 }}>
              {[round, date].filter(Boolean).join('  ·  ')}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: 1,
              color: '#F59E0B',
            }}
          >
            MENYESHA
          </div>
        </div>

        {/* Teams + score */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 30,
          }}
        >
          <TeamCol crest={crestUrl(home)} name={homeName} fallback={initials(home)} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 220,
            }}
          >
            <div style={{ display: 'flex', fontSize: 96, fontWeight: 800 }}>{centerLabel}</div>
            <div style={{ display: 'flex', fontSize: 28, opacity: 0.8, marginTop: 8 }}>
              {statusLabel}
            </div>
          </div>
          <TeamCol crest={crestUrl(away)} name={awayName} fallback={initials(away)} />
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            fontSize: 26,
            opacity: 0.75,
          }}
        >
          menyesha.vand.rw
        </div>
      </div>
    ),
    size
  );
}
