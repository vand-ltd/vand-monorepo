'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Script from 'next/script';

const GA_ID = 'G-LLP15XRGE9';

export function CookieConsent() {
  const t = useTranslations('cookies');
  const [consent, setConsent] = useState<'granted' | 'denied' | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('cookie-consent');
    if (stored === 'granted' || stored === 'denied') {
      setConsent(stored);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'granted');
    setConsent('granted');
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'denied');
    setConsent('denied');
  };

  return (
    <>
      {/* Only load Google Analytics if consent is granted */}
      {consent === 'granted' && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}

      {/* Banner — only show if no choice made yet */}
      {consent === null && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
          <div className="max-w-screen-lg mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
              <p className="font-medium text-gray-900 dark:text-white mb-1">{t('title')}</p>
              <p>{t('description')}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={decline}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {t('decline')}
              </button>
              <button
                onClick={accept}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-colors"
              >
                {t('accept')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
