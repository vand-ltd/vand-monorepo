'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Mail, Users, Smartphone, Languages, Zap, MapPin, Layers, CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CONTACT_EMAIL } from '@/lib/brand';

const PLACEMENTS = [
  { key: 'header', size: '728×100' },
  { key: 'sidebar', size: '300×250' },
  { key: 'inline', size: '300×250' },
  { key: 'infeed', size: '300×250' },
  { key: 'footer', size: '320×50' },
] as const;

const DURATIONS = ['month', 'quarter', 'year'] as const;
const TIERS = ['premium', 'standard'] as const;
const WHY_ICONS = [Users, Smartphone, Languages, Zap];

export default function AdvertisePage() {
  const t = useTranslations('advertisePage');
  const why = ['audience', 'mobile', 'languages', 'realtime'] as const;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('intro')}</p>
      </div>

      {/* Why advertise */}
      <div className="grid gap-3 sm:grid-cols-2">
        {why.map((k, i) => {
          const Icon = WHY_ICONS[i];
          return (
            <Card key={k}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-brand-primary/10 dark:bg-brand-accent/10 flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5 text-brand-primary dark:text-brand-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t(`why.${k}.title`)}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t(`why.${k}.body`)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Placements */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('placementsTitle')}
        </h2>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
          {PLACEMENTS.map((p) => (
            <div key={p.key} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t(`placements.${p.key}.name`)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(`placements.${p.key}.where`)}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-[11px] font-medium tabular-nums text-gray-500 dark:text-gray-400">
                {p.size}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* How pricing works — no numbers, driven to contact */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          {t('pricingTitle')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('pricingIntro')}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* By section */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-brand-secondary dark:text-brand-accent" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('bySectionTitle')}
                </h3>
              </div>
              <div className="space-y-3">
                {TIERS.map((tier) => (
                  <div key={tier}>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {t(`tiers.${tier}.name`)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t(`tiers.${tier}.sections`)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By package */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock className="h-4 w-4 text-brand-secondary dark:text-brand-accent" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t('byPackageTitle')}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {DURATIONS.map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t(`durations.${d}`)}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t('packageNote')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA — contact for rates */}
      <Card className="overflow-hidden !p-0 !gap-0">
        <div className="p-6" style={{ background: 'linear-gradient(135deg, #003153, #005F73)' }}>
          <h3 className="text-lg font-semibold text-white mb-1">{t('cta.title')}</h3>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">{t('cta.body')}</p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Advertising%20Inquiry`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-amber-400 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
            >
              <Mail className="h-4 w-4" />
              {t('cta.button')}
            </a>
            <span className="inline-flex items-center gap-1.5 text-sm text-white/70">
              <MapPin className="h-4 w-4" />
              Kigali, Rwanda
            </span>
          </div>
        </div>
      </Card>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('backHint')}{' '}
        <Link href="/contact" className="text-brand-secondary hover:text-brand-accent font-medium">
          {t('contactLink')}
        </Link>
        .
      </p>
    </div>
  );
}
