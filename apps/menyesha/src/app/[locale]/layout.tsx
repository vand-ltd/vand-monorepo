import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { Geist, Geist_Mono } from "next/font/google";
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
  } catch (error) {
    console.log(error)
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <div className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
          <Header />
          <div className="flex-1">
            <AsideBanner>
              <QueryProvider>
                {children}
              </QueryProvider>
            </AsideBanner>
          </div>
          <Footer />
        </div>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
