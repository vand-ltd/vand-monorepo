'use client';

import { useTranslations } from 'next-intl';
import { Wordmark } from './Wordmark';

export function SiteFooter() {
  const t = useTranslations('site');
  const year = 2026;

  const links = [
    { href: '#services', label: t('nav.services') },
    { href: '#products', label: t('nav.products') },
    { href: '#about', label: t('nav.about') },
    { href: '#contact', label: t('nav.contact') },
  ];

  return (
    <footer className="border-t border-gray-200/70 bg-white dark:border-white/10 dark:bg-[#0a0f16]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{t('footer.tagline')}</p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-2">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-gray-600 transition-colors hover:text-brand-primary dark:text-gray-400 dark:hover:text-brand-accent"
              >
                {l.label}
              </a>
            ))}
            <a
              href="https://menyesha.vand.rw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 transition-colors hover:text-brand-primary dark:text-gray-400 dark:hover:text-brand-accent"
            >
              Menyesha
            </a>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200/70 pt-6 text-sm text-gray-500 sm:flex-row dark:border-white/10 dark:text-gray-500">
          <p>© {year} Vand. {t('footer.rights')}</p>
          <a href="mailto:menyesha@vand.rw" className="hover:text-brand-primary dark:hover:text-brand-accent">
            menyesha@vand.rw
          </a>
        </div>
      </div>
    </footer>
  );
}
