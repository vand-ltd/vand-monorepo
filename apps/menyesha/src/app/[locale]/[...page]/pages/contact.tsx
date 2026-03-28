'use client';

import { useTranslations } from 'next-intl';
import { Mail, MapPin, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ContactPage() {
  const t = useTranslations('contactPage');

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('description')}
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-accent/10 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('generalEmail')}</h3>
              <a href="mailto:menyesha@vand.rw" className="text-sm text-brand-secondary hover:text-brand-accent transition-colors">
                menyesha@vand.rw
              </a>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('generalEmailHint')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-accent/10 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('location')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Kigali, Rwanda</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Story Tip */}
      <Card className="overflow-hidden !p-0 !gap-0">
        <div className="p-6" style={{ background: 'linear-gradient(135deg, #003153, #005F73)' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-brand-accent" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">{t('storyTipTitle')}</h3>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                {t('storyTipDescription')}
              </p>
              <a
                href="mailto:menyesha@vand.rw?subject=Story%20Tip"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent hover:bg-amber-400 text-gray-900 text-sm font-medium rounded-lg transition-colors"
              >
                <Mail className="h-4 w-4" />
                {t('sendTip')}
              </a>
            </div>
          </div>
        </div>
      </Card>

      {/* Advertising */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('advertisingTitle')}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {t('advertisingDescription')}
        </p>
        <a
          href="mailto:menyesha@vand.rw?subject=Advertising%20Inquiry"
          className="text-sm text-brand-secondary hover:text-brand-accent font-medium transition-colors"
        >
          menyesha@vand.rw
        </a>
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'Contact - Menyesha',
    description: 'Get in touch with Menyesha. Send us story tips, feedback, or business inquiries.',
  };
}
