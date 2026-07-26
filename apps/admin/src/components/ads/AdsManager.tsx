'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAds, getAdvertisers, deleteAd, type Ad } from '@org/api';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { cardClass, primaryBtn } from '@/components/football/styles';
import { AdEditorModal } from './AdEditorModal';
import { AdvertisersPanel } from './AdvertisersPanel';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

function targetingSummary(ad: Ad): string {
  const s = ad.sections.length ? ad.sections.join(', ') : 'all sections';
  const p = ad.pageTypes.length ? ad.pageTypes.join(', ') : 'all pages';
  return `${s} · ${p}`;
}

export function AdsManager() {
  const qc = useQueryClient();

  const adsQuery = useQuery({ queryKey: ['ads', 'admin'], queryFn: () => getAds() });
  const advertisersQuery = useQuery({ queryKey: ['advertisers'], queryFn: () => getAdvertisers() });
  const ads = adsQuery.data ?? [];
  const advertisers = advertisersQuery.data ?? [];

  const [editing, setEditing] = useState<Ad | null>(null);
  const [creating, setCreating] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Ad | null>(null);

  const removeMut = useMutation({
    mutationFn: (id: string) => deleteAd(id),
    onSuccess: () => {
      toast.success('Ad deleted');
      setRemoveTarget(null);
      qc.invalidateQueries({ queryKey: ['ads', 'admin'] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to delete ad')),
  });

  return (
    <div className="space-y-6">
      <AdvertisersPanel advertisers={advertisers} />

      <section className={`${cardClass} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Ads</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {ads.length} total · {ads.filter((a) => a.isActive).length} active
            </p>
          </div>
          <button type="button" onClick={() => setCreating(true)} className={primaryBtn}>
            <Plus className="h-4 w-4" /> New ad
          </button>
        </div>

        {adsQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-8">
            <Megaphone className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No ads yet. Create one — or a fallback house ad to fill empty slots.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ads.map((ad) => {
              const thumb = ad.creatives[0]?.imageUrl;
              return (
                <div
                  key={ad.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="h-12 w-20 shrink-0 rounded object-contain bg-gray-100 dark:bg-gray-700"
                    />
                  ) : (
                    <span className="h-12 w-20 shrink-0 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                      <Megaphone className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {ad.name}
                      </p>
                      {ad.isFallback && (
                        <span className="shrink-0 rounded bg-[#F59E0B]/15 text-[#F59E0B] px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                          Fallback
                        </span>
                      )}
                      {!ad.isActive && (
                        <span className="shrink-0 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-400">
                      {ad.placement} · {targetingSummary(ad)}
                      {ad.advertiser?.name ? ` · ${ad.advertiser.name}` : ''}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {ad.creatives.map((c) => c.locale).join(' · ') || 'no creatives'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(ad)}
                    aria-label="Edit ad"
                    className="p-1.5 shrink-0 rounded-lg text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(ad)}
                    aria-label="Delete ad"
                    className="p-1.5 shrink-0 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {(creating || editing) && (
        <AdEditorModal
          ad={editing}
          advertisers={advertisers}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ad?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete “{removeTarget?.name}” and its creatives. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTarget && removeMut.mutate(removeTarget.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
