import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{page: string}>;
}


export default async function DynamicPage(props: Props) {
  const resolvedParams = await props.params;
  try {
    const Page = (await import(`./pages/${resolvedParams.page}`)).default;
    return <Page />;
  } catch (error) {
    console.error("Error loading page:", error);
    return notFound();
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> { 
  const resolvedParams = await props.params;
  try {
    const mod = await import(`./pages/${resolvedParams.page}`);
    if (typeof mod.generateMetadata === 'function') {
      return await mod.generateMetadata();
    }
    return { title: "Default Title"}
  } catch (error) {
    return { title: error instanceof Error ? error.message : "Page Not Found"};
  }
}
