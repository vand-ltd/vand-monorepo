import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FuelPricesView } from '@/components/data/FuelPricesView';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'fuelPrices' });
  return {
    title: `${t('title')} - Menyesha`,
    description: t('subtitle'),
  };
}

export default function FuelPricesPage() {
  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900">
      <section className="py-8">
        <div className="mx-auto max-w-screen-xl px-4">
          <FuelPricesView />
        </div>
      </section>
    </div>
  );
}
