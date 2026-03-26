import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from 'next';
// @ts-ignore
import "../globals.css";
import { notFound } from "next/navigation";
import { routing } from '@/i18n/routing';
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from '@/components/layouts/Header';
import AsideBanner from '@/components/layouts/AsideBanner';
import Footer from '@/components/layouts/Footer';
import { QueryProvider } from '@org/api'

// Font loaders must be called at module scope
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../../../messages/en.json`)).default;
  }
  const m = messages.metadata;

  const localeMap: Record<string, string> = { en: 'en_US', fr: 'fr_FR', rw: 'rw_RW' };

  return {
    title: m.title,
    description: m.description,
    openGraph: {
      type: 'website',
      locale: localeMap[locale] || 'en_US',
      url: `https://menyesha.vand.rw/${locale}`,
      siteName: 'Menyesha',
      title: m.title,
      description: m.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
      creator: '@menyesha',
    },
  };
}

export default async function LocaleLayout({
  children, params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Ensure messages are loaded for the resolved locale
  let messages;
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryProvider>
          <div className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
            <Header />
            <div className="flex-1">
              <AsideBanner>
                {children}
              </AsideBanner>
            </div>
            <Footer />
          </div>
        </QueryProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
