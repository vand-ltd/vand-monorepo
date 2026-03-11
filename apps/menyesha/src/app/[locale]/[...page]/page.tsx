import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Article from "@/components/layouts/Article";

type Props = {
  params: Promise<{ locale: string; page: string[] }>;
};

const CATEGORY_PAGES = new Set([
  'sports', 'entertainment', 'technology', 'business', 'news',
]);

const VALID_SUB_CATEGORIES = new Set([
  'africa', 'europe', 'international',
]);

export default async function DynamicPage(props: Props) {
  const { page } = await props.params;
  const [mainPage, subPage] = page;

  // Category with optional subcategory: /sports, /sports/africa
  if (CATEGORY_PAGES.has(mainPage)) {
    if (subPage && !VALID_SUB_CATEGORIES.has(subPage)) {
      return notFound();
    }
    return (
      <div className="w-full max-w-full bg-gray-50 dark:bg-gray-900">
        <section className="py-8">
          <div className="max-w-screen-xl mx-auto px-4">
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
  const { page } = await props.params;
  // locale available via params if needed in the future
  const [mainPage, subPage] = page;

  if (CATEGORY_PAGES.has(mainPage)) {
    const title = mainPage.charAt(0).toUpperCase() + mainPage.slice(1);
    const sub = subPage ? ` - ${subPage.charAt(0).toUpperCase() + subPage.slice(1)}` : '';
    return { title: `${title}${sub} - Menyesha` };
  }

  if (page.length === 1) {
    try {
      const mod = await import(`./pages/${mainPage}`);
      if (typeof mod.generateMetadata === 'function') {
        return await mod.generateMetadata();
      }
      return { title: "Default Title" };
    } catch {
      return { title: "Page Not Found" };
    }
  }

  return { title: "Page Not Found" };
}
