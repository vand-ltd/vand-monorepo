'use client';

import type { ReactNode, SyntheticEvent } from 'react';
import { Link, useRouter } from '@/i18n/navigation';

// Wraps a team's crest and/or name so clicking opens /football/team/:slug.
//
// `nested` = this sits INSIDE another <a> (a match-row link), where a real <a>
// would be invalid HTML. There we navigate via onClick and stop the click from
// also triggering the outer match link. Non-nested spots use a real <Link> so
// the team page is crawlable and supports open-in-new-tab / middle-click.
//
// No slug → renders the children plainly (nothing breaks on slug-less teams).
export function TeamLink({
  slug,
  nested = false,
  className = '',
  title,
  children,
}: {
  slug?: string | null;
  nested?: boolean;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  if (!slug) return <>{children}</>;
  const href = `/football/team/${slug}`;

  if (nested) {
    const go = (e: SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      router.push(href);
    };
    return (
      <span
        role="link"
        tabIndex={0}
        onClick={go}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') go(e);
        }}
        title={title}
        className={`cursor-pointer hover:underline ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} title={title} className={`hover:underline ${className}`}>
      {children}
    </Link>
  );
}
