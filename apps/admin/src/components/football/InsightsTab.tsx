'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSeasonInsight, type InsightKind, type Season } from '@org/api';
import { cardClass, inputClass, primaryBtn } from './styles';
import { Link } from '@/i18n/navigation';
import { Copy, Check, Loader2, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// The insight "types" the editor can generate a briefing for. `matchday` and
// `digest` both hit the same `numbers` endpoint — matchday just adds a round.
type SelKey = 'digest' | 'matchday' | 'records' | 'streaks';
const KINDS: { key: SelKey; label: string; desc: string; kind: InsightKind }[] = [
  { key: 'digest', label: 'Season digest', desc: 'The whole season so far', kind: 'numbers' },
  { key: 'matchday', label: 'Matchday', desc: 'A single round (leagues)', kind: 'numbers' },
  { key: 'records', label: 'Records', desc: 'Season superlatives', kind: 'records' },
  { key: 'streaks', label: 'Streaks', desc: 'Runs & leaders', kind: 'streaks' },
];

export function InsightsTab({ seasonId, season }: { seasonId: string; season: Season | null }) {
  const [sel, setSel] = useState<SelKey>('digest');
  const [round, setRound] = useState('');
  const [copied, setCopied] = useState(false);

  const active = KINDS.find((k) => k.key === sel) ?? KINDS[0];
  const isMatchday = sel === 'matchday';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competitionLabel: string | undefined =
    (season as any)?.competition?.name ?? season?.name ?? undefined;

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['insight', seasonId, active.kind, isMatchday ? round.trim() : ''],
    queryFn: () => getSeasonInsight(seasonId, active.kind, isMatchday ? { round } : undefined),
    enabled: !!seasonId && (!isMatchday || !!round.trim()),
  });

  const briefing = data?.briefing ?? '';

  const copy = async () => {
    if (!briefing) return;
    try {
      await navigator.clipboard.writeText(briefing);
      setCopied(true);
      toast.success('Briefing copied');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Copy failed — select the text and copy manually');
    }
  };

  if (!seasonId) {
    return (
      <div className={`${cardClass} p-8 text-center`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a competition and season above to generate an article briefing.
        </p>
      </div>
    );
  }

  const needsRound = isMatchday && !round.trim();

  return (
    <section className={`${cardClass} p-5`}>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Article briefing</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Generate a copy-paste-ready briefing for {competitionLabel ?? 'this competition'}, then paste it
        into your AI chat to write the article.
      </p>

      {/* Insight type picker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {KINDS.map((k) => {
          const on = k.key === sel;
          return (
            <button
              key={k.key}
              type="button"
              onClick={() => setSel(k.key)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                on
                  ? 'border-[#003153] dark:border-[#F59E0B] bg-[#003153]/5 dark:bg-[#F59E0B]/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-[#003153]/40 dark:hover:border-[#F59E0B]/40'
              }`}
            >
              <span
                className={`block text-sm font-semibold ${
                  on ? 'text-[#003153] dark:text-[#F59E0B]' : 'text-gray-900 dark:text-white'
                }`}
              >
                {k.label}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Round input (matchday only) */}
      {isMatchday && (
        <div className="mb-4 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Round label
          </label>
          <input
            value={round}
            onChange={(e) => setRound(e.target.value)}
            placeholder="e.g. Matchday 12"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400">
            Must match how rounds were entered on fixtures. Leagues only.
          </p>
        </div>
      )}

      {/* Briefing output */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Briefing
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching || needsRound}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={!briefing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#003153] hover:bg-[#005F73] px-2.5 py-1 text-xs font-medium text-white transition-colors disabled:opacity-40"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="p-3">
          {needsRound ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Enter a round label above to load its matchday briefing.
            </p>
          ) : isFetching ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[#003153] dark:text-[#F59E0B]" />
            </div>
          ) : isError ? (
            <p className="flex items-center justify-center gap-2 py-8 text-center text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              Couldn&apos;t load this briefing. Try Refresh.
            </p>
          ) : !briefing ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No briefing yet — this season may not have enough completed matches.
            </p>
          ) : (
            <textarea
              readOnly
              value={briefing}
              rows={Math.min(20, Math.max(8, briefing.split('\n').length + 1))}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full resize-y rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 font-mono text-[13px] leading-relaxed text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B]"
            />
          )}
        </div>
      </div>

      {/* Next steps */}
      <div className="mt-4 rounded-xl border border-[#003153]/15 dark:border-[#F59E0B]/20 bg-[#003153]/5 dark:bg-[#F59E0B]/10 p-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Turn it into an article</p>
        <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-0.5 list-decimal list-inside">
          <li>Copy the briefing above.</li>
          <li>Paste it into your AI chat — ask for a recap using only these numbers (add French &amp; Kinyarwanda if you want).</li>
          <li>Paste the result into a new Draft article, review, and publish.</li>
        </ol>
        <Link href="/create-article" className={`${primaryBtn} mt-3`}>
          <FileText className="h-4 w-4" />
          Open article editor
        </Link>
      </div>
    </section>
  );
}
