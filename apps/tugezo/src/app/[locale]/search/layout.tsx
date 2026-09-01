import type { Metadata } from 'next';

// Search-result pages are query-driven, effectively infinite and thin — the
// classic source of index bloat. Keep them out of the index, but let crawlers
// follow the article links they contain.
//
// This lives in a layout because the page itself is a client component and so
// cannot export metadata.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
