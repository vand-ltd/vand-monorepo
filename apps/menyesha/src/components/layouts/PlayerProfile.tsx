'use client';

import { useQuery } from '@tanstack/react-query';
import { getPlayerProfile, type PlayerTeamRef } from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { TeamLink } from '@/components/football/TeamLink';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

function crestUrl(t?: PlayerTeamRef | null): string | null {
  const l = t?.logo;
  if (typeof l === 'string') return l.startsWith('http') ? l : null;
  return null;
}
function initials(name?: string): string {
  return (name ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || '?';
}

// A spell that hasn't ended (leftAt === null) is shown open-ended: "2026-2027" → "2026-".
// Once leftAt is set, the full season label is shown instead.
function openEnded(seasonName?: string | null): string {
  if (!seasonName) return '';
  return `${seasonName.split('-')[0]}-`;
}

function seasonLabel(
  seasons: { name: string }[] | undefined,
  leftAt?: string | null
): string {
  const names = (seasons ?? []).map((s) => s.name).filter(Boolean);
  if (names.length === 0) return '';
  if (leftAt) return names.join(', ');
  // Still at the club — open-ended from the earliest season on record.
  const earliest = [...names].sort()[0];
  return openEnded(earliest);
}

function TeamChip({ team, name }: { team?: PlayerTeamRef | null; name?: string }) {
  const url = crestUrl(team);
  const label = team?.name ?? name ?? '—';
  return (
    <TeamLink slug={team?.slug} title={label} className="inline-flex items-center gap-1.5 min-w-0">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-4 w-4 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0" />
      ) : (
        <span className="h-4 w-4 rounded-full bg-[#003153] text-white text-[7px] font-bold flex items-center justify-center shrink-0">
          {initials(label)}
        </span>
      )}
      <span className="truncate">{label}</span>
    </TeamLink>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-center">
      <div className={`text-2xl font-bold tabular-nums ${accent ?? 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}

export function PlayerProfile({
  slug,
  initialData,
}: {
  slug: string;
  // Server-fetched so the profile is in the initial HTML (crawlable) instead of
  // a loading state; the client still refetches for freshness.
  initialData?: Awaited<ReturnType<typeof getPlayerProfile>>;
}) {
  const locale = useLocale();
  const t = useTranslations('football');
  const dateLocale = locale === 'rw' ? 'en' : locale;

  const { data, isLoading } = useQuery({
    queryKey: ['player-profile', slug],
    queryFn: () => getPlayerProfile(slug),
    initialData,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-[#003153] dark:text-[#F59E0B]" />
      </div>
    );
  }
  if (!data?.player?.id) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-20 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('playerNotFound')}</p>
      </div>
    );
  }

  const { player, currentTeam, transfers, career, stats } = data;
  const photo =
    typeof player.photo === 'string' && player.photo.startsWith('http') ? player.photo : null;
  const dob = player.dateOfBirth
    ? new Date(player.dateOfBirth).toLocaleDateString(dateLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  // Always shown — an em-dash makes missing data explicit rather than hiding it.
  const meta: { label: string; value: string }[] = [
    { label: t('position'), value: player.position ?? '—' },
    { label: t('nationality'), value: player.nationality ?? '—' },
    { label: t('dateOfBirth'), value: dob ?? '—' },
    { label: t('placeOfBirth'), value: player.placeOfBirth ?? '—' },
    { label: t('height'), value: player.height ? `${player.height} cm` : '—' },
  ];

  const th = 'px-2 py-2 text-center font-medium';
  const td = 'px-2 py-2.5 text-center tabular-nums text-gray-600 dark:text-gray-300';

  return (
    <div className="space-y-6">
      <Link
        href="/football"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToFootball')}
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={player.fullName}
              className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0"
            />
          ) : (
            <span className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-[#003153] text-white text-2xl font-bold flex items-center justify-center shrink-0">
              {initials(player.fullName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {player.fullName}
            </h1>
          </div>
        </div>

        {/* Vitals: aligned label/value columns scan far better than an inline list */}
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
          {meta.map((m) => (
            <div key={m.label} className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wide text-gray-400">{m.label}</dt>
              <dd className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {m.value}
              </dd>
            </div>
          ))}
        </dl>

        {player.bio && (
          <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {player.bio}
          </p>
        )}
      </div>

      {/* Current team — its own object, kept separate from career history */}
      {currentTeam?.team && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('currentTeam')}
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <TeamLink
              slug={currentTeam.team?.slug}
              title={currentTeam.team.name}
              className="flex items-center gap-4 min-w-0"
            >
            {crestUrl(currentTeam.team) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={crestUrl(currentTeam.team) as string}
                alt=""
                className="h-12 w-12 rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0"
              />
            ) : (
              <span className="h-12 w-12 rounded-full bg-[#003153] text-white text-sm font-bold flex items-center justify-center shrink-0">
                {initials(currentTeam.team.name)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-900 dark:text-white">
                {currentTeam.team.name}
              </p>
              <p className="truncate text-xs text-gray-400">
                {[
                  currentTeam.season?.competition?.name,
                  currentTeam.leftAt
                    ? currentTeam.season?.name
                    : openEnded(currentTeam.season?.name),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            </TeamLink>

            {/* Same label/value grid as the vitals — aligns on mobile instead of
                floating right-aligned under the team name. */}
            <dl className="mt-4 grid grid-cols-3 gap-x-4 border-t border-gray-100 dark:border-gray-700 pt-3">
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wide text-gray-400">
                  {t('shirtNumber')}
                </dt>
                <dd className="truncate text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  {currentTeam.shirtNumber != null ? `#${currentTeam.shirtNumber}` : '—'}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wide text-gray-400">
                  {t('position')}
                </dt>
                <dd className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {currentTeam.position ?? player.position ?? '—'}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[10px] uppercase tracking-wide text-gray-400">
                  {t('joined')}
                </dt>
                <dd className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {currentTeam.joinedAt
                    ? new Date(currentTeam.joinedAt).toLocaleDateString(dateLocale, {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      {/* Career totals */}
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {t('careerTotals')}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          <StatTile label={t('appearances')} value={stats.totals.appearances} />
          <StatTile label={t('goals')} value={stats.totals.goals} />
          <StatTile label={t('assistsStat')} value={stats.totals.assists} />
          <StatTile
            label={t('yellowCards')}
            value={stats.totals.yellowCards}
            accent="text-yellow-500"
          />
          <StatTile label={t('redCards')} value={stats.totals.redCards} accent="text-red-500" />
        </div>
      </section>

      {/* By season */}
      {stats.bySeason.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('bySeason')}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <table className="min-w-[560px] w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-2 py-2 text-left font-medium">{t('season')}</th>
                  <th className="px-2 py-2 text-left font-medium">{t('team')}</th>
                  <th className={th}>{t('appearancesAbbr')}</th>
                  <th className={th}>{t('goalsAbbr')}</th>
                  <th className={th}>{t('assistsAbbr')}</th>
                  <th className={th}>Y</th>
                  <th className={th}>R</th>
                </tr>
              </thead>
              <tbody>
                {stats.bySeason.map((row, i) => (
                  <tr
                    key={`${row.season?.id ?? i}`}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <td className="px-2 py-2.5">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        {row.season?.name}
                      </span>
                      {row.season?.competition?.name && (
                        <span className="block text-[11px] text-gray-400">
                          {row.season.competition.name}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-gray-700 dark:text-gray-300">
                      <TeamChip team={row.team} />
                    </td>
                    <td className={td}>{row.appearances}</td>
                    <td className="px-2 py-2.5 text-center font-bold tabular-nums text-gray-900 dark:text-white">
                      {row.goals}
                    </td>
                    <td className={td}>{row.assists}</td>
                    <td className={td}>{row.yellowCards}</td>
                    <td className={td}>{row.redCards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Career clubs */}
      {career.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('career')}
          </h2>
          <ul className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {career.map((c, i) => {
              // Still at the club (no leftAt) → keep the "Current" tag and show an
              // open-ended season. Once leftAt is set, show the full season and drop the tag.
              const isCurrent =
                !c.leftAt && !!currentTeam?.team?.id && c.team?.id === currentTeam.team.id;
              return (
              <li key={i} className="flex items-center gap-3 px-3 py-3">
                <span className="min-w-0 flex-1 text-sm text-gray-900 dark:text-white">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <TeamChip team={c.team} name={c.clubName} />
                    {isCurrent && (
                      <span className="shrink-0 rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        {t('current')}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-gray-400">
                    {[seasonLabel(c.seasons, c.leftAt), c.isLoan ? t('loan') : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                  {c.appearances} {t('appearancesAbbr')} · {c.goals} {t('goalsAbbr')} · {c.assists}{' '}
                  {t('assistsAbbr')}
                </span>
              </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Transfers */}
      {transfers.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {t('transfers')}
          </h2>
          <ul className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {transfers.map((tr, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 px-3 py-3 text-sm">
                <span className="min-w-0 text-gray-600 dark:text-gray-300">
                  <TeamChip team={tr.from?.team} name={tr.from?.clubName} />
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="min-w-0 font-medium text-gray-900 dark:text-white">
                  <TeamChip team={tr.to?.team} name={tr.to?.clubName} />
                </span>
                <span className="ml-auto shrink-0 text-xs text-gray-400">
                  {[tr.to?.season?.name ?? tr.year, tr.isLoan ? t('loan') : null]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
