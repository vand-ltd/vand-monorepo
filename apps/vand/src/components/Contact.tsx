'use client';

import { useTranslations } from 'next-intl';
import { Mail, MapPin, ArrowRight } from 'lucide-react';

export function Contact() {
  const t = useTranslations('site.contact');

  return (
    <section id="contact" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-brand-primary to-brand-secondary px-6 py-14 text-center sm:px-12 dark:border-white/10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-accent/20 blur-3xl" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">{t('subtitle')}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:menyesha@vand.rw"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-gray-100 sm:w-auto"
            >
              <Mail className="h-4 w-4" />
              menyesha@vand.rw
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-6 inline-flex items-center gap-1.5 text-sm text-white/70">
            <MapPin className="h-4 w-4" />
            {t('location')}
          </p>
        </div>
      </div>
    </section>
  );
}
