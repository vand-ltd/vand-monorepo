import type { Metadata } from 'next';
import { PlayerProfile } from '@/components/layouts/PlayerProfile';
import { localeAlternates } from '@/lib/seo';

type Props = { params: Promise<{ locale: string; slug: string }> };

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menyesha.vand.rw';

const RW_KEYWORDS = [
  'Rwanda football',
  'Rwanda football players',
  'BK Pro League players',
  'Rwanda Premier League',
  'player profile Rwanda',
];

function pretty(slug: string): string {
  return slug
    .split('-')
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPlayer(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/api/menyesha/players/slug/${slug}`, {
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const alternates = localeAlternates(locale, `football/player/${slug}`);
  const data = await fetchPlayer(slug);
  const p = data?.player;
  const name = p?.fullName ?? pretty(slug);
  const club = data?.currentTeam?.team?.name;
  const position = data?.currentTeam?.position ?? p?.position;
  const goals = data?.stats?.totals?.goals;

  const title = `${name}${club ? ` — ${club}` : ''} | Rwanda Football | Menyesha`;
  const description = [
    `${name}${position ? `, ${position}` : ''}${club ? ` at ${club}` : ''}.`,
    goals != null ? `Career stats, goals (${goals}), assists, transfers and season history.` : '',
    'Rwanda football player profile on Menyesha.',
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
      type: 'profile',
      ...(p?.photo ? { images: [{ url: p.photo, alt: name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(p?.photo ? { images: [p.photo] } : {}),
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const data = await fetchPlayer(slug);
  const p = data?.player;

  // Person structured data for rich results.
  const jsonLd = p
    ? {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: p.fullName,
        ...(p.photo ? { image: p.photo } : {}),
        ...(p.nationality ? { nationality: p.nationality } : {}),
        ...(p.dateOfBirth ? { birthDate: p.dateOfBirth } : {}),
        jobTitle: 'Footballer',
        ...(data?.currentTeam?.team?.name
          ? {
              affiliation: {
                '@type': 'SportsTeam',
                name: data.currentTeam.team.name,
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
          <PlayerProfile slug={slug} />
        </div>
      </section>
    </div>
  );
}
