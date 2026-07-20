'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSeasonStages,
  getSeasonEntries,
  createStagesBulk,
  createGroupsBulk,
  STAGE_TYPES,
  type Season,
  type Stage,
  type StageGroup,
  type StageInput,
  type StageType,
  type GroupInput,
  type Team,
} from '@org/api';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Layers, Wand2 } from 'lucide-react';
import { cardClass, inputClass, labelClass, primaryBtn, ghostBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

type StageRow = { name: string; type: StageType };
const emptyStage: StageRow = { name: '', type: 'Knockout' };

// A typical cup structure — one click instead of typing four rows.
const CUP_PRESET: StageRow[] = [
  { name: 'Group Stage', type: 'Group' },
  { name: 'Quarter-final', type: 'Knockout' },
  { name: 'Semi-final', type: 'Knockout' },
  { name: 'Final', type: 'Knockout' },
];

type GroupRow = { name: string; teamIds: string[] };
const emptyGroup: GroupRow = { name: '', teamIds: [] };

export function StagesTab({ seasonId, season }: { seasonId: string; season: Season | null }) {
  const qc = useQueryClient();

  const stagesQuery = useQuery({
    queryKey: ['football', 'stages', seasonId],
    queryFn: () => getSeasonStages(seasonId),
    enabled: !!seasonId,
    retry: false,
  });
  const stages = stagesQuery.data ?? [];

  const entriesQuery = useQuery({
    queryKey: ['football', 'entries', seasonId],
    queryFn: () => getSeasonEntries(seasonId),
    enabled: !!seasonId,
  });
  const teams = entriesQuery.data ?? [];

  /* ------------------------------- Stages -------------------------------- */
  const [stageRows, setStageRows] = useState<StageRow[]>([{ ...emptyStage }]);
  const validStages = stageRows.filter((r) => r.name.trim());

  const createStagesMut = useMutation({
    mutationFn: () => {
      // order defaults to array position on the backend, but we send it explicitly.
      const payload: StageInput[] = validStages.map((r, i) => ({
        name: r.name.trim(),
        type: r.type,
        order: i + 1,
      }));
      return createStagesBulk(seasonId, { stages: payload });
    },
    onSuccess: () => {
      toast.success('Stages created');
      setStageRows([{ ...emptyStage }]);
      qc.invalidateQueries({ queryKey: ['football', 'stages', seasonId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to create stages')),
  });

  /* ------------------------------- Groups -------------------------------- */
  const groupStages = stages.filter((s) => s.type === 'Group');
  const [stageId, setStageId] = useState('');
  const activeStage = stages.find((s) => s.id === stageId) ?? null;
  const [groupRows, setGroupRows] = useState<GroupRow[]>([{ ...emptyGroup }]);
  const validGroups = groupRows.filter((r) => r.name.trim());

  // Teams already in a group of this stage can't be reused (409 otherwise).
  const takenByExisting = new Set(
    (activeStage?.groups ?? []).flatMap((g) => (g.teams ?? []).map((t) => t.id))
  );
  const takenInForm = (exceptIndex: number) =>
    new Set(groupRows.flatMap((r, i) => (i === exceptIndex ? [] : r.teamIds)));

  const createGroupsMut = useMutation({
    mutationFn: () => {
      const payload: GroupInput[] = validGroups.map((r, i) => ({
        name: r.name.trim(),
        order: i + 1,
        ...(r.teamIds.length ? { teamIds: r.teamIds } : {}),
      }));
      return createGroupsBulk(stageId, { groups: payload });
    },
    onSuccess: () => {
      toast.success('Groups created');
      setGroupRows([{ ...emptyGroup }]);
      qc.invalidateQueries({ queryKey: ['football', 'stages', seasonId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to create groups')),
  });

  if (!seasonId) {
    return (
      <div className={`${cardClass} p-8 text-center`}>
        <Layers className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a competition and season above to set up stages and groups.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------ Stages ------------------------------ */}
      <section className={`${cardClass} p-5`}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Stages</h2>
          <span className="text-xs text-gray-400">{stages.length} in {season?.name ?? 'season'}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          The whole cup structure in one call. Order follows the row order below.
        </p>

        {/* Existing stages */}
        {stagesQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading stages…
          </div>
        ) : stages.length > 0 ? (
          <ol className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {stages.map((s: Stage) => (
              <li key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="w-6 shrink-0 text-xs tabular-nums text-gray-400">
                  {s.order ?? ''}
                </span>
                <span className="flex-1 truncate text-gray-900 dark:text-white">{s.name}</span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    s.type === 'Group'
                      ? 'bg-[#003153]/10 text-[#003153] dark:bg-[#F59E0B]/10 dark:text-[#F59E0B]'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                  }`}
                >
                  {s.type}
                </span>
                {s.type === 'Group' && (
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {(s.groups ?? []).length} groups
                  </span>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mb-4 text-sm text-gray-400">No stages yet.</p>
        )}

        {/* Add stages */}
        <div className="space-y-2">
          {stageRows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <span className="w-6 shrink-0 text-center text-xs tabular-nums text-gray-400">
                {i + 1}
              </span>
              <input
                value={row.name}
                onChange={(e) =>
                  setStageRows((rs) => rs.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
                }
                placeholder="e.g. Group Stage"
                className={`${inputClass} flex-1 min-w-[160px]`}
              />
              <select
                value={row.type}
                onChange={(e) =>
                  setStageRows((rs) =>
                    rs.map((r, j) => (j === i ? { ...r, type: e.target.value as StageType } : r))
                  )
                }
                className={`${inputClass} w-36`}
              >
                {STAGE_TYPES.map((tp) => (
                  <option key={tp} value={tp}>
                    {tp}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setStageRows((rs) => (rs.length === 1 ? rs : rs.filter((_, j) => j !== i)))}
                disabled={stageRows.length === 1}
                className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setStageRows((rs) => [...rs, { ...emptyStage }])}
              className={ghostBtn}
            >
              <Plus className="h-4 w-4" /> Add stage
            </button>
            <button
              type="button"
              onClick={() => setStageRows(CUP_PRESET.map((s) => ({ ...s })))}
              className={ghostBtn}
              title="Group Stage · Quarter-final · Semi-final · Final"
            >
              <Wand2 className="h-4 w-4" /> Cup preset
            </button>
          </div>
          <button
            type="button"
            disabled={!validStages.length || createStagesMut.isPending}
            onClick={() => createStagesMut.mutate()}
            className={primaryBtn}
          >
            {createStagesMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Save {validStages.length || ''} stages
          </button>
        </div>
      </section>

      {/* ------------------------------ Groups ------------------------------ */}
      <section className={`${cardClass} p-5`}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Groups</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Creates the groups and assigns their teams in one call. Only stages of type{' '}
          <span className="font-medium">Group</span> can hold groups.
        </p>

        {groupStages.length === 0 ? (
          <p className="text-sm text-gray-400">
            No group stage yet — add a stage of type “Group” above first.
          </p>
        ) : (
          <>
            <div className="max-w-xs mb-4">
              <label className={labelClass}>Stage</label>
              <select
                value={stageId}
                onChange={(e) => {
                  setStageId(e.target.value);
                  setGroupRows([{ ...emptyGroup }]);
                }}
                className={inputClass}
              >
                <option value="">Select a group stage…</option>
                {groupStages.map((s: Stage) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {stageId && (
              <>
                {/* Existing groups */}
                {(activeStage?.groups ?? []).length > 0 && (
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(activeStage?.groups ?? []).map((g: StageGroup) => (
                      <div
                        key={g.id}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{g.name}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {(g.teams ?? []).map((t) => t.name).join(', ') || 'No teams'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {teams.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No teams enrolled in this season yet — enrol teams in the Setup tab first.
                  </p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {groupRows.map((row, i) => {
                        const taken = takenInForm(i);
                        return (
                          <div
                            key={i}
                            className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                value={row.name}
                                onChange={(e) =>
                                  setGroupRows((rs) =>
                                    rs.map((r, j) => (j === i ? { ...r, name: e.target.value } : r))
                                  )
                                }
                                placeholder="e.g. Group A"
                                className={`${inputClass} max-w-[12rem]`}
                              />
                              <span className="text-xs text-gray-400">
                                {row.teamIds.length} teams
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setGroupRows((rs) =>
                                    rs.length === 1 ? rs : rs.filter((_, j) => j !== i)
                                  )
                                }
                                disabled={groupRows.length === 1}
                                className="ml-auto p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                              {teams.map((t: Team) => {
                                const checked = row.teamIds.includes(t.id);
                                // Prevent the 400/409 by hiding teams used elsewhere.
                                const disabled =
                                  !checked && (taken.has(t.id) || takenByExisting.has(t.id));
                                return (
                                  <label
                                    key={t.id}
                                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                                      disabled
                                        ? 'border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                        : checked
                                          ? 'border-[#003153] bg-[#003153]/5 text-gray-900 dark:text-white cursor-pointer'
                                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer hover:border-gray-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={disabled}
                                      onChange={(e) =>
                                        setGroupRows((rs) =>
                                          rs.map((r, j) =>
                                            j === i
                                              ? {
                                                  ...r,
                                                  teamIds: e.target.checked
                                                    ? [...r.teamIds, t.id]
                                                    : r.teamIds.filter((id) => id !== t.id),
                                                }
                                              : r
                                          )
                                        )
                                      }
                                      className="h-3.5 w-3.5 accent-[#003153]"
                                    />
                                    <span className="truncate" title={t.name}>
                                      {t.name}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setGroupRows((rs) => [...rs, { ...emptyGroup }])}
                        className={ghostBtn}
                      >
                        <Plus className="h-4 w-4" /> Add group
                      </button>
                      <button
                        type="button"
                        disabled={!validGroups.length || createGroupsMut.isPending}
                        onClick={() => createGroupsMut.mutate()}
                        className={primaryBtn}
                      >
                        {createGroupsMut.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Save {validGroups.length || ''} groups
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
