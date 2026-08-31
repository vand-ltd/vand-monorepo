import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { MatchDetail } from '@/components/layouts/MatchDetail';
import { FootballResultsBoard } from '@/components/layouts/FootballResultsBoard';
import { isTbdKickoff } from '@org/api';
import { ssrMatchBundle } from '@/lib/matchSSR';
import { localeAlternates } from '@/lib/seo';
import { SITE_URL, BRAND_NAME, OG_IMAGE } from '@/lib/brand';

// /football/<competition>/<match-slug>  -> match detail  (slug contains "-vs-")
// /football/<competition>/<season-slug> -> that competition's season
type Props = { params: Promise<{ locale: string; competition: string; match: string }> };

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const RW_KEYWORDS = [
  'Rwanda football',
  'Rwanda football results',
  'Rwanda football fixtures',
  'Rwanda Premier League',
  'BK Pro League',
  'Rwanda live scores',
  'football standings Rwanda',
];

// Match slugs are "home-vs-away-date"; season slugs (e.g. "2026-2027") are not.
const isMatchSlug = (s: string) => s.includes('-vs-');

function prettySlug(slug: string): string {
  return slug
    .split('-')
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMatch(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/api/tugezo/matches/slug/${slug}`, {
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

// Resolve the real competition name from its slug via the seasons list.
async function fetchCompetitionName(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/tugezo/seasons`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (json.data || []).find((x: any) => x.competition?.slug === slug);
    return s?.competition?.name ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, competition, match } = await params;
  const alternates = localeAlternates(locale, `football/${competition}/${match}`);

  // Competition season overview
  if (!isMatchSlug(match)) {
    const comp = (await fetchCompetitionName(competition)) ?? prettySlug(competition);
    const title = `${comp} — Results, Fixtures, Table & Live Scores | Rwanda Football`;
    const description = `${comp} live scores, results, fixtures and league standings — follow every ${comp} matchday in Rwanda on ${BRAND_NAME}.`;
    return {
      title,
      description,
      keywords: RW_KEYWORDS,
      alternates,
      openGraph: { title, description, type: 'website' },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  // Match detail
  const m = await fetchMatch(match);
  if (!m) return { title: 'Match — Rwanda Football', alternates };
  const home = m.homeTeam?.name ?? 'Home';
  const away = m.awayTeam?.name ?? 'Away';
  const comp = m.season?.competition?.name ?? 'Rwanda Football';
  const scored =
    ['FullTime', 'Live', 'HalfTime'].includes(m.status) && m.homeScore != null && m.awayScore != null;
  const title = `${home} vs ${away}${scored ? ` ${m.homeScore}-${m.awayScore}` : ''} — ${comp} | Rwanda Football`;
  const description = scored
    ? `${home} ${m.homeScore}-${m.awayScore} ${away}: full-time result in the ${comp}${
        m.round ? `, ${m.round}` : ''
      }. Scores, stats and reaction on ${BRAND_NAME}.`
    : `${home} vs ${away} — ${comp} fixture${
        m.round ? `, ${m.round}` : ''
      } in Rwanda. Kickoff time, live score and result on ${BRAND_NAME}.`;
  return {
    title,
    description,
    keywords: RW_KEYWORDS,
    alternates,
    openGraph: { title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page({ params }: Props) {
  const { locale, competition, match } = await params;

  // Competition season overview
  if (!isMatchSlug(match)) {
    const t = await getTranslations('football');
    return (
      <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
        <section className="py-8">
          <div className="max-w-screen-xl mx-auto px-4">
            <Link
              href="/football"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToFootball')}
            </Link>
            <FootballResultsBoard initialCompetition={competition} initialSeason={match} />
          </div>
        </section>
      </div>
    );
  }

  // Match detail (+ SportsEvent structured data for rich results). Server-fetch
  // the full bundle (match, events, lineups) to seed the client — crawlable HTML.
  const { match: m, events, homeLineup, awayLineup } = await ssrMatchBundle(match);
  /* ---- values fed into the SportsEvent structured data ---------------- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competitionName = (m as any)?.season?.competition?.name ?? 'Rwanda Football';

  // Crest may arrive as logoUrl, a plain url string, or { url }.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const crest = (t: any): string | undefined => {
    const l = t?.logoUrl ?? t?.logo;
    if (typeof l === 'string') return l.startsWith('http') ? l : undefined;
    return typeof l?.url === 'string' ? l.url : undefined;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teamNode = (t: any, fallback: string) => ({
    '@type': 'SportsTeam' as const,
    name: t?.name ?? fallback,
    ...(t?.slug ? { url: `${SITE_URL}/${locale}/football/team/${t.slug}` } : {}),
    ...(crest(t) ? { logo: crest(t) } : {}),
  });

  const teamNodes = m ? [teamNode(m.homeTeam, 'Home'), teamNode(m.awayTeam, 'Away')] : [];

  // Prefer real crests; fall back to the brand OG image so `image` is never empty.
  const eventImages = m
    ? ([crest(m.homeTeam), crest(m.awayTeam)].filter(Boolean) as string[])
    : [];
  if (m && eventImages.length === 0) eventImages.push(OG_IMAGE);

  const eventScored =
    !!m && ['FullTime', 'Live', 'HalfTime'].includes(m.status) && m.homeScore != null && m.awayScore != null;
  const eventDescription = m
    ? eventScored
      ? `${m.homeTeam?.name ?? 'Home'} ${m.homeScore}-${m.awayScore} ${m.awayTeam?.name ?? 'Away'} — full-time result in the ${competitionName}${m.round ? `, ${m.round}` : ''}.`
      : `${m.homeTeam?.name ?? 'Home'} vs ${m.awayTeam?.name ?? 'Away'} — ${competitionName} fixture${m.round ? `, ${m.round}` : ''} in Rwanda.`
    : '';

  const jsonLd = m
    ? {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: `${m.homeTeam?.name ?? 'Home'} vs ${m.awayTeam?.name ?? 'Away'}`,
        sport: 'Soccer',
        // Omit startDate for a TBD fixture — emitting the far-future sentinel would
        // tell Google the event is in 2099. No startDate = no misleading rich result.
        ...(isTbdKickoff(m.kickoffAt) ? {} : { startDate: m.kickoffAt }),
        eventStatus:
          m.status === 'FullTime'
            ? 'https://schema.org/EventCompleted'
            : m.status === 'Cancelled'
              ? 'https://schema.org/EventCancelled'
              : m.status === 'Postponed'
                ? 'https://schema.org/EventPostponed'
                : 'https://schema.org/EventScheduled',
        // `location` is REQUIRED on SportsEvent — omitting it makes the whole
        // item invalid and drops it from rich results. Many lower-league and
        // youth fixtures have no venue recorded, so fall back to a
        // country-level Place rather than emitting nothing.
        location: m.venue?.name
          ? {
              '@type': 'Place',
              name: m.venue.name,
              address: {
                '@type': 'PostalAddress',
                ...(m.venue.city ? { addressLocality: m.venue.city } : {}),
                addressCountry: 'RW',
              },
            }
          : {
              '@type': 'Place',
              name: 'Rwanda',
              address: { '@type': 'PostalAddress', addressCountry: 'RW' },
            },
        // `competitor` is the SportsEvent-specific field; `performer` is the
        // generic Event one Google also looks for. Both name the same two teams.
        competitor: teamNodes,
        performer: teamNodes,
        description: eventDescription,
        ...(eventImages.length ? { image: eventImages } : {}),
        // Football is ~90 minutes plus the interval and stoppage; two hours is
        // the honest estimate. Skipped for TBD fixtures, which have no real start.
        ...(isTbdKickoff(m.kickoffAt)
          ? {}
          : { endDate: new Date(new Date(m.kickoffAt).getTime() + 2 * 60 * 60 * 1000).toISOString() }),
        organizer: {
          '@type': 'Organization',
          name: competitionName,
          url: `${SITE_URL}/${locale}/football/${competition}`,
        },
        // No `offers`: we don't sell or list tickets. Emitting an offer we
        // can't honour would be false markup, which is worse than an
        // incomplete item.
      }
    : null;

  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <section className="py-8">
        <div className="max-w-3xl mx-auto px-4">
          <MatchDetail
            slug={match}
            competition={competition}
            tab="info"
            initialMatch={m}
            initialEvents={events}
            initialHomeLineup={homeLineup}
            initialAwayLineup={awayLineup}
          />
        </div>
      </section>
    </div>
  );
}
