'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateSquadPlayer,
  updatePlayer,
  uploadMedia,
  PLAYER_POSITIONS,
  PLAYER_POSITION_LABELS,
  type Player,
} from '@org/api';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { CountrySelect } from './CountrySelect';
import { inputClass, labelClass, primaryBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

function playerInitials(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function resolvePhotoUrl(p: Player): string {
  if (p.photoUrl) return p.photoUrl;
  const l = p.photo;
  if (!l) return '';
  if (typeof l === 'string') return l.startsWith('http') ? l : '';
  return l.url ?? '';
}

export function EditSquadPlayerModal({
  teamId,
  seasonId,
  player,
  onClose,
}: {
  teamId: string;
  seasonId: string;
  player: Player;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(player.name ?? '');
  const [shirtNumber, setShirtNumber] = useState(
    player.shirtNumber != null ? String(player.shirtNumber) : ''
  );
  const [position, setPosition] = useState((player.position as string) ?? '');
  const [nationality, setNationality] = useState(player.nationality ?? '');
  const [photo, setPhoto] = useState(resolvePhotoUrl(player)); // plain URL
  // Only send the photo when it actually changed, so an untouched edit never
  // clears an existing picture.
  const [photoChanged, setPhotoChanged] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const media = await uploadMedia(file);
      // Photos take the plain URL (not a media id) — same as team logos.
      setPhoto(media.url);
      setPhotoChanged(true);
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveMut = useMutation({
    // Two endpoints: person-level fields live on the player, season-level fields
    // (shirt number, this-squad position) on the membership. Blank clears (null).
    mutationFn: async () => {
      const membershipId = player.membershipId as string;
      await Promise.all([
        updatePlayer(player.id, {
          fullName: name.trim(), // DTO uses fullName, not name
          nationality: nationality.trim() ? nationality.trim() : null,
          ...(photoChanged ? { photo: photo && photo.startsWith('http') ? photo : null } : {}),
        }),
        updateSquadPlayer(teamId, membershipId, {
          shirtNumber: shirtNumber.trim() ? Number(shirtNumber) : null,
          position: position || null,
        }),
      ]);
    },
    onSuccess: () => {
      toast.success('Player updated');
      qc.invalidateQueries({ queryKey: ['football', 'squad', teamId, seasonId] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to update player')),
  });

  const canSave = !!name.trim() && !uploading && !saveMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit player</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-3">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                className="h-14 w-14 rounded-full object-cover bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <span className="h-14 w-14 rounded-full bg-[#005F73] text-white text-sm font-bold flex items-center justify-center">
                {playerInitials(name)}
              </span>
            )}
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm font-medium text-[#003153] dark:text-[#F59E0B] hover:underline">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Uploading…' : 'Change photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPhoto(f);
                    e.target.value = '';
                  }}
                />
              </label>
              {photo && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto('');
                    setPhotoChanged(true);
                  }}
                  className="text-sm font-medium text-gray-400 hover:text-red-500"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Player name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Shirt number</label>
              <input
                type="number"
                min="1"
                max="99"
                value={shirtNumber}
                onChange={(e) => setShirtNumber(e.target.value)}
                placeholder="#"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className={inputClass}
              >
                <option value="">Position</option>
                {PLAYER_POSITIONS.map((p) => (
                  <option key={p} value={PLAYER_POSITION_LABELS[p]}>
                    {PLAYER_POSITION_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Nationality</label>
            <CountrySelect value={nationality} onChange={setNationality} />
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
          <button type="button" disabled={!canSave} onClick={() => saveMut.mutate()} className={primaryBtn}>
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
