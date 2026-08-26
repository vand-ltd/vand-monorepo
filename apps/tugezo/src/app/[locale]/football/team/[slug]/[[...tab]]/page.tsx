import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TeamProfile } from '@/components/layouts/TeamProfile';
import { localeAlternates } from '@/lib/seo';
import { SITE_URL, BRAND_NAME } from '@/lib/brand';

type TeamTab = 'overview' | 'fixtures' | 'results' | 'squad';
type Props = { params: Promise<{ locale: string; slug: string; tab?: string[] }> };

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const RW_KEYWORDS = [
  'Rwanda football',
  'Rwanda football clubs',
  'BK Pro League',
  'Rwanda Premier League',
  'football team Rwanda',
];

// The tabs that live under a path segment. "overview" is the bare team URL, so
// it's intentionally not in here (no /overview suffix — avoids a duplicate URL).
const PATH_TABS = ['fixtures', 'results', 'squad'] as const;

// Resolve the optional [[...tab]] segment to a tab, or null for an unknown/deep
// path (→ 404, so Google never indexes junk like /team/x/foo or /team/x/a/b).
function resolveTab(tab?: string[]): TeamTab | null {
  if (!tab || tab.length === 0) return 'overview';
  if (tab.length > 1) return null;
  return (PATH_TABS as readonly string[]).includes(tab[0]) ? (tab[0] as TeamTab) : null;
}

function pretty(slug: string): string {
  return slug
    .split('-')
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

function logoUrl(team: any): string | null {
  if (!team) return null;
  if (team.logoUrl) return team.logoUrl;
  const l = team.logo;
  if (typeof l === 'string') return l.startsWith('http') ? l : null;
  return l?.url ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTeam(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/api/tugezo/teams/slug/${slug}`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? json;
  } catch {
    return null;
  }
}

// Shape the server payload to the same defaults getTeamProfile applies, so the
// seeded initialData never has undefined fields the component reads.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTeamProfile(p: any) {
  return {
    team: p?.team ?? {},
    currentSeason: p?.currentSeason ?? null,
    seasons: p?.seasons ?? [],
    form: p?.form ?? [],
    recentResults: p?.recentResults ?? [],
    upcomingFixtures: p?.upcomingFixtures ?? [],
  };
}

// Per-tab title/description suffix — so each tab is a distinct, self-describing
// indexable page rather than four views sharing one <title>.
function tabMeta(tab: TeamTab, name: string): { label: string; blurb: string } {
  switch (tab) {
    case 'fixtures':
      return { label: 'Fixtures', blurb: `Upcoming ${name} fixtures, kickoff times and schedule.` };
    case 'results':
      return { label: 'Results', blurb: `Latest ${name} results, scores and match reports.` };
    case 'squad':
      return { label: 'Squad', blurb: `${name} squad and player list for the current season.` };
    default:
      return { label: '', blurb: 'Squad, fixtures, results, form and season-by-season record.' };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, tab } = await params;
  const active = resolveTab(tab);
  if (!active) return {}; // unknown tab — the page renders notFound()

  const path = active === 'overview' ? `football/team/${slug}` : `football/team/${slug}/${active}`;
  const alternates = localeAlternates(locale, path);
  const data = await fetchTeam(slug);
  const team = data?.team;
  const name = team?.name ?? pretty(slug);
  const comp = data?.currentSeason?.competition?.name;
  const logo = logoUrl(team);
  const { label, blurb } = tabMeta(active, name);

  const title = `${name}${label ? ` — ${label}` : ''}${comp ? ` — ${comp}` : ''} | Rwanda Football | ${BRAND_NAME}`;
  const description = [
    `${name}${team?.city ? `, ${team.city}` : ''}${comp ? ` — ${comp}` : ''}.`,
    blurb,
    `Rwanda football club profile on ${BRAND_NAME}.`,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    title,
    description,
    keywords: RW_KEYWORDS,
    alternates,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(logo ? { images: [{ url: logo, alt: name }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      ...(logo ? { images: [logo] } : {}),
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug, tab } = await params;
  const active = resolveTab(tab);
  if (!active) notFound();

  const data = await fetchTeam(slug);
  const team = data?.team;
  const logo = logoUrl(team);

  // SportsTeam structured data for rich results.
  const jsonLd = team
    ? {
        '@context': 'https://schema.org',
        '@type': 'SportsTeam',
        name: team.name,
        sport: 'Soccer',
        ...(logo ? { logo } : {}),
        ...(team.country ? { location: team.country } : {}),
        ...(team.founded ? { foundingDate: String(team.founded) } : {}),
        ...(data?.currentSeason?.competition?.name
          ? {
              memberOf: {
                '@type': 'SportsOrganization',
                name: data.currentSeason.competition.name,
              },
            }
          : {}),
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
        <div className="max-w-4xl mx-auto px-4">
          <TeamProfile
            slug={slug}
            initialData={data ? normalizeTeamProfile(data) : undefined}
            initialTab={active}
          />
        </div>
      </section>
    </div>
  );
}
