import type { Metadata } from 'next';
import { TeamProfile } from '@/components/layouts/TeamProfile';
import { localeAlternates } from '@/lib/seo';

type Props = { params: Promise<{ locale: string; slug: string }> };

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menyesha.vand.rw';

const RW_KEYWORDS = [
  'Rwanda football',
  'Rwanda football clubs',
  'BK Pro League',
  'Rwanda Premier League',
  'football team Rwanda',
];

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
    const res = await fetch(`${API_URL}/api/menyesha/teams/slug/${slug}`, {
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const alternates = localeAlternates(locale, `football/team/${slug}`);
  const data = await fetchTeam(slug);
  const team = data?.team;
  const name = team?.name ?? pretty(slug);
  const comp = data?.currentSeason?.competition?.name;
  const logo = logoUrl(team);

  const title = `${name}${comp ? ` — ${comp}` : ''} | Rwanda Football | Menyesha`;
  const description = [
    `${name}${team?.city ? `, ${team.city}` : ''}${comp ? ` — ${comp}` : ''}.`,
    'Squad, fixtures, results, form and season-by-season record.',
    'Rwanda football club profile on Menyesha.',
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
  const { slug } = await params;
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
          <TeamProfile slug={slug} initialData={data ? normalizeTeamProfile(data) : undefined} />
        </div>
      </section>
    </div>
  );
}
