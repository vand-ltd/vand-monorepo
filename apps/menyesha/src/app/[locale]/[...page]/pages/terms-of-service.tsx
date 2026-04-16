'use client';

import { useTranslations } from 'next-intl';
import { FileText, BookOpen, Users, MessageSquare, AlertTriangle, Shield, RefreshCw, Mail } from 'lucide-react';

export default function TermsOfServicePage() {
  const t = useTranslations('termsPage');

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 dark:bg-brand-accent/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
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

        {/* Use of Content */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('useTitle')}</h2>
          </div>
          <div className="space-y-3 text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>{t('useText1')}</p>
            <p>{t('useText2')}</p>
          </div>
        </section>

        {/* User Conduct */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('conductTitle')}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{t('conductText')}</p>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {t('conductItem1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {t('conductItem2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {t('conductItem3')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {t('conductItem4')}
            </li>
          </ul>
        </section>

        {/* Comments */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('commentsTitle')}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('commentsText')}</p>
        </section>

        {/* Disclaimer */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('disclaimerTitle')}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('disclaimerText')}</p>
        </section>

        {/* Limitation of Liability */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('liabilityTitle')}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('liabilityText')}</p>
        </section>

        {/* Changes */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('changesTitle')}</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('changesText')}</p>
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
