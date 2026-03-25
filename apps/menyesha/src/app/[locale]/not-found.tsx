'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, Search } from 'lucide-react';
import { SearchInput } from '@/components/layouts/SearchInput';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations('notFound');
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="mb-6">
          <Image
            src={mounted && resolvedTheme === 'dark' ? '/menyesha-logo-dark.svg' : '/menyesha-logo.svg'}
            alt="Menyesha"
            width={140}
            height={40}
            className="h-10 w-auto object-contain mx-auto opacity-30"
          />
        </div>

        <h1 className="text-7xl font-bold text-brand-primary dark:text-brand-accent mb-2">
          404
        </h1>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {t('title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          {t('description')}
        </p>

        <div className="max-w-sm mx-auto mb-6">
          <SearchInput />
        </div>

        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-secondary hover:text-brand-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>
      </div>
    </div>
  );
}
