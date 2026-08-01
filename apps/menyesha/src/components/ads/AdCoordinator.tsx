'use client';

import { createContext, useContext, useId, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// Coordinates the ad slots on a page so the same ad never appears twice. Slots
// that share a (placement, section, pageType) key each claim a distinct index;
// the slot then shows a *different* ad, and any slot beyond the number of
// available ads falls back to its placeholder. So one ad fills one box, and
// boxes fill up as more ads become available — never duplicating.

type Group = { ids: string[]; offset: number };
type Claim = { index: number; offset: number };

const Ctx = createContext<{ claim: (key: string, id: string) => Claim } | null>(null);

export function AdCoordinatorProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const registry = useRef<Map<string, Group>>(new Map());
  const lastPath = useRef(pathname);

  // Reset on navigation so indices don't accumulate across pages.
  if (lastPath.current !== pathname) {
    registry.current = new Map();
    lastPath.current = pathname;
  }

  const claim = (key: string, id: string): Claim => {
    let g = registry.current.get(key);
    if (!g) {
      // A per-key start offset so which ad leads rotates between page loads.
      g = { ids: [], offset: Math.random() };
      registry.current.set(key, g);
    }
    let index = g.ids.indexOf(id);
    if (index === -1) {
      g.ids.push(id);
      index = g.ids.length - 1;
    }
    return { index, offset: g.offset };
  };

  return <Ctx.Provider value={{ claim }}>{children}</Ctx.Provider>;
}

// Returns this slot's index within its group (0-based) and the group's rotation
// offset. Without a provider, every slot acts independently (index 0).
export function useAdSlot(key: string): Claim {
  const ctx = useContext(Ctx);
  const id = useId();
  if (!ctx) return { index: 0, offset: 0 };
  return ctx.claim(key, id);
}
