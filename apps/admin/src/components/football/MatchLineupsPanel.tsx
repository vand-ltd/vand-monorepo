'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSquad,
  getMatchLineup,
  setMatchLineup,
  normalizePosition,
  type Match,
  type Player,
} from '@org/api';
import { toast } from 'sonner';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { inputClass, labelClass, primaryBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

// Common formations to offer as quick picks (free text still allowed).
const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1', '4-5-1'];

type Slot = 'start' | 'bench'; // players not in the map are "out"
type Coord = { x: number; y: number };

const POS_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
// Normalized GK/DEF/MID/FWD code (positions may be stored as full names).
function posOf(p: Player): string {
  return normalizePosition(p.position) ?? '';
}
function initials(name?: string): string {
  return (name ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || '?';
}
function shortName(full?: string): string {
  if (!full) return '';
  const parts = full.trim().split(/\s+/);
  return parts.length === 1 ? parts[0] : `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

// Group starters into formation lines (GK → attack), same logic as the public pitch.
function buildLines(players: Player[], formation: string): Player[][] {
  const sorted = [...players].sort(
    (a, b) =>
      (POS_ORDER[posOf(a)] ?? 9) - (POS_ORDER[posOf(b)] ?? 9) ||
      (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99)
  );
  const nums = formation
    .split('-')
    .map((x) => parseInt(x, 10))
    .filter((x) => x > 0);
  const total = nums.reduce((a, b) => a + b, 0);
  if (nums.length && total + 1 === sorted.length) {
    const lines: Player[][] = [[sorted[0]]];
    let i = 1;
    for (const n of nums) {
      lines.push(sorted.slice(i, i + n));
      i += n;
    }
    if (i < sorted.length) lines.push(sorted.slice(i));
    return lines;
  }
  const buckets: Record<string, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  const other: Player[] = [];
  for (const p of sorted) {
    const k = posOf(p);
    if (buckets[k]) buckets[k].push(p);
    else other.push(p);
  }
  return [buckets.GK, buckets.DEF, buckets.MID, [...buckets.FWD, ...other]].filter((l) => l.length);
}

// Default (x, y) per starter from the formation — own frame: y=0 own goal → 100 attacking.
function defaultCoords(players: Player[], formation: string): Record<string, Coord> {
  const lines = buildLines(players, formation);
  const L = lines.length;
  const out: Record<string, Coord> = {};
  lines.forEach((line, li) => {
    const n = line.length;
    line.forEach((p, j) => {
      out[p.id] = {
        x: Math.round(((j + 1) / (n + 1)) * 100),
        y: Math.round(L <= 1 ? 8 : 8 + (li / (L - 1)) * 77),
      };
    });
  });
  return out;
}

export function MatchLineupsPanel({
  match,
  homeName,
  awayName,
}: {
  match: Match;
  homeName: string;
  awayName: string;
}) {
  return (
    <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
      <TeamLineupEditor
        matchId={match.id}
        teamId={match.homeTeamId}
        teamName={homeName}
        seasonId={match.seasonId}
        accent="home"
      />
      <TeamLineupEditor
        matchId={match.id}
        teamId={match.awayTeamId}
        teamName={awayName}
        seasonId={match.seasonId}
        accent="away"
      />
    </div>
  );
}

function TeamLineupEditor({
  matchId,
  teamId,
  teamName,
  seasonId,
  accent,
}: {
  matchId: string;
  teamId: string;
  teamName: string;
  seasonId: string;
  accent: 'home' | 'away';
}) {
  const qc = useQueryClient();

  const squadQuery = useQuery({
    queryKey: ['football', 'squad', teamId, seasonId],
    queryFn: () => getSquad(teamId, seasonId),
    enabled: !!teamId && !!seasonId,
  });
  const squad = squadQuery.data ?? [];

  const lineupQuery = useQuery({
    queryKey: ['football', 'lineup', matchId, teamId],
    queryFn: () => getMatchLineup(matchId, teamId),
    enabled: !!matchId && !!teamId,
    retry: false, // a missing lineup (404) is normal — start blank
  });

  const [formation, setFormation] = useState('4-3-3');
  const [coach, setCoach] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  // Explicit drag placements; players without an entry use the formation default.
  const [coords, setCoords] = useState<Record<string, Coord>>({});

  // Prefill from an existing lineup once it loads.
  useEffect(() => {
    const data = lineupQuery.data;
    if (!data) return;
    if (data.formation) setFormation(data.formation);
    if (data.coach) setCoach(data.coach);
    setIsConfirmed(!!data.isConfirmed);
    const nextSlots: Record<string, Slot> = {};
    const nextCoords: Record<string, Coord> = {};
    for (const p of data.slots) {
      nextSlots[p.playerId] = p.isStarting ? 'start' : 'bench';
      if (p.x != null && p.y != null) nextCoords[p.playerId] = { x: p.x, y: p.y };
    }
    setSlots(nextSlots);
    setCoords(nextCoords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineupQuery.data]);

  const setSlot = (playerId: string, slot: Slot | null) =>
    setSlots((s) => {
      const next = { ...s };
      if (slot === null) delete next[playerId];
      else next[playerId] = slot;
      return next;
    });

  const startingCount = Object.values(slots).filter((s) => s === 'start').length;
  const benchCount = Object.values(slots).filter((s) => s === 'bench').length;

  // Starters and their positions (drag override → default).
  const starters = squad.filter((p) => slots[p.id] === 'start');
  const base = defaultCoords(starters, formation.trim() || '4-3-3');
  const posOfPlayer = (id: string): Coord => coords[id] ?? base[id] ?? { x: 50, y: 50 };

  const saveMut = useMutation({
    mutationFn: () =>
      setMatchLineup(matchId, teamId, {
        ...(formation.trim() ? { formation: formation.trim() } : {}),
        ...(coach.trim() ? { coach: coach.trim() } : {}),
        isConfirmed,
        players: Object.entries(slots).map(([playerId, slot]) => {
          if (slot !== 'start') return { playerId, isStarting: false };
          const { x, y } = posOfPlayer(playerId);
          return { playerId, isStarting: true, x, y };
        }),
      }),
    onSuccess: () => {
      toast.success(`${teamName} lineup saved`);
      qc.invalidateQueries({ queryKey: ['football', 'lineup', matchId, teamId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to save lineup')),
  });

  const canSave = startingCount > 0 && !saveMut.isPending;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{teamName}</h4>
        <span className="shrink-0 text-[11px] text-gray-400 tabular-nums">
          {startingCount} starting · {benchCount} bench
        </span>
      </div>

      {/* Formation + coach */}
      <div className="mb-3 flex flex-wrap gap-3">
        <div>
          <label className={labelClass}>Formation</label>
          <input
            list={`formations-${teamId}`}
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            placeholder="e.g. 4-3-3"
            className={`${inputClass} py-1.5 w-28`}
          />
          <datalist id={`formations-${teamId}`}>
            {FORMATIONS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <div className="flex-1 min-w-[10rem]">
          <label className={labelClass}>Coach</label>
          <input
            value={coach}
            onChange={(e) => setCoach(e.target.value)}
            placeholder="Head coach"
            className={`${inputClass} py-1.5`}
          />
        </div>
      </div>

      {/* Confirmed toggle */}
      <label className="mb-3 inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={isConfirmed}
          onChange={(e) => setIsConfirmed(e.target.checked)}
          className="h-4 w-4 accent-emerald-600"
        />
        Confirmed lineup
        <span className="text-[11px] text-gray-400">(off = predicted / provisional)</span>
      </label>

      {/* Squad picker */}
      {squadQuery.isLoading || lineupQuery.isLoading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading squad…
        </div>
      ) : squad.length === 0 ? (
        <p className="text-xs text-gray-400">
          No squad for this team in the season. Add players in the Squads tab first.
        </p>
      ) : (
        <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {squad.map((p: Player) => {
            const slot = slots[p.id];
            return (
              <li key={p.id} className="flex items-center gap-2 text-sm">
                <span className="w-6 shrink-0 text-right text-xs text-gray-400 tabular-nums">
                  {p.shirtNumber ?? ''}
                </span>
                <span className="flex-1 min-w-0 truncate text-gray-900 dark:text-white">
                  {p.name}
                  {p.position ? (
                    <span className="ml-1 text-[11px] text-gray-400">{p.position}</span>
                  ) : null}
                </span>
                <SlotToggle value={slot} onChange={(next) => setSlot(p.id, next)} />
              </li>
            );
          })}
        </ul>
      )}

      {/* Positioning pitch — drag starters to place them (e.g. a CB on the left) */}
      {starters.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className={`${labelClass} !mb-0`}>Positions</label>
            {Object.keys(coords).length > 0 && (
              <button
                type="button"
                onClick={() => setCoords({})}
                className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <RotateCcw className="h-3 w-3" /> Reset to formation
              </button>
            )}
          </div>
          <EditablePitch
            starters={starters}
            posOf={posOfPlayer}
            accent={accent}
            onMove={(id, c) => setCoords((prev) => ({ ...prev, [id]: c }))}
          />
          <p className="mt-1 text-[11px] text-gray-400">Drag a player to set their spot on the pitch.</p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {startingCount !== 11 ? `${startingCount}/11 starters` : '11 starters ✓'}
        </span>
        <button
          type="button"
          disabled={!canSave}
          onClick={() => saveMut.mutate()}
          className={primaryBtn}
        >
          {saveMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save lineup
        </button>
      </div>
    </div>
  );
}

// A draggable mini-pitch. Oriented like the public pitch half: the home team's
// lineup sits at the top (GK up), the away team's at the bottom (GK down).
function EditablePitch({
  starters,
  posOf,
  accent,
  onMove,
}: {
  starters: Player[];
  posOf: (id: string) => Coord;
  accent: 'home' | 'away';
  onMove: (id: string, c: Coord) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);

  // Map own-frame (x,y) → on-screen position, mirroring for the away side.
  const display = (x: number, y: number) =>
    accent === 'home'
      ? { left: x, top: y } // own goal (y=0) at the top
      : { left: 100 - x, top: 100 - y }; // own goal at the bottom, x mirrored

  const compute = (e: React.PointerEvent): Coord | null => {
    const el = ref.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top) / r.height) * 100;
    const clamp = (v: number) => Math.max(3, Math.min(97, Math.round(v)));
    return accent === 'home'
      ? { x: clamp(px), y: clamp(py) }
      : { x: clamp(100 - px), y: clamp(100 - py) };
  };

  return (
    <div
      ref={ref}
      className="relative w-full max-w-[16rem] mx-auto aspect-[3/4] rounded-md overflow-hidden select-none touch-none border border-emerald-900/30"
      style={{
        background:
          'repeating-linear-gradient(0deg, #15803d 0, #15803d 12.5%, #16a34a 12.5%, #16a34a 25%)',
      }}
    >
      {/* Markings */}
      <div className="pointer-events-none absolute inset-1.5 rounded-sm border border-white/25" />
      <div className="pointer-events-none absolute left-1.5 right-1.5 top-1/2 -translate-y-1/2 border-t border-white/25" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />

      {starters.map((p) => {
        const { x, y } = posOf(p.id);
        const d = display(x, y);
        return (
          <button
            key={p.id}
            type="button"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              dragId.current = p.id;
            }}
            onPointerMove={(e) => {
              if (dragId.current !== p.id) return;
              const c = compute(e);
              if (c) onMove(p.id, c);
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              dragId.current = null;
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none"
            style={{ left: `${d.left}%`, top: `${d.top}%` }}
          >
            <span className="h-6 w-6 rounded-full bg-white text-[#003153] text-[10px] font-bold flex items-center justify-center shadow ring-1 ring-black/10">
              {p.shirtNumber ?? initials(p.name)}
            </span>
            <span className="mt-0.5 whitespace-nowrap rounded bg-black/45 px-0.5 text-[9px] font-medium leading-tight text-white">
              {shortName(p.name)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// A 3-way toggle: Start / Bench / Out (out = not selected).
function SlotToggle({
  value,
  onChange,
}: {
  value?: Slot;
  onChange: (next: Slot | null) => void;
}) {
  const opts: { key: Slot | 'out'; label: string }[] = [
    { key: 'start', label: 'Start' },
    { key: 'bench', label: 'Bench' },
    { key: 'out', label: 'Out' },
  ];
  const current = value ?? 'out';
  const activeClass: Record<string, string> = {
    start: 'bg-emerald-600 text-white',
    bench: 'bg-amber-500 text-white',
    out: 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
  };
  return (
    <div className="shrink-0 inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden text-[11px] font-medium">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key === 'out' ? null : (o.key as Slot))}
          className={`px-2 py-1 transition-colors ${
            current === o.key
              ? activeClass[o.key]
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
