'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSeasonEntries,
  getSquad,
  addSquadPlayers,
  removeSquadPlayer,
  uploadMedia,
  PLAYER_POSITIONS,
  type Team,
  type Player,
  type PlayerInput,
  type Season,
} from '@org/api';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Shirt, Upload } from 'lucide-react';
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
import { cardClass, inputClass, labelClass, primaryBtn, ghostBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

function playerInitials(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}
function resolvePhotoUrl(p: Player): string | null {
  if (p.photoUrl) return p.photoUrl;
  const l = p.photo;
  if (!l) return null;
  if (typeof l === 'string') return l.startsWith('http') ? l : null;
  return l.url ?? null;
}

type PlayerRow = {
  name: string;
  shirtNumber: string;
  position: string;
  nationality: string;
  photo?: string; // media url
  photoUrl?: string; // local preview
  uploading?: boolean;
};
const emptyRow: PlayerRow = { name: '', shirtNumber: '', position: '', nationality: '' };

export function SquadsTab({ seasonId, season }: { seasonId: string; season: Season | null }) {
  const qc = useQueryClient();
  const [teamId, setTeamId] = useState('');

  const entriesQuery = useQuery({
    queryKey: ['football', 'entries', seasonId],
    queryFn: () => getSeasonEntries(seasonId),
    enabled: !!seasonId,
  });
  const teams = entriesQuery.data ?? [];

  const squadQuery = useQuery({
    queryKey: ['football', 'squad', teamId, seasonId],
    queryFn: () => getSquad(teamId, seasonId),
    enabled: !!teamId && !!seasonId,
  });

  const [rows, setRows] = useState<PlayerRow[]>([{ ...emptyRow }]);
  const validRows = rows.filter((r) => r.name.trim());
  const anyUploading = rows.some((r) => r.uploading);

  const uploadPhoto = async (index: number, file: File) => {
    setRows((rs) => rs.map((r, j) => (j === index ? { ...r, uploading: true } : r)));
    try {
      const media = await uploadMedia(file);
      // Photos take the plain URL (not a media id) — same convention as team logos.
      setRows((rs) =>
        rs.map((r, j) =>
          j === index ? { ...r, photo: media.url, photoUrl: media.url, uploading: false } : r
        )
      );
    } catch {
      toast.error('Photo upload failed');
      setRows((rs) => rs.map((r, j) => (j === index ? { ...r, uploading: false } : r)));
    }
  };

  const addPlayersMut = useMutation({
    mutationFn: () => {
      const players: PlayerInput[] = validRows.map((r) => ({
        name: r.name.trim(),
        ...(r.shirtNumber.trim() ? { shirtNumber: Number(r.shirtNumber) } : {}),
        ...(r.position ? { position: r.position } : {}),
        ...(r.nationality.trim() ? { nationality: r.nationality.trim().toUpperCase() } : {}),
        ...(r.photo ? { photo: r.photo } : {}),
      }));
      return addSquadPlayers(teamId, seasonId, { players });
    },
    onSuccess: () => {
      toast.success('Players added to squad');
      setRows([{ ...emptyRow }]);
      qc.invalidateQueries({ queryKey: ['football', 'squad', teamId, seasonId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to add players')),
  });

  const [removeTarget, setRemoveTarget] = useState<{ membershipId: string; name: string } | null>(
    null
  );
  const removeMut = useMutation({
    mutationFn: (membershipId: string) => removeSquadPlayer(teamId, membershipId),
    onSuccess: () => {
      toast.success('Player removed from squad');
      setRemoveTarget(null);
      qc.invalidateQueries({ queryKey: ['football', 'squad', teamId, seasonId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to remove player')),
  });

  if (!seasonId) {
    return (
      <div className={`${cardClass} p-8 text-center`}>
        <Shirt className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a competition and season above to manage squads.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team picker */}
      <div className={`${cardClass} p-5`}>
        <label className={labelClass}>Team</label>
        {entriesQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading teams…
          </div>
        ) : teams.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No teams enrolled in {season?.name ?? 'this season'} yet. Enroll teams in the Setup tab first.
          </p>
        ) : (
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className={`${inputClass} max-w-xs`}
          >
            <option value="">Select team…</option>
            {teams.map((t: Team) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {teamId && (
        <>
          {/* Add players */}
          <div className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add players</h2>
              <span className="text-xs text-gray-400">
                {(squadQuery.data ?? []).length} in squad
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Only the name is required. Click the avatar to upload a player photo.
            </p>

            {/* Column labels */}
            <div className="hidden sm:grid grid-cols-[2.75rem_1fr_4rem_6rem_5rem_2.5rem] gap-2 px-1 mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
              <span>Photo</span>
              <span>Player name</span>
              <span>Shirt</span>
              <span>Position</span>
              <span>Nat.</span>
              <span />
            </div>

            <div className="space-y-2">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2.75rem_1fr_4rem_6rem_5rem_2.5rem] gap-2 items-center"
                >
                  {/* Photo upload */}
                  <label
                    title="Upload photo"
                    className="h-10 w-10 shrink-0 cursor-pointer rounded-full border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden hover:border-[#003153] dark:hover:border-[#F59E0B] transition-colors"
                  >
                    {row.uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : row.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPhoto(i, f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <input
                    value={row.name}
                    onChange={(e) =>
                      setRows((rs) => rs.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
                    }
                    placeholder="e.g. Meddie Kagere"
                    className={inputClass}
                  />
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={row.shirtNumber}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, j) => (j === i ? { ...r, shirtNumber: e.target.value } : r))
                      )
                    }
                    placeholder="#"
                    className={inputClass}
                  />
                  <select
                    value={row.position}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, j) => (j === i ? { ...r, position: e.target.value } : r))
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">Pos</option>
                    {PLAYER_POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <input
                    value={row.nationality}
                    onChange={(e) =>
                      setRows((rs) =>
                        rs.map((r, j) => (j === i ? { ...r, nationality: e.target.value } : r))
                      )
                    }
                    placeholder="RW"
                    maxLength={3}
                    className={`${inputClass} uppercase`}
                  />
                  <button
                    type="button"
                    onClick={() => setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, j) => j !== i)))}
                    disabled={rows.length === 1}
                    className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRows((rs) => [...rs, { ...emptyRow }])}
                className={ghostBtn}
              >
                <Plus className="h-4 w-4" /> Add row
              </button>
              <button
                type="button"
                disabled={!validRows.length || addPlayersMut.isPending || anyUploading}
                onClick={() => addPlayersMut.mutate()}
                className={primaryBtn}
              >
                {addPlayersMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Save {validRows.length || ''} players
              </button>
            </div>
          </div>

          {/* Current squad */}
          <div className={`${cardClass} p-5`}>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Current squad
            </h2>
            {squadQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : (squadQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-gray-400">No players in this squad yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(squadQuery.data ?? []).map((p: Player, i: number) => {
                  const url = resolvePhotoUrl(p);
                  return (
                    <div
                      key={p.id ?? i}
                      className="flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 p-2"
                    >
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full object-cover bg-gray-100 dark:bg-gray-700"
                        />
                      ) : (
                        <span className="h-9 w-9 shrink-0 rounded-full bg-[#005F73] text-white text-[11px] font-bold flex items-center justify-center">
                          {playerInitials(p.name)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {p.name}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                          {[p.position, p.nationality].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <span className="font-mono text-sm text-gray-400 shrink-0">
                        {p.shirtNumber ?? '—'}
                      </span>
                      {p.membershipId && (
                        <button
                          type="button"
                          onClick={() =>
                            setRemoveTarget({ membershipId: p.membershipId!, name: p.name })
                          }
                          title="Remove from squad"
                          className="p-1.5 shrink-0 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from squad?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {removeTarget?.name} from this season&apos;s squad? This only removes the squad
              membership, not the player record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTarget && removeMut.mutate(removeTarget.membershipId)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
