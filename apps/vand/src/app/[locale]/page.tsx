'use client';

import { useTranslations } from 'next-intl';

export default function ComingSoonPage() {
  const t = useTranslations('comingSoon');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003153] to-[#005F73]">
      <div className="text-center text-white px-6">
        <h1 className="text-5xl md:text-7xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-8">
          {t('subtitle')}
        </p>
        <div className="w-24 h-1 bg-[#F59E0B] mx-auto rounded-full" />
      </div>
    </div>
  );
}
