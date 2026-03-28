'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import {
  Shield,
  CheckCircle,
  Globe,
  Zap,
  Users,
  Target,
  Mail,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  const locale = useLocale();
  const t = useTranslations('aboutPage');

  const values = [
    { icon: Shield, key: 'independence' },
    { icon: CheckCircle, key: 'factBased' },
    { icon: Globe, key: 'perspective' },
    { icon: Zap, key: 'realTime' },
    { icon: Users, key: 'community' },
    { icon: Target, key: 'transparency' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-14">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl p-8 md:p-12" style={{ background: 'linear-gradient(135deg, #003153, #005F73, #003153)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full -translate-y-28 translate-x-28" />
          <div className="absolute bottom-0 left-0 w-52 h-52 bg-white rounded-full translate-y-20 -translate-x-12" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6">
            <Image
              src="/menyesha-logo-dark.svg"
              alt="Menyesha"
              width={160}
              height={44}
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight text-white">
            {t('heroTitle')}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-6">
            {t('heroDescription')}
          </p>
          <p className="text-sm text-gray-300 italic">
            {t('slogan')}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {t('missionTitle')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">
          {t('missionText')}
        </p>
      </section>

      {/* Values */}
      <section className="space-y-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {t('valuesTitle')}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {values.map(({ icon: Icon, key }) => (
            <Card key={key} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-accent/10 rounded-lg flex items-center justify-center">
                  <Icon className="h-5 w-5 text-brand-primary dark:text-brand-accent" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t(`values.${key}.title`)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t(`values.${key}.description`)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 md:p-10">
        <div className="max-w-2xl space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t('contactTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('contactDescription')}
          </p>

          <div className="space-y-4">
            <a href="mailto:menyesha@vand.rw" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('email')}</div>
                <div className="text-sm text-brand-secondary group-hover:text-brand-accent transition-colors">menyesha@vand.rw</div>
              </div>
            </a>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{t('location')}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Kigali, Rwanda</div>
              </div>
            </div>
          </div>

          <Link href={`/${locale}`}>
            <Button className="bg-brand-primary hover:bg-brand-secondary text-white mt-2">
              {t('readNews')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: 'About - Menyesha',
    description: 'Learn about Menyesha, our mission for independent journalism from Rwanda and around the world.',
  };
}
