import { locales, defaultLocale } from '@org/i18n';

// Always emit absolute production URLs — ignore a localhost NEXT_PUBLIC_SITE_URL.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.startsWith('https://')
    ? process.env.NEXT_PUBLIC_SITE_URL
    : 'https://menyesha.vand.rw';

/**
 * Build `alternates` (canonical + hreflang) for a page whose slug is IDENTICAL
 * across locales — football, data and static pages (unlike articles, whose
 * slugs are localized). Prevents Search Console's "Duplicate without
 * user-selected canonical" by naming a canonical and linking every locale.
 *
 * @param locale the current locale (self-canonical points here)
 * @param path   the path WITHOUT leading slash and WITHOUT locale prefix,
 *               e.g. "football/cecafa/apr-fc-vs-x-2026-08-01" or "" for the root.
 *               Pass the base (tab-less) path from a tab page so the near-
 *               duplicate tab URLs collapse onto one canonical.
 */
export function localeAlternates(locale: string, path: string) {
  const rel = path ? `/${path}` : '';
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `${SITE_URL}/${l}${rel}`;
  // x-default → the locale `/` redirects to, so language-agnostic hits land right.
  languages['x-default'] = `${SITE_URL}/${defaultLocale}${rel}`;
  return {
    canonical: `${SITE_URL}/${locale}${rel}`,
    languages,
  };
}
