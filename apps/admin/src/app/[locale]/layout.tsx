import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from "next/navigation";
import { routing } from '@/i18n/routing';
import { ThemeProvider } from "@org/ui";
import { AdminHeader } from '@/components/AdminHeader';
import { QueryProvider } from '@org/api';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

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
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            <AdminHeader />
            <main className="flex-1">{children}</main>
          </div>
        </QueryProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
