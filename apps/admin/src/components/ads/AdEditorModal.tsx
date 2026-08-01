'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createAd,
  updateAd,
  uploadMedia,
  AD_PLACEMENTS,
  AD_PLACEMENT_SIZES,
  AD_PLACEMENT_CONTEXTS,
  AD_SECTIONS,
  AD_PAGE_TYPES,
  AD_LOCALES,
  type Ad,
  type AdInput,
  type AdCreative,
  type Advertiser,
  type AdLocale,
  type AdPlacement,
} from '@org/api';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { inputClass, labelClass, primaryBtn } from '@/components/football/styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

// ISO <-> the value a datetime-local input expects (local, no seconds/zone).
function isoToLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

type CreativeDraft = {
  imageUrl: string;
  linkUrl: string;
  alt: string;
  uploading: boolean;
};
const emptyCreative = (): CreativeDraft => ({
  imageUrl: '',
  linkUrl: '',
  alt: '',
  uploading: false,
});

// Plain-language descriptions (with example URLs) shown on hover, so it's clear
// which real page each section / page-type maps to.
const SECTION_DESC: Record<string, string> = {
  home: 'The homepage',
  football: 'Scores section — match, competition, date & player pages',
  news: 'Articles & news category pages',
  fuel: 'Data / fuel-prices section',
};
const PAGE_TYPE_DESC: Record<string, string> = {
  home: 'The homepage',
  list: 'A listing page — a day’s football scores (e.g. /football/2026-07-28), a category’s articles, or the data hub',
  article: 'A single article/story page (e.g. /article/apr-wins-title)',
  match: 'A match detail page (e.g. /football/bk-pro-league/apr-vs-rayon-2026-07-20)',
  competition: 'A competition season page (e.g. /football/bk-pro-league/2026)',
  date: 'A day’s scores page (e.g. /football/2026-07-28)',
  player: 'A player profile page (e.g. /football/player/meddie-kagere)',
};

export function AdEditorModal({
  ad,
  advertisers,
  onClose,
}: {
  ad: Ad | null; // null = create
  advertisers: Advertiser[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const editing = !!ad;

  const [name, setName] = useState(ad?.name ?? '');
  const [advertiserId, setAdvertiserId] = useState(ad?.advertiserId ?? '');
  const [placement, setPlacement] = useState<AdPlacement>(ad?.placement ?? 'Sidebar');
  const [sections, setSections] = useState<string[]>(ad?.sections ?? []);
  const [pageTypes, setPageTypes] = useState<string[]>(ad?.pageTypes ?? []);
  const [category, setCategory] = useState(ad?.category ?? '');
  const [isFallback, setIsFallback] = useState(!!ad?.isFallback);
  const [isActive, setIsActive] = useState(ad?.isActive ?? true);
  const [startAt, setStartAt] = useState(isoToLocalInput(ad?.startAt));
  const [endAt, setEndAt] = useState(isoToLocalInput(ad?.endAt));

  // One creative draft per language, keyed by locale. A locale is included only
  // if it has both an image and a link.
  const [creatives, setCreatives] = useState<Record<AdLocale, CreativeDraft>>(() => {
    const base = Object.fromEntries(AD_LOCALES.map((l) => [l, emptyCreative()])) as Record<
      AdLocale,
      CreativeDraft
    >;
    for (const c of ad?.creatives ?? []) {
      if (base[c.locale as AdLocale]) {
        base[c.locale as AdLocale] = {
          imageUrl: c.imageUrl,
          linkUrl: c.linkUrl,
          alt: c.alt ?? '',
          uploading: false,
        };
      }
    }
    return base;
  });

  const setCreative = (locale: AdLocale, patch: Partial<CreativeDraft>) =>
    setCreatives((cs) => ({ ...cs, [locale]: { ...cs[locale], ...patch } }));

  // Only offer section/page-type combinations that actually have a slot for the
  // chosen placement, and keep the two in sync (hide page types that don't exist
  // for the selected sections, and vice versa).
  const contexts = AD_PLACEMENT_CONTEXTS[placement] ?? [];
  const validSectionsFor = (pts: string[]) => {
    const rel = pts.length ? contexts.filter((c) => pts.includes(c.pageType)) : contexts;
    return new Set(rel.map((c) => c.section as string));
  };
  const validPageTypesFor = (secs: string[]) => {
    const rel = secs.length ? contexts.filter((c) => secs.includes(c.section)) : contexts;
    return new Set(rel.map((c) => c.pageType as string));
  };
  // Show valid options, plus any already-selected value (so an existing invalid
  // combo can still be seen and removed).
  const shownSections = AD_SECTIONS.filter(
    (s) => validSectionsFor(pageTypes).has(s) || sections.includes(s)
  );
  const shownPageTypes = AD_PAGE_TYPES.filter(
    (p) => validPageTypesFor(sections).has(p) || pageTypes.includes(p)
  );

  const toggleSection = (s: string) => {
    const next = sections.includes(s) ? sections.filter((x) => x !== s) : [...sections, s];
    setSections(next);
    const valid = validPageTypesFor(next);
    setPageTypes((pts) => pts.filter((p) => valid.has(p)));
  };
  const togglePageType = (p: string) => {
    const next = pageTypes.includes(p) ? pageTypes.filter((x) => x !== p) : [...pageTypes, p];
    setPageTypes(next);
    const valid = validSectionsFor(next);
    setSections((secs) => secs.filter((s) => valid.has(s)));
  };
  const changePlacement = (p: AdPlacement) => {
    setPlacement(p);
    const ctx = AD_PLACEMENT_CONTEXTS[p] ?? [];
    const vSec = new Set(ctx.map((c) => c.section as string));
    const vPt = new Set(ctx.map((c) => c.pageType as string));
    setSections((secs) => secs.filter((s) => vSec.has(s)));
    setPageTypes((pts) => pts.filter((x) => vPt.has(x)));
  };

  const uploadCreative = async (locale: AdLocale, file: File) => {
    setCreative(locale, { uploading: true });
    try {
      const media = await uploadMedia(file);
      setCreative(locale, { imageUrl: media.url, uploading: false });
    } catch {
      toast.error('Image upload failed');
      setCreative(locale, { uploading: false });
    }
  };

  const builtCreatives = (): AdCreative[] =>
    AD_LOCALES.filter((l) => creatives[l].imageUrl && creatives[l].linkUrl).map((l) => {
      const c = creatives[l];
      return {
        locale: l,
        imageUrl: c.imageUrl,
        linkUrl: c.linkUrl.trim(),
        alt: c.alt.trim() || undefined,
      };
    });

  const saveMut = useMutation({
    mutationFn: () => {
      const payload: AdInput = {
        name: name.trim(),
        advertiserId: advertiserId || null,
        placement,
        sections,
        pageTypes,
        category: category.trim() || null,
        isFallback,
        isActive,
        startAt: localInputToIso(startAt),
        endAt: localInputToIso(endAt),
        creatives: builtCreatives(),
      };
      return editing ? updateAd(ad!.id, payload) : createAd(payload);
    },
    onSuccess: () => {
      toast.success(editing ? 'Ad updated' : 'Ad created');
      qc.invalidateQueries({ queryKey: ['ads', 'admin'] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to save ad')),
  });

  const anyUploading = AD_LOCALES.some((l) => creatives[l].uploading);
  const creativeCount = builtCreatives().length;
  const canSave = !!name.trim() && creativeCount > 0 && !anyUploading && !saveMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="sticky top-0 flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {editing ? 'Edit ad' : 'New ad'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Campaign name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BK Bank — July campaign"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Advertiser</label>
              <select
                value={advertiserId}
                onChange={(e) => setAdvertiserId(e.target.value)}
                className={inputClass}
              >
                <option value="">— None —</option>
                {advertisers.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Placement (slot)</label>
              <select
                value={placement}
                onChange={(e) => changePlacement(e.target.value as AdPlacement)}
                className={inputClass}
              >
                {AD_PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {p} · {AD_PLACEMENT_SIZES[p].width}×{AD_PLACEMENT_SIZES[p].height}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                Recommended image: {AD_PLACEMENT_SIZES[placement].width}×
                {AD_PLACEMENT_SIZES[placement].height}. Other sizes fit inside the slot without
                changing it.
              </p>
            </div>
          </div>

          {/* Targeting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sections</label>
              <div className="flex flex-wrap gap-1.5">
                {shownSections.map((s) => (
                  <button
                    key={s}
                    type="button"
                    title={SECTION_DESC[s] ?? s}
                    onClick={() => toggleSection(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      sections.includes(s)
                        ? 'border-[#003153] bg-[#003153] text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-gray-400">None selected = all sections for this placement.</p>
            </div>
            <div>
              <label className={labelClass}>Page types</label>
              <div className="flex flex-wrap gap-1.5">
                {shownPageTypes.map((p) => (
                  <button
                    key={p}
                    type="button"
                    title={PAGE_TYPE_DESC[p] ?? p}
                    onClick={() => togglePageType(p)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      pageTypes.includes(p)
                        ? 'border-[#003153] bg-[#003153] text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-gray-400">Only page types that exist for the chosen placement/section are shown.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Category (optional)</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. finance"
                className={inputClass}
              />
            </div>
            <div className="flex items-end gap-3 pb-2">
              <label className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-[#003153]"
                />
                Active
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Start (optional)</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>End (optional)</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFallback}
              onChange={(e) => setIsFallback(e.target.checked)}
              className="h-4 w-4 mt-0.5 accent-[#F59E0B]"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Fallback (house) ad</span> — shown when no paid ad
              matches the slot. Usually leave sections/page types empty and add all three languages.
            </span>
          </label>

          {/* Creatives per language */}
          <div>
            <label className={labelClass}>Creatives — one per language</label>
            <p className="text-[11px] text-gray-400 mb-2">
              A language shows only when it has both an image and a link. At least one required.
            </p>
            <div className="space-y-3">
              {AD_LOCALES.map((locale) => {
                const c = creatives[locale];
                return (
                  <div
                    key={locale}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 shrink-0 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                        {locale}
                      </span>
                      <label className="h-14 w-24 shrink-0 cursor-pointer rounded-md border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden hover:border-[#003153]">
                        {c.uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        ) : c.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.imageUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                          <Upload className="h-4 w-4 text-gray-400" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadCreative(locale, f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <div className="flex-1 min-w-0 space-y-2">
                        <input
                          value={c.linkUrl}
                          onChange={(e) => setCreative(locale, { linkUrl: e.target.value })}
                          placeholder="Click URL (https://…)"
                          className={inputClass}
                        />
                        <input
                          value={c.alt}
                          onChange={(e) => setCreative(locale, { alt: e.target.value })}
                          placeholder="Alt text (optional)"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <span className="text-xs text-gray-400">
            {creativeCount} language{creativeCount === 1 ? '' : 's'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => saveMut.mutate()}
              className={primaryBtn}
            >
              {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? 'Save changes' : 'Create ad'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
