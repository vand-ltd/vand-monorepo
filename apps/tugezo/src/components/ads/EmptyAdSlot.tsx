import { Link as IntlLink } from '@/i18n/navigation';

/**
 * The single, shared "advertise here" placeholder shown in EVERY empty ad slot —
 * header, sidebar, in-feed, in-article, search. It renders the animated brand
 * artwork (public/advertise-*.svg), sized to the slot, linking to the advertise
 * page so an unsold slot doubles as a self-serve sales prompt. When an ad is
 * actually sold, AdSlot renders the ad instead of this.
 *
 * The artwork is chosen from the slot's shape: `variant="leaderboard"` → the wide
 * banner; a 320×50 ratio → the mobile banner; everything else → the 300×250 box.
 * `animatedSrc` overrides the auto choice.
 */
export function EmptyAdSlot({
  label,
  aspectRatio,
  variant = 'box',
  className = '',
  animatedSrc,
}: {
  label: string;
  sizeLabel?: string; // kept for call-site compatibility (no longer displayed)
  aspectRatio: string; // e.g. '300 / 250' or '728 / 100'
  variant?: 'box' | 'leaderboard';
  badge?: string; // kept for call-site compatibility
  className?: string;
  animatedSrc?: string; // override the auto-picked artwork
}) {
  const ratio = aspectRatio.replace(/\s/g, '');
  const src =
    animatedSrc ??
    (variant === 'leaderboard'
      ? '/advertise-leaderboard.svg'
      : ratio === '320/50'
        ? '/advertise-mobile.svg'
        : '/advertise-box.svg');

  return (
    <IntlLink
      href="/advertise"
      aria-label={label}
      className={`block w-full overflow-hidden rounded-lg ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="h-auto w-full" />
    </IntlLink>
  );
}
