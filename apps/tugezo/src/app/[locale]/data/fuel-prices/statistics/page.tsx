import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BarChart3, ArrowLeft, TableProperties } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { computeFuelInsights, type FuelSeriesInsight } from '@/lib/fuelInsights';
import { SITE_URL, BRAND_NAME } from '@/lib/brand';

const PATH = '/data/fuel-prices/statistics';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const FUEL_ORDER = ['Petrol', 'Diesel', 'Kerosene'];
const FUEL_COLORS: Record<string, string> = { Petrol: '#F59E0B', Diesel: '#005F73', Kerosene: '#6366f1' };
const fuelDisplay = (f: string) => (f === 'Petrol' ? 'Gasoline (Petrol)' : f);

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'fuelPrices' });
  return {
    title: `${t('statsTitle')} - ${BRAND_NAME}`,
    description: t('statsSubtitle'),
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
      title: t('statsTitle'),
      description: t('statsSubtitle'),
      url: `${SITE_URL}/${locale}${PATH}`,
      siteName: BRAND_NAME,
      type: 'website',
    },
  };
}

async function apiGet(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()).data;
  } catch {
    return null;
  }
}

export default async function FuelStatisticsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'fuelPrices' });
  const tHub = await getTranslations({ locale, namespace: 'dataHub' });

  const history = await apiGet('/api/tugezo/fuel-prices/history?order=desc');
  const insights = computeFuelInsights(Array.isArray(history) ? history : []);

  const dateLocale = locale === 'rw' ? 'en' : locale;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' });
  const fmtNum = (n: number) => n.toLocaleString('en-US');
  const unit = t('unit');

  const petrol = insights.perFuel['Petrol'];
  const fuels = FUEL_ORDER.filter((f) => insights.perFuel[f]?.current != null).map(
    (f) => insights.perFuel[f]
  );

  const intro = insights.updateCount
    ? t('statsIntro', {
        updates: insights.updateCount,
        since: insights.firstDate ? fmtDate(insights.firstDate) : '—',
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

  function tilesFor(s: FuelSeriesInsight) {
    return [
      { label: t('statCurrent'), value: s.current != null ? `${fmtNum(s.current)} ${unit}` : '—', sub: s.currentDate ? fmtDate(s.currentDate) : undefined },
      { label: t('statAverage'), value: s.average != null ? `${fmtNum(Math.round(s.average * 10) / 10)} ${unit}` : '—' },
      { label: t('allTimeHigh'), value: s.high ? `${fmtNum(s.high.price)} ${unit}` : '—', sub: s.high ? fmtDate(s.high.date) : undefined },
      { label: t('allTimeLow'), value: s.low ? `${fmtNum(s.low.price)} ${unit}` : '—', sub: s.low ? fmtDate(s.low.date) : undefined },
      { label: t('biggestIncrease'), value: s.largestIncrease ? `+${fmtNum(s.largestIncrease.amount)}` : '—', sub: s.largestIncrease ? fmtDate(s.largestIncrease.date) : undefined },
      { label: t('statLargestDecrease'), value: s.largestDecrease ? `−${fmtNum(s.largestDecrease.amount)}` : '—', sub: s.largestDecrease ? fmtDate(s.largestDecrease.date) : undefined },
      { label: t('statChanges'), value: String(s.changeCount) },
      { label: t('statUpdates'), value: String(insights.updateCount) },
    ];
  }

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: t('statsTitle'),
      description: t('statsSubtitle'),
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
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: BRAND_NAME, item: `${SITE_URL}/${locale}` },
        { '@type': 'ListItem', position: 2, name: tHub('title'), item: `${SITE_URL}/${locale}/data` },
        { '@type': 'ListItem', position: 3, name: t('title'), item: `${SITE_URL}/${locale}/data/fuel-prices` },
        { '@type': 'ListItem', position: 4, name: t('statsTitle'), item: `${SITE_URL}/${locale}${PATH}` },
      ],
    },
  ];

  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="py-8">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="space-y-8">
            {/* Breadcrumb */}
            <nav className="text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li><Link href="/" className="hover:text-brand-primary dark:hover:text-brand-accent">{BRAND_NAME}</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/data" className="hover:text-brand-primary dark:hover:text-brand-accent">{tHub('title')}</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/data/fuel-prices" className="hover:text-brand-primary dark:hover:text-brand-accent">{t('title')}</Link></li>
                <li aria-hidden>/</li>
                <li className="text-gray-700 dark:text-gray-300">{t('statsTitle')}</li>
              </ol>
            </nav>

            {/* Header */}
            <header className="flex items-start gap-3">
              <div className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#003153]/10 text-[#003153] dark:bg-[#F59E0B]/15 dark:text-[#F59E0B]">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('statsTitle')}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('statsSubtitle')}</p>
              </div>
            </header>

            {intro && (
              <div className="max-w-3xl space-y-3">
                <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{intro}</p>
                {(insightChanges || insightTrend) && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {insightChanges && <p>{insightChanges}</p>}
                    {insightTrend && <p className="mt-1">{insightTrend}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Per-fuel statistics */}
            {fuels.length === 0 ? (
              <p className="py-12 text-center text-gray-500 dark:text-gray-400">{t('noRecords')}</p>
            ) : (
              fuels.map((s) => (
                <section key={s.fuelType}>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: FUEL_COLORS[s.fuelType] ?? '#003153' }} />
                    {fuelDisplay(s.fuelType)}
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {tilesFor(s).map((tile, i) => (
                      <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{tile.label}</p>
                        <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{tile.value}</p>
                        {tile.sub && <p className="text-xs text-gray-400">{tile.sub}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/data/fuel-prices" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                <ArrowLeft className="h-4 w-4" />
                {t('backToPrices')}
              </Link>
              <Link href="/data/fuel-prices" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                <TableProperties className="h-4 w-4" />
                {t('viewHistory')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
