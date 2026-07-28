'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpRight, Check } from 'lucide-react';
import { Reveal } from './Reveal';

export function ProductSpotlight() {
  const t = useTranslations('site.products');
  const features = ['live', 'news', 'multilang'] as const;

  return (
    <section
      id="products"
      className="scroll-mt-20 border-y border-gray-200/70 bg-gray-50 py-20 sm:py-28 dark:border-white/10 dark:bg-white/[0.02]"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-secondary dark:text-brand-accent">
            {t('kicker')}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{t('subtitle')}</p>
        </Reveal>

        <Reveal className="mt-12">
          <div className="grid items-center gap-10 rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 lg:grid-cols-2 dark:border-white/10 dark:bg-[#0f1620]">
            {/* Copy */}
            <div>
              <span className="inline-flex rounded-full bg-brand-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-accent">
                {t('flagship')}
              </span>
              <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Menyesha</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-300">{t('menyesha.tagline')}</p>

              <ul className="mt-6 space-y-3">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary dark:text-brand-accent" />
                    {t(`menyesha.features.${f}`)}
                  </li>
                ))}
              </ul>

              <a
                href="https://menyesha.vand.rw"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-secondary"
              >
                {t('menyesha.cta')}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>

            {/* Stylized product visual */}
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-2xl dark:border-white/10">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-100 px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 rounded-md bg-white px-2 py-0.5 text-[10px] text-gray-400 dark:bg-black/20 dark:text-gray-500">
                    menyesha.vand.rw
                  </span>
                </div>
                {/* Faux content */}
                <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-5">
                  <div className="rounded-xl bg-white/95 p-4 shadow-sm dark:bg-[#0f1620]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-primary dark:text-brand-accent">
                        BK PRO LEAGUE
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-red-500">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE 67&apos;
                      </span>
                    </div>
                    {[
                      ['APR FC', '2'],
                      ['Rayon Sports', '1'],
                    ].map(([team, score]) => (
                      <div key={team} className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{team}</span>
                        <span className="font-bold tabular-nums text-gray-900 dark:text-white">{score}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-12 rounded-lg bg-white/15" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-6">
          <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-5 text-center text-sm text-gray-500 dark:border-white/15 dark:text-gray-400">
            {t('more')}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
