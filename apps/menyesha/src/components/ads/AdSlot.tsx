'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  serveAds,
  trackAdImpression,
  AD_PLACEMENT_SIZES,
  type AdPlacement,
  type AdSection,
  type AdPageType,
  type ServedAd,
} from '@org/api';
import { useAdSlot } from './AdCoordinator';

// Tracking routes aren't built yet (Phase 1). Flip to true once the backend
// adds POST /ads/:id/impression — the plumbing below is already in place.
const ADS_TRACKING_ENABLED = false;

/**
 * Renders one ad creative in its placement box (size-locked, object-contain)
 * with impression tracking. Shared by AdSlot (fixed slots) and AdList (dynamic).
 */
function AdView({
  ad,
  placement,
  pageType,
  fill = false,
  className = '',
}: {
  ad: ServedAd;
  placement: AdPlacement;
  pageType?: AdPageType;
  fill?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: [0, 0.5] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Count one impression the first time this creative is at least half in view.
  useEffect(() => {
    if (!visible || fired.current) return;
    fired.current = true;
    if (ADS_TRACKING_ENABLED) {
      trackAdImpression(ad.id, { locale, placement, pageType }).catch(() => {
        /* fire-and-forget */
      });
    }
  }, [visible, ad.id, locale, placement, pageType]);

  // The placement's fixed box. The creative fits INSIDE it (object-contain), so
  // a wrongly-sized upload can't stretch or shrink the slot.
  const box = AD_PLACEMENT_SIZES[placement];
  const c = ad.creative;
  const advertiserName =
    typeof ad.advertiser === 'string' ? ad.advertiser : ad.advertiser?.name;

  return (
    <div ref={ref} className={`flex flex-col items-center ${className}`}>
      <span className="mb-1 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
        Ad
      </span>
      <a
        href={c.linkUrl}
        target="_blank"
        // sponsored = paid placement (SEO-correct); noopener/noreferrer for safety.
        rel="sponsored noopener noreferrer"
        className="block w-full"
        style={fill ? undefined : { maxWidth: box.width }}
      >
        <span
          className="relative block w-full overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800"
          style={{ aspectRatio: `${box.width} / ${box.height}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={c.imageUrl}
            alt={c.alt ?? advertiserName ?? 'Advertisement'}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain"
          />
        </span>
      </a>
    </div>
  );
}

/**
 * A single ad slot. Coordinates with sibling slots of the same kind so each
 * shows a *distinct* ad; extra empty slots collapse (or show `fallback`). Use
 * for a FIXED number of boxes (header, in-article, in-feed, footer).
 */
export function AdSlot({
  placement,
  section,
  pageType,
  className = '',
  fallback = null,
  alwaysShowFallback = false,
  fill = false,
}: {
  placement: AdPlacement;
  section?: AdSection;
  pageType?: AdPageType;
  className?: string;
  // Fill the container width instead of capping at the placement's width (used
  // by the full-bleed header, where each half is wider than the base size).
  fill?: boolean;
  // Rendered when the slot has no ad (not even a house/fallback ad) — e.g. the
  // "advertise here" placeholder, so the space is never blank.
  fallback?: ReactNode;
  // Fixed-box slots (e.g. the two header boxes) keep their placeholder when
  // empty instead of collapsing, so the layout always shows the same boxes.
  alwaysShowFallback?: boolean;
}) {
  const locale = useLocale();

  // This slot's position among sibling slots of the same kind on the page.
  const { index, offset } = useAdSlot(`${placement}|${section ?? ''}|${pageType ?? ''}`);

  const { data } = useQuery({
    queryKey: ['ads', placement, section ?? '', pageType ?? '', locale],
    queryFn: () => serveAds({ placement, section, pageType, locale }),
    staleTime: 60_000, // matches the endpoint's max-age=60
    refetchOnWindowFocus: false,
  });

  // Each slot takes a *distinct* ad (dedup across the page). When there are
  // fewer ads than slots, the extra slots get none and show their fallback.
  const ad = useMemo(() => {
    if (!data || data.length === 0) return null;
    if (index >= data.length) return null;
    const start = Math.floor(offset * data.length);
    return data[(start + index) % data.length];
  }, [data, index, offset]);

  if (!ad) {
    // Fixed-box slots always show their placeholder when empty (each header box
    // is ad-or-placeholder, independently).
    if (alwaysShowFallback) return <>{fallback}</>;
    // Otherwise the placeholder appears ONLY when nothing is sold for this
    // placement group, and only on the first slot. So: 1 ad → 1 box, N ads → N
    // boxes, 0 ads → a single fallback. Extra empty slots collapse.
    const noAdsForGroup = !data || data.length === 0;
    return noAdsForGroup && index === 0 ? <>{fallback}</> : null;
  }

  return <AdView ad={ad} placement={placement} pageType={pageType} fill={fill} className={className} />;
}

/**
 * Renders EVERY eligible ad for a placement — the number of boxes matches the
 * number of ads sold. Use where the count should be dynamic (e.g. the sidebar):
 * 1 ad → 1 box, 5 ads → 5 boxes, 0 ads → the `fallback`.
 */
export function AdList({
  placement,
  section,
  pageType,
  fallback = null,
  fill = false,
  gapClassName = 'space-y-6',
}: {
  placement: AdPlacement;
  section?: AdSection;
  pageType?: AdPageType;
  fallback?: ReactNode;
  fill?: boolean;
  gapClassName?: string;
}) {
  const locale = useLocale();
  const { data } = useQuery({
    queryKey: ['ads', placement, section ?? '', pageType ?? '', locale],
    queryFn: () => serveAds({ placement, section, pageType, locale }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const ads = data ?? [];
  if (ads.length === 0) return <>{fallback}</>;
  return (
    <div className={gapClassName}>
      {ads.map((ad) => (
        <AdView key={ad.id} ad={ad} placement={placement} pageType={pageType} fill={fill} />
      ))}
    </div>
  );
}
