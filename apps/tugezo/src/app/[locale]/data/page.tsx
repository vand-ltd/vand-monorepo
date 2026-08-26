import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Fuel, ChevronRight, Database } from 'lucide-react';
import { BRAND_NAME } from '@/lib/brand';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dataHub' });
  return {
    title: `${t('title')} - ${BRAND_NAME}`,
    description: t('subtitle'),
  };
}

export default async function DataHubPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dataHub' });

  const datasets = [
    {
      href: '/data/fuel-prices',
      icon: Fuel,
      title: t('fuelPricesTitle'),
      description: t('fuelPricesDescription'),
      color: '#F59E0B',
    },
  ];

  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900">
      <section className="py-8">
        <div className="mx-auto max-w-screen-xl px-4">
          <header className="mb-8 flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#003153]/10 text-[#003153] dark:bg-[#F59E0B]/15 dark:text-[#F59E0B]">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {t('title')}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {datasets.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              >
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${d.color}1a`, color: d.color }}
                >
                  <d.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900 dark:text-white">{d.title}</h2>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{d.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
