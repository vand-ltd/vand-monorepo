'use client';

import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';

export default function CreateArticlePage() {
  const t = useTranslations('createArticle');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 bg-[#003153]/10 dark:bg-[#003153]/30 rounded-2xl flex items-center justify-center mb-6">
          <FileText className="h-8 w-8 text-[#003153] dark:text-[#F59E0B]" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {t('title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          {t('subtitle')}
        </p>
      </div>
    </div>
  );
}
