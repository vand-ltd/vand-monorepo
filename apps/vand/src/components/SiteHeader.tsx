'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Wordmark } from './Wordmark';

export function SiteHeader() {
  const t = useTranslations('site.nav');
  const [open, setOpen] = useState(false);

  const links = [
    { href: '#services', label: t('services') },
    { href: '#products', label: t('products') },
    { href: '#about', label: t('about') },
    { href: '#contact', label: t('contact') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-[#0a0f16]/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" aria-label="Vand home">
          <Wordmark />
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-brand-primary dark:text-gray-300 dark:hover:text-brand-accent"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <a
            href="#contact"
            className="hidden rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-secondary sm:inline-flex"
          >
            {t('cta')}
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 md:hidden dark:border-white/10 dark:text-gray-300"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <nav className="border-t border-gray-200/70 bg-white px-4 py-3 md:hidden dark:border-white/10 dark:bg-[#0a0f16]">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-lg bg-brand-primary px-3 py-2.5 text-center text-sm font-semibold text-white"
          >
            {t('cta')}
          </a>
        </nav>
      )}
    </header>
  );
}
