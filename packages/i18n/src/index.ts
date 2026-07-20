import { defineRouting } from 'next-intl/routing';
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';

export const locales = ['en', 'fr', 'rw'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'rw';

/**
 * Create the i18n routing configuration with shared locales and defaultLocale.
 *
 * `localePrefix` defaults to next-intl's 'always' (every URL carries a locale,
 * so `/` redirects to `/<defaultLocale>`). Pass 'as-needed' to serve the default
 * locale at the root with a 200 — avoids the "Page with redirect" status in
 * Google Search Console for the homepage.
 */
export function createRouting(options?: {
  localePrefix?: 'always' | 'as-needed' | 'never';
}) {
  return defineRouting({
    locales: [...locales],
    defaultLocale,
    localeDetection: false,
    ...(options?.localePrefix ? { localePrefix: options.localePrefix } : {}),
  });
}

/**
 * Create the server-side request config for next-intl.
 * Each app provides its own loadMessages function to load translation JSON files.
 */
export function createRequestConfig(
  loadMessages: (locale: string) => Promise<Record<string, unknown>>
) {
  return getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale([...locales], requested)
      ? requested
      : defaultLocale;

    return {
      locale,
      messages: await loadMessages(locale),
    };
  });
}

// Re-export next-intl utilities apps need
export { createNavigation } from 'next-intl/navigation';
export { default as createProxy } from 'next-intl/middleware';
