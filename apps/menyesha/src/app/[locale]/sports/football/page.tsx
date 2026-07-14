import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { FootballResultsBoard } from '@/components/layouts/FootballResultsBoard';

export default async function FootballResultsPage() {
  const t = await getTranslations('football');

  return (
    <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
      <section className="py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <Link
            href="/sports"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToSports')}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {t('pageTitle')}
          </h1>
          <FootballResultsBoard />
        </div>
      </section>
    </div>
  );
}
