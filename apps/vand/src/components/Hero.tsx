'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  const t = useTranslations('site.hero');

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Ambient brand glow — stronger in dark mode. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[720px] max-w-full -translate-x-1/2 rounded-full bg-brand-secondary/20 blur-[120px] dark:bg-brand-secondary/30" />
        <div className="absolute right-[10%] top-[30%] h-[280px] w-[280px] rounded-full bg-brand-accent/10 blur-[100px] dark:bg-brand-accent/20" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/60 px-3 py-1 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
          <Sparkles className="h-3.5 w-3.5 text-brand-accent" />
          {t('eyebrow')}
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-6xl dark:text-white">
          {t('titleLead')}{' '}
          <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent dark:from-brand-accent dark:via-brand-secondary dark:to-white">
            {t('titleHighlight')}
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          {t('subtitle')}
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#contact"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-secondary sm:w-auto"
          >
            {t('ctaPrimary')}
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#products"
            className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 sm:w-auto dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10"
          >
            {t('ctaSecondary')}
          </a>
        </div>

        <p className="mt-10 text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {t('trust')}
        </p>
      </div>
    </section>
  );
}
