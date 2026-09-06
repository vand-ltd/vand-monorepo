'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMatch, isTbdKickoff, TBD_KICKOFF, type Match, type Team, type Venue } from '@org/api';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { inputClass, labelClass, primaryBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

const pad2 = (n: number) => String(n).padStart(2, '0');
// ISO -> value for <input type="datetime-local"> in the admin's local time.
const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

// Edit a fixture's setup: swap either team (schedule changes / replacements),
// reschedule it, move venue or round. Score/status stay on the inline row.
export function EditFixtureModal({
  match,
  teams,
  venues,
  seasonId,
  onClose,
}: {
  match: Match;
  teams: Team[];
  venues: Venue[];
  seasonId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [homeTeamId, setHomeTeamId] = useState(match.homeTeamId ?? '');
  const [awayTeamId, setAwayTeamId] = useState(match.awayTeamId ?? '');
  const [venueId, setVenueId] = useState<string>(match.venueId ?? (match.venue as any)?.id ?? '');
  const [round, setRound] = useState(match.round ?? '');
  // Match officials — all free-text and optional, mirroring `referee`.
  const [referee, setReferee] = useState(match.referee ?? '');
  const [ar1, setAr1] = useState(match.assistantReferee1 ?? '');
  const [ar2, setAr2] = useState(match.assistantReferee2 ?? '');
  const [fourth, setFourth] = useState(match.fourthOfficial ?? '');
  const [commissioner, setCommissioner] = useState(match.matchCommissioner ?? '');
  const [kickoff, setKickoff] = useState(
    match.kickoffAt && !isTbdKickoff(match.kickoffAt) ? toDatetimeLocal(match.kickoffAt) : ''
  );

  const sameTeam = !!homeTeamId && homeTeamId === awayTeamId;
  const canSave = !!homeTeamId && !!awayTeamId && !sameTeam;

  const saveMut = useMutation({
    mutationFn: () =>
      updateMatch(match.id, {
        homeTeamId,
        awayTeamId,
        // Blank kickoff = TBD (sentinel); otherwise the picked local time.
        kickoffAt: kickoff.trim() ? new Date(kickoff).toISOString() : TBD_KICKOFF,
        ...(venueId ? { venueId } : {}),
        ...(round.trim() ? { round: round.trim() } : {}),
        referee: referee.trim(),
        assistantReferee1: ar1.trim(),
        assistantReferee2: ar2.trim(),
        fourthOfficial: fourth.trim(),
        matchCommissioner: commissioner.trim(),
      }),
    onSuccess: () => {
      toast.success('Fixture updated');
      qc.invalidateQueries({ queryKey: ['football', 'matches', seasonId] });
      onClose();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to update fixture')),
  });

  const teamOptions = (excludeId: string) => (
    <>
      <option value="">Select team</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id} disabled={t.id === excludeId}>
          {t.name}
          {t.shortName ? ` (${t.shortName})` : ''}
        </option>
      ))}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit fixture</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelClass}>Home team</label>
              <select value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)} className={inputClass}>
                {teamOptions(awayTeamId)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Away team</label>
              <select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className={inputClass}>
                {teamOptions(homeTeamId)}
              </select>
            </div>
          </div>
          {sameTeam && (
            <p className="text-xs font-medium text-red-500">Home and away can&apos;t be the same team.</p>
          )}

          <div>
            <label className={labelClass}>Kickoff</label>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={kickoff}
                onChange={(e) => setKickoff(e.target.value)}
                className={inputClass}
              />
              {kickoff.trim() ? (
                <button
                  type="button"
                  onClick={() => setKickoff('')}
                  title="Mark kickoff as TBD"
                  className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  TBD
                </button>
              ) : (
                <span className="shrink-0 rounded-md bg-[#F59E0B]/10 px-2 py-1 text-[11px] font-semibold text-[#F59E0B]">
                  TBD
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Venue</label>
              <select value={venueId} onChange={(e) => setVenueId(e.target.value)} className={inputClass}>
                <option value="">No venue</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                    {v.city ? ` · ${v.city}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Round</label>
              <input value={round} onChange={(e) => setRound(e.target.value)} placeholder="Matchday 1" className={inputClass} />
            </div>
          </div>

          {/* Match officials — optional; leave blank if not yet appointed. */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Match officials
            </p>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Referee</label>
                <input value={referee} onChange={(e) => setReferee(e.target.value)} placeholder="Full name" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Assistant referee 1</label>
                  <input value={ar1} onChange={(e) => setAr1(e.target.value)} placeholder="Full name" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Assistant referee 2</label>
                  <input value={ar2} onChange={(e) => setAr2(e.target.value)} placeholder="Full name" className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Fourth official</label>
                  <input value={fourth} onChange={(e) => setFourth(e.target.value)} placeholder="Full name" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Match commissioner</label>
                  <input value={commissioner} onChange={(e) => setCommissioner(e.target.value)} placeholder="Full name" className={inputClass} />
                </div>
              </div>
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
          <button type="button" disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()} className={primaryBtn}>
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
