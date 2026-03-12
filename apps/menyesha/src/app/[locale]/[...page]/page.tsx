import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Article from "@/components/layouts/Article";

type Props = {
  params: Promise<{ locale: string; page: string[] }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://menyesha.vand.rw';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchCategories(locale: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/api/menyesha/categories?language=${locale}`, {
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
    return { title: `${parentCategory.name}${sub} - Menyesha` };
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
