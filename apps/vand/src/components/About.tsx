'use client';

import { useTranslations } from 'next-intl';
import { Reveal } from './Reveal';

export function About() {
  const t = useTranslations('site.about');
  const values = ['rooted', 'craft', 'partner'] as const;

  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-secondary dark:text-brand-accent">
            {t('kicker')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t('title')}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600 dark:text-gray-300">{t('lead')}</p>
          <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-300">{t('body')}</p>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((v) => (
              <div
                key={v}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t(`values.${v}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {t(`values.${v}.body`)}
                </p>
              </div>
            ))}
            <div className="rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-5 text-white">
              <p className="text-3xl font-bold">Rwanda</p>
              <p className="mt-1 text-sm text-white/80">{t('based')}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
