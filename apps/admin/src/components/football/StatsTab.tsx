'use client';

import { useState } from 'react';
import type { Season } from '@org/api';
import { cardClass } from './styles';
import { ListOrdered, Goal, Users, ImageDown } from 'lucide-react';
import { StatsGraphicModal, type StatsGraphicType } from './StatsGraphicModal';

const CARDS: { type: StatsGraphicType; title: string; desc: string; icon: typeof ListOrdered }[] = [
  { type: 'standings', title: 'Standings', desc: 'League table or group tables', icon: ListOrdered },
  { type: 'scorers', title: 'Top Scorers', desc: 'Golden boot leaderboard', icon: Goal },
  { type: 'assists', title: 'Top Assists', desc: 'Assist leaders', icon: Users },
];

export function StatsTab({ seasonId, season }: { seasonId: string; season: Season | null }) {
  const [open, setOpen] = useState<StatsGraphicType | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competitionLabel: string | undefined =
    (season as any)?.competition?.name ?? season?.name ?? undefined;

  if (!seasonId) {
    return (
      <div className={`${cardClass} p-8 text-center`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a competition and season above to generate graphics.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className={`${cardClass} p-5`}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Shareable graphics</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Branded graphics for {competitionLabel ?? 'this competition'} — works for both leagues and
          cups. Square for feeds, Story for WhatsApp Status.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CARDS.map((c) => (
            <button
              key={c.type}
              type="button"
              onClick={() => setOpen(c.type)}
              className="group flex flex-col items-start gap-2 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:border-[#003153]/40 dark:hover:border-[#F59E0B]/40 hover:shadow-sm transition-all"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003153]/10 dark:bg-[#F59E0B]/10 text-[#003153] dark:text-[#F59E0B]">
                <c.icon className="h-5 w-5" />
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">{c.title}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{c.desc}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#003153] dark:text-[#F59E0B]">
                <ImageDown className="h-3.5 w-3.5" /> Create graphic
              </span>
            </button>
          ))}
        </div>
      </section>

      {open && (
        <StatsGraphicModal
          seasonId={seasonId}
          competitionLabel={competitionLabel}
          seasonName={season?.name}
          type={open}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
