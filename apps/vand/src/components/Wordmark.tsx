// The Vand logo, rendered as theme-aware text so it matches the brand mark
// (V navy · a teal · n amber · d navy) yet stays legible on dark backgrounds
// (the navy letters flip to white in dark mode).
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      aria-label="Vand"
      className={`inline-flex items-baseline text-2xl font-bold leading-none tracking-tight ${className}`}
    >
      <span className="text-brand-primary dark:text-white">V</span>
      <span className="text-brand-secondary dark:text-gray-100">a</span>
      <span className="text-brand-accent">n</span>
      <span className="text-brand-primary dark:text-white">d</span>
    </span>
  );
}
