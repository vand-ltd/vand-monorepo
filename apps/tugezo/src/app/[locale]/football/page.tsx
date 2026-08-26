import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FootballResultsBoard } from '@/components/layouts/FootballResultsBoard';
import { localeAlternates } from '@/lib/seo';
import { BRAND_NAME } from '@/lib/brand';

type Props = { params: Promise<{ locale: string }> };

const RW_KEYWORDS = [
  'Rwanda football',
  'Rwanda football results',
  'Rwanda football fixtures',
  'Rwanda Premier League',
  'BK Pro League',
  'Rwanda live scores',
  'football standings Rwanda',
];

// Today's date in Kigali (YYYY-MM-DD) — the board opens on today, but the URL
// (/football) stays stable so it's a real, indexable landing page (no redirect).
function kigaliToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kigali' });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = 'Rwanda Football — Live Scores, Results, Fixtures & Standings';
  const description =
    `Live football scores, results, fixtures and league tables from Rwanda — the BK Pro League and every competition, updated in real time on ${BRAND_NAME}.`;
  return {
    title,
    description,
    keywords: RW_KEYWORDS,
    alternates: localeAlternates(locale, 'football'),
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// The football landing. Renders today's scores at the stable /football URL —
// no redirect (a redirect to a date that changes daily is a "Redirect error"
// in Search Console and never settles a canonical). Specific days still live at
// /football/YYYY-MM-DD.
export default async function FootballIndex() {
  const t = await getTranslations('football');
  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
      <section className="py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {t('pageTitle')}
          </h1>
          <FootballResultsBoard initialDate={kigaliToday()} />
        </div>
      </section>
    </div>
  );
}
