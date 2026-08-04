import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { FootballResultsBoard } from '@/components/layouts/FootballResultsBoard';
import { localeAlternates } from '@/lib/seo';

// First segment after /football:
//   YYYY-MM-DD    -> all competitions on that day
//   <competition> -> that competition's current season
type Props = { params: Promise<{ locale: string; competition: string }> };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
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
  'imikino y’umupira Rwanda',
];

function prettyDate(date: string): string | null {
  if (!DATE_RE.test(date)) return null;
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function prettySlug(slug: string): string {
  return slug
    .split('-')
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

// Resolve a competition's real name from its slug via the seasons list.
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
  const { locale, competition } = await params;
  const alternates = localeAlternates(locale, `football/${competition}`);

  // All-competitions view for a day
  if (DATE_RE.test(competition)) {
    const pretty = prettyDate(competition);
    const title = pretty
      ? `Rwanda Football — Live Scores, Results & Fixtures · ${pretty}`
      : 'Rwanda Football: Live Scores, Results, Fixtures & Standings';
    const description = pretty
      ? `Rwandan football live scores, results and fixtures for ${pretty} — BK Pro League and more, with league standings, updated in real time.`
      : 'Live scores, results, fixtures and league tables for football in Rwanda — the BK Pro League and every competition, updated in real time.';
    return {
      title,
      description,
      keywords: RW_KEYWORDS,
      alternates,
      openGraph: { title, description, type: 'website' },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  // Competition overview (current season)
  const comp = (await fetchCompetitionName(competition)) ?? prettySlug(competition);
  const title = `${comp} — Results, Fixtures, Table & Live Scores | Rwanda Football`;
  const description = `${comp} live scores, results, fixtures and league standings — follow every ${comp} matchday in Rwanda on Menyesha.`;
  return {
    title,
    description,
    keywords: RW_KEYWORDS,
    alternates,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page({ params }: Props) {
  const t = await getTranslations('football');
  const { competition } = await params;
  const isDate = DATE_RE.test(competition);

  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
      <section className="py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <Link
            href={isDate ? '/sports' : '/football'}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {isDate ? t('backToSports') : t('backToFootball')}
          </Link>
          {isDate && (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {t('pageTitle')}
            </h1>
          )}
          {isDate ? (
            <FootballResultsBoard initialDate={competition} />
          ) : (
            <FootballResultsBoard initialCompetition={competition} />
          )}
        </div>
      </section>
    </div>
  );
}
