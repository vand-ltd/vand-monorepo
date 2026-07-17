'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRIES, flagEmoji } from '@/lib/countries';
import { inputClass } from './styles';

// A searchable country picker. Stores the full country name; shows flag + name.
export function CountrySelect({
  value,
  onChange,
  placeholder = 'Nationality…',
}: {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = COUNTRIES.find((c) => c.name === value);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const q = query.trim().toLowerCase();
  const list = q ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)) : COUNTRIES;

  return (
    <div ref={ref} className="relative">
      <input
        className={`${inputClass} pr-7`}
        value={open ? query : selected ? `${flagEmoji(selected.code)} ${selected.name}` : ''}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
      />
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg text-sm">
          {list.length === 0 ? (
            <li className="px-3 py-2 text-gray-400">No match</li>
          ) : (
            list.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.name);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    c.name === value ? 'bg-gray-50 dark:bg-gray-700/50 font-medium' : ''
                  }`}
                >
                  {flagEmoji(c.code)} {c.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
