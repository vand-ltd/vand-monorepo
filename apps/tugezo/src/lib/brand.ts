// Single source of truth for the site's brand and domain.
//
// Renaming the site, or moving it to a new domain, should only mean editing this
// file (and setting NEXT_PUBLIC_SITE_URL) — never hunting hardcoded strings
// through metadata, sitemaps, share links and graphics.

// The production origin. A NEXT_PUBLIC_SITE_URL is only trusted when it's a real
// https URL, so a localhost value in dev can never leak into canonicals,
// hreflang or the sitemap.
//
// The canonical home of the site. Must always be the host that actually answers
// with 200 — never one that redirects — since every canonical, hreflang and
// sitemap URL is built from it. menyesha.vand.rw now 308s here.
const FALLBACK_SITE_URL = 'https://tugezo.com';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.startsWith('https://')
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
    : FALLBACK_SITE_URL;

// Bare hostname of the LIVE origin (derived from SITE_URL).
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');

// The domain printed on downloadable graphics (share cards, OG images, banners).
// Deliberately SEPARATE from SITE_URL/SITE_HOST: graphics are permanent once
// posted to social, so they advertise the brand's own domain, while canonicals,
// hreflang and the sitemap keep pointing at wherever the site actually answers.
// ⚠️ tugezo.com must at least redirect to the live site before graphics go out.
export const BRAND_DOMAIN = 'tugezo.com';

// The brand as it appears in titles, OG tags and alt text.
// "Tugezo" — from *tugezaho*: tu- (we) + geza (bring/deliver) + -ho (to you).
export const BRAND_NAME = 'Tugezo';

// The slogan, in English. Localized copies live in messages/*.json under
// `aboutPage.slogan` (rw: "Tubagezaho amakuru, buri munsi" — literally
// "we bring you the news, every day", built on the same *geza* root as the name).
// Use the translated key in UI; this constant is for non-localized surfaces.
export const BRAND_TAGLINE = 'We bring you the news, every day';

// The parent company, shown as the footer endorsement.
export const BRAND_PARENT = 'Vand Technologies';

// TODO(domain move): switch to the Tugezo mailbox once it exists — changing this
// before the address is live would break every contact link on the site.
export const CONTACT_EMAIL = 'menyesha@vand.rw';

// X/Twitter handle for `twitter:creator`.
export const TWITTER_HANDLE = '@tugezo';

// Default social/OG share image (lives in /public).
export const OG_IMAGE_PATH = '/tugezo.png';
export const OG_IMAGE = `${SITE_URL}${OG_IMAGE_PATH}`;

// Wordmark assets in /public. Renaming the brand means renaming these files and
// updating these two constants — nothing else references the filenames.
// The wave icon is unchanged; only the wordmark text differs.
export const LOGO_LIGHT_PATH = '/tugezo-logo.svg';
export const LOGO_DARK_PATH = '/tugezo-logo-dark.svg';

// Appended to page titles: "<page> | Tugezo".
export const TITLE_SUFFIX = ` | ${BRAND_NAME}`;

// Host suffix the media/image proxy trusts for our own uploads. This is the
// MEDIA domain, which may differ from the site domain (e.g. the site moves to
// its own domain while images keep being served from the parent's).
export const MEDIA_HOST_SUFFIX = '.vand.rw';
