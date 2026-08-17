'use client';

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createMatchesBulk, TBD_KICKOFF, type MatchInput, type Team, type Venue, type Stage } from '@org/api';
import { toast } from 'sonner';
import { cardClass, primaryBtn, ghostBtn } from './styles';
import { FileDown, Upload, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

// The canonical template columns. Header matching is case/space-insensitive.
const COLS = ['Home Team', 'Away Team', 'Date', 'Time', 'Round', 'Venue', 'Referee', 'Stage', 'Group'];

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
const pad = (n: number) => String(n).padStart(2, '0');

// Placeholder kickoff time for fixtures whose time isn't announced yet. Blank or
// "TBD"/"TBA" in the Time column falls back to this — edit the exact time later.
const DEFAULT_TIME = { H: 15, M: 0 };
const isTbd = (s: string) => s === '' || /^(tbd|tba|n\/?a)$/i.test(s);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errMessage(e: any, fallback: string): string {
  return e?.response?.data?.message || e?.message || fallback;
}

// Normalize an exceljs cell value to a primitive (Date | number | string).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cellVal(v: any): Date | number | string {
  if (v == null) return '';
  if (v instanceof Date) return v;
  if (typeof v === 'object') {
    if ('text' in v) return v.text;
    if ('result' in v) return v.result ?? '';
    if ('richText' in v) return v.richText.map((r: { text: string }) => r.text).join('');
    return '';
  }
  return v;
}

// Excel serial number → date/time parts (UTC, matching how the values are stored).
function serialParts(n: number) {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n * 86400000));
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, da: d.getUTCDate(), H: d.getUTCHours(), M: d.getUTCMinutes() };
}

function dateParts(v: Date | number | string): { y: number; mo: number; da: number } | null {
  if (v instanceof Date) return { y: v.getUTCFullYear(), mo: v.getUTCMonth() + 1, da: v.getUTCDate() };
  if (typeof v === 'number') { const p = serialParts(v); return { y: p.y, mo: p.mo, da: p.da }; }
  const s = String(v).trim();
  const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) return { y: +m[1], mo: +m[2], da: +m[3] };
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : { y: d.getFullYear(), mo: d.getMonth() + 1, da: d.getDate() };
}

function timeParts(v: Date | number | string): { H: number; M: number } | null {
  if (v instanceof Date) return { H: v.getUTCHours(), M: v.getUTCMinutes() };
  if (typeof v === 'number') { const p = serialParts(v); return { H: p.H, M: p.M }; }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let H = +m[1];
  const M = +m[2];
  const ap = m[3]?.toUpperCase();
  if (ap === 'PM' && H < 12) H += 12;
  if (ap === 'AM' && H === 12) H = 0;
  return { H, M };
}

type ParsedRow = {
  n: number;
  home: string;
  away: string;
  when: string; // display
  round: string;
  homeTeamId?: string;
  awayTeamId?: string;
  kickoffAt?: string;
  venueId?: string;
  referee?: string;
  stageId?: string;
  groupId?: string;
  errors: string[];
};

export function BulkFixtureUpload({
  seasonId,
  teams,
  venues,
  stages,
  onCreated,
}: {
  seasonId: string;
  teams: Team[];
  venues: Venue[];
  stages: Stage[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const teamByName = new Map<string, Team>();
  for (const t of teams) {
    teamByName.set(norm(t.name), t);
    if (t.shortName) teamByName.set(norm(t.shortName), t);
  }
  const venueByName = new Map<string, Venue>();
  for (const v of venues) venueByName.set(norm(v.name), v);

  const valid = rows?.filter((r) => r.errors.length === 0) ?? [];

  const downloadTemplate = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Fixtures');
    ws.addRow(COLS);
    ws.getRow(1).font = { bold: true };
    ws.addRow(['APR FC', 'Rayon Sports FC', '2026-08-22', '18:00', 'Matchday 1', venues[0]?.name ?? 'Amahoro Stadium', '', '', '']);
    // Time blank / TBD → known day, placeholder 15:00 time you edit later.
    ws.addRow(['Police FC', 'AS Kigali', '2026-08-23', 'TBD', 'Matchday 1', '', '', '', '']);
    // Date blank / TBD → whole fixture shows "TBD" on the site until scheduled.
    ws.addRow(['Musanze FC', 'Gasogi United', 'TBD', 'TBD', 'Matchday 1', '', '', '', '']);
    ws.columns = COLS.map(() => ({ width: 18 }));

    // Reference sheet: exact team / venue / stage names to copy from.
    const ref = wb.addWorksheet('Reference');
    ref.addRow(['Teams']).font = { bold: true };
    for (const t of teams) ref.addRow([t.name]);
    ref.addRow([]);
    ref.addRow(['Venues']).getCell(1).font = { bold: true };
    for (const v of venues) ref.addRow([v.name]);
    if (stages.length) {
      ref.addRow([]);
      ref.addRow(['Stages / Groups']).getCell(1).font = { bold: true };
      for (const s of stages) {
        ref.addRow([s.name]);
        for (const g of s.groups ?? []) ref.addRow(['', g.name]);
      }
    }
    ref.columns = [{ width: 26 }, { width: 20 }];

    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fixtures-template.xlsx';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setRows(null);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.getWorksheet('Fixtures') ?? wb.worksheets[0];
      if (!ws) throw new Error('No sheet found');

      // Map header -> column index from row 1.
      const idx: Record<string, number> = {};
      ws.getRow(1).eachCell((cell, col) => {
        idx[norm(cellVal(cell.value))] = col;
      });
      const get = (row: import('exceljs').Row, name: string) => {
        const c = idx[norm(name)];
        return c ? cellVal(row.getCell(c).value) : '';
      };

      const stageByName = new Map(stages.map((s) => [norm(s.name), s]));

      const out: ParsedRow[] = [];
      ws.eachRow((row, n) => {
        if (n === 1) return;
        const home = String(get(row, 'Home Team')).trim();
        const away = String(get(row, 'Away Team')).trim();
        if (!home && !away) return; // blank row

        const errors: string[] = [];
        const ht = teamByName.get(norm(home));
        const at = teamByName.get(norm(away));
        if (!home) errors.push('Missing home team');
        else if (!ht) errors.push(`Home team "${home}" not enrolled`);
        if (!away) errors.push('Missing away team');
        else if (!at) errors.push(`Away team "${away}" not enrolled`);
        if (ht && at && ht.id === at.id) errors.push('Home and away are the same team');

        // Date/time are optional. A blank/"TBD" Date makes the whole fixture TBD —
        // stored as the sentinel kickoff and shown as "TBD" everywhere. A known
        // date with a blank/"TBD" Time defaults to a placeholder time (15:00).
        const rawDate = String(get(row, 'Date')).trim();
        const rawTime = String(get(row, 'Time')).trim();
        const dateTbd = isTbd(rawDate);
        const timeTbd = isTbd(rawTime);
        const dp = dateTbd ? null : dateParts(get(row, 'Date'));
        const tp = timeTbd ? DEFAULT_TIME : timeParts(get(row, 'Time'));
        if (!dateTbd && !dp) errors.push('Invalid Date (use YYYY-MM-DD, or leave blank for TBD)');
        if (!dateTbd && !timeTbd && !tp) errors.push('Invalid Time (use HH:MM, or leave blank for TBD)');

        let kickoffAt: string | undefined;
        let when = '';
        if (dateTbd) {
          kickoffAt = TBD_KICKOFF;
          when = 'TBD';
        } else if (dp && tp) {
          // Kigali is UTC+2 (no DST) — fixed offset makes this deterministic.
          const iso = `${dp.y}-${pad(dp.mo)}-${pad(dp.da)}T${pad(tp.H)}:${pad(tp.M)}:00+02:00`;
          const d = new Date(iso);
          if (isNaN(d.getTime())) errors.push('Invalid date/time');
          else {
            kickoffAt = d.toISOString();
            when = `${dp.y}-${pad(dp.mo)}-${pad(dp.da)} ${pad(tp.H)}:${pad(tp.M)}${timeTbd ? ' · time TBD' : ''}`;
          }
        }

        const venueName = String(get(row, 'Venue')).trim();
        let venueId: string | undefined;
        if (venueName) {
          const v = venueByName.get(norm(venueName));
          if (!v) errors.push(`Venue "${venueName}" not found`);
          else venueId = v.id;
        }

        const stageName = String(get(row, 'Stage')).trim();
        let stageId: string | undefined;
        let groupId: string | undefined;
        if (stageName) {
          const s = stageByName.get(norm(stageName));
          if (!s) errors.push(`Stage "${stageName}" not found`);
          else {
            stageId = s.id;
            const groupName = String(get(row, 'Group')).trim();
            if (groupName) {
              const g = (s.groups ?? []).find((x) => norm(x.name) === norm(groupName));
              if (!g) errors.push(`Group "${groupName}" not in stage "${s.name}"`);
              else groupId = g.id;
            }
          }
        }

        out.push({
          n,
          home,
          away,
          when,
          round: String(get(row, 'Round')).trim(),
          homeTeamId: ht?.id,
          awayTeamId: at?.id,
          kickoffAt,
          venueId,
          referee: String(get(row, 'Referee')).trim() || undefined,
          stageId,
          groupId,
          errors,
        });
      });

      if (out.length === 0) toast.error('No fixture rows found in the file');
      setRows(out);
    } catch (err) {
      toast.error(errMessage(err, 'Could not read the file — is it a valid .xlsx?'));
      setRows(null);
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const createMut = useMutation({
    mutationFn: () => {
      const matches: MatchInput[] = valid.map((r) => ({
        homeTeamId: r.homeTeamId!,
        awayTeamId: r.awayTeamId!,
        kickoffAt: r.kickoffAt!,
        ...(r.venueId ? { venueId: r.venueId } : {}),
        ...(r.referee ? { referee: r.referee } : {}),
        ...(r.round ? { round: r.round } : {}),
        ...(r.stageId ? { stageId: r.stageId } : {}),
        ...(r.groupId ? { groupId: r.groupId } : {}),
      }));
      return createMatchesBulk({ seasonId, round: 'Round', matches });
    },
    onSuccess: (created) => {
      toast.success(`${created?.length ?? valid.length} fixtures created`);
      setRows(null);
      setFileName('');
      onCreated();
    },
    onError: (e) => toast.error(errMessage(e, 'Failed to create fixtures')),
  });

  return (
    <section className={`${cardClass} p-5`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span>
          <span className="block text-base font-semibold text-gray-900 dark:text-white">
            Bulk upload from Excel
          </span>
          <span className="block text-sm text-gray-500 dark:text-gray-400">
            Create many fixtures at once from a spreadsheet.
          </span>
        </span>
        <span className="text-sm font-medium text-[#003153] dark:text-[#F59E0B]">
          {open ? 'Hide' : 'Open'}
        </span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={downloadTemplate} className={ghostBtn}>
              <FileDown className="h-4 w-4" /> Download template
            </button>
            <label className={`${primaryBtn} cursor-pointer`}>
              <Upload className="h-4 w-4" />
              {parsing ? 'Reading…' : 'Choose Excel file'}
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onFile}
                className="hidden"
                disabled={parsing}
              />
            </label>
            {fileName && <span className="text-xs text-gray-500 dark:text-gray-400">{fileName}</span>}
          </div>

          <p className="text-xs text-gray-400">
            Columns: <span className="font-medium">{COLS.join(' · ')}</span>. Date as{' '}
            <span className="font-mono">YYYY-MM-DD</span>, Time as{' '}
            <span className="font-mono">HH:MM</span> (24h, Kigali). Leave <span className="font-mono">Date</span>{' '}
            blank or <span className="font-mono">TBD</span> for a fully unscheduled fixture (shows{' '}
            <span className="font-mono">TBD</span> on the site); leave only <span className="font-mono">Time</span>{' '}
            blank to use a placeholder <span className="font-mono">15:00</span>. Team &amp; venue names
            must match those enrolled — the template&apos;s “Reference” sheet lists them.
          </p>

          {rows && rows.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" /> {valid.length} ready
                </span>
                {rows.length - valid.length > 0 && (
                  <span className="inline-flex items-center gap-1 font-medium text-red-500">
                    <AlertCircle className="h-4 w-4" /> {rows.length - valid.length} with errors
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => { setRows(null); setFileName(''); }}
                  className="ml-auto inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400 dark:border-gray-700">
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Home</th>
                      <th className="px-3 py-2 font-medium">Away</th>
                      <th className="px-3 py-2 font-medium">Kickoff</th>
                      <th className="px-3 py-2 font-medium">Round</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.n}
                        className={`border-b border-gray-100 last:border-0 dark:border-gray-700 ${
                          r.errors.length ? 'bg-red-50/60 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-gray-400">{r.n}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{r.home || '—'}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-white">{r.away || '—'}</td>
                        <td className="px-3 py-2 tabular-nums text-gray-600 dark:text-gray-300">{r.when || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{r.round || '—'}</td>
                        <td className="px-3 py-2">
                          {r.errors.length === 0 ? (
                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-3.5 w-3.5" /> OK
                            </span>
                          ) : (
                            <span className="text-red-500">{r.errors.join('; ')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                disabled={valid.length === 0 || createMut.isPending}
                onClick={() => createMut.mutate()}
                className={primaryBtn}
              >
                {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Create {valid.length || ''} fixtures
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
