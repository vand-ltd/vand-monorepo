import { Megaphone } from 'lucide-react';
import { Link as IntlLink } from '@/i18n/navigation';

/**
 * The single, shared "advertise here" design shown in EVERY empty ad slot —
 * header, sidebar, in-feed, in-article, search. One look everywhere: a dashed
 * border + soft gradient + brand icon chip, linking to the advertise page so an
 * unsold slot doubles as a self-serve sales prompt.
 *
 * `variant="leaderboard"` switches to a compact horizontal layout for the wide
 * header slot; `box` (default) is the vertical 300×250 look.
 */
export function EmptyAdSlot({
  label,
  sizeLabel,
  aspectRatio,
  variant = 'box',
  badge,
  className = '',
}: {
  label: string;
  sizeLabel: string;
  aspectRatio: string; // e.g. '300 / 250' or '728 / 100'
  variant?: 'box' | 'leaderboard';
  badge?: string; // optional corner tag (e.g. the section name)
  className?: string;
}) {
  const horizontal = variant === 'leaderboard';
  return (
    <IntlLink
      href="/advertise"
      style={{ aspectRatio }}
      className={`group relative flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4 text-center transition-colors hover:border-brand-primary/40 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 ${
        horizontal ? 'flex-row gap-3' : 'flex-col'
      } ${className}`}
    >
      {badge && (
        <span className="absolute left-3 top-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {badge}
        </span>
      )}
      <div
        className={`flex shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 dark:bg-brand-accent/10 ${
          horizontal ? 'h-9 w-9' : 'mb-3 h-12 w-12'
        }`}
      >
        <Megaphone
          className={`text-brand-primary dark:text-brand-accent ${horizontal ? 'h-4 w-4' : 'h-6 w-6'}`}
        />
      </div>
      <div className={horizontal ? 'text-left' : ''}>
        <p className="mb-0.5 text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">{sizeLabel}</p>
      </div>
    </IntlLink>
  );
}
