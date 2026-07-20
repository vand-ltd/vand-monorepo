'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSeasonStages,
  getSeasonEntries,
  createStagesBulk,
  createGroupsBulk,
  updateStage,
  deleteStage,
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
import {
  Loader2,
  Plus,
  Trash2,
  Layers,
  Wand2,
  Pencil,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cardClass, inputClass, labelClass, primaryBtn, ghostBtn } from './styles';

function errMessage(error: any, fallback: string) {
  const m = error?.response?.data?.message || fallback;
  return Array.isArray(m) ? m.join(', ') : m;
}

type StageRow = { name: string; type: StageType; order: string };
const emptyStage: StageRow = { name: '', type: 'Knockout', order: '' };

// A typical cup structure — one click instead of typing four rows.
const CUP_PRESET: StageRow[] = [
  { name: 'Group Stage', type: 'Group', order: '' },
  { name: 'Quarter-final', type: 'Knockout', order: '' },
  { name: 'Semi-final', type: 'Knockout', order: '' },
  { name: 'Final', type: 'Knockout', order: '' },
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
      const payload: StageInput[] = validStages.map((r) => ({
        name: r.name.trim(),
        type: r.type,
        ...(r.order.trim() ? { order: Number(r.order) } : {}),
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

  // Stages in display order — `order` may be unset on older rows, so fall back
  // to the array position rather than lumping them all together.
  const orderedStages = [...stages].sort(
    (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
  );
  const orderOf = (s: Stage, i: number) => s.order ?? i + 1;

  /* ------------------------------ Edit a stage ---------------------------- */
  const [editId, setEditId] = useState('');
  const [editRow, setEditRow] = useState<StageRow>({ ...emptyStage });

  const updateStageMut = useMutation({
    mutationFn: (vars: { id: string; payload: { name?: string; type?: StageType; order?: number } }) =>
      updateStage(vars.id, vars.payload),
    onSuccess: () => {
      toast.success('Stage updated');
      setEditId('');
      qc.invalidateQueries({ queryKey: ['football', 'stages', seasonId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to update stage')),
  });

  // Swap this stage's order with its neighbour — beats typing order numbers.
  const moveStageMut = useMutation({
    mutationFn: async (vars: { index: number; dir: -1 | 1 }) => {
      const { index, dir } = vars;
      const a = orderedStages[index];
      const b = orderedStages[index + dir];
      if (!a || !b) return;
      const aOrder = orderOf(a, index);
      const bOrder = orderOf(b, index + dir);
      await updateStage(a.id, { order: bOrder });
      await updateStage(b.id, { order: aOrder });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['football', 'stages', seasonId] }),
    onError: (e) => toast.error(errMessage(e, 'Failed to reorder stages')),
  });

  /* ------------------------------- Groups -------------------------------- */
  const groupStages = stages.filter((s) => s.type === 'Group');
  const [stageId, setStageId] = useState('');
  const activeStage = stages.find((s) => s.id === stageId) ?? null;
  const [groupRows, setGroupRows] = useState<GroupRow[]>([{ ...emptyGroup }]);

  const [deleteTarget, setDeleteTarget] = useState<Stage | null>(null);
  const deleteStageMut = useMutation({
    mutationFn: (id: string) => deleteStage(id),
    onSuccess: () => {
      toast.success('Stage deleted');
      // The removed stage may be the one selected below — reset the group form.
      if (deleteTarget?.id === stageId) {
        setStageId('');
        setGroupRows([{ ...emptyGroup }]);
      }
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ['football', 'stages', seasonId] });
      qc.invalidateQueries({ queryKey: ['football', 'matches', seasonId] });
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to delete stage')),
  });
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
            {orderedStages.map((s: Stage, i: number) =>
              editId === s.id ? (
                <li key={s.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                  <input
                    value={editRow.name}
                    onChange={(e) => setEditRow((r) => ({ ...r, name: e.target.value }))}
                    className={`${inputClass} flex-1 min-w-[140px] py-1`}
                  />
                  <select
                    value={editRow.type}
                    onChange={(e) =>
                      setEditRow((r) => ({ ...r, type: e.target.value as StageType }))
                    }
                    className={`${inputClass} w-32 py-1`}
                  >
                    {STAGE_TYPES.map((tp) => (
                      <option key={tp} value={tp}>
                        {tp}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={editRow.order}
                    onChange={(e) => setEditRow((r) => ({ ...r, order: e.target.value }))}
                    placeholder="Order"
                    title="Order (leave blank to keep)"
                    className={`${inputClass} w-20 py-1 text-center`}
                  />
                  <button
                    type="button"
                    disabled={!editRow.name.trim() || updateStageMut.isPending}
                    onClick={() =>
                      updateStageMut.mutate({
                        id: s.id,
                        payload: {
                          name: editRow.name.trim(),
                          type: editRow.type,
                          ...(editRow.order.trim() ? { order: Number(editRow.order) } : {}),
                        },
                      })
                    }
                    className="px-2 py-1 rounded-md bg-[#003153] hover:bg-[#005F73] text-white text-xs font-medium disabled:opacity-50"
                  >
                    {updateStageMut.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Save'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId('')}
                    className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </li>
              ) : (
                <li key={s.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="w-6 shrink-0 text-xs tabular-nums text-gray-400">
                    {orderOf(s, i)}
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
                  {/* Reorder without thinking about numbers */}
                  <button
                    type="button"
                    disabled={i === 0 || moveStageMut.isPending}
                    onClick={() => moveStageMut.mutate({ index: i, dir: -1 })}
                    title="Move up"
                    className="shrink-0 p-1 rounded-md text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={i === orderedStages.length - 1 || moveStageMut.isPending}
                    onClick={() => moveStageMut.mutate({ index: i, dir: 1 })}
                    title="Move down"
                    className="shrink-0 p-1 rounded-md text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditId(s.id);
                      setEditRow({
                        name: s.name,
                        type: s.type,
                        order: s.order != null ? String(s.order) : '',
                      });
                    }}
                    title="Edit stage"
                    className="shrink-0 p-1 rounded-md text-gray-400 hover:text-[#003153] dark:hover:text-[#F59E0B] hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(s)}
                    title="Delete stage"
                    className="shrink-0 p-1 rounded-md text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            )}
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
              <input
                type="number"
                min="1"
                value={row.order}
                onChange={(e) =>
                  setStageRows((rs) => rs.map((r, j) => (j === i ? { ...r, order: e.target.value } : r)))
                }
                placeholder="Auto"
                title="Order — leave blank to append after existing stages"
                className={`${inputClass} w-20 text-center`}
              />
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete stage?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <span className="font-medium">{deleteTarget?.name}</span>
              {(deleteTarget?.groups ?? []).length > 0 && (
                <> and its {(deleteTarget?.groups ?? []).length} group(s)</>
              )}
              . Any fixtures scheduled in this stage may be affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteStageMut.mutate(deleteTarget.id)}
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
