import api from '../client';

// Envelope: list/detail payloads come as { data: ... }; tolerate a bare value.
function unwrap<T>(payload: any): T {
  return (payload && payload.data !== undefined ? payload.data : payload) as T;
}

/* ------------------------------ Vocabularies ------------------------------ */
// These MUST match the backend's ads.constants.ts exactly. Shared here so the
// menyesha <AdSlot> and the admin console both target the same strings.

export const AD_PLACEMENTS = ['Header', 'Sidebar', 'InFeed', 'Inline', 'Footer'] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

// The fixed box each placement renders in (standard IAB-ish sizes). The site
// fits the creative inside this box, so an oddly-sized upload can't change the
// slot's dimensions; the admin uses it to tell advertisers the target size.
export const AD_PLACEMENT_SIZES: Record<AdPlacement, { width: number; height: number }> = {
  Header: { width: 728, height: 100 }, // leaderboard-ish (two fill the header side by side)
  Sidebar: { width: 300, height: 250 }, // medium rectangle
  InFeed: { width: 300, height: 250 },
  Inline: { width: 300, height: 250 }, // medium rectangle — the in-article workhorse

  Footer: { width: 320, height: 50 }, // mobile banner
};

export const AD_SECTIONS = ['home', 'football', 'news', 'fuel'] as const;
export type AdSection = (typeof AD_SECTIONS)[number];

export const AD_PAGE_TYPES = [
  'home',
  'list',
  'article',
  'match',
  'competition',
  'date',
  'player',
] as const;
export type AdPageType = (typeof AD_PAGE_TYPES)[number];

export const AD_LOCALES = ['rw', 'fr', 'en'] as const;
export type AdLocale = (typeof AD_LOCALES)[number];

/* --------------------------------- Types ---------------------------------- */

export interface AdCreative {
  id?: string;
  locale: AdLocale;
  imageUrl: string; // plain URL from uploadMedia().url
  linkUrl: string;
  alt?: string | null;
}

export interface Advertiser {
  id: string;
  name: string;
  contactEmail?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface AdvertiserInput {
  name: string;
  contactEmail?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface Ad {
  id: string;
  name: string;
  advertiserId?: string | null;
  advertiser?: Advertiser | null;
  placement: AdPlacement;
  sections: string[]; // empty = all
  pageTypes: string[]; // empty = all
  category?: string | null;
  isFallback: boolean;
  startAt?: string | null;
  endAt?: string | null;
  isActive: boolean;
  creatives: AdCreative[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdInput {
  name: string;
  advertiserId?: string | null;
  placement: AdPlacement;
  sections?: string[];
  pageTypes?: string[];
  category?: string | null;
  isFallback?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  isActive?: boolean;
  creatives: AdCreative[]; // PATCH replaces the whole set
}

// One entry from the public serve endpoint: the creative is already resolved
// to the requested locale.
export interface ServedAd {
  id: string;
  placement: AdPlacement;
  category?: string | null;
  // Serve returns the advertiser as { id, name } (or null); tolerate a bare
  // string too.
  advertiser?: { id: string; name: string } | string | null;
  creative: AdCreative;
}

/* ------------------------------- Public serve ----------------------------- */

// GET /api/menyesha/ads/serve — the eligible ads for a slot (cacheable). The
// client renders/rotates and fires impressions, so this stays cache-friendly.
export async function serveAds(params: {
  placement: AdPlacement;
  section?: AdSection | string;
  pageType?: AdPageType | string;
  locale: AdLocale | string;
}): Promise<ServedAd[]> {
  const { data } = await api.get('/api/menyesha/ads/serve', { params });
  return unwrap<ServedAd[]>(data) ?? [];
}

/* ------------------------------- Tracking --------------------------------- */
// NOTE: these routes are NOT built yet (Phase 1 had no tracking). Defined here
// so wiring is a one-liner once the backend adds them — see AdSlot, where the
// impression call is gated behind ADS_TRACKING_ENABLED.

export async function trackAdImpression(
  id: string,
  body: { locale: string; placement: string; pageType?: string }
): Promise<void> {
  await api.post(`/api/menyesha/ads/${id}/impression`, body);
}

// A click-through URL that logs then 302-redirects (reliable, works w/o JS).
// Until the backend adds it, AdSlot links straight to creative.linkUrl.
export function adClickHref(id: string, to: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  return `${base}/api/menyesha/ads/${id}/click?to=${encodeURIComponent(to)}`;
}

/* -------------------------------- Admin ----------------------------------- */

export async function getAds(params?: {
  placement?: string;
  advertiserId?: string;
  isActive?: boolean;
}): Promise<Ad[]> {
  const { data } = await api.get('/api/menyesha/ads', { params });
  return unwrap<Ad[]>(data) ?? [];
}

export async function getAd(id: string): Promise<Ad> {
  const { data } = await api.get(`/api/menyesha/ads/${id}`);
  return unwrap<Ad>(data);
}

export async function createAd(input: AdInput): Promise<Ad> {
  const { data } = await api.post('/api/menyesha/ads', input);
  return unwrap<Ad>(data);
}

export async function updateAd(id: string, input: Partial<AdInput>): Promise<Ad> {
  const { data } = await api.patch(`/api/menyesha/ads/${id}`, input);
  return unwrap<Ad>(data);
}

export async function deleteAd(id: string): Promise<void> {
  await api.delete(`/api/menyesha/ads/${id}`);
}

export async function getAdvertisers(): Promise<Advertiser[]> {
  const { data } = await api.get('/api/menyesha/advertisers');
  return unwrap<Advertiser[]>(data) ?? [];
}

export async function createAdvertiser(input: AdvertiserInput): Promise<Advertiser> {
  const { data } = await api.post('/api/menyesha/advertisers', input);
  return unwrap<Advertiser>(data);
}

export async function updateAdvertiser(
  id: string,
  input: Partial<AdvertiserInput>
): Promise<Advertiser> {
  const { data } = await api.patch(`/api/menyesha/advertisers/${id}`, input);
  return unwrap<Advertiser>(data);
}

export async function deleteAdvertiser(id: string): Promise<void> {
  await api.delete(`/api/menyesha/advertisers/${id}`);
}
