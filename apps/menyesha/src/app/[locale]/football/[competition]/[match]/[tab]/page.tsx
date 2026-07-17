import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { MatchDetail } from '@/components/layouts/MatchDetail';
import { FootballResultsBoard } from '@/components/layouts/FootballResultsBoard';

// /football/<competition>/<match-slug>/<tab>  -> match detail tab (info|events|lineups)
// /football/<competition>/<season-slug>/<tab> -> that competition's season (fixtures|results|…)
type Props = {
  params: Promise<{ locale: string; competition: string; match: string; tab: string }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menyesha.vand.rw';

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
const MATCH_TABS = ['info', 'events', 'lineups'] as const;
type MatchTab = (typeof MATCH_TABS)[number];
const asMatchTab = (t: string): MatchTab => (MATCH_TABS as readonly string[]).includes(t) ? (t as MatchTab) : 'info';

function pretty(slug: string): string {
  return slug
    .split('-')
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
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

async function fetchCompetitionName(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/menyesha/seasons`, {
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
  const { competition, match, tab } = await params;

  // Match detail tab
  if (isMatchSlug(match)) {
    const m = await fetchMatch(match);
    if (!m) return { title: 'Match — Rwanda Football' };
    const home = m.homeTeam?.name ?? 'Home';
    const away = m.awayTeam?.name ?? 'Away';
    const comp = m.season?.competition?.name ?? 'Rwanda Football';
    const scored = m.homeScore != null && m.awayScore != null;
    const tabName = asMatchTab(tab);
    const tabLabel = tabName[0].toUpperCase() + tabName.slice(1);
    const title = `${home} vs ${away}${scored ? ` ${m.homeScore}-${m.awayScore}` : ''} — ${tabLabel} | ${comp} | Rwanda Football`;
    const description = `${home} vs ${away} ${tabName} — ${comp} in Rwanda. Lineups, match events, scores and stats on Menyesha.`;
    return {
      title,
      description,
      keywords: RW_KEYWORDS,
      openGraph: { title, description, type: 'article' },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  // Competition season tab
  const comp = (await fetchCompetitionName(competition)) ?? pretty(competition);
  const tabLabel = tab ? tab[0].toUpperCase() + tab.slice(1) : '';
  const title = `${comp} ${tabLabel} — Live Scores & Table | Rwanda Football`;
  const description = `${comp} ${tab}: live scores, results, fixtures and standings from Rwanda, updated in real time on Menyesha.`;
  return {
    title,
    description,
    keywords: RW_KEYWORDS,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page({ params }: Props) {
  const t = await getTranslations('football');
  const { competition, match, tab } = await params;

  // Match detail with a selected tab
  if (isMatchSlug(match)) {
    return (
      <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
        <section className="py-8">
          <div className="max-w-3xl mx-auto px-4">
            <MatchDetail slug={match} competition={competition} tab={asMatchTab(tab)} />
          </div>
        </section>
      </div>
    );
  }

  // Competition season overview with a tab
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
          <FootballResultsBoard
            initialCompetition={competition}
            initialSeason={match}
            initialTab={tab}
          />
        </div>
      </section>
    </div>
  );
}
