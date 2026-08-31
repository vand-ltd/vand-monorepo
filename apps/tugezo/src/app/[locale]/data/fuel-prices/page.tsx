import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Fuel } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { FuelPricesView } from '@/components/data/FuelPricesView';
import { computeFuelInsights } from '@/lib/fuelInsights';
import { SITE_URL, BRAND_NAME } from '@/lib/brand';

const PATH = '/data/fuel-prices';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'fuelPrices' });
  return {
    title: `${t('title')} - ${BRAND_NAME}`,
    description: t('subtitle'),
    alternates: {
      canonical: `${SITE_URL}/${locale}${PATH}`,
      languages: {
        en: `${SITE_URL}/en${PATH}`,
        fr: `${SITE_URL}/fr${PATH}`,
        rw: `${SITE_URL}/rw${PATH}`,
        'x-default': `${SITE_URL}/en${PATH}`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      url: `${SITE_URL}/${locale}${PATH}`,
      siteName: BRAND_NAME,
      type: 'website',
    },
  };
}

// Server-side fetch (with Origin header) so the data is in the initial HTML for SEO.
async function apiGet(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export default async function FuelPricesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'fuelPrices' });
  const tHub = await getTranslations({ locale, namespace: 'dataHub' });

  const queryClient = new QueryClient();
  const [current, upcoming, history] = await Promise.all([
    apiGet('/api/tugezo/fuel-prices/current'),
    apiGet('/api/tugezo/fuel-prices/upcoming'),
    apiGet('/api/tugezo/fuel-prices/history?order=desc'),
  ]);
  if (current) queryClient.setQueryData(['fuel-prices-current'], current);
  if (upcoming) queryClient.setQueryData(['fuel-prices-upcoming'], upcoming);
  if (history) {
    queryClient.setQueryData(['fuel-prices-history'], history);
    queryClient.setQueryData(['fuel-prices-history-table', '', '', '', '', '', 'desc'], history);
  }

  // ---- Insights (computed from the history rows) ----
  const insights = computeFuelInsights(Array.isArray(history) ? history : []);
  const petrol = insights.perFuel['Petrol'];
  const diesel = insights.perFuel['Diesel'];
  const years = Array.from(
    new Set((Array.isArray(history) ? history : []).map((r) => new Date(r.effectiveDate).getFullYear()))
  ).sort((a, b) => b - a);

  const dateLocale = locale === 'rw' ? 'en' : locale;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' });
  const fmtNum = (n: number) => n.toLocaleString('en-US');

  const intro =
    petrol?.current != null && diesel?.current != null && petrol.currentDate
      ? t('intro', {
          petrol: fmtNum(petrol.current),
          diesel: fmtNum(diesel.current),
          date: fmtDate(petrol.currentDate),
        })
      : null;

  const insightChanges = petrol
    ? t('insightChanges', { up: petrol.increases, down: petrol.decreases, same: petrol.unchanged })
    : null;
  const insightTrend =
    petrol && petrol.pctVsStart != null
      ? petrol.pctVsStart > 0.05
        ? t('insightTrendUp', { pct: Math.abs(petrol.pctVsStart).toFixed(1) })
        : petrol.pctVsStart < -0.05
          ? t('insightTrendDown', { pct: Math.abs(petrol.pctVsStart).toFixed(1) })
          : t('insightTrendSame')
      : null;

  // ---- FAQ (curated questions, data-filled answers) ----
  const faqItems: { q: string; a: string }[] = [{ q: t('faqQ1'), a: t('faqA1') }];
  if (petrol?.current != null && diesel?.current != null && petrol.currentDate) {
    faqItems.push({
      q: t('faqQ2'),
      a: t('faqA2', {
        petrol: fmtNum(petrol.current),
        diesel: fmtNum(diesel.current),
        date: fmtDate(petrol.currentDate),
      }),
    });
  }
  if (insights.lastDate) {
    faqItems.push({ q: t('faqQ3'), a: t('faqA3', { date: fmtDate(insights.lastDate) }) });
  }
  faqItems.push({ q: t('faqQ4'), a: t('faqA4', { updates: insights.updateCount }) });
  if (petrol?.high) {
    faqItems.push({
      q: t('faqQ5'),
      a: t('faqA5', { high: fmtNum(petrol.high.price), highDate: fmtDate(petrol.high.date) }),
    });
  }
  faqItems.push({ q: t('faqQ6'), a: t('faqA6') });

  // ---- Structured data ----
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: t('title'),
      description: t('subtitle'),
      url: `${SITE_URL}/${locale}${PATH}`,
      inLanguage: locale,
      isAccessibleForFree: true,
      // Recommended by Google for Dataset rich results / Dataset Search.
      // Points at our terms rather than granting a blanket open licence:
      // the underlying figures are RURA's, we publish the compilation.
      license: `${SITE_URL}/${locale}/terms-of-service`,
      creator: { '@type': 'Organization', name: 'RURA', url: 'https://www.rura.rw' },
      ...(insights.lastDate ? { dateModified: insights.lastDate } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: BRAND_NAME, item: `${SITE_URL}/${locale}` },
        { '@type': 'ListItem', position: 2, name: tHub('title'), item: `${SITE_URL}/${locale}/data` },
        { '@type': 'ListItem', position: 3, name: t('title'), item: `${SITE_URL}/${locale}${PATH}` },
      ],
    },
  ];

  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="py-8">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="space-y-10">
            {/* Breadcrumb */}
            <nav className="text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href="/" className="hover:text-brand-primary dark:hover:text-brand-accent">
                    {BRAND_NAME}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/data" className="hover:text-brand-primary dark:hover:text-brand-accent">
                    {tHub('title')}
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-gray-700 dark:text-gray-300">{t('title')}</li>
              </ol>
            </nav>

            {/* Header + intro */}
            <header className="flex items-start gap-3">
              <div className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#003153]/10 text-[#003153] dark:bg-[#F59E0B]/15 dark:text-[#F59E0B]">
                <Fuel className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('title')}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
              </div>
            </header>

            {intro && (
              <div className="max-w-3xl space-y-3">
                <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{intro}</p>
                {(insightChanges || insightTrend) && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {t('insightsTitle')}
                    </h2>
                    {insightChanges && <p>{insightChanges}</p>}
                    {insightTrend && <p className="mt-1">{insightTrend}</p>}
                  </div>
                )}
                <Link
                  href="/data/fuel-prices/statistics"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:underline dark:text-brand-accent"
                >
                  {t('statsLink')} →
                </Link>
              </div>
            )}

            {/* Interactive data (server-rendered via hydration) */}
            <HydrationBoundary state={dehydrate(queryClient)}>
              <FuelPricesView />
            </HydrationBoundary>

            {/* FAQ */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">{t('faqTitle')}</h2>
              <div className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
                {faqItems.map((item, i) => (
                  <details key={i} className="group bg-white dark:bg-gray-800">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium text-gray-900 marker:content-none dark:text-white">
                      <h3 className="font-medium">{item.q}</h3>
                      <span className="text-gray-400 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="px-4 pb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Browse by year */}
            {years.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('byYear')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {years.map((y) => (
                    <Link
                      key={y}
                      href={`/data/fuel-prices/${y}`}
                      className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      {y}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
