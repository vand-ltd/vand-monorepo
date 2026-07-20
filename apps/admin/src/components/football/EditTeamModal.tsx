'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTeam, uploadMedia, type Team } from '@org/api';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { inputClass, labelClass, primaryBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

function resolveLogoUrl(t: Team): string {
  if (t.logoUrl) return t.logoUrl;
  const l = t.logo;
  if (typeof l === 'string') return l.startsWith('http') ? l : '';
  return l?.url ?? '';
}

function initials(name?: string): string {
  return (name ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || '?';
}

export function EditTeamModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(team.name ?? '');
  const [shortName, setShortName] = useState(team.shortName ?? '');
  const [city, setCity] = useState(team.city ?? '');
  const [logo, setLogo] = useState(resolveLogoUrl(team)); // plain URL
  const [uploading, setUploading] = useState(false);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const media = await uploadMedia(file);
      // Logos take the plain URL (not a media id) — upload first, then send the url.
      setLogo(media.url);
    } catch {
      toast.error('Logo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveMut = useMutation({
    mutationFn: () =>
      updateTeam(team.id, {
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        city: city.trim() || undefined,
        ...(logo && logo.startsWith('http') ? { logo } : {}),
      }),
    onSuccess: () => {
      toast.success('Team updated');
      qc.invalidateQueries({ queryKey: ['football', 'teams'] });
      qc.invalidateQueries({ queryKey: ['football', 'entries'] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to update team')),
  });

  const canSave = !!name.trim() && !uploading && !saveMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit team</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-14 w-14 rounded-full object-cover bg-white border border-gray-200 dark:border-gray-700" />
            ) : (
              <span className="h-14 w-14 rounded-full bg-[#003153] text-white text-sm font-bold flex items-center justify-center">
                {initials(name)}
              </span>
            )}
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm font-medium text-[#003153] dark:text-[#F59E0B] hover:underline">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Change logo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadLogo(f);
                }}
              />
            </label>
          </div>

          <div>
            <label className={labelClass}>Club name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Short code</label>
              <input
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="e.g. APR"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-700">
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
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
