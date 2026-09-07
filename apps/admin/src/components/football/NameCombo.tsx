'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getOfficials,
  createOfficial,
  getCoaches,
  createCoach,
  type OfficialType,
} from '@org/api';

/**
 * Lookup-backed name fields.
 *
 * Matches and lineups still store the chosen name as a plain STRING — these
 * lists exist purely so the admin can pick a name instead of retyping it. A
 * name that isn't in the list can be typed freely; it's added to the lookup
 * only once the record it belongs to has actually been saved (see `ensure`),
 * so a stray click into a field never pollutes the list.
 */

/* ------------------------------- officials -------------------------------- */

export function useOfficialNames(type: OfficialType) {
  const qc = useQueryClient();
  const key = ['football', 'officials', type];
  const q = useQuery({
    queryKey: key,
    queryFn: () => getOfficials({ type, active: true }),
    staleTime: 5 * 60 * 1000,
  });
  const names = (q.data ?? []).map((o) => o.name);

  // Add a typed name to the lookup, but only if it's genuinely new.
  // Case-insensitive so "J. Cucuri" and "j. cucuri" don't both get stored.
  const ensure = async (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    // Only decide "this is new" against a list we actually loaded. If the fetch
    // failed or is still in flight, `names` is empty and every name would look
    // new — which would create a duplicate on every save (the API allows
    // duplicate names, auto-suffixing the slug, so nothing would stop it).
    if (!q.isSuccess) return;
    if (names.some((n) => n.toLowerCase() === name.toLowerCase())) return;
    try {
      await createOfficial({ name, type });
      qc.invalidateQueries({ queryKey: key });
    } catch {
      /* a failed lookup insert must never block the save that triggered it */
    }
  };

  return { names, ensure, isLoading: q.isLoading };
}

/* -------------------------------- coaches --------------------------------- */

export function useCoachNames(teamId?: string) {
  const qc = useQueryClient();
  const key = ['football', 'coaches', teamId ?? 'all'];
  const q = useQuery({
    queryKey: key,
    queryFn: () => getCoaches({ active: true }),
    staleTime: 5 * 60 * 1000,
  });
  // Show this team's coaches first, then everyone else — a coach can move club.
  const all = q.data ?? [];
  const names = [
    ...all.filter((c) => teamId && c.teamId === teamId).map((c) => c.name),
    ...all.filter((c) => !teamId || c.teamId !== teamId).map((c) => c.name),
  ];

  const ensure = async (raw: string) => {
    const name = raw.trim();
    if (!name) return;
    if (!q.isSuccess) return; // see the note in useOfficialNames
    if (all.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    try {
      await createCoach({ name, ...(teamId ? { teamId } : {}) });
      qc.invalidateQueries({ queryKey: key });
    } catch {
      /* non-blocking, as above */
    }
  };

  return { names, ensure, isLoading: q.isLoading };
}

/* --------------------------------- input ---------------------------------- */

// A searchable combobox over the lookup list.
//
// The input holds the real value, so a name that isn't in the list can simply be
// typed — that's the whole point, and why this isn't a <select>. Typing also
// filters the list; the chevron opens it unfiltered. Built by hand because
// native <select> can't be searched and <datalist> gives no visible control.
export function NameCombo({
  value,
  onChange,
  options,
  placeholder,
  title,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  title?: string;
  className?: string;
}) {
  const listId = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  // null = not filtering (opened via the chevron); a string = the user typed.
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const filtered = useMemo(() => {
    if (query === null || query.trim() === '') return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  // Close when focus or a click lands outside the control.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('focusin', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('focusin', onDoc);
    };
  }, [open]);

  const pick = (name: string) => {
    onChange(name);
    setQuery(null);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return setOpen(false);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((i) => {
        const next = e.key === 'ArrowDown' ? i + 1 : i - 1;
        return Math.max(0, Math.min(filtered.length - 1, next));
      });
      return;
    }
    // Enter picks the highlighted row, but never steals a value the user typed
    // in full — if nothing is highlighted the typed text stands as-is.
    if (e.key === 'Enter' && open && filtered[active]) {
      e.preventDefault();
      pick(filtered[active]);
    }
  };

  return (
    <span ref={wrapRef} className="relative inline-flex min-w-0 flex-1">
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => options.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        title={title}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={`${className ?? ''} ${options.length ? 'pr-7' : ''}`}
      />

      {options.length > 0 && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={title ? `Show ${title} list` : 'Show list'}
          onClick={() => {
            setQuery(null); // chevron always reveals the whole list
            setActive(0);
            setOpen((o) => !o);
          }}
          className="absolute inset-y-0 right-0 flex w-7 items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}

      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          {filtered.length === 0 ? (
            <li className="px-2.5 py-1.5 text-xs text-gray-400">
              No match — “{value.trim()}” will be added as new
            </li>
          ) : (
            filtered.map((n, i) => (
              <li key={n} role="option" aria-selected={n === value}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(n)}
                  className={`block w-full truncate px-2.5 py-1.5 text-left text-xs ${
                    i === active
                      ? 'bg-[#003153]/10 text-[#003153] dark:bg-[#F59E0B]/10 dark:text-[#F59E0B]'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {n}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </span>
  );
}
