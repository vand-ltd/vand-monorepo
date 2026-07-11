import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { CalendarRange, ArrowLeft, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { computeFuelInsights, type FuelSeriesInsight } from '@/lib/fuelInsights';
import type { FuelPriceRecord } from '@org/api';

const SITE_URL = 'https://menyesha.vand.rw';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const FUEL_ORDER = ['Petrol', 'Diesel', 'Kerosene'];
const FUEL_COLORS: Record<string, string> = { Petrol: '#F59E0B', Diesel: '#005F73', Kerosene: '#6366f1' };
const fuelDisplay = (f: string) => (f === 'Petrol' ? 'Gasoline (Petrol)' : f);
const toNum = (v: string | null | undefined) => (v == null ? null : parseFloat(v));

type Props = { params: Promise<{ locale: string; year: string }> };

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

async function loadYear(year: string) {
  const history: FuelPriceRecord[] = (await apiGet('/api/menyesha/fuel-prices/history?order=desc')) || [];
  const allYears = Array.from(
    new Set(history.map((r) => new Date(r.effectiveDate).getFullYear()))
  ).sort((a, b) => b - a);
  const yr = Number(year);
  const records = history.filter((r) => new Date(r.effectiveDate).getFullYear() === yr);
  return { records, allYears };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, year } = await params;
  const t = await getTranslations({ locale, namespace: 'fuelPrices' });
  const path = `/data/fuel-prices/${year}`;
  return {
    title: `${t('yearTitle', { year })} - Menyesha`,
    description: t('yearSubtitle', { year }),
    alternates: {
      canonical: `${SITE_URL}/${locale}${path}`,
      languages: {
        en: `${SITE_URL}/en${path}`,
        fr: `${SITE_URL}/fr${path}`,
        rw: `${SITE_URL}/rw${path}`,
        'x-default': `${SITE_URL}/en${path}`,
      },
    },
    openGraph: {
      title: t('yearTitle', { year }),
      description: t('yearSubtitle', { year }),
      url: `${SITE_URL}/${locale}${path}`,
      siteName: 'Menyesha',
      type: 'website',
    },
  };
}

export default async function FuelYearPage({ params }: Props) {
  const { locale, year } = await params;
  if (!/^\d{4}$/.test(year)) notFound();

  const { records, allYears } = await loadYear(year);
  if (records.length === 0) notFound();

  const t = await getTranslations({ locale, namespace: 'fuelPrices' });
  const tHub = await getTranslations({ locale, namespace: 'dataHub' });

  const dateLocale = locale === 'rw' ? 'en' : locale;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' });
  const fmtNum = (n: number) => n.toLocaleString('en-US');
  const unit = t('unit');

  const insights = computeFuelInsights(records);
  const fuels = FUEL_ORDER.filter((f) => insights.perFuel[f]).map((f) => insights.perFuel[f]);
  const rows = records
    .slice()
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  function tilesFor(s: FuelSeriesInsight) {
    return [
      { label: t('statAverage'), value: s.average != null ? `${fmtNum(Math.round(s.average * 10) / 10)} ${unit}` : '—' },
      { label: t('highest'), value: s.high ? `${fmtNum(s.high.price)} ${unit}` : '—', sub: s.high ? fmtDate(s.high.date) : undefined },
      { label: t('lowest'), value: s.low ? `${fmtNum(s.low.price)} ${unit}` : '—', sub: s.low ? fmtDate(s.low.date) : undefined },
      { label: t('statChanges'), value: String(s.changeCount) },
    ];
  }

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: t('yearTitle', { year }),
      description: t('yearSubtitle', { year }),
      url: `${SITE_URL}/${locale}/data/fuel-prices/${year}`,
      inLanguage: locale,
      isAccessibleForFree: true,
      creator: { '@type': 'Organization', name: 'RURA', url: 'https://www.rura.rw' },
      temporalCoverage: year,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Menyesha', item: `${SITE_URL}/${locale}` },
        { '@type': 'ListItem', position: 2, name: tHub('title'), item: `${SITE_URL}/${locale}/data` },
        { '@type': 'ListItem', position: 3, name: t('title'), item: `${SITE_URL}/${locale}/data/fuel-prices` },
        { '@type': 'ListItem', position: 4, name: year, item: `${SITE_URL}/${locale}/data/fuel-prices/${year}` },
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
                <li><Link href="/" className="hover:text-brand-primary dark:hover:text-brand-accent">Menyesha</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/data" className="hover:text-brand-primary dark:hover:text-brand-accent">{tHub('title')}</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/data/fuel-prices" className="hover:text-brand-primary dark:hover:text-brand-accent">{t('title')}</Link></li>
                <li aria-hidden>/</li>
                <li className="text-gray-700 dark:text-gray-300">{year}</li>
              </ol>
            </nav>

            {/* Header */}
            <header className="flex items-start gap-3">
              <div className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#003153]/10 text-[#003153] dark:bg-[#F59E0B]/15 dark:text-[#F59E0B]">
                <CalendarRange className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('yearTitle', { year })}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('yearSubtitle', { year })}</p>
              </div>
            </header>

            <p className="max-w-3xl text-base leading-relaxed text-gray-700 dark:text-gray-300">
              {t('yearIntro', { year, updates: insights.updateCount })}
            </p>

            {/* Per-fuel stats for the year */}
            {fuels.map((s) => (
              <section key={s.fuelType}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: FUEL_COLORS[s.fuelType] ?? '#003153' }} />
                  {fuelDisplay(s.fuelType)}
                </h2>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {tilesFor(s).map((tile, i) => (
                    <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{tile.label}</p>
                      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{tile.value}</p>
                      {tile.sub && <p className="text-xs text-gray-400">{tile.sub}</p>}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Updates table */}
            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{t('history')}</h2>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('colDate')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('colFuel')}</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('colPrice')}</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('colChange')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                      {rows.map((rec) => {
                        const price = toNum(rec.pricePerLiter);
                        const DirIcon = rec.direction === 'up' ? ArrowUp : rec.direction === 'down' ? ArrowDown : Minus;
                        const color = rec.direction === 'up' ? 'text-red-600 dark:text-red-400' : rec.direction === 'down' ? 'text-green-600 dark:text-green-400' : 'text-gray-400';
                        return (
                          <tr key={rec.id}>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900 dark:text-white">{fmtDate(rec.effectiveDate)}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: FUEL_COLORS[rec.fuelType] ?? '#003153' }} />
                                {fuelDisplay(rec.fuelType)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                              {price != null ? fmtNum(price) : '—'} <span className="text-xs font-normal text-gray-400">{rec.currency}</span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              {rec.change == null || rec.direction == null ? (
                                <span className="text-xs text-gray-400">—</span>
                              ) : (
                                <span className={`inline-flex items-center justify-end gap-0.5 text-xs font-medium ${color}`}>
                                  <DirIcon className="h-3.5 w-3.5" />
                                  {rec.change !== 0 ? fmtNum(Math.abs(rec.change)) : t('unchanged')}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Browse by year */}
            {allYears.length > 1 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('byYear')}</h2>
                <div className="flex flex-wrap gap-2">
                  {allYears.map((y) => (
                    <Link
                      key={y}
                      href={`/data/fuel-prices/${y}`}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        String(y) === year
                          ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {y}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div className="pt-2">
              <Link href="/data/fuel-prices" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                <ArrowLeft className="h-4 w-4" />
                {t('backToPrices')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
