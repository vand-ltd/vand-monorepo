'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getTeamProfile,
  getSquad,
  getMatches,
  getStandings,
  getTeamSeasonJourney,
  type TeamPerspectiveMatch,
  type TeamSeasonRow,
  type TeamHonour,
  type TeamJourneyKnockout,
  type StandingRow,
  type Player,
  type Match,
} from '@org/api';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { TeamLink } from '@/components/football/TeamLink';
import {
  Loader2,
  ArrowLeft,
  Trophy,
  MapPin,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';

/* -------------------------------- helpers --------------------------------- */

function resolveLogo(logo?: string | { url?: string } | null, logoUrl?: string | null): string | null {
  if (logoUrl) return logoUrl;
  if (typeof logo === 'string') return logo.startsWith('http') ? logo : null;
  return logo?.url ?? null;
}
function initials(name?: string): string {
  return (name ?? '').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || '?';
}

// 1 -> "1st", 2 -> "2nd", 11 -> "11th" … for the season finishing position.
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function Crest({
  url,
  name,
  size = 20,
  slug,
}: {
  url: string | null;
  name?: string;
  size?: number;
  slug?: string | null;
}) {
  const router = useRouter();
  const px = `${size}px`;
  const inner = url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      style={{ width: px, height: px }}
      className="rounded-full object-cover bg-gray-100 dark:bg-gray-700 shrink-0"
    />
  ) : (
    <span
      style={{ width: px, height: px, fontSize: size * 0.4 }}
      className="rounded-full bg-[#003153] text-white font-bold flex items-center justify-center shrink-0"
    >
      {initials(name)}
    </span>
  );
  // Team crest links to /football/team/:slug. onClick nav (not an <a>) keeps it
  // valid inside the match-row links these crests sit in.
  if (!slug) return inner;
  const go = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/football/team/${slug}`);
  };
  return (
    <span
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') go(e);
      }}
      title={name}
      className="shrink-0 cursor-pointer rounded-full transition-shadow hover:ring-2 hover:ring-[#003153]/40 dark:hover:ring-[#F59E0B]/40"
    >
      {inner}
    </span>
  );
}

const FORM_STYLES: Record<string, string> = {
  W: 'bg-green-500 text-white',
  D: 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-100',
  L: 'bg-red-500 text-white',
};
function FormBadges({ form }: { form?: string[] }) {
  if (!form || form.length === 0) return <span className="text-gray-300 dark:text-gray-600">—</span>;
  return (
    <span className="inline-flex gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center ${
            FORM_STYLES[r] ?? 'bg-gray-200 text-gray-500'
          }`}
        >
          {r}
        </span>
      ))}
    </span>
  );
}

function matchHref(m: TeamPerspectiveMatch): string {
  return `/football/${m.competition?.slug ?? 'match'}/${m.slug}`;
}

const RESULT_STYLES: Record<string, string> = {
  W: 'bg-green-500 text-white',
  D: 'bg-gray-400 text-white',
  L: 'bg-red-500 text-white',
};

/* ---------------------------- perspective rows ---------------------------- */

type SelfTeam = { name: string; crest: string | null; slug?: string };

// A results/fixtures row shown as home vs away (both teams), the profile team
// emphasized, with the score (or kickoff time) in the middle. Links to the match.
function PerspectiveRow({
  m,
  self,
  dateLocale,
  upcoming,
}: {
  m: TeamPerspectiveMatch;
  self: SelfTeam;
  dateLocale: string;
  upcoming?: boolean;
}) {
  const opp: SelfTeam = {
    name: m.opponent?.name ?? '—',
    crest: resolveLogo(m.opponent?.logo),
    slug: m.opponent?.slug,
  };
  const home = m.isHome ? self : opp;
  const away = m.isHome ? opp : self;
  const dt = m.kickoffAt ? new Date(m.kickoffAt) : null;
  const date = dt ? dt.toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' }) : '';
  const time = dt ? dt.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) : '';
  // A played result shows the score in the middle; an upcoming fixture shows the
  // kickoff time under the date and a "V" between the teams.
  const showScore = !upcoming && m.homeScore != null && m.awayScore != null;

  const nameCls = (emphasize: boolean) =>
    `truncate text-sm ${emphasize ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`;

  return (
    <Link
      href={matchHref(m)}
      className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
    >
      <span className="w-14 shrink-0 text-[11px] leading-tight text-gray-400">
        <span className="block">{date}</span>
        {!showScore && time && <span className="block">{time}</span>}
      </span>
      {/* Home — right-aligned toward the middle */}
      <span className="flex-1 min-w-0 flex items-center justify-end gap-2">
        <TeamLink nested slug={home.slug} className={nameCls(m.isHome)}>
          {home.name}
        </TeamLink>
        <Crest url={home.crest} name={home.name} slug={home.slug} size={20} />
      </span>
      {/* Score for results, "V" for upcoming */}
      <span className="shrink-0 w-10 text-center">
        {showScore ? (
          <span className="tabular-nums text-sm font-bold text-gray-900 dark:text-white">
            {m.homeScore}–{m.awayScore}
          </span>
        ) : (
          <span className="text-xs font-semibold text-gray-400">V</span>
        )}
      </span>
      {/* Away */}
      <span className="flex-1 min-w-0 flex items-center gap-2">
        <Crest url={away.crest} name={away.name} slug={away.slug} size={20} />
        <TeamLink nested slug={away.slug} className={nameCls(!m.isHome)}>
          {away.name}
        </TeamLink>
      </span>
      {/* Result badge — finished matches only */}
      {!upcoming && m.result ? (
        <span
          className={`h-5 w-5 shrink-0 rounded text-[10px] font-bold flex items-center justify-center ${
            RESULT_STYLES[m.result] ?? 'bg-gray-200 text-gray-500'
          }`}
        >
          {m.result}
        </span>
      ) : null}
    </Link>
  );
}

function Panel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {aside && <span className="shrink-0 truncate text-xs text-gray-400">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------ season table ------------------------------ */

// Classify a season row as cup vs league. Prefer the explicit competition type;
// fall back to the competition name (some payloads omit type) so the tabs still
// split correctly.
// Cup vs league comes straight from the competition type in the API response.
function isCupRow(r: TeamSeasonRow): boolean {
  return (r.competition?.type ?? '').toLowerCase() === 'cup';
}

// League/Cup tabbed season record. Both tabs are always shown; clicking one
// shows that competition kind's seasons. League shows a flat table (with the
// finishing place); Cup shows expandable rows that drill down into the run.
function BySeason({
  teamId,
  rows,
  t,
}: {
  teamId: string;
  rows: TeamSeasonRow[];
  t: ReturnType<typeof useTranslations>;
}) {
  const leagueRows = rows.filter((r) => !isCupRow(r));
  const cupRows = rows.filter(isCupRow);
  const [tab, setTab] = useState<'league' | 'cup'>(
    leagueRows.length === 0 && cupRows.length > 0 ? 'cup' : 'league'
  );

  const pill = (key: 'league' | 'cup', label: string, count: number) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
        tab === key
          ? 'bg-[#003153] text-white dark:bg-[#F59E0B] dark:text-gray-900'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {label} <span className="opacity-70">({count})</span>
    </button>
  );

  const active = tab === 'cup' ? cupRows : leagueRows;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('bySeason')}</h3>
        <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          {pill('league', t('league'), leagueRows.length)}
          {pill('cup', t('cup'), cupRows.length)}
        </div>
      </div>
      {active.length === 0 ? (
        <EmptyBox text={t('noSeasons')} />
      ) : tab === 'cup' ? (
        <div className="space-y-2">
          {cupRows.map((r, i) => (
            <CupSeasonRow key={`${r.season?.id ?? i}`} teamId={teamId} row={r} t={t} />
          ))}
        </div>
      ) : (
        <SeasonTable rows={leagueRows} kind="league" t={t} />
      )}
    </div>
  );
}

/* ------------------------------ cup journey ------------------------------- */

// Colour the ready-made outcome label from the endpoint by its kind.
function outcomeStyle(outcome: string): string {
  const o = outcome.toLowerCase();
  if (o.startsWith('winner')) return 'bg-[#F59E0B] text-gray-900';
  if (o.startsWith('runner')) return 'bg-gray-300 text-gray-800 dark:bg-gray-500 dark:text-white';
  if (o.startsWith('in progress')) return 'bg-blue-500 text-white';
  if (o.startsWith('eliminated')) return 'bg-red-500/90 text-white';
  return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-200';
}

// One expandable cup season → lazy-loads and renders the group + knockout run.
function CupSeasonRow({
  teamId,
  row,
  t,
}: {
  teamId: string;
  row: TeamSeasonRow;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);
  const seasonId = row.season?.id ?? '';
  const { data, isLoading } = useQuery({
    queryKey: ['team-journey', teamId, seasonId],
    queryFn: () => getTeamSeasonJourney(teamId, seasonId),
    enabled: open && !!seasonId,
  });

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{row.season?.name}</div>
          <div className="truncate text-xs text-gray-400">{row.competition?.name}</div>
        </div>
        {open && data?.outcome ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${outcomeStyle(data.outcome)}`}
          >
            {data.outcome}
          </span>
        ) : (
          <span className="shrink-0 text-xs tabular-nums text-gray-400">
            {row.won}W {row.drawn}D {row.lost}L
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[#003153] dark:text-[#F59E0B]" />
            </div>
          ) : !data ? (
            <p className="py-4 text-center text-sm text-gray-400">{t('noSeasons')}</p>
          ) : (
            <>
              {data.group && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {data.group.group?.name}
                  </h4>
                  <GroupTable rows={data.group.table} teamId={teamId} />
                </div>
              )}
              {data.knockout.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {t('knockout')}
                  </h4>
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {data.knockout.map((k) => (
                      <KnockoutRow
                        key={k.match.id}
                        ko={k}
                        self={{
                          name: data.team?.name ?? '',
                          crest: resolveLogo(data.team?.logo),
                          slug: data.team?.slug,
                        }}
                        competitionSlug={data.season.competition?.slug}
                      />
                    ))}
                  </div>
                </div>
              )}
              {data.outcome && (
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[#F59E0B]" />
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${outcomeStyle(data.outcome)}`}
                  >
                    {data.outcome}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Compact group standings, the team's row highlighted.
function GroupTable({ rows, teamId }: { rows: StandingRow[]; teamId: string }) {
  const td = 'px-2 py-2 text-center tabular-nums text-gray-600 dark:text-gray-300';
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-100 dark:border-gray-700">
            <th className="px-2 py-2 text-center font-medium w-8">#</th>
            <th className="px-2 py-2 text-left font-medium">Team</th>
            <th className="px-2 py-2 text-center font-medium">P</th>
            <th className="px-2 py-2 text-center font-medium">GD</th>
            <th className="px-2 py-2 text-center font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const isTeam = r.team?.id === teamId;
            return (
              <tr
                key={r.team?.id ?? r.position}
                className={`border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                  isTeam ? 'bg-[#003153]/5 dark:bg-[#F59E0B]/10' : ''
                }`}
              >
                <td className="px-2 py-2 text-center text-gray-400">{r.position}</td>
                <td className="px-2 py-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <Crest url={resolveLogo(r.team?.logo, r.team?.logoUrl)} name={r.team?.name} slug={r.team?.slug} size={18} />
                    <TeamLink
                      slug={r.team?.slug}
                      className={`min-w-0 flex-1 truncate ${
                        isTeam
                          ? 'font-bold text-[#003153] dark:text-[#F59E0B]'
                          : 'font-medium text-gray-900 dark:text-white'
                      }`}
                    >
                      {r.team?.name}
                    </TeamLink>
                  </span>
                </td>
                <td className={td}>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
                <td className="px-2 py-2 text-center font-bold text-gray-900 dark:text-white">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// One knockout round from the team's perspective, linking to the match.
function KnockoutRow({
  ko,
  self,
  competitionSlug,
}: {
  ko: TeamJourneyKnockout;
  self: SelfTeam;
  competitionSlug?: string;
}) {
  const m = ko.match;
  const done = m.status !== 'Scheduled' && m.homeScore != null && m.awayScore != null;
  const opp: SelfTeam = {
    name: m.opponent?.name ?? '—',
    crest: resolveLogo(m.opponent?.logo),
    slug: m.opponent?.slug,
  };
  const home = m.isHome ? self : opp;
  const away = m.isHome ? opp : self;
  const hasPens = m.homePenalties != null && m.awayPenalties != null;
  const nameCls = (emphasize: boolean) =>
    `truncate text-sm ${emphasize ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`;

  return (
    <Link
      href={`/football/${competitionSlug ?? 'match'}/${m.slug}`}
      className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
    >
      <span className="w-16 sm:w-20 shrink-0 truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
        {ko.stage?.name}
      </span>
      <span className="flex-1 min-w-0 flex items-center justify-end gap-2">
        <TeamLink nested slug={home.slug} className={nameCls(m.isHome)}>
          {home.name}
        </TeamLink>
        <Crest url={home.crest} name={home.name} slug={home.slug} size={18} />
      </span>
      <span className="shrink-0 w-12 text-center">
        {done ? (
          <span className="tabular-nums text-sm font-bold text-gray-900 dark:text-white">
            {m.homeScore}–{m.awayScore}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-gray-400">{m.status}</span>
        )}
        {hasPens && (
          <span className="block text-[10px] tabular-nums text-gray-400">
            ({m.homePenalties}-{m.awayPenalties}p)
          </span>
        )}
      </span>
      <span className="flex-1 min-w-0 flex items-center gap-2">
        <Crest url={away.crest} name={away.name} slug={away.slug} size={18} />
        <TeamLink nested slug={away.slug} className={nameCls(!m.isHome)}>
          {away.name}
        </TeamLink>
      </span>
      {done &&
        (m.advanced ? (
          <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Advanced" />
        ) : (
          <X className="h-4 w-4 shrink-0 text-red-500" aria-label="Out" />
        ))}
    </Link>
  );
}

function SeasonTable({
  rows,
  kind,
  t,
}: {
  rows: TeamSeasonRow[];
  kind: 'league' | 'cup';
  t: ReturnType<typeof useTranslations>;
}) {
  const th = 'px-2 py-2 text-center font-medium';
  const td = 'px-2 py-2.5 text-center tabular-nums text-gray-600 dark:text-gray-300';
  const showPos = kind === 'league';
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <table className="min-w-[640px] w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <th className="px-3 py-2 text-left font-medium">{t('season')}</th>
            <th className="px-3 py-2 text-left font-medium">{t('competition')}</th>
            <th className={th}>P</th>
            <th className={th}>W</th>
            <th className={th}>D</th>
            <th className={th}>L</th>
            <th className={th}>GF</th>
            <th className={th}>GA</th>
            <th className={th}>GD</th>
            <th className={th}>Pts</th>
            {showPos && <th className={th}>{t('pos')}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={`${r.season?.id ?? i}-${r.competition?.id ?? ''}`}
              className="border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                {r.season?.name ?? '—'}
              </td>
              <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {r.competition?.name ?? '—'}
              </td>
              <td className={td}>{r.played}</td>
              <td className={td}>{r.won}</td>
              <td className={td}>{r.drawn}</td>
              <td className={td}>{r.lost}</td>
              <td className={td}>{r.goalsFor}</td>
              <td className={td}>{r.goalsAgainst}</td>
              <td className={td}>{r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}</td>
              <td className="px-2 py-2.5 text-center font-bold text-gray-900 dark:text-white">
                {r.points}
              </td>
              {showPos && (
                <td className={`${td} whitespace-nowrap`}>
                  {r.position != null ? (
                    <span
                      className={`inline-flex items-center justify-center gap-1 ${
                        r.position === 1 ? 'font-semibold text-[#F59E0B]' : ''
                      }`}
                    >
                      {r.position === 1 && <Trophy className="h-3 w-3" />}
                      {ordinal(r.position)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------- live standings widget ------------------------ */

function StandingsWidget({
  seasonId,
  seasonLabel,
  teamId,
  t,
}: {
  seasonId: string;
  seasonLabel?: string;
  teamId: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['team-standings', seasonId],
    queryFn: () => getStandings(seasonId, { live: true }),
    enabled: !!seasonId,
    refetchInterval: (q) => (q.state.data?.hasLiveMatches ? 20000 : false),
  });

  // League table, or the group that contains this team.
  const rows: StandingRow[] = useMemo(() => {
    if (!data) return [];
    if (data.groups.length > 0) {
      const g = data.groups.find((grp) => grp.standings.some((r) => r.team?.id === teamId));
      return g?.standings ?? data.groups[0]?.standings ?? [];
    }
    return data.standings;
  }, [data, teamId]);

  if (isLoading) {
    return (
      <Panel title={t('leagueTable')} aside={seasonLabel}>
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[#003153] dark:text-[#F59E0B]" />
        </div>
      </Panel>
    );
  }
  if (rows.length === 0) return null;

  const td = 'px-2 py-2 text-center tabular-nums text-gray-600 dark:text-gray-300';
  return (
    <Panel title={t('leagueTable')} aside={seasonLabel}>
      {data?.hasLiveMatches && (
        <div className="px-3 pt-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            {t('liveTable')}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th className="px-2 py-2 text-center font-medium w-8">#</th>
              <th className="px-2 py-2 text-left font-medium">{t('team')}</th>
              <th className="px-2 py-2 text-center font-medium">P</th>
              <th className="px-2 py-2 text-center font-medium">GD</th>
              <th className="px-2 py-2 text-center font-medium">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isTeam = r.team?.id === teamId;
              return (
                <tr
                  key={r.team?.id ?? r.position}
                  className={`border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                    isTeam ? 'bg-[#003153]/5 dark:bg-[#F59E0B]/10' : ''
                  } ${r.isLive ? 'bg-amber-50 dark:bg-amber-950/40' : ''}`}
                >
                  <td className="px-2 py-2 text-center text-gray-400">{r.position}</td>
                  <td className="px-2 py-2">
                    <span className="flex items-center gap-2 min-w-0">
                      <Crest url={resolveLogo(r.team?.logo, r.team?.logoUrl)} name={r.team?.name} slug={r.team?.slug} size={18} />
                      <TeamLink
                        slug={r.team?.slug}
                        className={`truncate ${
                          isTeam
                            ? 'font-bold text-[#003153] dark:text-[#F59E0B]'
                            : 'font-medium text-gray-900 dark:text-white'
                        }`}
                      >
                        {r.team?.name}
                      </TeamLink>
                      {r.isLive && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-600" />}
                    </span>
                  </td>
                  <td className={td}>{r.played}</td>
                  <td className={td}>
                    {r.goalDifference > 0 ? `+${r.goalDifference}` : r.goalDifference}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-gray-900 dark:text-white">
                    {r.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* --------------------------------- squad ---------------------------------- */

function SquadTab({
  teamId,
  seasons,
  initialSeasonId,
  t,
}: {
  teamId: string;
  seasons: { id: string; name: string }[];
  initialSeasonId?: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [seasonId, setSeasonId] = useState(initialSeasonId ?? seasons[0]?.id ?? '');
  const { data, isLoading } = useQuery({
    queryKey: ['team-squad', teamId, seasonId],
    queryFn: () => getSquad(teamId, seasonId || undefined),
    enabled: !!teamId,
  });
  const players = data ?? [];

  return (
    <div className="space-y-3">
      {seasons.length > 1 && (
        <SeasonSelect seasons={seasons} value={seasonId} onChange={setSeasonId} />
      )}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#003153] dark:text-[#F59E0B]" />
        </div>
      ) : players.length === 0 ? (
        <EmptyBox text={t('noSquad')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {players.map((p: Player) => {
            const inner = (
              <>
                <span className="w-7 shrink-0 text-center text-sm font-bold tabular-nums text-gray-400">
                  {p.shirtNumber ?? '–'}
                </span>
                <Crest url={resolveLogo(p.photo, p.photoUrl)} name={p.name} size={28} />
                <span className="flex-1 min-w-0 truncate text-sm font-medium text-gray-900 dark:text-white">
                  {p.name}
                </span>
                <span className="shrink-0 text-[11px] uppercase tracking-wide text-gray-400">
                  {p.position ?? ''}
                </span>
              </>
            );
            return p.slug ? (
              <Link
                key={p.id}
                href={`/football/player/${p.slug}`}
                className="flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 hover:border-[#003153]/40 dark:hover:border-[#F59E0B]/40 transition-colors"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={p.id}
                className="flex items-center gap-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- matches --------------------------------- */

function MatchesTab({
  teamId,
  seasons,
  initialSeasonId,
  dateLocale,
  t,
}: {
  teamId: string;
  seasons: { id: string; name: string }[];
  initialSeasonId?: string;
  dateLocale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [seasonId, setSeasonId] = useState(initialSeasonId ?? seasons[0]?.id ?? '');
  const { data, isLoading } = useQuery({
    queryKey: ['team-matches', teamId, seasonId],
    queryFn: () => getMatches({ teamId, seasonId: seasonId || undefined, order: 'asc' }),
    enabled: !!teamId,
  });
  const matches = data ?? [];

  return (
    <div className="space-y-3">
      {seasons.length > 1 && (
        <SeasonSelect seasons={seasons} value={seasonId} onChange={setSeasonId} />
      )}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#003153] dark:text-[#F59E0B]" />
        </div>
      ) : matches.length === 0 ? (
        <EmptyBox text={t('noMatches')} />
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
          {matches.map((m: Match) => (
            <FullMatchRow key={m.id} m={m} teamId={teamId} dateLocale={dateLocale} />
          ))}
        </div>
      )}
    </div>
  );
}

function FullMatchRow({ m, teamId, dateLocale }: { m: Match; teamId: string; dateLocale: string }) {
  const isHome = m.homeTeamId === teamId;
  const done = m.status !== 'Scheduled' && m.homeScore != null && m.awayScore != null;
  const dt = m.kickoffAt ? new Date(m.kickoffAt) : null;
  const date = dt ? dt.toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' }) : '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compSlug = (m as any).season?.competition?.slug ?? 'match';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slug = (m as any).slug ?? m.id;
  const home = m.homeTeam;
  const away = m.awayTeam;
  return (
    <Link
      href={`/football/${compSlug}/${slug}`}
      className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
    >
      <span className="w-11 shrink-0 text-[11px] text-gray-400">{date}</span>
      <span className={`flex-1 min-w-0 flex items-center justify-end gap-2 ${isHome ? 'font-semibold' : ''}`}>
        <TeamLink nested slug={home?.slug} className="truncate text-sm text-gray-900 dark:text-white">
          {home?.name ?? '—'}
        </TeamLink>
        <Crest url={resolveLogo(home?.logo, home?.logoUrl)} name={home?.name} slug={home?.slug} size={18} />
      </span>
      <span className="shrink-0 w-14 text-center tabular-nums text-sm font-semibold text-gray-900 dark:text-white">
        {done ? `${m.homeScore}–${m.awayScore}` : dt?.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className={`flex-1 min-w-0 flex items-center gap-2 ${!isHome ? 'font-semibold' : ''}`}>
        <Crest url={resolveLogo(away?.logo, away?.logoUrl)} name={away?.name} slug={away?.slug} size={18} />
        <TeamLink nested slug={away?.slug} className="truncate text-sm text-gray-900 dark:text-white">
          {away?.name ?? '—'}
        </TeamLink>
      </span>
    </Link>
  );
}

/* -------------------------------- shared ---------------------------------- */

function SeasonSelect({
  seasons,
  value,
  onChange,
}: {
  seasons: { id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153] dark:focus:ring-[#F59E0B]"
    >
      {seasons.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 py-14 text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}

/* -------------------------------- page ------------------------------------ */

type Tab = 'overview' | 'squad' | 'matches';

export function TeamProfile({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations('football');
  const dateLocale = locale === 'rw' ? 'en' : locale;
  const [tab, setTab] = useState<Tab>('overview');

  const { data, isLoading } = useQuery({
    queryKey: ['team-profile', slug],
    queryFn: () => getTeamProfile(slug),
  });

  const seasonOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of data?.seasons ?? []) {
      if (r.season?.id) seen.set(r.season.id, r.season.name);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [data?.seasons]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-[#003153] dark:text-[#F59E0B]" />
      </div>
    );
  }
  if (!data?.team?.id) {
    return <EmptyBox text={t('teamNotFound')} />;
  }

  const { team, currentSeason, seasons, form, recentResults, upcomingFixtures } = data;
  const logo = resolveLogo(team.logo, team.logoUrl);
  // The profile team, for the home-vs-away results/fixtures rows.
  const self: SelfTeam = { name: team.name, crest: logo, slug: team.slug };
  const honours = team.honours ?? [];

  const tabBtn = (key: Tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        tab === key
          ? 'border-[#003153] dark:border-[#F59E0B] text-[#003153] dark:text-[#F59E0B]'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <Link
        href="/football"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToScores')}
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 sm:p-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <Crest url={logo} name={team.name} size={80} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              {(team.city || team.country) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[team.city, team.country].filter(Boolean).join(', ')}
                </span>
              )}
              {team.founded && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t('founded')} {team.founded}
                </span>
              )}
            </div>
            {currentSeason && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#003153]/10 dark:bg-[#F59E0B]/10 px-3 py-1 text-xs font-semibold text-[#003153] dark:text-[#F59E0B]">
                  {currentSeason.competition?.name ?? currentSeason.name}
                </span>
                <FormBadges form={form} />
              </div>
            )}
          </div>
        </div>
        {team.bio && (
          <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{team.bio}</p>
        )}
      </div>

      {/* Honours */}
      {honours.length > 0 && (
        <Panel title={t('honours')}>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {honours.map((h: TeamHonour, i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Trophy className="h-4 w-4 shrink-0 text-[#F59E0B]" />
                <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-white">
                  {h.title}
                  {h.competition?.name ? (
                    <span className="font-normal text-gray-400"> · {h.competition.name}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-gray-400">{h.season ?? h.year ?? ''}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex gap-1 overflow-x-auto">
        {tabBtn('overview', t('overview'))}
        {tabBtn('squad', t('squadTab'))}
        {tabBtn('matches', t('matchesTab'))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title={t('recentResults')}>
              {recentResults.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-gray-400">{t('noResults')}</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentResults.map((m) => (
                    <PerspectiveRow key={m.slug} m={m} self={self} dateLocale={dateLocale} />
                  ))}
                </div>
              )}
            </Panel>
            <Panel title={t('upcomingFixtures')}>
              {upcomingFixtures.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-gray-400">{t('noFixtures')}</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {upcomingFixtures.map((m) => (
                    <PerspectiveRow key={m.slug} m={m} self={self} dateLocale={dateLocale} upcoming />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {currentSeason?.id && (
            <StandingsWidget
              seasonId={currentSeason.id}
              seasonLabel={[currentSeason.competition?.name, currentSeason.name]
                .filter(Boolean)
                .join(' · ')}
              teamId={team.id}
              t={t}
            />
          )}

          {seasons.length > 0 && <BySeason rows={seasons} teamId={team.id} t={t} />}
        </div>
      )}

      {tab === 'squad' && (
        <SquadTab
          teamId={team.id}
          seasons={seasonOptions}
          initialSeasonId={currentSeason?.id}
          t={t}
        />
      )}

      {tab === 'matches' && (
        <MatchesTab
          teamId={team.id}
          seasons={seasonOptions}
          initialSeasonId={currentSeason?.id}
          dateLocale={dateLocale}
          t={t}
        />
      )}
    </div>
  );
}
