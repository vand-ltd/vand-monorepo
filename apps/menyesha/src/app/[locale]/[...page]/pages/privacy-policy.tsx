'use client';

import { useTranslations } from 'next-intl';
import { Shield, Cookie, Share2, UserCheck, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacyPage');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 dark:bg-brand-accent/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('lastUpdated')}</p>
      </div>

      <div className="space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t('introTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('introText')}</p>
        </section>

        {/* Information We Collect */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('collectTitle')}</h2>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('collectAnalytics')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('collectAnalyticsText')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('collectLocale')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('collectLocaleText')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('collectComments')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t('collectCommentsText')}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cookies */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Cookie className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('cookiesTitle')}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{t('cookiesText')}</p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary dark:bg-brand-accent flex-shrink-0" />
              {t('cookieEssential')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary dark:bg-brand-accent flex-shrink-0" />
              {t('cookieAnalytics')}
            </li>
          </ul>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{t('cookiesNote')}</p>
        </section>

        {/* Data Sharing */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('sharingTitle')}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('sharingText')}</p>
        </section>

        {/* Your Rights */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('rightsTitle')}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{t('rightsText')}</p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary dark:bg-brand-accent flex-shrink-0" />
              {t('rightAccess')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary dark:bg-brand-accent flex-shrink-0" />
              {t('rightDelete')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary dark:bg-brand-accent flex-shrink-0" />
              {t('rightPortability')}
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('contactTitle')}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-2">{t('contactText')}</p>
          <p className="text-brand-primary dark:text-brand-accent font-medium">menyesha@vand.rw</p>
        </section>
      </div>
    </div>
  );
}
