import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vand.rw';

// With localePrefix 'as-needed' the default locale (rw) lives at the root.
const languages = {
  rw: SITE_URL,
  en: `${SITE_URL}/en`,
  fr: `${SITE_URL}/fr`,
};

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'monthly',
      priority: 1,
      alternates: { languages },
    },
    {
      url: languages.en,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages },
    },
    {
      url: languages.fr,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages },
    },
  ];
}
