import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { FuelPricesView } from '@/components/data/FuelPricesView';

const SITE_URL = 'https://menyesha.vand.rw';
const PATH = '/data/fuel-prices';
const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'fuelPrices' });
  return {
    title: `${t('title')} - Menyesha`,
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
      siteName: 'Menyesha',
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

  const queryClient = new QueryClient();
  const [current, upcoming, history] = await Promise.all([
    apiGet('/api/menyesha/fuel-prices/current'),
    apiGet('/api/menyesha/fuel-prices/upcoming'),
    apiGet('/api/menyesha/fuel-prices/history?order=desc'),
  ]);
  // Seed the same query keys the client component reads, so SSR renders real content.
  if (current) queryClient.setQueryData(['fuel-prices-current'], current);
  if (upcoming) queryClient.setQueryData(['fuel-prices-upcoming'], upcoming);
  if (history) {
    queryClient.setQueryData(['fuel-prices-history'], history);
    queryClient.setQueryData(['fuel-prices-history-table', '', '', '', '', '', 'desc'], history);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: t('title'),
    description: t('subtitle'),
    url: `${SITE_URL}/${locale}${PATH}`,
    inLanguage: locale,
    isAccessibleForFree: true,
    creator: { '@type': 'Organization', name: 'RURA', url: 'https://www.rura.rw' },
    ...(Array.isArray(history) && history[0]?.effectiveDate
      ? { dateModified: history[0].effectiveDate }
      : {}),
  };

  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="py-8">
        <div className="mx-auto max-w-screen-xl px-4">
          <HydrationBoundary state={dehydrate(queryClient)}>
            <FuelPricesView />
          </HydrationBoundary>
        </div>
      </section>
    </div>
  );
}
