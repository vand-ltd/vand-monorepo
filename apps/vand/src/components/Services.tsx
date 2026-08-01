'use client';

import { useTranslations } from 'next-intl';
import { Boxes, Code2, Rocket } from 'lucide-react';
import { Reveal } from './Reveal';

const ICONS = [Code2, Boxes, Rocket];

export function Services() {
  const t = useTranslations('site.services');
  const items = ['custom', 'apps', 'products'] as const;

  return (
    <section id="services" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <Reveal className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-secondary dark:text-brand-accent">
          {t('kicker')}
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
          {t('title')}
        </h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{t('subtitle')}</p>
      </Reveal>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((key, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal key={key} delay={i * 80}>
              <div className="group h-full rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand-secondary/40 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-brand-accent/40">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary dark:bg-brand-accent/10 dark:text-brand-accent">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {t(`items.${key}.body`)}
                </p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
