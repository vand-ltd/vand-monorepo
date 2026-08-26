import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Article from "@/components/layouts/Article";
import { FootballScoreboard } from "@/components/layouts/FootballScoreboard";
import { SITE_URL, BRAND_NAME } from '@/lib/brand';

type Props = {
  params: Promise<{ locale: string; page: string[] }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Localized metadata for the custom single-page routes. These page components
// are 'use client', so their exported generateMetadata is a client reference
// that can't be called from the server — instead we read the page's own title
// (and description) from its translation namespace for the current locale.
const PAGE_META_KEYS: Record<string, { ns: string; titleKey: string; descKey?: string }> = {
  about: { ns: 'aboutPage', titleKey: 'heroTitle', descKey: 'heroDescription' },
  contact: { ns: 'contactPage', titleKey: 'title', descKey: 'description' },
  'privacy-policy': { ns: 'privacyPage', titleKey: 'title' },
  'terms-of-service': { ns: 'termsPage', titleKey: 'title' },
  advertise: { ns: 'advertisePage', titleKey: 'title', descKey: 'intro' },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadMessages(locale: string): Promise<any> {
  try {
    return (await import(`../../../../messages/${locale}.json`)).default;
  } catch {
    return (await import(`../../../../messages/en.json`)).default;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCategories(locale: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/api/tugezo/categories?language=${locale}`, {
      headers: { 'Content-Type': 'application/json', Origin: SITE_URL },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function DynamicPage(props: Props) {
  const { locale, page } = await props.params;
  const [mainPage, subPage] = page;

  // Fetch categories to validate locale-specific slugs
  const categories = await fetchCategories(locale);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parentCategory = categories.find((c: any) => c.slug === mainPage);

  if (parentCategory) {
    // Validate subcategory if present
    if (subPage) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validChild = (parentCategory.children || []).some((child: any) => child.slug === subPage);
      if (!validChild) return notFound();
    }
    return (
      <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900">
        <section className="py-8">
          <div className="max-w-screen-xl mx-auto px-4">
            {/* Football results/fixtures at the top of the sports landing */}
            {mainPage === 'sports' && !subPage && <FootballScoreboard />}
            <Article categoryKey={mainPage} subCategoryKey={subPage} />
          </div>
        </section>
      </div>
    );
  }

  // Fallback: try loading a custom page component
  if (page.length === 1) {
    try {
      const Page = (await import(`./pages/${mainPage}`)).default;
      return <Page />;
    } catch {
      return notFound();
    }
  }

  return notFound();
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, page } = await props.params;
  const [mainPage, subPage] = page;

  const categories = await fetchCategories(locale);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parentCategory = categories.find((c: any) => c.slug === mainPage);

  if (parentCategory) {
    const sub = subPage
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ` - ${(parentCategory.children || []).find((c: any) => c.slug === subPage)?.name || subPage}`
      : '';
    return { title: `${parentCategory.name}${sub} - ${BRAND_NAME}` };
  }

  if (page.length === 1) {
    const cfg = PAGE_META_KEYS[mainPage];
    if (cfg) {
      const messages = await loadMessages(locale);
      const ns = messages[cfg.ns] ?? {};
      const raw = ns[cfg.titleKey];
      if (raw) {
        // Avoid "Tugezo — Tugezo" when the title already names the brand.
        const title = String(raw).includes(BRAND_NAME) ? raw : `${raw} — ${BRAND_NAME}`;
        const description = cfg.descKey ? ns[cfg.descKey] : undefined;
        return description ? { title, description } : { title };
      }
    }
    // Unknown single page — humanize the slug (the page itself 404s if missing).
    const pretty = mainPage
      .split('-')
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
      .join(' ');
    return { title: `${pretty} — ${BRAND_NAME}` };
  }

  return { title: "Page Not Found" };
}
