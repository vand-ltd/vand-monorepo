'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMatchEvents,
  getSquad,
  createMatchEvent,
  updateMatchEvent,
  MATCH_EVENT_TYPES,
  type Match,
  type MatchEvent,
  type MatchEventType,
  type Player,
} from '@org/api';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, X } from 'lucide-react';
import { inputClass, labelClass, primaryBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

// Human label for each event type in the admin picker.
const TYPE_LABELS: Record<MatchEventType, string> = {
  Goal: 'Goal',
  Penalty: 'Penalty goal',
  OwnGoal: 'Own goal',
  MissedPenalty: 'Missed penalty',
  YellowCard: 'Yellow card',
  SecondYellow: 'Second yellow',
  RedCard: 'Red card',
  Substitution: 'Substitution',
};

const GOAL_TYPES: MatchEventType[] = ['Goal', 'Penalty', 'OwnGoal'];
const ASSIST_TYPES: MatchEventType[] = ['Goal', 'Penalty']; // own goals have no assist

// What the optional "related player" means for a given event type.
function relatedLabel(type: MatchEventType): string | null {
  if (ASSIST_TYPES.includes(type)) return 'Assisted by (optional)';
  if (type === 'Substitution') return 'Player coming off';
  return null;
}

// The main player picker's label per type.
function playerLabel(type: MatchEventType): string {
  if (type === 'Substitution') return 'Player coming on';
  if (type === 'OwnGoal') return 'Scored by (opposing team)';
  return 'Player';
}

function eventClock(e: MatchEvent): string {
  return `${e.minute}${e.extraMinute ? `+${e.extraMinute}` : ''}'`;
}

export function MatchEventsPanel({
  match,
  homeName,
  awayName,
}: {
  match: Match;
  homeName: string;
  awayName: string;
}) {
  const qc = useQueryClient();
  const seasonId = match.seasonId;

  const eventsQuery = useQuery({
    queryKey: ['football', 'events', match.id],
    queryFn: () => getMatchEvents(match.id),
  });
  const events = eventsQuery.data ?? [];

  /* --------------------------------- Form -------------------------------- */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string>(match.homeTeamId);
  const [type, setType] = useState<MatchEventType>('Goal');
  const [minute, setMinute] = useState('');
  const [extraMinute, setExtraMinute] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [relatedPlayerId, setRelatedPlayerId] = useState('');

  // For an own goal, the scorer belongs to the opposing team; every other
  // event's player belongs to the selected team.
  const oppositeTeamId =
    teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
  const playerTeamId = type === 'OwnGoal' ? oppositeTeamId : teamId;

  // Squad of the player's team for the current season (for the player picker).
  const squadQuery = useQuery({
    queryKey: ['football', 'squad', playerTeamId, seasonId],
    queryFn: () => getSquad(playerTeamId, seasonId),
    enabled: !!playerTeamId && !!seasonId,
  });
  const squad = squadQuery.data ?? [];

  const teamName = (id: string) =>
    id === match.homeTeamId ? homeName : id === match.awayTeamId ? awayName : id;

  const showRelated = relatedLabel(type);

  const resetForm = () => {
    setEditingId(null);
    setTeamId(match.homeTeamId);
    setType('Goal');
    setMinute('');
    setExtraMinute('');
    setPlayerId('');
    setRelatedPlayerId('');
  };

  // Load an existing event into the form for editing.
  const startEdit = (e: MatchEvent) => {
    setEditingId(e.id);
    setTeamId(e.teamId);
    setType(e.type);
    setMinute(String(e.minute));
    setExtraMinute(e.extraMinute != null ? String(e.extraMinute) : '');
    setPlayerId(e.playerId ?? '');
    setRelatedPlayerId(e.relatedPlayerId ?? '');
  };

  const buildPayload = () => ({
    teamId,
    type,
    minute: Number(minute),
    // send null to clear when empty on edit; omit-friendly for create.
    extraMinute: extraMinute.trim() ? Number(extraMinute) : undefined,
    playerId: playerId || undefined,
    relatedPlayerId: relatedPlayerId || undefined,
  });

  const saveMut = useMutation({
    mutationFn: () => {
      const p = buildPayload();
      return editingId
        ? updateMatchEvent(match.id, editingId, p)
        : createMatchEvent(match.id, {
            teamId: p.teamId,
            type: p.type,
            minute: p.minute,
            ...(p.extraMinute != null ? { extraMinute: p.extraMinute } : {}),
            ...(p.playerId ? { playerId: p.playerId } : {}),
            ...(p.relatedPlayerId ? { relatedPlayerId: p.relatedPlayerId } : {}),
          });
    },
    onSuccess: () => {
      toast.success(editingId ? 'Event updated' : 'Event added');
      resetForm();
      qc.invalidateQueries({ queryKey: ['football', 'events', match.id] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to save event')),
  });

  const canSubmit = !!teamId && !!type && minute.trim() !== '' && !saveMut.isPending;

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => a.minute - b.minute || (a.extraMinute ?? 0) - (b.extraMinute ?? 0)
      ),
    [events]
  );

  const selectClass = `${inputClass} py-1.5`;

  return (
    <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-3">
      {/* Existing events */}
      {eventsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading events…
        </div>
      ) : sortedEvents.length === 0 ? (
        <p className="text-xs text-gray-400">No events recorded yet.</p>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {sortedEvents.map((e) => (
            <li
              key={e.id}
              className={`flex items-center gap-2 text-xs rounded px-1 py-0.5 ${
                editingId === e.id ? 'bg-[#003153]/10 dark:bg-[#F59E0B]/10' : ''
              }`}
            >
              <span className="w-10 shrink-0 text-right font-semibold tabular-nums text-gray-500 dark:text-gray-400">
                {eventClock(e)}
              </span>
              <span className="inline-flex items-center rounded bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 font-medium text-gray-700 dark:text-gray-200">
                {TYPE_LABELS[e.type as MatchEventType] ?? e.type}
              </span>
              <span className="text-gray-900 dark:text-white truncate">
                {e.player?.fullName ?? '—'}
                {e.relatedPlayer?.fullName && (
                  <span className="text-gray-400">
                    {' '}
                    {GOAL_TYPES.includes(e.type as MatchEventType) ? '(assist: ' : '(for '}
                    {e.relatedPlayer.fullName})
                  </span>
                )}
              </span>
              <span className="ml-auto shrink-0 text-gray-400 truncate max-w-[8rem]">
                {teamName(e.teamId)}
              </span>
              <button
                type="button"
                onClick={() => startEdit(e)}
                title="Edit event"
                className="shrink-0 p-1 rounded text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add / edit event form */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        {editingId && (
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#003153] dark:text-[#F59E0B]">
              Editing event
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className={labelClass}>Team</label>
            <select
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                setPlayerId('');
                setRelatedPlayerId('');
              }}
              className={selectClass}
            >
              <option value={match.homeTeamId}>{homeName}</option>
              <option value={match.awayTeamId}>{awayName}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as MatchEventType);
                // Player pool may change (own goal → opposing team); clear stale picks.
                setPlayerId('');
                setRelatedPlayerId('');
              }}
              className={selectClass}
            >
              {MATCH_EVENT_TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {TYPE_LABELS[tp]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Minute</label>
            <input
              type="number"
              min="0"
              max="130"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              placeholder="e.g. 45"
              className={selectClass}
            />
          </div>
          <div>
            <label className={labelClass}>+ Extra (opt)</label>
            <input
              type="number"
              min="0"
              max="15"
              value={extraMinute}
              onChange={(e) => setExtraMinute(e.target.value)}
              placeholder="e.g. 2"
              className={selectClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          <div>
            <label className={labelClass}>{playerLabel(type)}</label>
            <select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className={selectClass}
              disabled={squadQuery.isLoading}
            >
              <option value="">
                {squadQuery.isLoading ? 'Loading squad…' : 'Select player…'}
              </option>
              {squad.map((p: Player) => (
                <option key={p.id} value={p.id}>
                  {p.shirtNumber ? `${p.shirtNumber}. ` : ''}
                  {p.name}
                </option>
              ))}
            </select>
            {type === 'OwnGoal' && (
              <p className="mt-1 text-[11px] text-gray-400">
                Own goal is credited to {teamName(teamId)}; pick the {teamName(oppositeTeamId)}{' '}
                player who scored it.
              </p>
            )}
          </div>
          {showRelated && (
            <div>
              <label className={labelClass}>{showRelated}</label>
              <select
                value={relatedPlayerId}
                onChange={(e) => setRelatedPlayerId(e.target.value)}
                className={selectClass}
                disabled={squadQuery.isLoading}
              >
                <option value="">Select player…</option>
                {squad
                  .filter((p: Player) => p.id !== playerId)
                  .map((p: Player) => (
                    <option key={p.id} value={p.id}>
                      {p.shirtNumber ? `${p.shirtNumber}. ` : ''}
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-3 flex justify-end gap-2">
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => saveMut.mutate()}
            className={primaryBtn}
          >
            {saveMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingId ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingId ? 'Update event' : 'Add event'}
          </button>
        </div>
      </div>
    </div>
  );
}
